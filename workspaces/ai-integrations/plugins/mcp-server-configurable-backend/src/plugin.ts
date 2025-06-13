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
import { createRouter } from './router';

/**
 * mcpServerConfigurablePlugin backend plugin
 *
 * @public
 */
export const mcpServerConfigurablePlugin = createBackendPlugin({
  pluginId: 'mcp-server-configurable',
  register(env) {
    env.registerInit({
      deps: {
        auth: coreServices.auth,
        discovery: coreServices.discovery,
        logger: coreServices.logger,
        httpRouter: coreServices.httpRouter,
      },
      async init({ auth, discovery, logger, httpRouter }) {
        httpRouter.use(
          await createRouter({
            auth,
            discovery,
            logger,
          }),
        );
        httpRouter.addAuthPolicy({
          path: '/mcp',
          allow: 'unauthenticated',
        });
        httpRouter.addAuthPolicy({
          path: '/sse',
          allow: 'unauthenticated',
        });
        httpRouter.addAuthPolicy({
          path: '/message',
          allow: 'unauthenticated',
        });
      },
    });
  },
});
