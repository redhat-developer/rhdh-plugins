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

import { useCallback, useEffect, useMemo, useRef } from 'react';

import {
  ApiRef,
  bitbucketAuthApiRef,
  githubAuthApiRef,
  gitlabAuthApiRef,
  OAuthApi,
  useApi,
  useApp,
} from '@backstage/core-plugin-api';
import {
  augmentRepoToken,
  AuthToken,
  AuthTokenDescriptor,
} from '@red-hat-developer-hub/backstage-plugin-x2a-common';

const isAuthApi = (api: any): api is OAuthApi => {
  return api && typeof api.getAccessToken === 'function';
};

/**
 * Like useApi but returns undefined instead of throwing when the provider is not registered.
 */
function useOptionalApi<T>(apiRef: ApiRef<T>): T | undefined {
  try {
    // eslint-disable-next-line react-hooks/rules-of-hooks
    return useApi(apiRef);
  } catch {
    return undefined;
  }
}

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
  const app = useApp();
  const bitbucketAuthApi = useOptionalApi(bitbucketAuthApiRef);
  const githubAuthApi = useOptionalApi(githubAuthApiRef);
  const gitlabAuthApi = useOptionalApi(gitlabAuthApiRef);

  const warnedRef = useRef(false);
  useEffect(() => {
    if (warnedRef.current) return;
    warnedRef.current = true;

    const unavailable = [
      !bitbucketAuthApi && 'Bitbucket',
      !githubAuthApi && 'GitHub',
      !gitlabAuthApi && 'GitLab',
    ].filter(Boolean);

    if (unavailable.length > 0) {
      // eslint-disable-next-line no-console
      console.warn(
        `x2a: SCM auth providers not configured (will not be available for repository authentication): ${unavailable.join(', ')}`,
      );
    }
  }, [bitbucketAuthApi, githubAuthApi, gitlabAuthApi]);

  const getToken = useCallback(
    async (tokenDescriptor: AuthTokenDescriptor): Promise<AuthToken> => {
      let token;
      if (tokenDescriptor.provider === 'github') {
        if (!githubAuthApi) {
          throw new Error(
            'GitHub auth provider is not configured. Add @backstage/plugin-auth-backend-module-github-provider to your backend.',
          );
        }
        token = await getProviderToken(githubAuthApi, tokenDescriptor);
      } else if (tokenDescriptor.provider === 'gitlab') {
        if (!gitlabAuthApi) {
          throw new Error(
            'GitLab auth provider is not configured. Add @backstage/plugin-auth-backend-module-gitlab-provider to your backend.',
          );
        }
        token = await getProviderToken(gitlabAuthApi, tokenDescriptor);
      } else if (tokenDescriptor.provider === 'bitbucket') {
        if (!bitbucketAuthApi) {
          throw new Error(
            'Bitbucket auth provider is not configured. Add @backstage/plugin-auth-backend-module-bitbucket-provider to your backend.',
          );
        }
        token = await getProviderToken(bitbucketAuthApi, tokenDescriptor);
      } else {
        throw new Error(`Unsupported provider: ${tokenDescriptor.provider}`);
      }

      return {
        token: augmentRepoToken(token, tokenDescriptor),
        provider: tokenDescriptor.provider,
      };
    },
    [bitbucketAuthApi, githubAuthApi, gitlabAuthApi],
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
