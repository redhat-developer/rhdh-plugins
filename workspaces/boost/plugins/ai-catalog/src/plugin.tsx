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

import { createFrontendPlugin } from '@backstage/frontend-plugin-api';

import { aiCatalogFilterExtensions } from './extensions/aiCatalogFilters';
import { aiCatalogPage } from './extensions/aiCatalogPage';
import { entityCardExtensions } from './extensions/entityCards';
import { rootRouteRef } from './routes';

/**
 * The AI Catalog frontend plugin for RHDH.
 * @public
 */
export const aiCatalogPlugin = createFrontendPlugin({
  pluginId: 'ai-catalog',
  extensions: [
    aiCatalogPage,
    ...aiCatalogFilterExtensions,
    ...entityCardExtensions,
  ],
  routes: {
    root: rootRouteRef,
  },
});
