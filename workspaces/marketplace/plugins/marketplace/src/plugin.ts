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
  createPlugin,
  createRoutableExtension,
  createComponentExtension,
  type IconComponent,
  createApiFactory,
  discoveryApiRef,
  fetchApiRef,
} from '@backstage/core-plugin-api';

import MUIMarketplaceIcon from '@mui/icons-material/ShoppingBasketOutlined';

import { rootRouteRef } from './routes';
import { marketplaceApiRef, MarketplaceBackendClient } from './api';

/**
 * Marketplace Plugin
 * @public
 */
export const marketplacePlugin = createPlugin({
  id: 'marketplace',
  routes: {
    root: rootRouteRef,
  },
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
 * Marketplace page with header and tabs.
 * @public
 */
export const MarketplacePage = marketplacePlugin.provide(
  createRoutableExtension({
    name: 'MarketplacePage',
    component: () =>
      import('./components/MarketplacePage').then(m => m.MarketplacePage),
    mountPoint: rootRouteRef,
  }),
);

/**
 * Marketplace catalog content without header and tabs.
 * @public
 */
export const MarketplaceCatalogContent = marketplacePlugin.provide(
  createComponentExtension({
    name: 'MarketplaceCatalogContent',
    component: {
      lazy: () =>
        import('./components/MarketplaceCatalogContent').then(
          m => m.MarketplaceCatalogContent,
        ),
    },
  }),
);

/**
 * @public
 */
export const MarketplaceIcon: IconComponent = MUIMarketplaceIcon;
