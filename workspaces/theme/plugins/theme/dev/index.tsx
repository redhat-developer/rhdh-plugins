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

/**
 * New Frontend System dev mode for the RHDH Theme plugin
 */

import '@backstage/ui/css/styles.css';
import { createApp } from '@backstage/frontend-defaults';
import ReactDOM from 'react-dom/client';

import {
  createFrontendModule,
  createFrontendPlugin,
  NavItemBlueprint,
  PageBlueprint,
} from '@backstage/frontend-plugin-api';
import {
  Sidebar,
  SidebarGroup,
  SidebarItem,
  SidebarScrollWrapper,
  SidebarSpace,
} from '@backstage/core-components';
import { NavContentBlueprint } from '@backstage/plugin-app-react';
import ExtensionIcon from '@material-ui/icons/Extension';
import { createRouteRef } from '@backstage/core-plugin-api';
import {
  SidebarLanguageSwitcher,
  SidebarSignOutButton,
} from '@backstage/dev-utils';

import { rhdhThemeModule } from '../src/alpha';
import { ThemeTestPage } from './ThemeTestPage';

const rootRouteRef = createRouteRef({
  id: 'theme-test',
});

const themeDevPageModule = createFrontendPlugin({
  pluginId: 'theme-test',
  extensions: [
    PageBlueprint.make({
      name: 'theme-test',
      params: {
        path: '/',
        routeRef: rootRouteRef,
        loader: async () => <ThemeTestPage />,
      },
    }),
    NavItemBlueprint.make({
      params: {
        routeRef: rootRouteRef,
        title: 'Test page',
        icon: ExtensionIcon,
      },
    }),
  ],
  routes: { root: rootRouteRef },
});

const devSidebarContent = NavContentBlueprint.make({
  params: {
    component: ({ items }) => (
      <Sidebar>
        <SidebarGroup label="Menu">
          <SidebarScrollWrapper>
            {items.map(item => (
              <SidebarItem {...item} key={`${item.title}`} />
            ))}
          </SidebarScrollWrapper>
        </SidebarGroup>
        <SidebarSpace />
        <SidebarLanguageSwitcher />
        <SidebarSignOutButton />
      </Sidebar>
    ),
  },
});

const devNavModule = createFrontendModule({
  pluginId: 'app',
  extensions: [devSidebarContent],
});

const app = createApp({
  features: [rhdhThemeModule, themeDevPageModule, devNavModule],
});

const root = app.createRoot();

ReactDOM.createRoot(document.getElementById('root')!).render(root);
