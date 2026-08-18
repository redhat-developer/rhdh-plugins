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
 * WITHOUT WARRANTIES OR CONDITIONS OF THE LICENSE, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
import {
  coreServices,
  createBackendPlugin,
} from '@backstage/backend-plugin-api';
import { createRouter } from './router';

/**
 * dcmPlugin backend plugin
 *
 * @public
 */
export const dcmPlugin = createBackendPlugin({
  pluginId: 'dcm',
  register(env) {
    env.registerInit({
      deps: {
        httpRouter: coreServices.httpRouter,
        logger: coreServices.logger,
        config: coreServices.rootConfig,
        httpAuth: coreServices.httpAuth,
        permissions: coreServices.permissions,
        cache: coreServices.cache,
      },
      async init({ httpRouter, logger, config, httpAuth, permissions, cache }) {
        const router = await createRouter({
          logger,
          config,
          httpAuth,
          permissions,
          cache,
        });
        httpRouter.use(router);
        httpRouter.addAuthPolicy({
          path: '/health',
          allow: 'unauthenticated',
        });
        httpRouter.addAuthPolicy({
          path: '/token',
          allow: 'user-cookie',
        });
        httpRouter.addAuthPolicy({
          path: '/access',
          allow: 'user-cookie',
        });
        httpRouter.addAuthPolicy({
          path: '/proxy',
          allow: 'user-cookie',
        });
      },
    });
  },
});
