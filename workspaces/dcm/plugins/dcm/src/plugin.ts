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
  CatalogClient,
  PlacementClient,
  PolicyManagerClient,
  ProvidersClient,
} from '@red-hat-developer-hub/backstage-plugin-dcm-common';

import {
  rootRouteRef,
  serviceSpecsRouteRef,
  environmentDetailsRouteRef,
  serviceSpecDetailsRouteRef,
  providersRouteRef,
  policiesRouteRef,
  serviceTypesRouteRef,
  catalogItemsRouteRef,
  catalogItemInstancesRouteRef,
  resourcesRouteRef,
} from './routes';
import {
  catalogApiRef,
  placementApiRef,
  policyManagerApiRef,
  providersApiRef,
} from './apis';

/**
 * DCM plugin instance.
 *
 * @public
 */
export const dcmPlugin = createPlugin({
  id: 'dcm',
  routes: {
    root: rootRouteRef,
    serviceSpecs: serviceSpecsRouteRef,
    environmentDetails: environmentDetailsRouteRef,
    serviceSpecDetails: serviceSpecDetailsRouteRef,
    providers: providersRouteRef,
    policies: policiesRouteRef,
    serviceTypes: serviceTypesRouteRef,
    catalogItems: catalogItemsRouteRef,
    catalogItemInstances: catalogItemInstancesRouteRef,
    resources: resourcesRouteRef,
  },
  apis: [
    createApiFactory({
      api: catalogApiRef,
      deps: { discoveryApi: discoveryApiRef, fetchApi: fetchApiRef },
      factory({ discoveryApi, fetchApi }) {
        return new CatalogClient({ discoveryApi, fetchApi });
      },
    }),
    createApiFactory({
      api: policyManagerApiRef,
      deps: { discoveryApi: discoveryApiRef, fetchApi: fetchApiRef },
      factory({ discoveryApi, fetchApi }) {
        return new PolicyManagerClient({ discoveryApi, fetchApi });
      },
    }),
    createApiFactory({
      api: providersApiRef,
      deps: { discoveryApi: discoveryApiRef, fetchApi: fetchApiRef },
      factory({ discoveryApi, fetchApi }) {
        return new ProvidersClient({ discoveryApi, fetchApi });
      },
    }),
    createApiFactory({
      api: placementApiRef,
      deps: { discoveryApi: discoveryApiRef, fetchApi: fetchApiRef },
      factory({ discoveryApi, fetchApi }) {
        return new PlacementClient({ discoveryApi, fetchApi });
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
