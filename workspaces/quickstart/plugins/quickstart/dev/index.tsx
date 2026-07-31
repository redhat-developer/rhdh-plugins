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
 * New Frontend System dev mode for the Quickstart plugin.
 */

import ReactDOM from 'react-dom/client';

import {
  Sidebar,
  SidebarGroup,
  SidebarItem,
  SidebarScrollWrapper,
  SidebarSpace,
} from '@backstage/core-components';
import {
  SidebarLanguageSwitcher,
  SidebarSignOutButton,
} from '@backstage/dev-utils';
import { createApp } from '@backstage/frontend-defaults';
import {
  ApiBlueprint,
  createFrontendModule,
} from '@backstage/frontend-plugin-api';
import { NavContentBlueprint } from '@backstage/plugin-app-react';
import { permissionApiRef } from '@backstage/plugin-permission-react';
import { mockApis } from '@backstage/test-utils';

import WavingHandOutlinedIcon from '@mui/icons-material/WavingHandOutlined';

import { useAppDrawer } from '@red-hat-developer-hub/backstage-plugin-app-react';
import { appDrawerModule } from '@red-hat-developer-hub/backstage-plugin-app-react/alpha';
import { rhdhThemeModule } from '@red-hat-developer-hub/backstage-plugin-theme/alpha';

import quickstartPlugin, {
  quickstartInitModule,
  quickstartTranslationsModule,
} from '../src';

const QUICKSTART_DRAWER_ID = 'quickstart';

const appDevOverrides = createFrontendModule({
  pluginId: 'app',
  extensions: [
    ApiBlueprint.make({
      name: 'permission-mock',
      params: defineParams =>
        defineParams({
          api: permissionApiRef,
          deps: {},
          factory: () => mockApis.permission(),
        }),
    }),
  ],
});

function QuickstartSidebarItem() {
  const { toggleDrawer } = useAppDrawer();
  return (
    <SidebarItem
      text="Quick start"
      icon={WavingHandOutlinedIcon}
      onClick={() => toggleDrawer(QUICKSTART_DRAWER_ID)}
    />
  );
}

const devSidebarContent = NavContentBlueprint.make({
  params: {
    component: ({ navItems }) => {
      const nav = navItems.withComponent(item => (
        <SidebarItem icon={() => item.icon} to={item.href} text={item.title} />
      ));

      return (
        <Sidebar>
          <SidebarScrollWrapper>
            <SidebarGroup label="Menu">{nav.rest()}</SidebarGroup>
          </SidebarScrollWrapper>
          <SidebarSpace />
          <QuickstartSidebarItem />
          <SidebarLanguageSwitcher />
          <SidebarSignOutButton />
        </Sidebar>
      );
    },
  },
});

const devNavModule = createFrontendModule({
  pluginId: 'app',
  extensions: [devSidebarContent],
});

const app = createApp({
  features: [
    quickstartPlugin,
    quickstartInitModule,
    quickstartTranslationsModule,
    appDrawerModule,
    appDevOverrides,
    rhdhThemeModule,
    devNavModule,
  ],
});

const root = app.createRoot();

ReactDOM.createRoot(document.getElementById('root')!).render(root);
