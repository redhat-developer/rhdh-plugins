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

// eslint-disable-next-line @backstage/no-ui-css-imports-in-non-frontend
import '@backstage/ui/css/styles.css';
import { createApp } from '@backstage/frontend-defaults';
import ReactDOM from 'react-dom/client';

import {
  createFrontendModule,
  createFrontendPlugin,
  PageBlueprint,
} from '@backstage/frontend-plugin-api';
import { createRouteRef } from '@backstage/core-plugin-api';
import {
  SidebarLanguageSwitcher,
  SidebarSignOutButton,
} from '@backstage/dev-utils';
import ExtensionIcon from '@mui/icons-material/Extension';

import rhdhAppDefaults from '@red-hat-developer-hub/backstage-plugin-app-defaults';
import { SidebarElementBlueprint } from '@red-hat-developer-hub/backstage-plugin-app-react';

import rhdhThemeModule from '../src';
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
        title: 'Test page',
        icon: <ExtensionIcon />,
        routeRef: rootRouteRef,
        loader: async () => <ThemeTestPage />,
      },
    }),
  ],
  routes: { root: rootRouteRef },
});

const devNavModule = createFrontendModule({
  pluginId: 'app',
  extensions: [
    SidebarElementBlueprint.make({
      name: 'SidebarLanguageSwitcher',
      params: {
        component: SidebarLanguageSwitcher,
        priority: -10000,
      },
    }),
    SidebarElementBlueprint.make({
      name: 'SidebarSignOutButton',
      params: {
        component: SidebarSignOutButton,
        priority: -10001,
      },
    }),
  ],
});

const app = createApp({
  features: [
    rhdhAppDefaults,
    rhdhThemeModule,
    themeDevPageModule,
    devNavModule,
  ],
});

const root = app.createRoot();

ReactDOM.createRoot(document.getElementById('root')!).render(root);
