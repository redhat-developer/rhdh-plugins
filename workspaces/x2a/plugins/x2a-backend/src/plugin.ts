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
import { x2aDatabaseServiceRef } from './services/X2ADatabaseService';
import { createRouter } from './router';
import { kubeServiceRef } from './services/KubeService';
import type { RouterDeps } from './router/types';

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
        logger: coreServices.logger,
        discoveryApi: coreServices.discovery,
        catalog: catalogServiceRef,
        permissionsSvc: coreServices.permissions,
        config: coreServices.rootConfig,
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
        catalog,
        kubeService,
        config,
      }) {
        httpRouter.addAuthPolicy({
          path: '/projects/:projectId/collectArtifacts',
          allow: 'unauthenticated',
        });

        httpRouter.addAuthPolicy({
          path: '/static/:file',
          allow: 'unauthenticated',
        });

        // The refs are typed with the slim x2a-node interfaces, but the
        // factories return the full class instances. Cast is safe.
        httpRouter.use(
          await createRouter({
            httpAuth,
            logger,
            discoveryApi,
            catalog,
            permissionsSvc,
            x2aDatabase: x2aDatabase as unknown as RouterDeps['x2aDatabase'],
            kubeService: kubeService as unknown as RouterDeps['kubeService'],
            config,
          }),
        );
      },
    });
  },
});
