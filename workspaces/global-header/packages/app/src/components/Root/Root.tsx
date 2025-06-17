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
import { styled } from '@mui/material/styles';
import Box from '@mui/material/Box';
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

/** This component is copy pasted from RHDH and should be kept in sync. */
const PageWithoutFixHeight = styled(Box, {
  name: 'RHDHPageWithoutFixHeight',
  slot: 'root',
})(() => ({
  // Use the complete viewport (similar to how Backstage does it) and make the
  // page content part scrollable below. We also need to compensate for the
  // above-sidebar position of the global header as it takes up a fixed height
  // at the top of the page.
  display: 'flex',
  flexDirection: 'column',
  height: '100vh',

  // This solves the same issue for techdocs, which was reported as
  // https://issues.redhat.com/browse/RHIDP-4637
  '.techdocs-reader-page > main': {
    height: 'unset',
  },
}));

/** This component is copy pasted from RHDH and should be kept in sync. */
const SidebarLayout = styled(Box, {
  name: 'RHDHPageWithoutFixHeight',
  slot: 'sidebarLayout',
  shouldForwardProp: prop =>
    prop !== 'aboveSidebarHeaderHeight' &&
    prop !== 'aboveMainContentHeaderHeight',
})(
  ({
    aboveSidebarHeaderHeight,
    aboveMainContentHeaderHeight,
  }: {
    aboveSidebarHeaderHeight?: number;
    aboveMainContentHeaderHeight?: number;
  }) => ({
    // We remove Backstage's 100vh on the content, and instead rely on flexbox
    // to take up the whole viewport.
    display: 'flex',
    flexGrow: 1,
    maxHeight: `calc(100vh - ${aboveSidebarHeaderHeight ?? 0}px)`,

    '& div[class*="BackstageSidebarPage"]': {
      display: 'flex',
      flexDirection: 'column',
      height: 'unset',
      flexGrow: 1,
      // Here we override the theme so that the Backstage default page suspense
      // takes up the whole height of the page instead of 100vh. The difference
      // lies in the height of the global header above the sidebar.
      '@media (min-width: 600px)': {
        '& > [class*="MuiLinearProgress-root"]': {
          height: 'unset',
          flexGrow: 1,
        },
      },
    },

    // The height is controlled by the flexbox in the BackstageSidebarPage.
    '& main[class*="BackstagePage-root"]': {
      height: `calc(100vh - ${
        aboveSidebarHeaderHeight! + aboveMainContentHeaderHeight!
      }px)`,
      flexGrow: 1,
    },

    // We need to compensate for the above-sidebar position of the global header
    // as it takes up a fixed height at the top of the page.
    '& div[class*="BackstageSidebar-drawer"]': {
      top: `max(0px, ${aboveSidebarHeaderHeight ?? 0}px)`,
    },
  }),
);

export const Root = ({ children = null }: PropsWithChildren<{}>) => {
  return (
    <PageWithoutFixHeight>
      <div id="above-sidebar-header-container">
        {/* update globalHeaderMountPoints config to test Global header */}
        <GlobalHeaderComponent
          globalHeaderMountPoints={defaultGlobalHeaderComponentsMountPoints}
        />
      </div>
      <SidebarLayout
        aboveMainContentHeaderHeight={0}
        aboveSidebarHeaderHeight={64}
      >
        <SidebarPage>
          <div id="above-main-content-header-container" />
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
      </SidebarLayout>
    </PageWithoutFixHeight>
  );
};
