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
  configApiRef,
  createApiFactory,
  createPlugin,
  createRoutableExtension,
  discoveryApiRef,
  fetchApiRef,
  type ConfigApi,
  type OAuthApi,
  type OpenIdConnectApi,
} from '@backstage/core-plugin-api';
import {
  AgentsClient,
  CatalogClient,
  PolicyManagerClient,
  ResourcesClient,
  type DcmOidcTokenProvider,
} from '@red-hat-developer-hub/backstage-plugin-dcm-common';

import {
  rootRouteRef,
  agentsRouteRef,
  policiesRouteRef,
  serviceTypesRouteRef,
  catalogItemsRouteRef,
  catalogItemInstancesRouteRef,
  resourcesRouteRef,
} from './routes';
import {
  agentsApiRef,
  catalogApiRef,
  policyManagerApiRef,
  resourcesApiRef,
} from './apis';
import { oidcAuthApiRef } from './api/AuthApiRefs';

export function getDcmAccessTokenProvider(
  configApi: ConfigApi,
  oidcAuthApi?: OAuthApi & OpenIdConnectApi,
): DcmOidcTokenProvider | undefined {
  const authEnabled = configApi.getOptionalBoolean('dcm.auth.enabled') ?? true;
  if (!authEnabled) {
    return undefined;
  }
  if (!oidcAuthApi) {
    return () =>
      Promise.reject(
        new Error(
          'DCM authentication is enabled, but the host does not provide internal.auth.oidc.',
        ),
      );
  }
  return oidcAuthApi.getAccessToken.bind(oidcAuthApi);
}

/**
 * DCM plugin instance.
 *
 * @public
 */
export const dcmPlugin = createPlugin({
  id: 'dcm',
  routes: {
    root: rootRouteRef,
    agents: agentsRouteRef,
    policies: policiesRouteRef,
    serviceTypes: serviceTypesRouteRef,
    catalogItems: catalogItemsRouteRef,
    catalogItemInstances: catalogItemInstancesRouteRef,
    resources: resourcesRouteRef,
  },
  apis: [
    createApiFactory({
      api: catalogApiRef,
      deps: {
        configApi: configApiRef,
        discoveryApi: discoveryApiRef,
        fetchApi: fetchApiRef,
        oidcAuthApi: oidcAuthApiRef,
      },
      factory({ configApi, discoveryApi, fetchApi, oidcAuthApi }) {
        return new CatalogClient({
          discoveryApi,
          fetchApi,
          getAccessToken: getDcmAccessTokenProvider(configApi, oidcAuthApi),
        });
      },
    }),
    createApiFactory({
      api: policyManagerApiRef,
      deps: {
        configApi: configApiRef,
        discoveryApi: discoveryApiRef,
        fetchApi: fetchApiRef,
        oidcAuthApi: oidcAuthApiRef,
      },
      factory({ configApi, discoveryApi, fetchApi, oidcAuthApi }) {
        return new PolicyManagerClient({
          discoveryApi,
          fetchApi,
          getAccessToken: getDcmAccessTokenProvider(configApi, oidcAuthApi),
        });
      },
    }),
    createApiFactory({
      api: agentsApiRef,
      deps: {
        configApi: configApiRef,
        discoveryApi: discoveryApiRef,
        fetchApi: fetchApiRef,
        oidcAuthApi: oidcAuthApiRef,
      },
      factory({ configApi, discoveryApi, fetchApi, oidcAuthApi }) {
        return new AgentsClient({
          discoveryApi,
          fetchApi,
          getAccessToken: getDcmAccessTokenProvider(configApi, oidcAuthApi),
        });
      },
    }),
    createApiFactory({
      api: resourcesApiRef,
      deps: {
        configApi: configApiRef,
        discoveryApi: discoveryApiRef,
        fetchApi: fetchApiRef,
        oidcAuthApi: oidcAuthApiRef,
      },
      factory({ configApi, discoveryApi, fetchApi, oidcAuthApi }) {
        return new ResourcesClient({
          discoveryApi,
          fetchApi,
          getAccessToken: getDcmAccessTokenProvider(configApi, oidcAuthApi),
        });
      },
    }),
  ],
});

/**
 * DCM page component.
 *
 * @public
 */
export const DcmPage = dcmPlugin.provide(
  createRoutableExtension({
    name: 'DcmPage',
    component: () => import('./Router').then(m => m.Router),
    mountPoint: rootRouteRef,
  }),
);
