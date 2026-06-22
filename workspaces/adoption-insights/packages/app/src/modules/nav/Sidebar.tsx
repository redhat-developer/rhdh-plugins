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
  UserSettingsSignInAvatar,
  Settings as SidebarSettings,
} from '@backstage/plugin-user-settings';
import type { IconComponent } from '@backstage/core-plugin-api';
import { SidebarLogo } from './SidebarLogo';
import MenuIcon from '@mui/icons-material/Menu';

type NavItem = { to: string; text: string; icon: IconComponent; title: string };

export const SidebarContent = NavContentBlueprint.make({
  params: {
    component: ({ items }) => {
      const mainItems = (items as NavItem[]).filter(
        item => !item.to.includes('/settings'),
      );
      const footerItems = (items as NavItem[]).filter(item =>
        item.to.includes('/settings'),
      );
      return (
        <Sidebar>
          <SidebarLogo />
          <SidebarDivider />
          <SidebarGroup label="Menu" icon={<MenuIcon />}>
            <SidebarScrollWrapper>
              {mainItems.map(item => (
                <SidebarItem
                  key={item.to}
                  icon={item.icon}
                  to={item.to}
                  text={item.title}
                />
              ))}
            </SidebarScrollWrapper>
          </SidebarGroup>
          <SidebarSpace />
          {footerItems.length > 0 && (
            <>
              <SidebarDivider />
              <SidebarGroup
                label="Settings"
                icon={<UserSettingsSignInAvatar />}
              >
                <SidebarSettings />
              </SidebarGroup>
            </>
          )}
        </Sidebar>
      );
    },
  },
});
