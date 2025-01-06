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
 */
import {
  coreServices,
  createBackendModule,
} from '@backstage/backend-plugin-api';
import { catalogProcessingExtensionPoint } from '@backstage/plugin-catalog-node/alpha';
import { MarketplacePluginProcessor } from './MarketplacePluginProcessor';
import { MarketplacePluginListProcessor } from './MarketplacePluginListProcessor';

import { MarketplaceMicrositeProvider } from './providers/MarketplaceMicrositeProvider';
import { MarketplaceNPMProvider } from './providers/MarketplaceNPMProvider';
import { MarketplaceOCIProvider } from './providers/MarketplaceOCIProvider';

/**
 * @public
 */
export const catalogModuleMarketplace = createBackendModule({
  pluginId: 'catalog',
  moduleId: 'marketplace',
  register(reg) {
    reg.registerInit({
      deps: {
        config: coreServices.rootConfig,
        catalog: catalogProcessingExtensionPoint,
        logger: coreServices.logger,
      },
      async init({ config, catalog, logger }) {
        logger.info('Initialize Marketplace...');

        logger.info('- create MarketplacePluginProcessor...');
        catalog.addProcessor(new MarketplacePluginProcessor());

        logger.info('- create MarketplacePluginListProcessor...');
        catalog.addProcessor(new MarketplacePluginListProcessor());

        logger.info('- create MarketplaceMicrositeProvider...');
        catalog.addEntityProvider(
          MarketplaceMicrositeProvider.fromConfig(config, { logger }),
        );

        logger.info('- create MarketplaceNPMProvider...');
        catalog.addEntityProvider(MarketplaceNPMProvider.fromConfig(config));

        logger.info('- create MarketplaceOCIProviders...');
        catalog.addEntityProvider(MarketplaceOCIProvider.fromConfig(config));

        logger.info('Marketplace initialized!');
      },
    });
  },
});
