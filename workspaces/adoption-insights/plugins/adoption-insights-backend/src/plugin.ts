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
  createBackendPlugin,
} from '@backstage/backend-plugin-api';
import { catalogServiceRef } from '@backstage/plugin-catalog-node';
import { notificationService } from '@backstage/plugin-notifications-node';
import { adoptionInsightsEventsReadPermission } from '@red-hat-developer-hub/backstage-plugin-adoption-insights-common';
import { createRouter } from './router';
import { migrate } from './database/migration';
import { DatabaseFactory } from './database/DatabaseFactory';
import { EventBatchProcessor } from './domain/EventBatchProcessor';
import EventApiController from './controllers/EventApiController';
import { schedulePartition } from './database/partition';
import { scheduleTimeSavedNotifications } from './notifications/scheduleTimeSavedNotifications';
import { getConfigurationOptions } from './utils/config';

/**
 * adoptionInsightsPlugin backend plugin
 *
 * @public
 */
export const adoptionInsightsPlugin = createBackendPlugin({
  pluginId: 'adoption-insights',
  register(env) {
    env.registerInit({
      deps: {
        auditor: coreServices.auditor,
        config: coreServices.rootConfig,
        logger: coreServices.logger,
        httpAuth: coreServices.httpAuth,
        httpRouter: coreServices.httpRouter,
        database: coreServices.database,
        scheduler: coreServices.scheduler,
        permissions: coreServices.permissions,
        permissionsRegistry: coreServices.permissionsRegistry,
        auth: coreServices.auth,
        catalog: catalogServiceRef,
        notification: notificationService,
      },
      async init({
        auditor,
        config,
        logger,
        httpAuth,
        httpRouter,
        database,
        scheduler,
        permissions,
        permissionsRegistry,
        auth,
        catalog,
        notification,
      }) {
        // Register plugin permission
        permissionsRegistry.addPermissions([
          adoptionInsightsEventsReadPermission,
        ]);

        // Queue configuration
        const options = getConfigurationOptions(config);
        const client = await database.getClient();
        const db = DatabaseFactory.getDatabase(client, logger);
        const processor = new EventBatchProcessor(db, logger, options);
        const eventApiController = new EventApiController(
          db,
          processor,
          config,
          auditor,
          catalog,
          auth,
        );

        // Migrate database
        await migrate(database);

        // Schedule partition creation
        if (db.isPartitionSupported()) {
          schedulePartition(client, { logger, scheduler });
        }

        // Schedule weekly time-saved notification summary
        await scheduleTimeSavedNotifications({
          scheduler,
          db,
          notification,
          logger,
          config,
        });

        httpRouter.use(
          await createRouter({
            httpAuth,
            permissions,
            eventApiController,
            db,
          }),
        );

        httpRouter.addAuthPolicy({
          path: '/health',
          allow: 'unauthenticated',
        });
      },
    });
  },
});
