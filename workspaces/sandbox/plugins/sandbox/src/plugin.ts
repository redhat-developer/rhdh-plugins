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
  fetchApiRef,
  configApiRef,
} from '@backstage/core-plugin-api';
import { rootRouteRef } from './routes';
import HomeOutlinedIcon from '@mui/icons-material/HomeOutlined';
import StarOutlineOutlinedIcon from '@mui/icons-material/StarOutlineOutlined';
import { registerApiRef, RegistrationBackendClient } from './api';

export const sandboxPlugin = createPlugin({
  id: 'sandbox',
  routes: {
    root: rootRouteRef,
  },
  apis: [
    createApiFactory({
      api: registerApiRef,
      deps: {
        configApi: configApiRef,
        discoveryApi: discoveryApiRef,
        fetchApi: fetchApiRef,
      },
      factory: ({ configApi, discoveryApi, fetchApi }) =>
        new RegistrationBackendClient({ configApi, discoveryApi, fetchApi }),
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
      import('./components/SandboxActivities/SandboxActvitiesPage').then(
        m => m.SandboxActivitiesPage,
      ),
    mountPoint: rootRouteRef,
  }),
);

/**
 * @public
 */
export const SandboxHomeIcon: IconComponent = HomeOutlinedIcon;

/**
 * @public
 */
export const SandboxActivitiesIcon: IconComponent = StarOutlineOutlinedIcon;
