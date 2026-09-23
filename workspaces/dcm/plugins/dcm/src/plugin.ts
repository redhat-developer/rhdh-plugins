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
  discoveryApiRef,
  fetchApiRef,
} from '@backstage/core-plugin-api';
import {
  AgentsClient,
  CatalogClient,
  PolicyManagerClient,
  ResourcesClient,
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
import { dcmAuthApiFactory, dcmAuthApiRef } from './api/AuthApiRefs';

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
    dcmAuthApiFactory,
    createApiFactory({
      api: catalogApiRef,
      deps: {
        discoveryApi: discoveryApiRef,
        fetchApi: fetchApiRef,
        dcmAuthApi: dcmAuthApiRef,
      },
      factory({ discoveryApi, fetchApi, dcmAuthApi }) {
        return new CatalogClient({
          discoveryApi,
          fetchApi,
          getAccessToken: dcmAuthApi.getAccessToken,
        });
      },
    }),
    createApiFactory({
      api: policyManagerApiRef,
      deps: {
        discoveryApi: discoveryApiRef,
        fetchApi: fetchApiRef,
        dcmAuthApi: dcmAuthApiRef,
      },
      factory({ discoveryApi, fetchApi, dcmAuthApi }) {
        return new PolicyManagerClient({
          discoveryApi,
          fetchApi,
          getAccessToken: dcmAuthApi.getAccessToken,
        });
      },
    }),
    createApiFactory({
      api: agentsApiRef,
      deps: {
        discoveryApi: discoveryApiRef,
        fetchApi: fetchApiRef,
        dcmAuthApi: dcmAuthApiRef,
      },
      factory({ discoveryApi, fetchApi, dcmAuthApi }) {
        return new AgentsClient({
          discoveryApi,
          fetchApi,
          getAccessToken: dcmAuthApi.getAccessToken,
        });
      },
    }),
    createApiFactory({
      api: resourcesApiRef,
      deps: {
        discoveryApi: discoveryApiRef,
        fetchApi: fetchApiRef,
        dcmAuthApi: dcmAuthApiRef,
      },
      factory({ discoveryApi, fetchApi, dcmAuthApi }) {
        return new ResourcesClient({
          discoveryApi,
          fetchApi,
          getAccessToken: dcmAuthApi.getAccessToken,
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
