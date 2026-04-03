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
  createFrontendModule,
  createFrontendPlugin,
  NavItemBlueprint,
  PageBlueprint,
} from '@backstage/frontend-plugin-api';
import { TranslationBlueprint } from '@backstage/plugin-app-react';
import { compatWrapper } from '@backstage/core-compat-api';
import ExtensionsIcon from '@mui/icons-material/ShoppingBasketOutlined';
import { dynamicPluginsInfoApi, extensionApi } from './apis';
import { allRoutes, rootRouteRef } from '../routes';
import { extensionsTranslations } from './translations';

export * from './translations';

/**
 * @alpha
 */
export const extensionsPage: ReturnType<typeof PageBlueprint.make> =
  PageBlueprint.make({
    params: {
      path: '/extensions',
      routeRef: rootRouteRef,
      loader: () =>
        import('../pages/DynamicExtensionsPluginRouter').then(m =>
          compatWrapper(<m.DynamicExtensionsPluginRouter />),
        ),
      // async () => compatWrapper(<DynamicExtensionsPluginRouter/>),
    },
  });

/**
 * @alpha
 */

export const extensionsNavItem: ReturnType<typeof NavItemBlueprint.make> =
  NavItemBlueprint.make({
    params: {
      title: 'Extensions',
      routeRef: rootRouteRef,
      icon: ExtensionsIcon,
    },
  });

/**
 * Translation module for the rbac plugin
 * @alpha
 */

export const extensionsTranslationsModule: ReturnType<
  typeof createFrontendModule
> = createFrontendModule({
  pluginId: 'app',
  extensions: [
    TranslationBlueprint.make({
      name: 'extensions-translations',
      params: {
        resource: extensionsTranslations,
      },
    }),
  ],
});

/*
 * @alpha
 */
/**
 * @alpha
 */
const extensionsPlugin: ReturnType<typeof createFrontendPlugin> =
  createFrontendPlugin({
    pluginId: 'extensions',
    info: { packageJson: () => import('../../package.json') },
    extensions: [
      dynamicPluginsInfoApi,
      extensionApi,
      extensionsPage,
      extensionsNavItem,
    ],
    routes: allRoutes,
  });

export default extensionsPlugin;
