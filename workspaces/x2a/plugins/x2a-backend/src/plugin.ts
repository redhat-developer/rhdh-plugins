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
import { x2aDatabaseServiceRef } from './services/X2ADatabaseService';
import { createRouter } from './router';
import { migrate } from './services/dbMigrate';
import { kubeServiceRef } from './services/KubeService';

/**
 * x2APlugin backend plugin
 *
 * @public
 */
export const x2APlugin = createBackendPlugin({
  pluginId: 'x2a',
  register(env) {
    env.registerInit({
      deps: {
        httpAuth: coreServices.httpAuth,
        httpRouter: coreServices.httpRouter,
        database: coreServices.database,
        logger: coreServices.logger,
        discoveryApi: coreServices.discovery,
        permissionsSvc: coreServices.permissions,
        x2aDatabase: x2aDatabaseServiceRef,
        kubeService: kubeServiceRef,
      },
      async init({
        httpRouter,
        permissionsSvc,
        x2aDatabase,
        logger,
        discoveryApi,
        httpAuth,
        database,
        kubeService,
      }) {
        await migrate(database);

        httpRouter.use(
          await createRouter({
            httpAuth,
            logger,
            discoveryApi,
            permissionsSvc,
            x2aDatabase,
            kubeService,
          }),
        );
      },
    });
  },
});
