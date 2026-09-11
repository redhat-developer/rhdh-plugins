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

/**
 * New Frontend System entry (`./alpha`).
 *
 * @packageDocumentation
 */

import {
  discoveryApiRef,
  fetchApiRef,
  identityApiRef,
} from '@backstage/core-plugin-api';
import {
  ApiBlueprint,
  createApiFactory,
  createFrontendPlugin,
  PageBlueprint,
} from '@backstage/frontend-plugin-api';
import { IconBundleBlueprint } from '@backstage/plugin-app-react';
import {
  CostManagementSlimClient,
  OptimizationsClient,
  OrchestratorSlimClient,
} from '@red-hat-developer-hub/plugin-cost-management-common/clients';
import {
  costManagementSlimApiRef,
  optimizationsApiRef,
  orchestratorSlimApiRef,
} from './apis';
import { CostManagementIconOutlined } from './components/icon';
import {
  optimizationsBreakdownRouteRef,
  openShiftRouteRef,
  rootRouteRef,
} from './routes';

const optimizationsApi = ApiBlueprint.make({
  name: 'optimizations',
  params: defineParams =>
    defineParams(
      createApiFactory({
        api: optimizationsApiRef,
        deps: {
          discoveryApi: discoveryApiRef,
          fetchApi: fetchApiRef,
        },
        factory: ({ discoveryApi, fetchApi }) =>
          new OptimizationsClient({
            discoveryApi,
            fetchApi,
          }),
      }),
    ),
});

const orchestratorSlimApi = ApiBlueprint.make({
  name: 'orchestrator-slim',
  params: defineParams =>
    defineParams(
      createApiFactory({
        api: orchestratorSlimApiRef,
        deps: {
          discoveryApi: discoveryApiRef,
          fetchApi: fetchApiRef,
          identityApi: identityApiRef,
        },
        factory: ({ discoveryApi, fetchApi, identityApi }) =>
          new OrchestratorSlimClient({
            discoveryApi,
            fetchApi,
            identityApi,
          }),
      }),
    ),
});

const costManagementSlimApi = ApiBlueprint.make({
  name: 'cost-management-slim',
  params: defineParams =>
    defineParams(
      createApiFactory({
        api: costManagementSlimApiRef,
        deps: {
          discoveryApi: discoveryApiRef,
          fetchApi: fetchApiRef,
        },
        factory: ({ discoveryApi, fetchApi }) =>
          new CostManagementSlimClient({
            discoveryApi,
            fetchApi,
          }),
      }),
    ),
});

const costManagementIcons = IconBundleBlueprint.make({
  name: 'cost-management-icons',
  params: {
    icons: {
      costManagementIconOutlined: CostManagementIconOutlined,
    },
  },
});

const optimizationsPage = PageBlueprint.make({
  params: {
    path: '/cost-management/optimizations',
    routeRef: rootRouteRef,
    title: 'Optimizations',
    icon: <CostManagementIconOutlined />,
    noHeader: true,
    loader: () => import('./Router').then(m => <m.OptimizationsRouter />),
  },
});

const openShiftPage = PageBlueprint.make({
  name: 'openshift',
  params: {
    path: '/cost-management/openshift',
    routeRef: openShiftRouteRef,
    title: 'Cost Management',
    icon: <CostManagementIconOutlined />,
    noHeader: true,
    loader: () =>
      import('./pages/openshift/OpenShiftPage').then(m => <m.OpenShiftPage />),
  },
});

/**
 * Cost Management plugin for the Backstage new frontend system.
 * @alpha
 */
export default createFrontendPlugin({
  pluginId: 'cost-management',
  extensions: [
    optimizationsApi,
    orchestratorSlimApi,
    costManagementSlimApi,
    costManagementIcons,
    optimizationsPage,
    openShiftPage,
  ],
  routes: {
    root: rootRouteRef,
    openShift: openShiftRouteRef,
    breakdown: optimizationsBreakdownRouteRef,
  },
});
