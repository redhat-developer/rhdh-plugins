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
import { ModelService } from './services/ModelService';
import { CatalogClient } from '@backstage/catalog-client';

/**
 * aiExperiencePlugin backend plugin
 *
 * @public
 */
export const aiExperiencePlugin = createBackendPlugin({
  pluginId: 'ai-experience',
  register(env) {
    env.registerInit({
      deps: {
        logger: coreServices.logger,
        discovery: coreServices.discovery,
        auth: coreServices.auth,
        httpRouter: coreServices.httpRouter,
      },
      async init({ logger, auth, httpRouter, discovery }) {
        logger.info('Initializing ai-experience backend plugin');

        const catalog = new CatalogClient({ discoveryApi: discovery });

        const modelService = new ModelService({
          auth,
          catalog,
        });

        httpRouter.use(
          await createRouter({
            modelService,
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
