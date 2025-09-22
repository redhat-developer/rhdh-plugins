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

import { ExtensionsBackendClient } from '@red-hat-developer-hub/backstage-plugin-extensions-common';

import { extensionsApiRef } from './api';
import { allRoutes } from './routes';

/**
 * Extensions Plugin
 * @public
 */
export const extensionsPlugin = createPlugin({
  id: 'extensions',
  routes: allRoutes,
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
  ],
});

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
 */
export const InstallationContextProvider = extensionsPlugin.provide(
  createComponentExtension({
    name: 'InstallationContextProvider',
    component: {
      lazy: () =>
        import('./components/InstallationContext').then(
          m => m.InstallationContextProvider,
        ),
    },
  }),
);

/**
 * @public
 */
export const ExtensionsIcon: IconComponent = MUIExtensionsIcon;
