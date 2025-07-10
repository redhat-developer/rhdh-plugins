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
import { ScmAuth, scmAuthApiRef } from '@backstage/integration-react';
import {
  ApiRef,
  BackstageIdentityApi,
  configApiRef,
  createApiFactory,
  createApiRef,
  discoveryApiRef,
  githubAuthApiRef,
  OAuthApi,
  oauthRequestApiRef,
  ProfileInfoApi,
  SessionApi,
} from '@backstage/core-plugin-api';
import { GithubAuth } from '@backstage/core-app-api';

export const ghTwoAuthApiRef: ApiRef<
  OAuthApi & ProfileInfoApi & BackstageIdentityApi & SessionApi
> = createApiRef({
  id: 'my.custom.auth.github-two',
});

export const ghTwoApi: any = createApiFactory({
  api: ghTwoAuthApiRef,
  deps: {
    discoveryApi: discoveryApiRef,
    oauthRequestApi: oauthRequestApiRef,
    configApi: configApiRef,
  },
  factory: ({ discoveryApi, oauthRequestApi, configApi }) =>
    GithubAuth.create({
      configApi,
      discoveryApi,
      oauthRequestApi,
      provider: { id: 'github-two', title: 'Github Two', icon: () => null },
      defaultScopes: ['read:user'],
      environment: configApi.getOptionalString('auth.environment'),
    }),
});

export const scmAuthApi = createApiFactory({
  api: scmAuthApiRef,
  deps: { githubAuthApi: githubAuthApiRef, ghTwoAuthApi: ghTwoAuthApiRef },
  factory: ({ githubAuthApi, ghTwoAuthApi }) => {
    return ScmAuth.merge(
      ScmAuth.forGithub(ghTwoAuthApi),
      ScmAuth.forGithub(githubAuthApi, { host: 'my.enterprise.github' }),
    );
  },
});
