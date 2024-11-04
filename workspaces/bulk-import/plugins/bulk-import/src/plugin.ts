/*
 * Copyright 2024 The Backstage Authors
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
 */ import {
  configApiRef,
  createApiFactory,
  createComponentExtension,
  createPlugin,
  createRoutableExtension,
  identityApiRef,
} from '@backstage/core-plugin-api';

import {
  bulkImportApiRef,
  BulkImportBackendClient,
} from './api/BulkImportBackendClient';
import { addRepositoriesRouteRef, rootRouteRef } from './routes';

export const bulkImportPlugin = createPlugin({
  id: 'bulk-import',
  routes: {
    root: rootRouteRef,
    addRepositories: addRepositoriesRouteRef,
  },
  apis: [
    createApiFactory({
      api: bulkImportApiRef,
      deps: {
        configApi: configApiRef,
        identityApi: identityApiRef,
      },
      factory: ({ configApi, identityApi }) =>
        new BulkImportBackendClient({ configApi, identityApi }),
    }),
  ],
});

export const BulkImportPage = bulkImportPlugin.provide(
  createRoutableExtension({
    name: 'BulkImportPage',
    component: () => import('./components').then(m => m.Router),
    mountPoint: rootRouteRef,
  }),
);

export const BulkImportSidebarItem = bulkImportPlugin.provide(
  createComponentExtension({
    name: 'BulkImportSidebarItem',
    component: {
      lazy: () => import('./components').then(m => m.BulkImportSidebarItem),
    },
  }),
);
