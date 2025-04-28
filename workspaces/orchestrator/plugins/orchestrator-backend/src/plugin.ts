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
import { catalogServiceRef } from '@backstage/plugin-catalog-node/alpha';

import { createRouter } from './routerWrapper';

/**
 * @public
 * Orchestrator Backend Plugin
 */
export const orchestratorPlugin = createBackendPlugin({
  pluginId: 'orchestrator',
  register(env) {
    env.registerInit({
      deps: {
        logger: coreServices.logger,
        auditor: coreServices.auditor,
        config: coreServices.rootConfig,
        discovery: coreServices.discovery,
        catalogApi: catalogServiceRef,
        urlReader: coreServices.urlReader,
        permissions: coreServices.permissions,
        scheduler: coreServices.scheduler,
        httpAuth: coreServices.httpAuth,
        http: coreServices.httpRouter,
      },
      async init(props) {
        const { http } = props;
        const router = await createRouter(props);
        http.use(router);
        http.addAuthPolicy({
          path: '/health',
          allow: 'unauthenticated',
        });
        http.addAuthPolicy({
          path: '/static',
          allow: 'unauthenticated',
        });
        http.addAuthPolicy({
          path: '/docs',
          allow: 'unauthenticated',
        });
      },
    });
  },
});
