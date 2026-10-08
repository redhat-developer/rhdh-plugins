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
import AddCircleOutlineIcon from '@mui/icons-material/AddCircleOutline';
import ExtensionIcon from '@mui/icons-material/Extension';
import HomeIcon from '@mui/icons-material/Home';
import LibraryBooks from '@mui/icons-material/LibraryBooks';
import MenuIcon from '@mui/icons-material/Menu';
import GroupIcon from '@mui/icons-material/People';
import SearchIcon from '@mui/icons-material/Search';
import Box from '@mui/material/Box';
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
} from '@backstage/core-components';
import { MyGroupsSidebarItem } from '@backstage/plugin-org';
import {
  LightspeedChatContainer,
  LightspeedDrawerStateExposer,
  LightspeedFAB,
} from '@red-hat-developer-hub/backstage-plugin-intelligent-assistant/legacy';
import {
  LogoFull,
  LogoIcon,
} from '@red-hat-developer-hub/backstage-plugin-theme';
import { Administration } from '@backstage-community/plugin-rbac';
import { ApplicationDrawer } from './ApplicationDrawer';

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

export const Root = ({ children }: PropsWithChildren<{}>) => {
  return (
    <Box
      id="sidebar"
      sx={{
        // When drawer is open, adjust the content size
        // Similary this code exists in RHDH:
        // https://github.com/redhat-developer/rhdh/blob/main/packages/app/src/components/Root/Root.tsx#L159-L165
        // https://github.com/redhat-developer/rhdh/blob/main/packages/app/src/components/ErrorPages/ErrorPage.tsx#L54-L59
        'body.docked-drawer-open #sidebar&': {
          "> div > main[class*='BackstagePage-root']": {
            marginRight: 'calc(var(--docked-drawer-width, 500px) + 1.5em)',
            transition: 'margin-right 0.3s ease',
          },
        },
      }}
    >
      <SidebarPage>
        <LightspeedFAB />
        <Sidebar>
          <SidebarLogo />
          <SidebarGroup label="Search" icon={<SearchIcon />} to="/search">
            <SidebarSearchModal />
          </SidebarGroup>
          <SidebarDivider />
          <SidebarGroup label="Menu" icon={<MenuIcon />}>
            {/* Global nav, not org-specific */}
            <SidebarItem icon={HomeIcon} to="catalog" text="Home" />
            <MyGroupsSidebarItem
              singularTitle="My Group"
              pluralTitle="My Groups"
              icon={GroupIcon}
            />
            <SidebarItem icon={ExtensionIcon} to="api-docs" text="APIs" />
            <SidebarItem icon={LibraryBooks} to="docs" text="Docs" />
            <SidebarItem
              icon={AddCircleOutlineIcon}
              to="create"
              text="Create..."
            />
            {/* End global nav */}
            <SidebarDivider />
            <SidebarScrollWrapper>
              {/* Items in this group will be scrollable if they run out of space */}
            </SidebarScrollWrapper>
          </SidebarGroup>
          <SidebarSpace />
          <SidebarDivider />
          <Administration />
          <SidebarGroup
            label="Settings"
            icon={<UserSettingsSignInAvatar />}
            to="/settings"
          >
            <SidebarSettings />
          </SidebarGroup>
        </Sidebar>
        {children}
        <ApplicationDrawer
          drawerContents={[
            {
              Component: LightspeedChatContainer,
              priority: 100,
              id: 'intelligent-assistant',
            },
          ]}
          stateExposers={[
            // In RHDH, these would come from mount points:
            // - mountPoint: application/internal/drawer-state
            //   importName: LightspeedDrawerStateExposer
            { Component: LightspeedDrawerStateExposer },
          ]}
        />
      </SidebarPage>
    </Box>
  );
};
