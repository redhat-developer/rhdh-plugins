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
  coreServices,
  createBackendModule,
} from '@backstage/backend-plugin-api';
import { catalogProcessingExtensionPoint } from '@backstage/plugin-catalog-node/alpha';
import { MarketplacePluginProcessor } from './MarketplacePluginProcessor';
import { MarketplacePluginListProcessor } from './MarketplacePluginListProcessor';

/**
 * @public
 */
export const catalogModuleMarketplace = createBackendModule({
  pluginId: 'catalog',
  moduleId: 'marketplace',
  register(reg) {
    reg.registerInit({
      deps: {
        logger: coreServices.logger,
        catalog: catalogProcessingExtensionPoint,
      },
      async init({ logger, catalog }) {
        logger.info('Marketplace provider initialized!');
        catalog.addProcessor(new MarketplacePluginProcessor());
        catalog.addProcessor(new MarketplacePluginListProcessor());
      },
    });
  },
});
