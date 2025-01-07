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
import { MarketplaceCatalogService } from './services/MarketplaceCatalogService';
import { CatalogClient } from '@backstage/catalog-client';
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
        discovery: coreServices.discovery,
      },
      async init({ logger, auth, config, httpAuth, httpRouter, discovery }) {
        const catalogApi = new CatalogClient({ discoveryApi: discovery });
        const marketplaceService = new MarketplaceCatalogService({
          logger,
          auth,
          config,
          catalogApi,
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
