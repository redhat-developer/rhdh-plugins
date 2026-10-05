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
import apiDocsPlugin from '@backstage/plugin-api-docs/alpha';
import { z } from 'zod/v4';
import { CustomApiDocsPage } from './CustomApiDocsPage';
import { entityDependenciesApiDocsCardAttachments } from '../catalog/entityDependenciesCardAttachments';

/**
 * Override of the Backstage API docs plugin that adds an empty state
 * when no API entities are available and moves API cards to the Dependencies tab.
 *
 * Stock NFS also registers `entity-card:api-docs/definition` on Overview; RHDH
 * shows API definition only on the Definition tab (`entity-content:api-docs/definition`).
 * Restore the Overview card with `config.useOriginalFactory: true`.
 *
 * @public
 */
export const apiDocsPluginOverride = apiDocsPlugin.withOverrides({
  extensions: [
    ...entityDependenciesApiDocsCardAttachments,
    apiDocsPlugin.getExtension('entity-card:api-docs/definition').override({
      configSchema: {
        // When true, call the stock factory (no hide filter) so the card can
        // be restored on Overview without removing api-docs-plugin-override.
        useOriginalFactory: z.boolean().optional(),
      },
      factory(originalFactory, { config }) {
        if (config.useOriginalFactory) {
          return originalFactory();
        }
        return originalFactory({
          params: {
            filter: () => false,
          },
        });
      },
    }),
    apiDocsPlugin.getExtension('page:api-docs').override({
      factory(originalFactory) {
        const original = originalFactory();
        const originalElement = original.get(coreExtensionData.reactElement);
        return [
          ...original,
          coreExtensionData.reactElement(
            <CustomApiDocsPage>{originalElement}</CustomApiDocsPage>,
          ),
        ];
      },
    }),
  ],
});
