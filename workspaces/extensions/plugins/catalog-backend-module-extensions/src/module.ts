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

import { ExtensionsPluginProcessor } from './processors/ExtensionsPluginProcessor';
import { ExtensionsCollectionProcessor } from './processors/ExtensionsCollectionProcessor';
import { DynamicPackageInstallStatusProcessor } from './processors/DynamicPackageInstallStatusProcessor';
import { LocalPackageInstallStatusProcessor } from './processors/LocalPackageInstallStatusProcessor';
import { ExtensionsPackageProcessor } from './processors/ExtensionsPackageProcessor';
import { ExtensionsPluginProvider } from './providers/ExtensionsPluginProvider';
import { ExtensionsPackageProvider } from './providers/ExtensionsPackageProvider';
import { dynamicPluginsServiceRef } from '@backstage/backend-dynamic-feature-service';
import { CatalogClient } from '@backstage/catalog-client';
import { PluginInstallStatusProcessor } from './processors/PluginInstallStatusProcessor';

/**
 * @public
 */
export const catalogModuleExtensions = createBackendModule({
  pluginId: 'catalog',
  moduleId: 'extensions',
  register(reg) {
    reg.registerInit({
      deps: {
        logger: coreServices.logger,
        auth: coreServices.auth,
        discovery: coreServices.discovery,
        catalog: catalogProcessingExtensionPoint,
        pluginProvider: dynamicPluginsServiceRef,
        cache: coreServices.cache,
        scheduler: coreServices.scheduler,
      },
      async init({
        logger,
        auth,
        discovery,
        catalog,
        pluginProvider,
        cache,
        scheduler,
      }) {
        logger.info('Adding Extensions providers and processors to catalog...');
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

        catalog.addEntityProvider(new ExtensionsPackageProvider(taskRunner));
        catalog.addEntityProvider(
          new ExtensionsPluginProvider(delayedTaskRunner),
        );
        // Disabling the collection provider as collections/all.yaml is already commented in RHDH 1.5 image.
        // catalog.addEntityProvider(
        //   new ExtensionsCollectionProvider(taskRunner),
        // );
        catalog.addProcessor(new ExtensionsPluginProcessor());
        catalog.addProcessor(new ExtensionsCollectionProcessor());
        catalog.addProcessor(new LocalPackageInstallStatusProcessor());
        catalog.addProcessor(
          new DynamicPackageInstallStatusProcessor({
            logger,
            pluginProvider,
          }),
        );
        catalog.addProcessor(new ExtensionsPackageProcessor());
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

/**
 * @public
 * @deprecated Use catalogModuleExtensions instead
 */
export const catalogModuleMarketplace = catalogModuleExtensions;
