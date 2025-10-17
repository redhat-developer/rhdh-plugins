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
  GitHubIcon,
  Link,
  Sidebar,
  sidebarConfig,
  SidebarDivider,
  SidebarGroup,
  SidebarItem,
  SidebarPage,
  SidebarScrollWrapper,
  SidebarSpace,
  useSidebarOpenState,
} from '@backstage/core-components';
import { MyGroupsSidebarItem } from '@backstage/plugin-org';
import {
  SidebarSearchModal,
  SearchModal,
  useSearchModal,
} from '@backstage/plugin-search';
import {
  Settings as SidebarSettings,
  UserSettingsSignInAvatar,
} from '@backstage/plugin-user-settings';
import CreateComponentIcon from '@mui/icons-material/AddCircleOutline';
import ExtensionIcon from '@mui/icons-material/Extension';
import HomeIcon from '@mui/icons-material/Home';
import LibraryBooks from '@mui/icons-material/LibraryBooks';
import MenuIcon from '@mui/icons-material/Menu';
import GroupIcon from '@mui/icons-material/People';
import SearchIcon from '@mui/icons-material/Search';
import { makeStyles } from '@mui/styles';
import { PropsWithChildren } from 'react';
import LogoFull from './LogoFull';
import LogoIcon from './LogoIcon';

import {
  GlobalFloatingActionButton,
  Slot,
} from '@red-hat-developer-hub/backstage-plugin-global-floating-action-button';

const useSidebarLogoStyles = makeStyles({
  root: {
    width: sidebarConfig.drawerWidthClosed,
    height: 3 * sidebarConfig.logoHeight,
    display: 'flex',
    flexFlow: 'row nowrap',
    alignItems: 'center',
    marginBottom: -14,
  },
  link: {
    width: sidebarConfig.drawerWidthClosed,
    marginLeft: 24,
  },
});

const SidebarLogo = () => {
  const classes = useSidebarLogoStyles();
  const { isOpen } = useSidebarOpenState();

  return (
    <div className={classes.root}>
      <Link to="/" underline="none" className={classes.link} aria-label="Home">
        {isOpen ? <LogoFull /> : <LogoIcon />}
      </Link>
    </div>
  );
};

export const Root = ({ children }: PropsWithChildren<{}>) => {
  const { state, toggleModal } = useSearchModal();

  return (
    <SidebarPage>
      <GlobalFloatingActionButton
        floatingButtons={[
          {
            color: 'success',
            icon: <CreateComponentIcon />,
            label: 'Create',
            labelKey: 'fab.create.label',
            showLabel: true,
            toolTip: 'Create entity',
            toolTipKey: 'fab.create.tooltip',
            to: '/create',
          },
          {
            slot: Slot.BOTTOM_LEFT,
            icon: <ExtensionIcon />,
            label: 'APIs',
            labelKey: 'fab.apis.label',
            toolTip: 'APIs',
            toolTipKey: 'fab.apis.tooltip',
            to: '/api-docs',
          },
          {
            slot: Slot.BOTTOM_LEFT,
            icon: <LibraryBooks />,
            label: 'Docs',
            labelKey: 'fab.docs.label',
            showLabel: true,
            toolTip: 'Docs',
            toolTipKey: 'fab.docs.tooltip',
            to: '/docs',
          },
          {
            icon: <SearchIcon />,
            label: 'Search',
            labelKey: 'fab.search.label',
            toolTip: 'Search',
            toolTipKey: 'fab.search.tooltip',
            onClick: toggleModal,
          },
          {
            icon: <GitHubIcon />,
            label: 'RHDH plugins',
            labelKey: 'fab.github.label',
            showLabel: true,
            toolTip: 'RHDH plugins',
            toolTipKey: 'fab.github.tooltip',
            to: 'https://github.com/redhat-developer/rhdh-plugins',
            visibleOnPaths: ['/catalog'],
          },
          {
            color: 'success',
            icon: <UserSettingsSignInAvatar />,
            label: 'Settings',
            labelKey: 'fab.settings.label',
            showLabel: true,
            toolTip: 'Settings',
            toolTipKey: 'fab.settings.tooltip',
            to: '/settings',
            excludeOnPaths: ['/settings'],
          },
        ]}
      />
      <SearchModal {...state} toggleModal={toggleModal} />
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
            icon={CreateComponentIcon}
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
};
