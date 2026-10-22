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
import { catalogProcessingExtensionPoint } from '@backstage/plugin-catalog-node';

import { SkillsCatalogProvider } from './SkillsCatalogProvider';
import { readSkillsCatalogProviderConfigs } from './config';
import { DatabaseReconciliationStore } from './reconciliation-store';

/** Default polling frequency: 10 minutes. */
const DEFAULT_FREQUENCY_SECONDS = 600;

/** Default timeout: 10 minutes. */
const DEFAULT_TIMEOUT_SECONDS = 600;

/**
 * Backend module that registers the common skills catalog entity provider.
 *
 * The module reads `catalog.providers.skillsCatalogProvider` from the
 * root config and creates one `SkillsCatalogProvider` per keyed entry.
 * Each provider instance uses Backstage's database service for durable
 * reconciliation state per design D6 tasks 4.3–4.4.
 *
 * @public
 */
export const catalogModuleSkillsCatalogProvider = createBackendModule({
  moduleId: 'catalog-backend-module-skills-catalog-provider',
  pluginId: 'catalog',
  register(env) {
    env.registerInit({
      deps: {
        catalog: catalogProcessingExtensionPoint,
        config: coreServices.rootConfig,
        discovery: coreServices.discovery,
        auth: coreServices.auth,
        logger: coreServices.logger,
        scheduler: coreServices.scheduler,
        database: coreServices.database,
      },
      async init({
        catalog,
        config,
        discovery,
        auth,
        logger,
        scheduler,
        database,
      }) {
        const providerConfigs = readSkillsCatalogProviderConfigs(config);
        const knex = await database.getClient();

        for (const providerConfig of providerConfigs) {
          // Create a provider-scoped store for data isolation
          const store = new DatabaseReconciliationStore(
            knex,
            providerConfig.id,
            database.migrations?.skip ?? false,
          );
          await store.initialize();

          const taskRunner = providerConfig.schedule
            ? scheduler.createScheduledTaskRunner(providerConfig.schedule)
            : scheduler.createScheduledTaskRunner({
                frequency: { seconds: DEFAULT_FREQUENCY_SECONDS },
                timeout: { seconds: DEFAULT_TIMEOUT_SECONDS },
                initialDelay: { seconds: 0 },
              });

          const provider = new SkillsCatalogProvider(
            providerConfig,
            discovery,
            auth,
            logger,
            taskRunner,
            store,
          );

          catalog.addEntityProvider(provider);
        }
      },
    });
  },
});
