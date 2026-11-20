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

import { AuthHostNotAllowedError, useRepoAuthentication } from '../repoAuth';
import { normalizeHost } from '../hooks/useScmAuthHosts';

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
  /**
   * Set when the host is not the one the provider's OAuth app is registered
   * against (`x2a.scm.authHosts`), so no token was requested. Retrying does
   * not help.
   */
  refused?: AuthHostNotAllowedError;
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
  refused?: AuthHostNotAllowedError;
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
 *   provider-level Backstage auth API. That API is configured per provider
 *   type, so `useRepoAuthentication` only hands its token to the host set in
 *   `x2a.scm.authHosts`; any other host is reported as an error. It never
 *   throws: a failure is reported through `status` and an empty token is
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
  const inFlightRef = useRef<
    { host: string; promise: Promise<{ token: string }> } | undefined
  >(undefined);

  /**
   * Requests the token for `callHost`, which is normalised (lowercased,
   * without a default port), as `new URL().host` returns it.
   */
  const requestCredentials = useCallback(
    async (callHost: string): Promise<{ token: string }> => {
      if (failedHostRef.current === callHost) {
        return { token: '' };
      }
      // `byHost` matches the configured host exactly, but the URL drops an
      // explicit default port (`host:443` is a valid integration host). The
      // selected host keeps the configured spelling, so fall back to it.
      const selectedHost = latest.current.host;
      const integration =
        integrations.byHost(callHost) ??
        (selectedHost && normalizeHost(selectedHost) === callHost
          ? integrations.byHost(selectedHost)
          : undefined);
      const provider = integration
        ? PROVIDER_BY_INTEGRATION_TYPE[integration.type]
        : undefined;
      setState({ status: 'pending', provider, host: callHost });

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
        if (!provider) {
          throw new Error(`Unsupported SCM host '${callHost}'`);
        }
        const token = await latest.current.getRawToken(
          resolveScmProviderByName(provider).getAuthTokenDescriptor(
            latest.current.readOnly,
          ),
          // The guard in useRepoAuth refuses a host other than the one the
          // provider's OAuth app is registered against.
          callHost,
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
          refused: e instanceof AuthHostNotAllowedError ? e : undefined,
        });
        return { token: '' };
      }
    },
    [integrations],
  );

  // One request per host at a time. While a sign-in is pending the secret is
  // still empty, so the stock picker asks again on every debounced state
  // change (each owner/repo keystroke). Those calls share the pending request
  // rather than starting another one, whose late result could overwrite the
  // status or the stored token.
  const getCredentials = useCallback(
    ({ url }: { url: string }): Promise<{ token: string }> => {
      const callHost = new URL(url).host;
      const inFlight = inFlightRef.current;
      if (inFlight?.host === callHost) {
        return inFlight.promise;
      }
      const promise = requestCredentials(callHost).finally(() => {
        if (inFlightRef.current?.promise === promise) {
          inFlightRef.current = undefined;
        }
      });
      inFlightRef.current = { host: callHost, promise };
      return promise;
    },
    [requestCredentials],
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
