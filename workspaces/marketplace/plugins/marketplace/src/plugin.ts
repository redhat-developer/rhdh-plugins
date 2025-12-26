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
  identityApiRef,
  configApiRef,
} from '@backstage/core-plugin-api';

import MUIMarketplaceIcon from '@mui/icons-material/ShoppingBasketOutlined';
import MUIPluginsIcon from '@mui/icons-material/PowerOutlined';

import { MarketplaceBackendClient } from '@red-hat-developer-hub/backstage-plugin-extensions-common';

import { marketplaceApiRef, dynamicPluginsInfoApiRef } from './api';
import { DynamicPluginsInfoClient } from './api/DynamicPluginsInfoClient';
import { allRoutes } from './routes';
import { marketplaceTranslationRef } from './translations';

/**
 * Marketplace Plugin
 * @public
 */
export const marketplacePlugin = createPlugin({
  id: 'extensions',
  routes: allRoutes,
  __experimentalTranslations: {
    availableLanguages: ['en', 'de', 'fr', 'es'],
    resources: [marketplaceTranslationRef],
  },
  apis: [
    createApiFactory({
      api: marketplaceApiRef,
      deps: {
        discoveryApi: discoveryApiRef,
        fetchApi: fetchApiRef,
        identityApi: identityApiRef,
        configApi: configApiRef,
      },
      factory: ({ discoveryApi, fetchApi, identityApi, configApi }) =>
        new MarketplaceBackendClient({
          discoveryApi,
          fetchApi,
          identityApi,
          configApi,
        }),
    }),
    createApiFactory({
      api: dynamicPluginsInfoApiRef,
      deps: {
        discoveryApi: discoveryApiRef,
        fetchApi: fetchApiRef,
      },
      factory: ({ discoveryApi, fetchApi }) =>
        new DynamicPluginsInfoClient({
          discoveryApi,
          fetchApi,
        }),
    }),
  ],
} as any);

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
 * Main marketplace plugin router with tabs and sub-routes.
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

/**
 * @public
 */
export const PluginsIcon: IconComponent = MUIPluginsIcon;

/**
 * @public
 * @deprecated Use the latest RHDH. This no-op export remains only for backward compatibility and will be removed in a future major release.
 */
export const InstallationContextProvider = marketplacePlugin.provide(
  createComponentExtension({
    name: 'InstallationContextProvider',
    component: {
      sync: () => null,
    },
  }),
);
