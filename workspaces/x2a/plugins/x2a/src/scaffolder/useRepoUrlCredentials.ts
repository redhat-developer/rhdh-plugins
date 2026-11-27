/*
 * Copyright Red Hat, Inc.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { ApiHolder, ApiRef } from '@backstage/core-plugin-api';
import { useApi } from '@backstage/core-plugin-api';
import {
  scmAuthApiRef,
  scmIntegrationsApiRef,
} from '@backstage/integration-react';
import { useTemplateSecrets } from '@backstage/plugin-scaffolder-react';
import {
  extractHost,
  resolveScmProvider,
  type ScmProviderName,
} from '@red-hat-developer-hub/backstage-plugin-x2a-common';

import { AuthHostNotAllowedError, useRepoAuthentication } from '../repoAuth';
import { normalizeHost } from '../hooks/useScmAuthHosts';
import { useScmHostMap } from '../hooks/useScmHostMap';

/**
 * `ui:options.requestUserCredentials` as consumed by `X2ARepoUrlPicker`.
 *
 * Same `secretsKey` and `additionalScopes` as the stock `RepoUrlPicker`
 * option, plus `readOnly`.
 *
 * @public
 */
export type RepoUrlCredentialsOptions = {
  /** Scaffolder secret the access token is written to. */
  secretsKey: string;
  /**
   * Extra OAuth scopes per provider, forwarded by the stock picker to the
   * app's `scmAuthApi` (`additionalScope.customScopes`).
   */
  additionalScopes?: {
    github?: string[];
    gitlab?: string[];
    bitbucket?: string[];
  };
  /**
   * Request a read-only scope. Defaults to `false` (read/write).
   *
   * Passed to the app's `scmAuthApi` as `additionalScope.repoWrite`, which
   * GitLab and Bitbucket honour. GitHub's `repo` scope has no read-only
   * counterpart, so GitHub always gets read/write.
   */
  readOnly?: boolean;
};

/**
 * Progress of the access-token request made by `X2ARepoUrlPicker`.
 *
 * @public
 */
export type RepoUrlCredentialsStatus = 'idle' | 'error';

/** @public */
export type RepoUrlCredentialsState = {
  status: RepoUrlCredentialsStatus;
  /** Provider the token was requested from, once a host is known. */
  provider?: ScmProviderName;
  /** Host the status refers to. */
  host?: string;
  error?: string;
  /**
   * Set when the host is not the one the provider's OAuth app is registered
   * against (`x2a.scm.authHosts`), so no token was requested. Retrying does
   * not help.
   */
  refused?: AuthHostNotAllowedError;
  retry: () => void;
};

type Params = {
  /** Host currently selected in the picker, e.g. `gitlab.example.com`. */
  host: string | undefined;
  options: RepoUrlCredentialsOptions | undefined;
};

type Status = {
  status: RepoUrlCredentialsStatus;
  provider?: ScmProviderName;
  host?: string;
  error?: string;
  refused?: AuthHostNotAllowedError;
};

const IDLE: Status = { status: 'idle' };

/**
 * Obtains an SCM access token for the host selected in `X2ARepoUrlPicker`.
 *
 * Returns an `ApiHolder` that is meant to wrap the stock `RepoUrlPicker`
 * (`ApiProvider`) and replaces two APIs in that scope only:
 *
 * - `scmAuthApiRef`: a thin shim that delegates to the app's `scmAuthApi`
 *   (resolved outside the scope), behind the `x2a.scm.authHosts` guard. RHDH
 *   maps every `integrations.<type>[]` host to one per-type auth API, which
 *   would send one host's token to another host of the same type; the guard
 *   refuses any host other than the one configured. It never throws: a
 *   refusal or failure is reported through `status` and an empty token is
 *   returned, which fails closed in the scaffolder action.
 * - `scmIntegrationsApiRef`: reports Bitbucket Cloud as `bitbucket`, which is
 *   what the stock picker needs to render the workspace/project inputs.
 *   TODO: remove once `@backstage/plugin-scaffolder` >= 1.38.1
 *   (Backstage >= 1.53.0) is used.
 *
 * The token is stored raw (not run through `augmentToken`), because
 * `createProjectAction` adds the git-over-HTTPS prefix server-side. The
 * secret is cleared as soon as the selected host changes, so a token for one
 * host is never submitted for another.
 */
export function useRepoUrlCredentials({ host, options }: Params) {
  const { assertAuthHost } = useRepoAuthentication();
  const { secrets, setSecrets } = useTemplateSecrets();
  const integrations = useApi(scmIntegrationsApiRef);
  const appScmAuth = useApi(scmAuthApiRef);
  const hostMap = useScmHostMap();

  const [state, setState] = useState<Status>(IDLE);
  const [attempt, setAttempt] = useState(0);

  const secretsKey = options?.secretsKey;
  const readOnly = options?.readOnly ?? false;

  // Latest values, read by the long-lived shim.
  const latest = useRef({ host, secretsKey, readOnly, secrets });
  latest.current = { host, secretsKey, readOnly, secrets };
  const setSecretsRef = useRef(setSecrets);
  setSecretsRef.current = setSecrets;
  const failedHostRef = useRef<string | undefined>(undefined);

  const getCredentials = useCallback(
    async (
      callOptions: Parameters<typeof appScmAuth.getCredentials>[0],
    ): Promise<{ token: string }> => {
      // `new URL().host`: lowercased, without a default port.
      const callHost = extractHost(callOptions.url) ?? '';
      if (failedHostRef.current === callHost) {
        return { token: '' };
      }
      // An unknown host resolves to the fallback provider of
      // `resolveScmProvider`, so it is checked against that provider's
      // `authHosts` entry and refused (fail closed).
      const provider = resolveScmProvider(callOptions.url, hostMap).name;

      // A response for a host that is no longer selected must not touch the
      // secret: hand back its current value so the caller's write is a no-op.
      // The selected host keeps the integration's spelling (e.g. `:443`), so
      // normalise it like the URL host.
      const stale = () => normalizeHost(latest.current.host) !== callHost;
      const currentSecret = () => {
        const key = latest.current.secretsKey;
        return { token: (key && latest.current.secrets[key]) || '' };
      };

      try {
        assertAuthHost(provider, callHost);
      } catch (e) {
        if (!(e instanceof AuthHostNotAllowedError)) {
          throw e;
        }
        failedHostRef.current = callHost;
        setState({
          status: 'error',
          provider,
          host: callHost,
          error: e.message,
          refused: e,
        });
        return { token: '' };
      }

      try {
        const { token } = await appScmAuth.getCredentials({
          ...callOptions,
          additionalScope: {
            ...callOptions.additionalScope,
            repoWrite: !latest.current.readOnly,
          },
        });
        if (stale()) {
          return currentSecret();
        }
        setState(IDLE);
        return { token };
      } catch (e) {
        if (stale()) {
          return currentSecret();
        }
        failedHostRef.current = callHost;
        setState({
          status: 'error',
          provider,
          host: callHost,
          error: e instanceof Error ? e.message : String(e),
        });
        return { token: '' };
      }
    },
    [appScmAuth, assertAuthHost, hostMap],
  );

  const apis = useMemo<ApiHolder>(() => {
    const shim = { getCredentials };
    // TODO: remove once @backstage/plugin-scaffolder >= 1.38.1.
    const remapped = Object.create(integrations, {
      byHost: {
        value: (h: string) => {
          const found = integrations.byHost(h);
          return found?.type === 'bitbucketCloud'
            ? Object.create(found, { type: { value: 'bitbucket' } })
            : found;
        },
      },
    });
    return {
      get<T>(ref: ApiRef<T>): T | undefined {
        if (ref.id === scmAuthApiRef.id) return shim as unknown as T;
        if (ref.id === scmIntegrationsApiRef.id) return remapped as T;
        return undefined;
      },
    };
  }, [integrations, getCredentials]);

  // Drop the previous host's token immediately on host change; the stock
  // picker only refreshes it after a 500 ms debounce.
  const prevHostRef = useRef(host);
  useEffect(() => {
    const prev = prevHostRef.current;
    prevHostRef.current = host;
    if (prev === undefined || prev === host) {
      return;
    }
    failedHostRef.current = undefined;
    setState(IDLE);
    if (secretsKey) {
      setSecretsRef.current({ [secretsKey]: '' });
    }
  }, [host, secretsKey]);

  const retry = useCallback(() => {
    failedHostRef.current = undefined;
    setAttempt(a => a + 1);
  }, []);

  const active = !!secretsKey;
  return {
    apis,
    attempt,
    status: active ? state.status : 'idle',
    provider: state.provider,
    host: state.host,
    error: state.error,
    refused: state.refused,
    retry,
  } satisfies RepoUrlCredentialsState & { apis: ApiHolder; attempt: number };
}
