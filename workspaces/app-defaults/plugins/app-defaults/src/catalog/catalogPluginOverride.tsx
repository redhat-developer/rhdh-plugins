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
  coreExtensionData,
  createExtensionInput,
  createRouteRef,
  PageBlueprint,
} from '@backstage/frontend-plugin-api';
import catalogPlugin from '@backstage/plugin-catalog/alpha';

import { entityDependenciesCatalogCardAttachments } from './entityDependenciesCardAttachments';
import { entityOverviewCatalogCardDefaults } from './entityOverviewCatalogCardDefaults';
import { entityPageLayoutExtensions } from './entityPageLayoutExtensions';
import { entityPageTabExtensions } from './entityPageTabExtensions';

const catalogPage = PageBlueprint.makeWithOverrides({
  inputs: {
    filters: createExtensionInput([coreExtensionData.reactElement]),
  },
  factory(originalFactory, { inputs }) {
    return originalFactory({
      path: '/catalog',
      routeRef: createRouteRef({ aliasFor: 'catalog.catalogIndex' }),
      loader: async () => {
        const { CustomCatalogPage } = await import('./CustomCatalogPage');
        const filters = inputs.filters.map(f =>
          f.get(coreExtensionData.reactElement),
        );
        return <CustomCatalogPage filters={filters} />;
      },
    });
  },
});

/**
 * Override of the Backstage catalog plugin that adds an empty state
 * when no catalog entities are available, RHDH overview layout, NFS Dependencies tab,
 * and legacy System Diagram entity tab.
 *
 * @public
 */
export const catalogPluginOverride = catalogPlugin.withOverrides({
  extensions: [
    catalogPage,
    ...entityOverviewCatalogCardDefaults,
    ...entityDependenciesCatalogCardAttachments,
    ...entityPageLayoutExtensions,
    ...entityPageTabExtensions,
  ],
});
