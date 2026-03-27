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

import { OAuth2 } from '@backstage/core-app-api';
import {
  configApiRef,
  discoveryApiRef,
  oauthRequestApiRef,
} from '@backstage/core-plugin-api';
import {
  ApiBlueprint,
  createFrontendModule,
} from '@backstage/frontend-plugin-api';
import appPlugin from '@backstage/plugin-app';

import {
  auth0AuthApiRef,
  keycloakAuthApiRef,
  oidcAuthApiRef,
  pingfederateAuthApiRef,
  samlAuthApiRef,
} from './AuthApiRefs';
import { SignInPage } from './components/SignInPage';

const oidcAuthApi = ApiBlueprint.make({
  name: 'oidc-auth',
  params: defineParams =>
    defineParams({
      api: oidcAuthApiRef,
      deps: {
        discoveryApi: discoveryApiRef,
        oauthRequestApi: oauthRequestApiRef,
        configApi: configApiRef,
      },
      factory: ({ discoveryApi, oauthRequestApi, configApi }) =>
        OAuth2.create({
          configApi,
          discoveryApi,
          oauthRequestApi: oauthRequestApi,
          provider: {
            id: 'oidc',
            title: 'OIDC',
            icon: () => null,
          },
          environment: configApi.getOptionalString('auth.environment'),
        }),
    }),
});

const keycloakAuthApi = ApiBlueprint.make({
  name: 'keycloak-auth',
  params: defineParams =>
    defineParams({
      api: keycloakAuthApiRef,
      deps: {
        discoveryApi: discoveryApiRef,
        oauthRequestApi: oauthRequestApiRef,
        configApi: configApiRef,
      },
      factory: ({ discoveryApi, oauthRequestApi, configApi }) =>
        OAuth2.create({
          discoveryApi,
          oauthRequestApi: oauthRequestApi,
          provider: {
            id: 'keycloak',
            title: 'Keycloak',
            icon: () => null,
          },
          environment: configApi.getOptionalString('auth.environment'),
        }),
    }),
});

const pingfederateAuthApi = ApiBlueprint.make({
  name: 'pingfederate-auth',
  params: defineParams =>
    defineParams({
      api: pingfederateAuthApiRef,
      deps: {
        discoveryApi: discoveryApiRef,
        oauthRequestApi: oauthRequestApiRef,
        configApi: configApiRef,
      },
      factory: ({ discoveryApi, oauthRequestApi, configApi }) =>
        OAuth2.create({
          discoveryApi,
          oauthRequestApi: oauthRequestApi,
          provider: {
            id: 'pingfederate',
            title: 'PingFederate',
            icon: () => null,
          },
          environment: configApi.getOptionalString('auth.environment'),
        }),
    }),
});

const auth0AuthApi = ApiBlueprint.make({
  name: 'auth0-auth',
  params: defineParams =>
    defineParams({
      api: auth0AuthApiRef,
      deps: {
        discoveryApi: discoveryApiRef,
        oauthRequestApi: oauthRequestApiRef,
        configApi: configApiRef,
      },
      factory: ({ discoveryApi, oauthRequestApi, configApi }) =>
        OAuth2.create({
          discoveryApi,
          oauthRequestApi: oauthRequestApi,
          provider: {
            id: 'auth0',
            title: 'Auth0',
            icon: () => null,
          },
          defaultScopes: ['openid', 'email', 'profile'],
          environment: configApi.getOptionalString('auth.environment'),
        }),
    }),
});

const samlAuthApi = ApiBlueprint.make({
  name: 'saml-auth',
  params: defineParams =>
    defineParams({
      api: samlAuthApiRef,
      deps: {
        discoveryApi: discoveryApiRef,
        oauthRequestApi: oauthRequestApiRef,
        configApi: configApiRef,
      },
      factory: ({ discoveryApi, oauthRequestApi, configApi }) =>
        OAuth2.create({
          discoveryApi,
          oauthRequestApi: oauthRequestApi,
          provider: {
            id: 'saml',
            title: 'SAML',
            icon: () => null,
          },
          environment: configApi.getOptionalString('auth.environment'),
        }),
    }),
});

const signInPageOverride = appPlugin.getExtension('sign-in-page:app').override({
  params: {
    loader: async () => (props: Parameters<typeof SignInPage>[0]) =>
      <SignInPage {...props} />,
  },
});

/**
 * RHDH app sign-in page plus OIDC, Keycloak, PingFederate, Auth0, and SAML OAuth2 frontend APIs (`pluginId: app`).
 * Default-export this module for dynamic frontend loading.
 *
 * @alpha
 */
export const appAuthModule = createFrontendModule({
  pluginId: 'app',
  extensions: [
    signInPageOverride,
    oidcAuthApi,
    keycloakAuthApi,
    pingfederateAuthApi,
    auth0AuthApi,
    samlAuthApi,
  ],
});
