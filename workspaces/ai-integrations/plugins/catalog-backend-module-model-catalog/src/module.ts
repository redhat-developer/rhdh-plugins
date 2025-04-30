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
import {
  catalogProcessingExtensionPoint,
  catalogLocationsExtensionPoint,
} from '@backstage/plugin-catalog-node/alpha';

import { ModelCatalogResourceEntityProvider } from './providers';
import { RHDHRHOAIReaderProcessor } from './processors';
import { RHDHRHOAIEntityProvider } from './providers/RHDHRHOAIEntityProvider';

/**
 * catalogModuleModelCatalogResourceEntityProvider defines the model catalog entity provider which runs on startup
 *
 * @public
 */
export const catalogModuleModelCatalogResourceEntityProvider =
  createBackendModule({
    moduleId: 'catalog-backend-module-model-catalog',
    pluginId: 'catalog',
    register(env) {
      env.registerInit({
        deps: {
          catalog: catalogProcessingExtensionPoint,
          config: coreServices.rootConfig,
          logger: coreServices.logger,
          scheduler: coreServices.scheduler,
        },
        async init({ catalog, config, logger, scheduler }) {
          catalog.addEntityProvider(
            ModelCatalogResourceEntityProvider.fromConfig(
              { config, logger },
              {
                schedule: scheduler.createScheduledTaskRunner({
                  frequency: { seconds: 30 },
                  timeout: { minutes: 3 },
                }),
                scheduler: scheduler,
              },
            ),
          );
        },
      });
    },
  });

/**
 * catalogModuleRHDHRHOAIReaderProcessor defines the custom processor used to ingest updated/newly
 * discovered model catalog entities
 *
 * @public
 */
export const catalogModuleRHDHRHOAIReaderProcessor = createBackendModule({
  pluginId: 'catalog',
  moduleId: 'rhdh-rhoai-bridge-reader-processor',
  register(env) {
    env.registerInit({
      deps: {
        catalog: catalogProcessingExtensionPoint,
        reader: coreServices.urlReader,
        config: coreServices.rootConfig,
        logger: coreServices.logger,
      },
      async init({ catalog, reader, config, logger }) {
        catalog.addProcessor(
          new RHDHRHOAIReaderProcessor(reader, config, logger),
        );
      },
    });
  },
});

/** so a `CatalogProcessor` does not need to also provide a `CatalogLocationsExtensionPoint` if it only supports imports of locations
 * from the app-config.yaml on startup, but if you want to dynamically add Locations via the catalog's REST API (like what the UI does for import
 * of catalog-info.yaml from git repos) then you need to also provide a `CatalogLocationsExtension` point to add your type to the default list of 'url' and 'file';
 * fwiw in examining the core Backstage code, none of the default `CatalogProcessors` bother to also provide a `CatalogLocationsExtension`; however,
 * we want to allow our RHDH bridge to import new locations dynamically
 *
 * @public
 */
export const catalogModuleRHDHRHOAILocationsExtensionPoint =
  createBackendModule({
    pluginId: 'catalog',
    moduleId: 'rhdh-rhoai-bridge-location-extension-point',
    register(env) {
      env.registerInit({
        deps: {
          catalog: catalogLocationsExtensionPoint,
          logger: coreServices.logger,
        },
        async init({ catalog, logger }) {
          // setAllowedLocationTypes does not add to the list but replaces it, so we preserve the default options of 'file' and 'url'
          logger
            .child({ source: 'catalog-backend-module-model-catalog"' })
            .info("Registering the 'rhdh-rhoai-bridge' location type");
          const allowedLocationTypes = ['file', 'url', 'rhdh-rhoai-bridge'];
          catalog.setAllowedLocationTypes(allowedLocationTypes);
        },
      });
    },
  });

/**
 * catalogModuleRHDHRHOAIEntityProvider defines the entity provider used to handle ingestion/cleanup of locations in the model catalog
 *
 * @public
 */
export const catalogModuleRHDHRHOAIEntityProvider = createBackendModule({
  pluginId: 'catalog',
  moduleId: 'rhdh-rhoai-bridge-entiry-provider',
  register(env) {
    env.registerInit({
      deps: {
        catalog: catalogProcessingExtensionPoint,
        config: coreServices.rootConfig,
        discovery: coreServices.discovery,
        logger: coreServices.logger,
        scheduler: coreServices.scheduler,
        reader: coreServices.urlReader,
      },
      async init({ catalog, config, logger, scheduler, discovery, reader }) {
        const runner = scheduler.createScheduledTaskRunner({
          frequency: { seconds: 30 },
          timeout: { minutes: 3 },
        });
        catalog.addEntityProvider(
          new RHDHRHOAIEntityProvider(
            discovery,
            config,
            logger,
            runner,
            reader,
          ),
        );
      },
    });
  },
});
