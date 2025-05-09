/*
 * Copyright The Backstage Authors
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
  createPlugin,
  createRoutableExtension,
  type IconComponent,
  createApiFactory,
  discoveryApiRef,
  fetchApiRef,
  createComponentExtension,
} from '@backstage/core-plugin-api';

import MUIMarketplaceIcon from '@mui/icons-material/ShoppingBasketOutlined';

import { MarketplaceBackendClient } from '@red-hat-developer-hub/backstage-plugin-marketplace-common';

import { marketplaceApiRef } from './api';
import { allRoutes } from './routes';

/**
 * Marketplace Plugin
 * @public
 */
export const marketplacePlugin = createPlugin({
  id: 'extensions',
  routes: allRoutes,
  apis: [
    createApiFactory({
      api: marketplaceApiRef,
      deps: {
        discoveryApi: discoveryApiRef,
        fetchApi: fetchApiRef,
      },
      factory: ({ discoveryApi, fetchApi }) =>
        new MarketplaceBackendClient({
          discoveryApi,
          fetchApi,
        }),
    }),
  ],
});

/**
 * Marketplace page with routes for different pages.
 * @public
 */
export const MarketplaceFullPageRouter = marketplacePlugin.provide(
  createRoutableExtension({
    name: 'MarketplacePage',
    component: () =>
      import('./pages/MarketplaceFullPageRouter').then(
        m => m.MarketplaceFullPageRouter,
      ),
    mountPoint: allRoutes.rootRouteRef,
  }),
);

/**
 * Marketplace page with header and tabs.
 * @public
 */
export const MarketplaceTabbedPageRouter = marketplacePlugin.provide(
  createRoutableExtension({
    name: 'MarketplaceTabbedPageRouter',
    component: () =>
      import('./pages/MarketplaceTabbedPageRouter').then(
        m => m.MarketplaceTabbedPageRouter,
      ),
    mountPoint: allRoutes.rootRouteRef,
  }),
);

/**
 * @public
 */
export const DynamicMarketplacePluginRouter = marketplacePlugin.provide(
  createRoutableExtension({
    name: 'DynamicMarketplacePluginRouter',
    component: () =>
      import('./pages/DynamicMarketplacePluginRouter').then(
        m => m.DynamicMarketplacePluginRouter,
      ),
    mountPoint: allRoutes.rootRouteRef,
  }),
);

/**
 * @public
 */
export const DynamicMarketplacePluginContent = marketplacePlugin.provide(
  createComponentExtension({
    name: 'DynamicMarketplacePluginContent',
    component: {
      lazy: () =>
        import('./pages/DynamicMarketplacePluginRouter').then(
          m => m.DynamicMarketplacePluginContent,
        ),
    },
  }),
);

/**
 * @public
 */
export const MarketplaceIcon: IconComponent = MUIMarketplaceIcon;
