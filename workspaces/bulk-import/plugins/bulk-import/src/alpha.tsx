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
  ApiBlueprint,
  configApiRef,
  createApiFactory,
  createFrontendModule,
  createFrontendPlugin,
  createRouteRef,
  createSubRouteRef,
  identityApiRef,
  PageBlueprint,
} from '@backstage/frontend-plugin-api';
import { TranslationBlueprint } from '@backstage/plugin-app-react';

import {
  bulkImportApiRef,
  BulkImportBackendClient,
} from './api/BulkImportBackendClient';
import BulkImportIcon from './components/BulkImportIcon';
import { bulkImportTranslations } from './translations';

// NFS Route References - created using @backstage/frontend-plugin-api
// These are separate from the legacy route refs in routes.ts
const rootRouteRef = createRouteRef();
const importHistoryRouteRef = createSubRouteRef({
  parent: rootRouteRef,
  path: '/import-history/:repoUrl',
});

/**
 * API Extension
 *
 * Provides the BulkImportAPI for communicating with the bulk-import backend.
 */
const bulkImportApi = ApiBlueprint.make({
  params: defineParams =>
    defineParams(
      createApiFactory({
        api: bulkImportApiRef,
        deps: {
          configApi: configApiRef,
          identityApi: identityApiRef,
        },
        factory: ({ configApi, identityApi }) => {
          return new BulkImportBackendClient({ configApi, identityApi });
        },
      }),
    ),
});

/**
 * Page Extension
 *
 * Provides the main bulk import page at /bulk-import path.
 */
const bulkImportPage = PageBlueprint.make({
  params: {
    title: 'Bulk import',
    icon: <BulkImportIcon />,
    path: '/bulk-import',
    routeRef: rootRouteRef,
    noHeader: true,
    loader: () => import('./components').then(({ Router }) => <Router />),
  },
});

/**
 * The Bulk Import frontend plugin for the new Backstage frontend system.
 *
 * @public
 */
export default createFrontendPlugin({
  pluginId: 'bulk-import',
  extensions: [bulkImportApi, bulkImportPage],
  routes: {
    root: rootRouteRef,
    tasks: importHistoryRouteRef,
  },
});

/**
 * Translation module for the bulk-import plugin.
 *
 * @public
 */
export const bulkImportTranslationsModule = createFrontendModule({
  pluginId: 'app',
  extensions: [
    TranslationBlueprint.make({
      name: 'bulk-import-translations',
      params: {
        resource: bulkImportTranslations,
      },
    }),
  ],
});

export * from './translations';
