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
 * See the License for the permissions and limitations under the License.
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
  Settings as SidebarSettings,
  UserSettingsSignInAvatar,
} from '@backstage/plugin-user-settings';
import { SidebarSearchModal } from '@backstage/plugin-search';
import CreateComponentIcon from '@material-ui/icons/AddCircleOutline';
import ExtensionIcon from '@material-ui/icons/Extension';
import HomeIcon from '@material-ui/icons/Home';
import LibraryBooks from '@material-ui/icons/LibraryBooks';
import MenuIcon from '@material-ui/icons/Menu';
import SearchIcon from '@material-ui/icons/Search';
import { MyGroupsSidebarItem } from '@backstage/plugin-org';
import GroupIcon from '@material-ui/icons/People';
import { SidebarLogo } from './SidebarLogo';

/**
 * Custom nav content for the app sidebar (NavContentBlueprint).
 * Receives `items` from the app (resolved nav items from page extensions);
 * we render a fixed sidebar structure.
 */
export const SidebarContent = () =>
  compatWrapper(
    <Sidebar>
      <SidebarLogo />
      <SidebarGroup label="Search" icon={<SearchIcon />} to="/search">
        <SidebarSearchModal />
      </SidebarGroup>
      <SidebarDivider />
      <SidebarGroup label="Menu" icon={<MenuIcon />}>
        <SidebarItem icon={HomeIcon} to="/" text="Home" />
        <MyGroupsSidebarItem
          singularTitle="My Group"
          pluralTitle="My Groups"
          icon={GroupIcon}
        />
        <SidebarItem icon={ExtensionIcon} to="/api-docs" text="APIs" />
        <SidebarItem icon={LibraryBooks} to="/docs" text="Docs" />
        <SidebarItem icon={CreateComponentIcon} to="/create" text="Create..." />
        <SidebarDivider />
        <SidebarItem icon={ExtensionIcon} to="/bcc-tests" text="BCC tests" />
        <SidebarItem icon={ExtensionIcon} to="/bui-tests" text="BUI tests" />
        <SidebarItem
          icon={ExtensionIcon}
          to="/mui4-tests"
          text="MUI v4 tests"
        />
        <SidebarItem
          icon={ExtensionIcon}
          to="/mui5-tests"
          text="MUI v5 tests"
        />
        <SidebarDivider />
        <SidebarScrollWrapper />
      </SidebarGroup>
      <SidebarSpace />
      <SidebarDivider />
      <SidebarGroup
        label="Settings"
        icon={<UserSettingsSignInAvatar />}
        to="/settings"
      >
        <SidebarSettings />
      </SidebarGroup>
    </Sidebar>,
  );
