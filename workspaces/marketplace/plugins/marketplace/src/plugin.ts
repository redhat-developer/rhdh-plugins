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
  createApiFactory,
  createRoutableExtension,
  createPlugin,
  discoveryApiRef,
  fetchApiRef,
} from '@backstage/core-plugin-api';

import { rootRouteRef } from './routes';
import { MarketplaceApiRef, MarketplaceClient } from './api';

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
      api: MarketplaceApiRef,
      deps: {
        discoveryApi: discoveryApiRef,
        fetchApi: fetchApiRef,
      },
      factory: ({ discoveryApi, fetchApi }) =>
        new MarketplaceClient({
          discoveryApi,
          fetchApi,
        }),
    }),
  ],
});

/**
 * Marketplace Page
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
