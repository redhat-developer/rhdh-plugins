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
  identityApiRef,
} from '@backstage/core-plugin-api';
import {
  OptimizationsClient,
  OrchestratorSlimClient,
  CostManagementSlimClient,
} from '@red-hat-developer-hub/plugin-redhat-resource-optimization-common/clients';
import {
  optimizationsApiRef,
  orchestratorSlimApiRef,
  costManagementSlimApiRef,
  resourceOptimizationAccessApiRef,
  type ResourceOptimizationAccessApi,
} from './apis';

const resourceOptimizationPluginId = 'redhat-resource-optimization';
import { optimizationsBreakdownRouteRef, rootRouteRef } from './routes';

/** @public */
export const resourceOptimizationPlugin = createPlugin({
  id: 'redhat-resource-optimization',
  apis: [
    createApiFactory({
      api: optimizationsApiRef,
      deps: {
        discoveryApi: discoveryApiRef,
        fetchApi: fetchApiRef,
      },
      factory({ discoveryApi, fetchApi }) {
        return new OptimizationsClient({
          discoveryApi,
          fetchApi,
        });
      },
    }),
    createApiFactory({
      api: orchestratorSlimApiRef,
      deps: {
        discoveryApi: discoveryApiRef,
        fetchApi: fetchApiRef,
        identityApi: identityApiRef,
      },
      factory({ discoveryApi, fetchApi, identityApi }) {
        return new OrchestratorSlimClient({
          discoveryApi,
          fetchApi,
          identityApi,
        });
      },
    }),
    createApiFactory({
      api: costManagementSlimApiRef,
      deps: {
        discoveryApi: discoveryApiRef,
        fetchApi: fetchApiRef,
      },
      factory({ discoveryApi, fetchApi }) {
        return new CostManagementSlimClient({
          discoveryApi,
          fetchApi,
        });
      },
    }),
    createApiFactory({
      api: resourceOptimizationAccessApiRef,
      deps: {
        discoveryApi: discoveryApiRef,
        fetchApi: fetchApiRef,
      },
      factory({ discoveryApi, fetchApi }): ResourceOptimizationAccessApi {
        return {
          async getOptimizationsAccess() {
            const baseUrl = await discoveryApi.getBaseUrl(
              resourceOptimizationPluginId,
            );
            const res = await fetchApi.fetch(`${baseUrl}/access`);
            const data = (await res.json()) as { decision: string };
            return data.decision === 'ALLOW';
          },
          async getCostManagementAccess() {
            const baseUrl = await discoveryApi.getBaseUrl(
              resourceOptimizationPluginId,
            );
            const res = await fetchApi.fetch(
              `${baseUrl}/access/cost-management`,
            );
            const data = (await res.json()) as { decision: string };
            return data.decision === 'ALLOW';
          },
        };
      },
    }),
  ],
  routes: {
    root: rootRouteRef,
    breakdown: optimizationsBreakdownRouteRef,
  },
});

/** @public */
export const ResourceOptimizationPage = resourceOptimizationPlugin.provide(
  createRoutableExtension({
    name: 'ResourceOptimizationPage',
    component: () => import('./Router').then(m => m.Router),
    mountPoint: rootRouteRef,
  }),
);
