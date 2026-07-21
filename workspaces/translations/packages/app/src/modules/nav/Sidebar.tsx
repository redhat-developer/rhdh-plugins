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
  SidebarSpace,
} from '@backstage/core-components';
import { NavContentBlueprint } from '@backstage/plugin-app-react';
import ExtensionIcon from '@mui/icons-material/Extension';
import MenuIcon from '@mui/icons-material/Menu';
import ScienceIcon from '@mui/icons-material/Science';
import { SidebarLogo } from './SidebarLogo';
import { UserSettingsSignInAvatar } from '@backstage/plugin-user-settings';

export const SidebarContent = NavContentBlueprint.make({
  params: {
    component: ({ navItems }) => {
      const items = navItems.withComponent(({ title, icon, href }) => (
        <SidebarItem icon={() => icon} to={href} text={title} />
      ));

      return (
        <Sidebar>
          <SidebarLogo />
          <SidebarGroup label="Menu" icon={<MenuIcon />}>
            {items.rest()}
            <SidebarDivider />
            <SidebarItem
              icon={ExtensionIcon}
              to="/translations"
              text="Translations"
            />
            <SidebarItem
              icon={ScienceIcon}
              to="/translations-test"
              text="Translations Test"
            />
          </SidebarGroup>
          <SidebarSpace />
          <SidebarDivider />
          <SidebarGroup
            label="Settings"
            icon={<UserSettingsSignInAvatar />}
            to="/settings"
          />
        </Sidebar>
      );
    },
  },
});
