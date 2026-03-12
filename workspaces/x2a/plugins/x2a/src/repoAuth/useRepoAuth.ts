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
import {
  resolveScmProviderByName,
  AuthToken,
  AuthTokenDescriptor,
  ScmProviderName,
} from '@red-hat-developer-hub/backstage-plugin-x2a-common';

const isAuthApi = (api: any): api is OAuthApi => {
  return api && typeof api.getAccessToken === 'function';
};

const providerLabels: Record<ScmProviderName, string> = {
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

export const useRepoAuthentication = () => {
  const apiHolder = useApiHolder();

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

  const getToken = useCallback(
    async (tokenDescriptor: AuthTokenDescriptor): Promise<AuthToken> => {
      const providerName = tokenDescriptor.provider as ScmProviderName;
      const api = apiByProvider[providerName];

      if (!api) {
        const label = providerLabels[providerName] ?? providerName;
        throw new Error(
          `${label} auth provider is not configured. Add the corresponding @backstage/plugin-auth-backend-module-*-provider to your backend.`,
        );
      }

      const rawToken = await getProviderToken(api, tokenDescriptor);
      const provider = resolveScmProviderByName(
        tokenDescriptor.provider as ScmProviderName,
      );
      return {
        token: provider.augmentToken(rawToken),
        provider: tokenDescriptor.provider,
      };
    },
    [apiByProvider],
  );

  const authenticate = useCallback(
    async (
      tokenDescriptors: AuthTokenDescriptor[],
    ): Promise<Array<AuthToken>> => {
      const authTokens: Array<AuthToken> = [];
      for (const tokenDescriptor of tokenDescriptors) {
        authTokens.push(await getToken(tokenDescriptor));
      }
      return authTokens;
    },
    [getToken],
  );

  const response = useMemo(() => {
    return {
      authenticate,
    };
  }, [authenticate]);

  return response;
};
