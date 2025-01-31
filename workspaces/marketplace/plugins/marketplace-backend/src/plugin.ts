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
import { CatalogClient } from '@backstage/catalog-client';
import { DatabaseManager } from '@backstage/backend-defaults/database';

import {
  MarketplaceApi,
  MarketplaceCatalogClient,
} from '@red-hat-developer-hub/backstage-plugin-marketplace-common';

import { createRouter } from './router';
import { MarketplaceAggregationService } from './service/MarketplaceAggregationService';

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
        auth: coreServices.auth,
        httpAuth: coreServices.httpAuth,
        httpRouter: coreServices.httpRouter,
        discovery: coreServices.discovery,
        config: coreServices.rootConfig,
        logger: coreServices.logger,
        lifecycle: coreServices.lifecycle,
      },
      async init({
        auth,
        httpAuth,
        httpRouter,
        discovery,
        config,
        logger,
        lifecycle,
      }) {
        const catalogApi = new CatalogClient({ discoveryApi: discovery });
        const db = DatabaseManager.fromConfig(config).forPlugin('catalog', {
          logger,
          lifecycle,
        });
        const client = await db.getClient();

        const marketplaceApi: MarketplaceApi = new MarketplaceCatalogClient({
          auth,
          catalogApi,
        });

        const marketplaceAggregationApi = new MarketplaceAggregationService({
          client,
        });

        httpRouter.use(
          await createRouter({
            httpAuth,
            marketplaceApi,
            marketplaceAggregationApi,
          }),
        );
      },
    });
  },
});
