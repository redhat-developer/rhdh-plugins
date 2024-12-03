/*
 * Copyright 2024 The Backstage Authors
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
import { MarketplaceServiceFSImpl } from './services/MarketplaceServiceFSImpl';

/**
 * marketplacePlugin backend plugin
 *
 * @public
 */
export const marketplacePlugin = createBackendPlugin({
  pluginId: 'marketplace',
  register(env) {
    env.registerInit({
      deps: {
        logger: coreServices.logger,
        auth: coreServices.auth,
        config: coreServices.rootConfig,
        httpAuth: coreServices.httpAuth,
        httpRouter: coreServices.httpRouter,
      },
      async init({ logger, auth, config, httpAuth, httpRouter }) {
        const marketplaceService = new MarketplaceServiceFSImpl({
          logger,
          auth,
          config,
        });

        httpRouter.use(
          await createRouter({
            httpAuth,
            marketplaceService,
          }),
        );
      },
    });
  },
});
