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
import { dynamicPluginsServiceRef } from '@backstage/backend-dynamic-feature-service';
import { DynamicPluginsService } from './resolvers/DynamicPluginsService';
import { MarketplaceProvider } from './providers/MarketplaceProvider';
import { PackageInstallStatusResolver } from './resolvers/PackageInstallStatusResolver';
import { DynamicPackageInstallStatusResolver } from './resolvers/DynamicPackageInstallStatusResolver';
import { LocalPackageInstallStatusResolver } from './resolvers/LocalPackageInstallStatusResolver';
import { PluginInstallStatusResolver } from './resolvers/PluginInstallStatusResolver';
import {
  MarketplacePackageProcessor,
  MarketplacePluginProcessor,
} from './processors';
import { MarketplaceCollectionProcessor } from './processors/MarketplaceCollectionProcessor';

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
        catalog: catalogProcessingExtensionPoint,
        config: coreServices.rootConfig,
        pluginProvider: dynamicPluginsServiceRef,
        scheduler: coreServices.scheduler,
      },
      async init({ logger, catalog, config, pluginProvider, scheduler }) {
        logger.info(
          'Adding Marketplace providers and processors to catalog...',
        );
        const taskRunner = scheduler.createScheduledTaskRunner({
          frequency: { minutes: 30 },
          timeout: { minutes: 10 },
        });

        const dynamicPluginsService = DynamicPluginsService.fromConfig({
          config,
          logger,
        });
        dynamicPluginsService.initialize();

        const dynamicPackageInstallStatusResolver =
          new DynamicPackageInstallStatusResolver({
            logger,
            pluginProvider,
            dynamicPluginsService,
          });
        const localPackageInstallStatusResolver =
          new LocalPackageInstallStatusResolver({ logger });
        const packageInstallStatusResolver = new PackageInstallStatusResolver({
          dynamicPackageInstallStatusResolver,
          localPackageInstallStatusResolver,
        });
        const pluginInstallStatusResolver = new PluginInstallStatusResolver({
          logger,
        });
        catalog.addEntityProvider(
          new MarketplaceProvider({
            taskRunner,
            logger,
            packageInstallStatusResolver,
            pluginInstallStatusResolver,
          }),
        );

        catalog.addProcessor(new MarketplacePluginProcessor());
        catalog.addProcessor(new MarketplacePackageProcessor());
        catalog.addProcessor(new MarketplaceCollectionProcessor());
      },
    });
  },
});
