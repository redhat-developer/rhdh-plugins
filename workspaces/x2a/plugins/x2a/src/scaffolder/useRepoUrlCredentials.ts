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
  resolveScmProviderByName,
  type ScmProviderName,
} from '@red-hat-developer-hub/backstage-plugin-x2a-common';

import { useRepoAuthentication } from '../repoAuth';

/**
 * `ui:options.requestUserCredentials` as consumed by `X2ARepoUrlPicker`.
 *
 * Same `secretsKey` as the stock `RepoUrlPicker` option, plus `readOnly`.
 *
 * @public
 */
export type RepoUrlCredentialsOptions = {
  /** Scaffolder secret the access token is written to. */
  secretsKey: string;
  /**
   * Request a read-only scope. Defaults to `false` (read/write).
   *
   * Honoured by GitLab (`read_repository` vs `write_repository`) and Bitbucket
   * (`repository` vs `repository:write`). GitHub's `repo` scope has no
   * read-only counterpart, so GitHub always gets read/write.
   */
  readOnly?: boolean;
};

/**
 * Progress of the access-token request made by `X2ARepoUrlPicker`.
 *
 * @public
 */
export type RepoUrlCredentialsStatus =
  | 'idle'
  | 'pending'
  | 'authenticated'
  | 'error';

/** @public */
export type RepoUrlCredentialsState = {
  status: RepoUrlCredentialsStatus;
  /** Provider the token was requested from, once a host is known. */
  provider?: ScmProviderName;
  /** Host the status refers to, for messages when no provider is known. */
  host?: string;
  error?: string;
  retry: () => void;
};

/** Integration `type` (Backstage) to x2a provider. */
const PROVIDER_BY_INTEGRATION_TYPE: Record<string, ScmProviderName> = {
  github: 'github',
  gitlab: 'gitlab',
  bitbucketCloud: 'bitbucket',
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
};

const IDLE: Status = { status: 'idle' };

/**
 * Obtains an SCM access token for the host selected in `X2ARepoUrlPicker`.
 *
 * The stock `RepoUrlPicker` resolves `requestUserCredentials` through
 * `scmAuthApi`, which is keyed **by host** and throws for any self-hosted
 * instance. Instead of reimplementing the picker, this hook returns an
 * `ApiHolder` that is meant to wrap it (`ApiProvider`) and replaces two APIs
 * in that scope only:
 *
 * - `scmAuthApiRef`: a shim whose `getCredentials` obtains the token from the
 *   provider-level Backstage auth API (configured per provider type, so any
 *   host works). It never throws: a failure is reported through `status` and
 *   an empty token is returned, which fails closed in the scaffolder action.
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
  const { getRawToken } = useRepoAuthentication();
  const { secrets, setSecrets } = useTemplateSecrets();
  const integrations = useApi(scmIntegrationsApiRef);

  const [state, setState] = useState<Status>(IDLE);
  const [attempt, setAttempt] = useState(0);

  const secretsKey = options?.secretsKey;
  const readOnly = options?.readOnly ?? false;

  // Latest values, read by the long-lived shim.
  const latest = useRef({ host, secretsKey, readOnly, secrets, getRawToken });
  latest.current = { host, secretsKey, readOnly, secrets, getRawToken };
  const setSecretsRef = useRef(setSecrets);
  setSecretsRef.current = setSecrets;
  const failedHostRef = useRef<string | undefined>(undefined);

  const getCredentials = useCallback(
    async ({ url }: { url: string }): Promise<{ token: string }> => {
      const callHost = new URL(url).host;
      if (failedHostRef.current === callHost) {
        return { token: '' };
      }
      const integration = integrations.byHost(callHost);
      const provider = integration
        ? PROVIDER_BY_INTEGRATION_TYPE[integration.type]
        : undefined;
      setState({ status: 'pending', provider, host: callHost });

      // A response for a host that is no longer selected must not touch the
      // secret: hand back its current value so the caller's write is a no-op.
      const stale = () => latest.current.host !== callHost;
      const currentSecret = () => {
        const key = latest.current.secretsKey;
        return { token: (key && latest.current.secrets[key]) || '' };
      };

      try {
        if (!provider) {
          throw new Error(`Unsupported SCM host '${callHost}'`);
        }
        const token = await latest.current.getRawToken(
          resolveScmProviderByName(provider).getAuthTokenDescriptor(
            latest.current.readOnly,
          ),
        );
        if (stale()) {
          return currentSecret();
        }
        setState({ status: 'authenticated', provider, host: callHost });
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
    [integrations],
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
    retry,
  } satisfies RepoUrlCredentialsState & { apis: ApiHolder; attempt: number };
}
