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
import {
  createApiFactory,
  createPlugin,
  createRoutableExtension,
  IconComponent,
  discoveryApiRef,
  configApiRef,
  oauthRequestApiRef,
} from '@backstage/core-plugin-api';
import { OAuth2 } from '@backstage/core-app-api';
import { rootRouteRef } from './routes';
import HomeOutlinedIcon from '@mui/icons-material/HomeOutlined';
import StarOutlineOutlinedIcon from '@mui/icons-material/StarOutlineOutlined';
import {
  registerApiRef,
  keycloakApiRef,
  RegistrationBackendClient,
  KubeBackendClient,
  kubeApiRef,
  aapApiRef,
  AnsibleBackendClient,
  secureFetchApiRef,
  SecureFetchClient,
} from './api';

/**
 * Plugin for Developer Sandbox frontend
 * @public
 */
export const sandboxPlugin = createPlugin({
  id: 'sandbox',
  routes: {
    root: rootRouteRef,
  },
  apis: [
    createApiFactory({
      api: keycloakApiRef,
      deps: {
        discoveryApi: discoveryApiRef,
        oauthRequestApi: oauthRequestApiRef,
        configApi: configApiRef,
      },
      factory: ({ discoveryApi, oauthRequestApi, configApi }) =>
        OAuth2.create({
          configApi,
          discoveryApi,
          oauthRequestApi,
          provider: {
            id: 'oidc',
            title: 'Keycloak OIDC',
            icon: () => null,
          },
          environment: configApi.getOptionalString('auth.environment'),
          defaultScopes: ['openid', 'profile', 'email'],
        }),
    }),
    createApiFactory({
      api: secureFetchApiRef,
      deps: { oauthApi: keycloakApiRef },
      factory: ({ oauthApi }) => new SecureFetchClient({ oauthApi }),
    }),
    createApiFactory({
      api: registerApiRef,
      deps: {
        configApi: configApiRef,
        discoveryApi: discoveryApiRef,
        secureFetchApi: secureFetchApiRef,
      },
      factory: ({ configApi, discoveryApi, secureFetchApi }) =>
        new RegistrationBackendClient({
          configApi,
          discoveryApi,
          secureFetchApi,
        }),
    }),
    createApiFactory({
      api: kubeApiRef,
      deps: {
        discoveryApi: discoveryApiRef,
        secureFetchApi: secureFetchApiRef,
      },
      factory: ({ discoveryApi, secureFetchApi }) =>
        new KubeBackendClient({ discoveryApi, secureFetchApi }),
    }),
    createApiFactory({
      api: aapApiRef,
      deps: {
        discoveryApi: discoveryApiRef,
        secureFetchApi: secureFetchApiRef,
      },
      factory: ({ discoveryApi, secureFetchApi }) =>
        new AnsibleBackendClient({ discoveryApi, secureFetchApi }),
    }),
  ],
});

/**
 * Sandbox Page
 * @public
 */
export const SandboxPage = sandboxPlugin.provide(
  createRoutableExtension({
    name: 'SandboxPage',
    component: () =>
      import('./components/SandboxCatalog/SandboxCatalogPage').then(
        m => m.SandboxCatalogPage,
      ),
    mountPoint: rootRouteRef,
  }),
);

/**
 * Sandbox Activities Page
 * @public
 */
export const SandboxActivitiesPage = sandboxPlugin.provide(
  createRoutableExtension({
    name: 'SandboxActivitiesPage',
    component: () =>
      import('./components/SandboxActivities/SandboxActivitiesPage').then(
        m => m.SandboxActivitiesPage,
      ),
    mountPoint: rootRouteRef,
  }),
);

/**
 * Icon for Sandbox Home Page
 * @public
 */
export const SandboxHomeIcon: IconComponent = HomeOutlinedIcon;

/**
 * Icon for Sandbox Activities Page
 * @public
 */
export const SandboxActivitiesIcon: IconComponent = StarOutlineOutlinedIcon;
