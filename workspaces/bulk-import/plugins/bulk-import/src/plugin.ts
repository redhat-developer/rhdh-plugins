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
  createComponentExtension,
  createPlugin,
  createRoutableExtension,
  identityApiRef,
} from '@backstage/core-plugin-api';

import { bulkImportApiRef } from './api/BackendClient';
import { PRBulkImportBackendClient } from './api/PRBulkImportBackendClientImpl';
import { ScaffolderBulkImportBackendClient } from './api/ScaffolderBulkImportBackendClientImpl';
import { addRepositoriesRouteRef, rootRouteRef, tasksRouteRef } from './routes';

/**
 * @public
 * Bulk Import Plugin
 */
export const bulkImportPlugin = createPlugin({
  id: 'bulk-import',
  routes: {
    root: rootRouteRef,
    addRepositories: addRepositoriesRouteRef,
    tasks: tasksRouteRef,
  },
  apis: [
    createApiFactory({
      api: bulkImportApiRef,
      deps: {
        configApi: configApiRef,
        identityApi: identityApiRef,
      },
      factory: ({ configApi, identityApi }) => {
        const importAPI =
          configApi.getOptionalString('bulkImport.importAPI') ??
          'open-pull-requests';
        switch (importAPI) {
          case 'scaffolder':
            return new ScaffolderBulkImportBackendClient({
              configApi,
              identityApi,
            });
          case 'open-pull-requests':
            return new PRBulkImportBackendClient({ configApi, identityApi });
          default:
            throw new Error(`Unsupported API type ${importAPI}`);
        }
      },
    }),
  ],
});

/**
 * @public
 * Bulk Import Page
 */
export const BulkImportPage = bulkImportPlugin.provide(
  createRoutableExtension({
    name: 'BulkImportPage',
    component: () => import('./components').then(m => m.Router),
    mountPoint: rootRouteRef,
  }),
);

/**
 * @public
 * Bulk Import SidebarItem
 */
export const BulkImportSidebarItem = bulkImportPlugin.provide(
  createComponentExtension({
    name: 'BulkImportSidebarItem',
    component: {
      lazy: () => import('./components').then(m => m.BulkImportSidebarItem),
    },
  }),
);
