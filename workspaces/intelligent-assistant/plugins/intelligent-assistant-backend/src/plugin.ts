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

import { migrate } from './database/migration';
import { createNotebooksRouter } from './service/notebooks';
import { createRouter } from './service/router';

/**
 * @public
 * The lightspeed backend plugin.
 */
export const intelligentAssistantPlugin = createBackendPlugin({
  pluginId: 'intelligent-assistant',
  register(env) {
    env.registerInit({
      deps: {
        logger: coreServices.logger,
        config: coreServices.rootConfig,
        http: coreServices.httpRouter,
        httpAuth: coreServices.httpAuth,
        auth: coreServices.auth,
        userInfo: coreServices.userInfo,
        permissions: coreServices.permissions,
        database: coreServices.database,
      },
      async init({
        logger,
        config,
        http,
        httpAuth,
        auth,
        userInfo,
        permissions,
        database,
      }) {
        await migrate(database);

        if (config.has('lightspeed')) {
          logger.warn(
            'DEPRECATED: The "lightspeed" configuration key has been renamed to "intelligent-assistant". ' +
              'Please update your app-config.yaml. The old "lightspeed" key is no longer read. ' +
              'Migration guide: https://github.com/redhat-developer/rhdh-plugins/blob/main/workspaces/lightspeed/plugins/lightspeed-backend/README.md#migration-from-lightspeed-to-intelligent-assistant',
          );
        }

        const aiNotebooksEnabled =
          config.getOptionalBoolean(
            'intelligent-assistant.notebooks.enabled',
          ) ?? false;

        if (aiNotebooksEnabled) {
          const queryModel = config.getOptionalString(
            'intelligent-assistant.notebooks.queryDefaults.model',
          );
          const queryProvider = config.getOptionalString(
            'intelligent-assistant.notebooks.queryDefaults.provider_id',
          );

          if (!queryModel || !queryProvider) {
            logger.warn(
              'AI Notebooks feature is enabled but required configuration is missing. ' +
                'Please configure intelligent-assistant.notebooks.queryDefaults.model and intelligent-assistant.notebooks.queryDefaults.provider_id. ' +
                'Notebooks will not be available until these are set.',
            );
          } else {
            http.use(
              await createNotebooksRouter({
                config: config,
                logger: logger,
                httpAuth: httpAuth,
                userInfo: userInfo,
                permissions,
              }),
            );
            logger.info('AI Notebooks enabled');

            http.addAuthPolicy({
              path: '/notebooks/health',
              allow: 'unauthenticated',
            });
          }
        }

        http.use(
          await createRouter({
            config,
            logger,
            database,
            httpAuth,
            auth,
            userInfo,
            permissions,
          }),
        );

        // Configure authentication policies
        http.addAuthPolicy({
          path: '/health',
          allow: 'unauthenticated',
        });
      },
    });
  },
});
