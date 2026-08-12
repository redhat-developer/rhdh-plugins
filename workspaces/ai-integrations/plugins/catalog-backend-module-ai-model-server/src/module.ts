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

import { createBackendModule } from '@backstage/backend-plugin-api';
import type { CatalogModelSource } from '@backstage/catalog-model/alpha';
import { catalogModelExtensionPoint } from '@backstage/plugin-catalog-node/alpha';
import { aiModelServerApiEntityModel } from '@red-hat-developer-hub/backstage-plugin-catalog-model-ai-model-server';

/**
 * Registers the AiModelServerAPI kind in the catalog.
 *
 * Uses a dedicated kind to avoid colliding with the upstream API kind.
 * When backstage/backstage#34476 merges, this module can be replaced
 * by the upstream `@backstage/plugin-catalog-backend-module-ai-model`.
 *
 * @public
 */
export const catalogModuleAiModelServer = createBackendModule({
  pluginId: 'catalog',
  moduleId: 'ai-model-server',
  register(reg) {
    reg.registerInit({
      deps: {
        model: catalogModelExtensionPoint,
      },
      async init({ model }) {
        const source: CatalogModelSource = {
          async *read() {
            yield { data: [{ layer: aiModelServerApiEntityModel }] };
          },
        };
        model.addModelSource(source);
      },
    });
  },
});
