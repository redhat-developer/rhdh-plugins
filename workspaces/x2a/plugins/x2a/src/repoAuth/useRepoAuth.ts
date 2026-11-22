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
 * See the License for the specific language governing permissions and limitations under the License.
 */

import { useCallback, useEffect, useMemo, useRef } from 'react';

import {
  bitbucketAuthApiRef,
  githubAuthApiRef,
  gitlabAuthApiRef,
  OAuthApi,
  useApiHolder,
} from '@backstage/core-plugin-api';
import { useScmAuthHosts } from '../hooks/useScmAuthHosts';
import {
  extractHost,
  resolveScmProvider,
  resolveScmProviderByName,
  AuthToken,
  AuthTokenDescriptor,
  ScmProviderName,
} from '@red-hat-developer-hub/backstage-plugin-x2a-common';

const isAuthApi = (api: any): api is OAuthApi => {
  return api && typeof api.getAccessToken === 'function';
};

/** Display names of the SCM providers. */
export const providerLabels: Record<ScmProviderName, string> = {
  github: 'GitHub',
  gitlab: 'GitLab',
  bitbucket: 'Bitbucket',
};

const getProviderToken = async (
  api: unknown,
  tokenDescriptor: AuthTokenDescriptor,
): Promise<string> => {
  if (!tokenDescriptor.tokenType || tokenDescriptor.tokenType === 'oauth') {
    if (isAuthApi(api)) {
      return await api.getAccessToken(tokenDescriptor.scope);
    }
    throw new Error(
      `${tokenDescriptor.provider} auth API does not support OAuth tokens, since it does not implement the getAccessToken method`,
    );
  } else {
    throw new Error(
      `Unsupported token type: ${tokenDescriptor.tokenType}. The supported token type is: oauth`,
    );
  }
};

/** A token request together with the host the token will be used against. */
export type HostBoundTokenRequest = {
  descriptor: AuthTokenDescriptor;
  /** Host (with a non-default port) of the repository the token is for. */
  host: string;
};

/**
 * Builds the token request for a repository: the descriptor of the SCM
 * provider that owns `repoUrl`, bound to the repository's host. An
 * unparseable URL yields an empty host, which the guard rejects.
 */
export const repoTokenRequest = (
  repoUrl: string,
  hostMap: Map<string, ScmProviderName>,
  readOnly: boolean,
): HostBoundTokenRequest => ({
  descriptor: resolveScmProvider(repoUrl, hostMap).getAuthTokenDescriptor(
    readOnly,
  ),
  host: extractHost(repoUrl) ?? '',
});

/**
 * Thrown when a token is requested for a host other than the one the
 * provider's OAuth app is registered against (`x2a.scm.authHosts`). Retrying
 * does not help; the configuration or the chosen host has to change.
 */
export class AuthHostNotAllowedError extends Error {
  constructor(
    message: string,
    /** Provider whose token was requested. */
    readonly provider: ScmProviderName,
    /** Host the token was requested for. */
    readonly host: string,
  ) {
    super(message);
    this.name = 'AuthHostNotAllowedError';
  }
}

export const useRepoAuthentication = () => {
  const apiHolder = useApiHolder();
  const { authHostFor, isAuthHost } = useScmAuthHosts();

  const apiByProvider = useMemo<Record<ScmProviderName, OAuthApi | undefined>>(
    () => ({
      github: apiHolder.get(githubAuthApiRef),
      gitlab: apiHolder.get(gitlabAuthApiRef),
      bitbucket: apiHolder.get(bitbucketAuthApiRef),
    }),
    [apiHolder],
  );

  const warnedRef = useRef(false);
  useEffect(() => {
    if (warnedRef.current) return;
    warnedRef.current = true;

    const unavailable = (
      Object.entries(apiByProvider) as [ScmProviderName, unknown][]
    )
      .filter(([_, api]) => !api)
      .map(([name]) => providerLabels[name]);

    if (unavailable.length > 0) {
      // eslint-disable-next-line no-console
      console.warn(
        `x2a: SCM auth providers not configured (will not be available for repository authentication): ${unavailable.join(', ')}`,
      );
    }
  }, [apiByProvider]);

  /**
   * Security boundary: the provider-level OAuth API issues one token per
   * provider type, valid for a single host. Never hand it out for another
   * host, even one of the same type. Do not remove this as redundant with the
   * picker's host filter, which is only a UX nicety.
   */
  const assertAuthHost = useCallback(
    (providerName: ScmProviderName, host: string) => {
      if (isAuthHost(host, providerName)) return;
      const label = providerLabels[providerName] ?? providerName;
      const expected = authHostFor(providerName);
      throw new AuthHostNotAllowedError(
        expected
          ? `The ${label} auth provider is configured for ${expected}, not ${host}. Its access token is not sent to other hosts.`
          : `No host is configured for the ${label} auth provider, so no ${label} access token can be used for ${host}. Set x2a.scm.authHosts.${providerName} to the host the provider is registered against.`,
        providerName,
        host,
      );
    },
    [authHostFor, isAuthHost],
  );

  /**
   * Returns the OAuth access token exactly as the provider issued it, without
   * the provider-specific git-over-HTTPS prefix that {@link augmentToken} adds.
   *
   * Consumers that hand the token to the x2a backend must pick the right
   * variant: the `OAUTH_TOKEN_*` secrets written by the CSV bulk import carry
   * augmented tokens, while `SRC_USER_OAUTH_TOKEN` / `TGT_USER_OAUTH_TOKEN`
   * carry raw ones because `createProjectAction` augments them server-side.
   */
  const getRawToken = useCallback(
    async (
      tokenDescriptor: AuthTokenDescriptor,
      host: string,
    ): Promise<string> => {
      const providerName = tokenDescriptor.provider as ScmProviderName;
      const api = apiByProvider[providerName];

      assertAuthHost(providerName, host);

      if (!api) {
        const label = providerLabels[providerName] ?? providerName;
        throw new Error(
          `${label} auth provider is not configured. Add the corresponding @backstage/plugin-auth-backend-module-*-provider to your backend.`,
        );
      }

      return await getProviderToken(api, tokenDescriptor);
    },
    [apiByProvider, assertAuthHost],
  );

  const getToken = useCallback(
    async ({
      descriptor: tokenDescriptor,
      host,
    }: HostBoundTokenRequest): Promise<AuthToken> => {
      const rawToken = await getRawToken(tokenDescriptor, host);
      const provider = resolveScmProviderByName(
        tokenDescriptor.provider as ScmProviderName,
      );
      return {
        token: provider.augmentToken(rawToken),
        provider: tokenDescriptor.provider,
      };
    },
    [getRawToken],
  );

  const authenticate = useCallback(
    async (requests: HostBoundTokenRequest[]): Promise<Array<AuthToken>> => {
      // Refuse the whole batch before any OAuth flow starts, so an allowed
      // host earlier in the list does not trigger a sign-in that a refused
      // host later in the list turns into an error anyway.
      for (const { descriptor, host } of requests) {
        assertAuthHost(descriptor.provider as ScmProviderName, host);
      }
      const authTokens: Array<AuthToken> = [];
      for (const request of requests) {
        authTokens.push(await getToken(request));
      }
      return authTokens;
    },
    [assertAuthHost, getToken],
  );

  const response = useMemo(() => {
    return {
      authenticate,
      getRawToken,
      assertAuthHost,
    };
  }, [authenticate, getRawToken, assertAuthHost]);

  return response;
};
