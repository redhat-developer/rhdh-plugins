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

import React, { PropsWithChildren } from 'react';
import { makeStyles } from '@material-ui/core';
import HomeIcon from '@material-ui/icons/Home';
import ExtensionIcon from '@material-ui/icons/Extension';
import LibraryBooks from '@material-ui/icons/LibraryBooks';
import {
  Sidebar,
  SidebarDivider,
  SidebarGroup,
  SidebarItem,
  SidebarPage,
  SidebarScrollWrapper,
  SidebarSpace,
} from '@backstage/core-components';
import MenuIcon from '@material-ui/icons/Menu';
import { MyGroupsSidebarItem } from '@backstage/plugin-org';
import GroupIcon from '@material-ui/icons/People';
import {
  GlobalHeaderComponent,
  defaultGlobalHeaderComponentsMountPoints,
} from '@red-hat-developer-hub/backstage-plugin-global-header';
import { NotificationsSidebarItem } from '@backstage/plugin-notifications';

const useStyles = makeStyles(() => ({
  pageWithoutFixHeight: {
    '> div[class*="-sidebarLayout"]': {
      height: '100vh',
      display: 'flex',
      flexDirection: 'column',
    },
    '> div > main': {
      height: 'unset',
      flexGrow: 1,
    },
    '.techdocs-reader-page > main': {
      height: 'unset',
    },
  },
  sidebarItem: {
    textDecorationLine: 'none',
  },
  sidebarLayout: {
    '& div[class*="BackstageSidebar-drawer"]': {
      top: '64px',
      height: 'calc(100vh - 64px)',
    },
    '& main[class*="BackstagePage-root"]': {
      height: `calc(100vh - 40px)`, // header-height(64px) - border-width(24px) = 40px
      marginTop: '-24px',
      marginBottom: '-24px',
      '& header': {
        borderRadiusTopRight: '4px',
        overflow: 'hidden',
      },
      '& article': {
        borderRadiusBottomRight: '4px',
        overflow: 'auto',
      },
    },
  },
}));

export const Root = ({ children = null }: PropsWithChildren<{}>) => {
  const { pageWithoutFixHeight, sidebarLayout } = useStyles();

  return (
    <div className={pageWithoutFixHeight}>
      <div>
        {/* update globalHeaderMountPoints config to test Global header */}
        <GlobalHeaderComponent
          globalHeaderMountPoints={defaultGlobalHeaderComponentsMountPoints}
        />
      </div>
      <div className={sidebarLayout}>
        <SidebarPage>
          <Sidebar>
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
              <NotificationsSidebarItem
                webNotificationsEnabled
                titleCounterEnabled
                snackbarEnabled
              />
              {/* End global nav */}
              <SidebarDivider />
              <SidebarScrollWrapper>
                {/* Items in this group will be scrollable if they run out of space */}
              </SidebarScrollWrapper>
            </SidebarGroup>
            <SidebarSpace />
            <SidebarDivider />
          </Sidebar>
          {children}
        </SidebarPage>
      </div>
    </div>
  );
};
