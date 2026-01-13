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

import MUIExtensionsIcon from '@mui/icons-material/ShoppingBasketOutlined';
import MUIPluginsIcon from '@mui/icons-material/PowerOutlined';

import { ExtensionsBackendClient } from '@red-hat-developer-hub/backstage-plugin-extensions-common';

import { extensionsApiRef, dynamicPluginsInfoApiRef } from './api';
import { DynamicPluginsInfoClient } from './api/DynamicPluginsInfoClient';
import { allRoutes } from './routes';
import { extensionsTranslationRef } from './translations';

/**
 * Extensions Plugin
 * @public
 */
export const extensionsPlugin = createPlugin({
  id: 'extensions',
  routes: allRoutes,
  __experimentalTranslations: {
    availableLanguages: ['en', 'de', 'es', 'fr', 'it', 'ja'],
    resources: [extensionsTranslationRef],
  },
  apis: [
    createApiFactory({
      api: extensionsApiRef,
      deps: {
        discoveryApi: discoveryApiRef,
        fetchApi: fetchApiRef,
        identityApi: identityApiRef,
        configApi: configApiRef,
      },
      factory: ({ discoveryApi, fetchApi, identityApi, configApi }) =>
        new ExtensionsBackendClient({
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
 * @public
 * @deprecated Use extensionsPlugin instead
 */
export const marketplacePlugin = extensionsPlugin;

/**
 * Extensions page with routes for different pages.
 * @public
 */
export const ExtensionsFullPageRouter = extensionsPlugin.provide(
  createRoutableExtension({
    name: 'ExtensionsPage',
    component: () =>
      import('./pages/ExtensionsFullPageRouter').then(
        m => m.ExtensionsFullPageRouter,
      ),
    mountPoint: allRoutes.rootRouteRef,
  }),
);

/**
 * @public
 * @deprecated Use ExtensionsFullPageRouter instead
 */
export const MarketplaceFullPageRouter = ExtensionsFullPageRouter;

/**
 * Extensions page with header and tabs.
 * @public
 */
export const ExtensionsTabbedPageRouter = extensionsPlugin.provide(
  createRoutableExtension({
    name: 'ExtensionsTabbedPageRouter',
    component: () =>
      import('./pages/ExtensionsTabbedPageRouter').then(
        m => m.ExtensionsTabbedPageRouter,
      ),
    mountPoint: allRoutes.rootRouteRef,
  }),
);

/**
 * @public
 * @deprecated Use ExtensionsTabbedPageRouter instead
 */
export const MarketplaceTabbedPageRouter = ExtensionsTabbedPageRouter;

/**
 * Main extensions plugin router with tabs and sub-routes.
 * @public
 */
export const DynamicExtensionsPluginRouter = extensionsPlugin.provide(
  createRoutableExtension({
    name: 'DynamicExtensionsPluginRouter',
    component: () =>
      import('./pages/DynamicExtensionsPluginRouter').then(
        m => m.DynamicExtensionsPluginRouter,
      ),
    mountPoint: allRoutes.rootRouteRef,
  }),
);

/**
 * @public
 * @deprecated Use DynamicExtensionsPluginRouter instead
 */
export const DynamicMarketplacePluginRouter = DynamicExtensionsPluginRouter;

/**
 * @public
 */
export const DynamicExtensionsPluginContent = extensionsPlugin.provide(
  createComponentExtension({
    name: 'DynamicExtensionsPluginContent',
    component: {
      lazy: () =>
        import('./pages/DynamicExtensionsPluginRouter').then(
          m => m.DynamicExtensionsPluginContent,
        ),
    },
  }),
);

/**
 * @public
 * @deprecated Use DynamicExtensionsPluginContent instead
 */
export const DynamicMarketplacePluginContent = DynamicExtensionsPluginContent;

/**
 * @public
 */
export const ExtensionsIcon: IconComponent = MUIExtensionsIcon;

/**
 * @public
 * @deprecated Use ExtensionsIcon instead
 */
export const MarketplaceIcon = ExtensionsIcon;

/**
 * @public
 */
export const PluginsIcon: IconComponent = MUIPluginsIcon;

/**
 * @public
 * @deprecated Use the latest RHDH. This no-op export remains only for backward compatibility and will be removed in a future major release.
 */
export const InstallationContextProvider = extensionsPlugin.provide(
  createComponentExtension({
    name: 'InstallationContextProvider',
    component: {
      sync: () => null,
    },
  }),
);
