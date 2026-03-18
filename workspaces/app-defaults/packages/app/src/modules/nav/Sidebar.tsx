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
import { compatWrapper } from '@backstage/core-compat-api';
import {
  NavContentBlueprint,
  type NavContentComponentProps,
} from '@backstage/plugin-app-react';
import { useAppDrawer } from '@red-hat-developer-hub/backstage-plugin-app-react';
import { SidebarLogo } from './SidebarLogo';
import MenuIcon from '@material-ui/icons/Menu';
import ChatIcon from '@material-ui/icons/Chat';
import HelpIcon from '@material-ui/icons/Help';
import SettingsIcon from '@material-ui/icons/Settings';

const SidebarNavContent = ({ navItems }: NavContentComponentProps) => {
  const { toggleDrawer } = useAppDrawer();
  const nav = navItems.withComponent(item => (
    <SidebarItem icon={() => item.icon} to={item.href} text={item.title} />
  ));
  return compatWrapper(
    <Sidebar>
      <SidebarLogo />
      <SidebarDivider />
      <SidebarGroup label="Menu" icon={<MenuIcon />}>
        {nav.take('page:catalog')}
        {nav.take('page:scaffolder')}
        <SidebarDivider />
        <SidebarScrollWrapper>
          {nav.rest({ sortBy: 'title' })}
        </SidebarScrollWrapper>
      </SidebarGroup>
      <SidebarSpace />
      <SidebarDivider />
      <SidebarItem
        icon={ChatIcon}
        text="Chat"
        onClick={() => toggleDrawer('demo-chat')}
      />
      <SidebarItem
        icon={HelpIcon}
        text="Help"
        onClick={() => toggleDrawer('demo-help')}
      />
      <SidebarDivider />
      <SidebarItem icon={SettingsIcon} text="Settings" to="/settings" />
    </Sidebar>,
  );
};

export const SidebarContent = NavContentBlueprint.make({
  params: {
    component: SidebarNavContent,
  },
});
