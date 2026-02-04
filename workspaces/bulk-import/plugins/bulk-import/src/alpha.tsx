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
  compatWrapper,
  convertLegacyRouteRef,
  convertLegacyRouteRefs,
} from '@backstage/core-compat-api';
import {
  configApiRef,
  createApiFactory,
  identityApiRef,
} from '@backstage/core-plugin-api';
import {
  ApiBlueprint,
  createFrontendPlugin,
  NavItemBlueprint,
  PageBlueprint,
} from '@backstage/frontend-plugin-api';

import {
  bulkImportApiRef,
  BulkImportBackendClient,
} from './api/BulkImportBackendClient';
import BulkImportIcon from './components/BulkImportSidebarItem';
import { importHistoryRouteRef, rootRouteRef } from './routes';

// Re-export translations for backward compatibility
export * from './translations';

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
    path: '/bulk-import',
    routeRef: convertLegacyRouteRef(rootRouteRef),
    loader: () => import('./components').then(m => compatWrapper(<m.Router />)),
  },
});

/**
 * Nav Item Extension
 *
 * NOTE: This nav item is always visible in the sidebar. Unlike the legacy
 * BulkImportSidebarItem component, NavItemBlueprint does not support runtime
 * permission checking because:
 *
 * 1. Extension factories run at app startup, before user authentication
 * 2. NavItemBlueprint only accepts static data (title, icon, routeRef)
 * 3. React hooks like usePermission cannot be used in extension factories
 *
 * Permission checking is handled at the PAGE level instead. Users without
 * the required permissions will see a permission error when accessing the page.
 *
 * For apps requiring permission-gated nav visibility, use the legacy
 * BulkImportSidebarItem component from the main package export:
 *
 * @example
 * ```tsx
 * import { BulkImportSidebarItem } from '@red-hat-developer-hub/backstage-plugin-bulk-import';
 * ```
 */
const bulkImportNavItem = NavItemBlueprint.make({
  params: {
    title: 'Bulk import',
    routeRef: convertLegacyRouteRef(rootRouteRef),
    icon: BulkImportIcon,
  },
});

/**
 * The Bulk Import frontend plugin for the new Backstage frontend system.
 *
 * @public
 */
export default createFrontendPlugin({
  pluginId: 'bulk-import',
  extensions: [bulkImportApi, bulkImportPage, bulkImportNavItem],
  routes: convertLegacyRouteRefs({
    root: rootRouteRef,
    tasks: importHistoryRouteRef,
  }),
});
