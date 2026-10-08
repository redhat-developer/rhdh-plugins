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

import { coreExtensionData } from '@backstage/frontend-plugin-api';
import catalogGraphPlugin from '@backstage/plugin-catalog-graph/alpha';
import { z } from 'zod/v4';
import { entityOverviewGraphCardExtension } from './entityOverviewGraphCardExtension';
import { entityDependenciesGraphCardExtension } from './entityDependenciesGraphCardExtension';
import { CustomCatalogGraphPage } from './CustomCatalogGraphPage';

/**
 * Override of the Backstage catalog graph plugin that adds an empty state
 * when no catalog entities are available and RHDH default relations graph cards
 * (no `app.extensions` config required).
 *
 * @public
 */
export const catalogGraphPluginOverride = catalogGraphPlugin.withOverrides({
  extensions: [
    catalogGraphPlugin
      .getExtension('entity-card:catalog-graph/relations')
      .override({
        configSchema: {
          // When true, call the stock factory (no hide filter) so the card can
          // be restored without removing catalog-graph-plugin-override.
          useOriginalFactory: z.boolean().optional(),
        },
        factory(originalFactory, { config }) {
          if (config.useOriginalFactory) {
            return originalFactory();
          }
          // Replaced by rhdh-overview-relations / rhdh-component-dependencies-relations.
          return originalFactory({
            params: {
              filter: () => false,
            },
          });
        },
      }),
    entityOverviewGraphCardExtension,
    entityDependenciesGraphCardExtension,
    catalogGraphPlugin.getExtension('page:catalog-graph').override({
      factory(originalFactory) {
        const original = originalFactory();
        const originalElement = original.get(coreExtensionData.reactElement);
        return [
          ...original,
          coreExtensionData.reactElement(
            <CustomCatalogGraphPage>{originalElement}</CustomCatalogGraphPage>,
          ),
        ];
      },
    }),
  ],
});
