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

/**
 * New Frontend System dev mode for the Extensions plugin
 */

// eslint-disable-next-line @backstage/no-ui-css-imports-in-non-frontend
import '@backstage/ui/css/styles.css';

import { createApp } from '@backstage/frontend-defaults';
import ReactDOM from 'react-dom/client';

import {
  ApiBlueprint,
  createFrontendModule,
  createFrontendPlugin,
  pluginHeaderActionsApiRef,
} from '@backstage/frontend-plugin-api';
import {
  Sidebar,
  SidebarGroup,
  SidebarItem,
  SidebarScrollWrapper,
  SidebarSpace,
} from '@backstage/core-components';
import { NavContentBlueprint } from '@backstage/plugin-app-react';
import {
  SidebarLanguageSwitcher,
  SidebarSignOutButton,
} from '@backstage/dev-utils';

import {
  extensionsPage,
  extensionsNavItem,
  extensionsTranslationsModule,
} from '../src/alpha';
import { rhdhThemeModule } from '@red-hat-developer-hub/backstage-plugin-theme/alpha';
import { extensionsApiRef, dynamicPluginsInfoApiRef } from '../src/api';
import { allRoutes } from '../src/routes';
import { MockExtensionsApi } from './__data__/mockExtensions';

const mockDynamicPluginsInfo = {
  listLoadedPlugins: async () => [],
};

const mockExtensionApi = ApiBlueprint.make({
  name: 'extensions-mock',
  params: defineParams =>
    defineParams({
      api: extensionsApiRef,
      deps: {},
      factory: () => new MockExtensionsApi(),
    }),
});

const mockDynamicPluginsInfoApi = ApiBlueprint.make({
  name: 'dynamic-plugins-info-mock',
  params: defineParams =>
    defineParams({
      api: dynamicPluginsInfoApiRef,
      deps: {},
      factory: () => mockDynamicPluginsInfo,
    }),
});

const mockPluginHeaderActionsApi = ApiBlueprint.make({
  name: 'plugin-header-actions-mock',
  params: defineParams =>
    defineParams({
      api: pluginHeaderActionsApiRef,
      deps: {},
      factory: () => ({
        getPluginHeaderActions: () => [],
      }),
    }),
});

const pluginHeaderActionsModule = createFrontendModule({
  pluginId: 'app',
  extensions: [mockPluginHeaderActionsApi],
});

const extensionsDevPlugin = createFrontendPlugin({
  pluginId: 'extensions',
  info: { packageJson: () => import('../package.json') },
  extensions: [
    mockExtensionApi,
    mockDynamicPluginsInfoApi,
    extensionsPage,
    extensionsNavItem,
  ],
  routes: allRoutes,
});

const devSidebarContent = NavContentBlueprint.make({
  params: {
    component: ({ items }) => (
      <Sidebar>
        <SidebarScrollWrapper>
          {items.map(item => (
            <SidebarItem
              key={item.title}
              to={item.to}
              text={item.title}
              icon={item.icon}
            />
          ))}
        </SidebarScrollWrapper>
        <SidebarSpace />
        <SidebarGroup label="Settings">
          <SidebarLanguageSwitcher />
          <SidebarSignOutButton />
        </SidebarGroup>
      </Sidebar>
    ),
  },
});

const devNavModule = createFrontendModule({
  pluginId: 'app',
  extensions: [devSidebarContent],
});

const app = createApp({
  features: [
    pluginHeaderActionsModule,
    extensionsTranslationsModule,
    extensionsDevPlugin,
    devNavModule,
    rhdhThemeModule,
  ],
});

const root = app.createRoot();

ReactDOM.createRoot(document.getElementById('root')!).render(root);
