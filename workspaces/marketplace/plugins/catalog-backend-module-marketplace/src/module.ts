/*
 * Copyright The Backstage Authors
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

import { MarketplacePluginProcessor } from './processors/MarketplacePluginProcessor';
import { MarketplaceCollectionProcessor } from './processors/MarketplaceCollectionProcessor';
import { DynamicPackageInstallStatusProcessor } from './processors/DynamicPackageInstallStatusProcessor';
import { LocalPackageInstallStatusProcessor } from './processors/LocalPackageInstallStatusProcessor';
import { MarketplacePackageProcessor } from './processors/MarketplacePackageProcessor';

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
        discovery: coreServices.discovery,
        auth: coreServices.auth,
      },
      async init({ logger, catalog, discovery, auth }) {
        logger.info('Adding Marketplace processors to catalog...');
        catalog.addProcessor(new MarketplacePluginProcessor());
        catalog.addProcessor(new MarketplaceCollectionProcessor());
        catalog.addProcessor(new LocalPackageInstallStatusProcessor());
        catalog.addProcessor(new MarketplacePackageProcessor());
        catalog.addProcessor(
          new DynamicPackageInstallStatusProcessor(discovery, auth),
        );
      },
    });
  },
});
