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
import { useCallback } from 'react';

import {
  AnyApiFactory,
  githubAuthApiRef,
  gitlabAuthApiRef,
  microsoftAuthApiRef,
  OAuthApi,
  OpenIdConnectApi,
  useApi,
  useApiHolder,
  useApp,
} from '@backstage/core-plugin-api';

import {
  AuthToken,
  AuthTokenDescriptor,
} from '@redhat/backstage-plugin-orchestrator-common';

const isAuthApi = (api: any): api is OAuthApi => {
  return api && typeof api.getAccessToken === 'function';
};

const isOpenIdAuthApi = (api: any): api is OpenIdConnectApi => {
  return api && 'getIdToken' in api && typeof api.getIdToken === 'function';
};

export const useOrchestratorAuth = () => {
  const app = useApp();
  const apiHolder = useApiHolder();
  const githubAuthApi = useApi(githubAuthApiRef);
  const gitlabAuthApi = useApi(gitlabAuthApiRef);
  const microsoftAuthApi = useApi(microsoftAuthApiRef);

  const getProviderToken = useCallback(
    async (
      api: unknown,
      tokenDescriptor: AuthTokenDescriptor,
    ): Promise<string> => {
      if (tokenDescriptor.tokenType === 'openId') {
        if (isOpenIdAuthApi(api)) {
          return await api.getIdToken();
        }
        throw new Error(
          `${tokenDescriptor.provider} auth API does not support OpenID Connect tokens, since it does not implement the getIdToken method`,
        );
      } else if (
        !tokenDescriptor.tokenType ||
        tokenDescriptor.tokenType === 'oauth'
      ) {
        if (isAuthApi(api)) {
          return await api.getAccessToken(tokenDescriptor.scope);
        }
        throw new Error(
          `${tokenDescriptor.provider} auth API does not support OAuth tokens, since it does not implement the getAccessToken method`,
        );
      } else {
        throw new Error(
          `Unsupported token type: ${tokenDescriptor.tokenType}. The supported token types are: openId and oauth`,
        );
      }
    },
    [],
  );

  const findCustomProvider = useCallback(
    async (providerApiId: string): Promise<unknown> => {
      const allPlugins = app.getPlugins();

      // For APIs deployed within plugins
      const apiRef = allPlugins
        .flatMap(plugin => Array.from(plugin.getApis()))
        .find((api: AnyApiFactory) => api.api.id === providerApiId)?.api;

      if (apiRef) {
        const api = apiHolder.get(apiRef);
        if (!api) {
          throw new Error(
            `API with id "${providerApiId}" was not found in the API holder. The API is provided by a plugin.`,
          );
        }
        return api;
      }

      // Try to find a statically added api ref, like the 'internal.auth.oidc'
      // by https://github.com/redhat-developer/rhdh/blob/main/packages/app/src/api/AuthApiRefs.ts
      // Hint: If this approach proves to be working, we could use it for the other apis as well.
      // @ts-ignore
      const allApis = apiHolder.apis as Map<string, object>;
      const api = allApis.get(providerApiId);
      if (!api) {
        throw new Error(
          `API with id "${providerApiId}" was not found in the API holder.`,
        );
      }
      return api;
    },
    [app, apiHolder],
  );

  const getToken = useCallback(
    async (tokenDescriptor: AuthTokenDescriptor): Promise<AuthToken> => {
      let authApi: unknown;

      switch (tokenDescriptor.provider.toLocaleLowerCase('en-US')) {
        case 'github':
          authApi = githubAuthApi;
          break;
        case 'gitlab':
          authApi = gitlabAuthApi;
          break;
        case 'microsoft':
          authApi = microsoftAuthApi;
          break;
        default:
          if (!tokenDescriptor.customProviderApiId) {
            throw new Error(
              `Custom authentication provider API id is required for provider: ${tokenDescriptor.provider}`,
            );
          }
          authApi = await findCustomProvider(
            tokenDescriptor.customProviderApiId,
          );
          break;
      }

      const token = await getProviderToken(authApi, tokenDescriptor);
      return {
        token,
        provider: tokenDescriptor.provider,
      };
    },
    [
      githubAuthApi,
      gitlabAuthApi,
      microsoftAuthApi,
      findCustomProvider,
      getProviderToken,
    ],
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

  return {
    authenticate,
  };
};
