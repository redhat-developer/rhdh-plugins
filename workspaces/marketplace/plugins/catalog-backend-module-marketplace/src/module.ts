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
import { MarketplacePluginProvider } from './providers/MarketplacePluginProvider';
import { MarketplacePackageProvider } from './providers/MarketplacePackageProvider';
import { dynamicPluginsServiceRef } from '@backstage/backend-dynamic-feature-service';
import { DynamicPluginsService } from './processors/DynamicPluginsService';
import { CatalogClient } from '@backstage/catalog-client';
import { PluginInstallStatusProcessor } from './processors/PluginInstallStatusProcessor';

/**
 * @public
 */
export const catalogModuleMarketplace = createBackendModule({
  pluginId: 'catalog',
  moduleId: 'extensions',
  register(reg) {
    reg.registerInit({
      deps: {
        logger: coreServices.logger,
        auth: coreServices.auth,
        discovery: coreServices.discovery,
        catalog: catalogProcessingExtensionPoint,
        config: coreServices.rootConfig,
        pluginProvider: dynamicPluginsServiceRef,
        cache: coreServices.cache,
        scheduler: coreServices.scheduler,
      },
      async init({
        logger,
        auth,
        discovery,
        catalog,
        config,
        pluginProvider,
        cache,
        scheduler,
      }) {
        logger.info(
          'Adding Marketplace providers and processors to catalog...',
        );
        const taskRunner = scheduler.createScheduledTaskRunner({
          frequency: { minutes: 30 },
          timeout: { minutes: 10 },
        });
        const delayedTaskRunner = scheduler.createScheduledTaskRunner({
          frequency: { minutes: 30 },
          timeout: { minutes: 10 },
          initialDelay: { seconds: 20 },
        });

        const catalogApi = new CatalogClient({ discoveryApi: discovery });
        const dynamicPluginsService = DynamicPluginsService.fromConfig({
          config,
          logger,
        });
        dynamicPluginsService.initialize();

        catalog.addEntityProvider(new MarketplacePackageProvider(taskRunner));
        catalog.addEntityProvider(
          new MarketplacePluginProvider(delayedTaskRunner),
        );
        // Disabling the collection provider as collections/all.yaml is already commented in RHDH 1.5 image.
        // catalog.addEntityProvider(
        //   new MarketplaceCollectionProvider(taskRunner),
        // );
        catalog.addProcessor(new MarketplacePluginProcessor());
        catalog.addProcessor(new MarketplaceCollectionProcessor());
        catalog.addProcessor(new LocalPackageInstallStatusProcessor());
        catalog.addProcessor(
          new DynamicPackageInstallStatusProcessor({
            logger,
            pluginProvider,
            dynamicPluginsService,
          }),
        );
        catalog.addProcessor(new MarketplacePackageProcessor());
        catalog.addProcessor(
          new PluginInstallStatusProcessor({
            auth,
            catalog: catalogApi,
            logger,
            cache,
            scheduler,
          }),
        );
      },
    });
  },
});
