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
 * See the License for the specific governing permissions and limitations under the License.
 */

import { useCallback, useMemo } from 'react';

import {
  githubAuthApiRef,
  gitlabAuthApiRef,
  OAuthApi,
  useApi,
  useApp,
} from '@backstage/core-plugin-api';
import { AuthToken, AuthTokenDescriptor } from './tokenDescriptorTypes';

const isAuthApi = (api: any): api is OAuthApi => {
  return api && typeof api.getAccessToken === 'function';
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

/**
 * This is highly motivated by the similar well-tested functionality in the orchestrator plugin.
 *
 * We need just a subset of it (github and gitlab) for now.
 */
export const useRepoAuthentication = () => {
  const app = useApp();
  const githubAuthApi = useApi(githubAuthApiRef);
  const gitlabAuthApi = useApi(gitlabAuthApiRef);

  const getToken = useCallback(
    async (tokenDescriptor: AuthTokenDescriptor): Promise<AuthToken> => {
      let authApi = githubAuthApi;
      if (tokenDescriptor.provider.toLocaleLowerCase('en-US') === 'gitlab') {
        authApi = gitlabAuthApi;
      }

      const token = await getProviderToken(authApi, tokenDescriptor);
      return {
        token,
        provider: tokenDescriptor.provider,
      };
    },
    [githubAuthApi, gitlabAuthApi],
  );

  const authenticate = useCallback(
    async (
      tokenDescriptors: AuthTokenDescriptor[],
    ): Promise<Array<AuthToken>> => {
      if (!app) {
        throw new Error('App context is required for authentication');
      }

      const authTokens: Array<AuthToken> = [];
      for (const tokenDescriptor of tokenDescriptors) {
        authTokens.push(await getToken(tokenDescriptor));
      }
      return authTokens;
    },
    [app, getToken],
  );

  const response = useMemo(() => {
    return {
      authenticate,
    };
  }, [authenticate]);

  return response;
};
