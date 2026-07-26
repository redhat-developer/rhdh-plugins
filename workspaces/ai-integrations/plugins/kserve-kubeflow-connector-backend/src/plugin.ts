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
import { setupInformer } from './services/InformerService';

/**
 * kserveKubeflowConnectorPlugin backend plugin
 *
 * @public
 */
export const kserveKubeflowConnectorPlugin = createBackendPlugin({
  pluginId: 'kserve-kubeflow-connector',
  register(env) {
    env.registerInit({
      deps: {
        httpAuth: coreServices.httpAuth,
        httpRouter: coreServices.httpRouter,
        logger: coreServices.logger,
      },
      async init({ logger, httpRouter }) {
        setupInformer().catch(error => {
          logger.error('Failed to set up informer:', error);
        });
        httpRouter.use(await createRouter());
      },
    });
  },
});
