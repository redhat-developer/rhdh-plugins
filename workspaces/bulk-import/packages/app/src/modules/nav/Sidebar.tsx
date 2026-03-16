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

import {
  Sidebar,
  SidebarDivider,
  SidebarGroup,
  SidebarItem,
  SidebarScrollWrapper,
  SidebarSpace,
} from '@backstage/core-components';
import { NavContentBlueprint } from '@backstage/plugin-app-react';
import {
  Settings as SidebarSettings,
  UserSettingsSignInAvatar,
} from '@backstage/plugin-user-settings';
import MenuIcon from '@mui/icons-material/Menu';
import { SidebarLogo } from './SidebarLogo';

export const SidebarContent = NavContentBlueprint.make({
  params: {
    component: ({ items }) => (
      <Sidebar>
        <SidebarLogo />
        <SidebarDivider />
        <SidebarGroup label="Menu" icon={<MenuIcon />}>
          {items.map((item, index) => (
            <SidebarItem {...item} key={index} />
          ))}
        </SidebarGroup>
        <SidebarScrollWrapper />
        <SidebarSpace />
        <SidebarDivider />
        <SidebarGroup
          label="Settings"
          icon={<UserSettingsSignInAvatar />}
          to="/settings"
        >
          <SidebarSettings />
        </SidebarGroup>
      </Sidebar>
    ),
  },
});
