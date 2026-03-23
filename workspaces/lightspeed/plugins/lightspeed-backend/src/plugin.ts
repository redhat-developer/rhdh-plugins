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

import { createNotebooksRouter } from './service/notebooks';
import { createRouter } from './service/router';

/**
 * @public
 * The lightspeed backend plugin.
 */
export const lightspeedPlugin = createBackendPlugin({
  pluginId: 'lightspeed',
  register(env) {
    env.registerInit({
      deps: {
        logger: coreServices.logger,
        config: coreServices.rootConfig,
        http: coreServices.httpRouter,
        httpAuth: coreServices.httpAuth,
        userInfo: coreServices.userInfo,
        permissions: coreServices.permissions,
      },
      async init({ logger, config, http, httpAuth, userInfo, permissions }) {
        // Main lightspeed router
        http.use(
          await createRouter({
            config: config,
            logger: logger,
            httpAuth: httpAuth,
            userInfo: userInfo,
            permissions,
          }),
        );

        const aiNotebooksEnabled =
          config.getOptionalBoolean('lightspeed.aiNotebooks.enabled') ?? false;
        if (aiNotebooksEnabled) {
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
        }

        // Configure authentication policies
        http.addAuthPolicy({
          path: '/health',
          allow: 'unauthenticated',
        });
        http.addAuthPolicy({
          path: '/ai-notebooks/health',
          allow: 'unauthenticated',
        });
      },
    });
  },
});
