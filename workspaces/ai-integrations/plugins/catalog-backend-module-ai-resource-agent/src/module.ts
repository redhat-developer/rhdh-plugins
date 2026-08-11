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
import { CatalogModelSources } from '@backstage/catalog-model/alpha';
import { catalogProcessingExtensionPoint } from '@backstage/plugin-catalog-node';
import { catalogModelExtensionPoint } from '@backstage/plugin-catalog-node/alpha';
import { agentAiResourceEntityModel } from '@red-hat-developer-hub/backstage-plugin-catalog-model-ai-resource-agent';
import { AiResourceAgentProcessor } from './AiResourceAgentProcessor';

/**
 * Registers the agent specType for the AiResource kind in the catalog.
 *
 * Follows the upstream pattern established by
 * `@backstage/plugin-catalog-backend-module-ai-model` which registers
 * skill/rule via `catalogModelExtensionPoint.addModelSource`.
 *
 * @public
 */
export const catalogModuleAiResourceAgent = createBackendModule({
  pluginId: 'catalog',
  moduleId: 'ai-resource-agent',
  register(reg) {
    reg.registerInit({
      deps: {
        model: catalogModelExtensionPoint,
        catalog: catalogProcessingExtensionPoint,
      },
      async init({ model, catalog }) {
        model.addModelSource(
          CatalogModelSources.static([agentAiResourceEntityModel]),
        );
        catalog.addProcessor(new AiResourceAgentProcessor());
      },
    });
  },
});
