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
import { PropsWithChildren } from 'react';
import Box from '@mui/material/Box';
import HomeIcon from '@mui/icons-material/Home';
import ExtensionIcon from '@mui/icons-material/Extension';
import LibraryBooks from '@mui/icons-material/LibraryBooks';
import CreateComponentIcon from '@mui/icons-material/AddCircleOutline';
import MenuIcon from '@mui/icons-material/Menu';
import SearchIcon from '@mui/icons-material/Search';
import GroupIcon from '@mui/icons-material/People';
import LogoFull from './LogoFull';
import LogoIcon from './LogoIcon';
import {
  Settings as SidebarSettings,
  UserSettingsSignInAvatar,
} from '@backstage/plugin-user-settings';
import { SidebarSearchModal } from '@backstage/plugin-search';
import {
  Sidebar,
  sidebarConfig,
  SidebarDivider,
  SidebarGroup,
  SidebarItem,
  SidebarPage,
  SidebarScrollWrapper,
  SidebarSpace,
  useSidebarOpenState,
  Link,
  CatalogIcon,
} from '@backstage/core-components';
import { MyGroupsSidebarItem } from '@backstage/plugin-org';
import {
  GlobalHeaderComponent,
  defaultGlobalHeaderComponentsMountPoints,
} from '@red-hat-developer-hub/backstage-plugin-global-header';

const SidebarLogo = () => {
  const { isOpen } = useSidebarOpenState();

  return (
    <Box
      sx={{
        width: sidebarConfig.drawerWidthClosed,
        height: 3 * sidebarConfig.logoHeight,
        display: 'flex',
        flexFlow: 'row nowrap',
        alignItems: 'center',
        mb: '-14px',
      }}
    >
      <Link
        to="/"
        underline="none"
        aria-label="Home"
        style={{
          width: sidebarConfig.drawerWidthClosed,
          marginLeft: 24,
        }}
      >
        {isOpen ? <LogoFull /> : <LogoIcon />}
      </Link>
    </Box>
  );
};

export const Root = ({ children }: PropsWithChildren<{}>) => (
  <SidebarPage>
    <GlobalHeaderComponent
      globalHeaderMountPoints={defaultGlobalHeaderComponentsMountPoints}
    />
    <Sidebar>
      <SidebarLogo />
      <SidebarGroup label="Search" icon={<SearchIcon />} to="/search">
        <SidebarSearchModal />
      </SidebarGroup>
      <SidebarDivider />
      <SidebarGroup label="Menu" icon={<MenuIcon />}>
        {/* Global nav, not org-specific */}
        <SidebarItem icon={HomeIcon} to="home" text="Home" />
        <SidebarItem icon={CatalogIcon} to="catalog" text="Catalog" />
        <MyGroupsSidebarItem
          singularTitle="My Group"
          pluralTitle="My Groups"
          icon={GroupIcon}
        />
        <SidebarItem icon={CatalogIcon} to="news" text="AI News" />
        <SidebarItem icon={ExtensionIcon} to="api-docs" text="APIs" />
        <SidebarItem icon={LibraryBooks} to="docs" text="Docs" />
        <SidebarItem icon={CreateComponentIcon} to="create" text="Create..." />
        {/* End global nav */}
        <SidebarDivider />
        <SidebarScrollWrapper>
          {/* Items in this group will be scrollable if they run out of space */}
        </SidebarScrollWrapper>
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
    </Sidebar>
    {children}
  </SidebarPage>
);
