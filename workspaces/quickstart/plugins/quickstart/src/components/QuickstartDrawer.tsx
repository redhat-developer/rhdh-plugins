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

import Drawer from '@mui/material/Drawer';
import { ThemeConfig } from '@red-hat-developer-hub/backstage-plugin-theme';
import { configApiRef, useApiHolder } from '@backstage/core-plugin-api';
import { Quickstart } from './Quickstart';
import { useQuickstartDrawerContext } from '../hooks/useQuickstartDrawerContext';
import { QuickstartItemData } from '../types';
import { filterQuickstartItemsByRole } from '../utils';
import { useQuickstartRole } from '../hooks/useQuickstartRole';
import { useEffect, useRef } from 'react';

export const QuickstartDrawer = () => {
  const { isDrawerOpen, closeDrawer, openDrawer, drawerWidth } =
    useQuickstartDrawerContext();

  // Track if we've already auto-opened the drawer to prevent re-opening after manual close
  const hasAutoOpened = useRef(false);

  const apiHolder = useApiHolder();
  const config = apiHolder.get(configApiRef);
  const quickstartItems: QuickstartItemData[] = config?.has('app.quickstart')
    ? config.get('app.quickstart')
    : [];

  const { isLoading, userRole } = useQuickstartRole();
  const filteredItems =
    !isLoading && userRole
      ? filterQuickstartItemsByRole(quickstartItems, userRole)
      : [];

  // Auto-open drawer when user logs in and has quickstart items available
  // Only do this once, and respect user's manual close action
  useEffect(() => {
    if (
      !isLoading &&
      filteredItems.length > 0 &&
      !isDrawerOpen &&
      !hasAutoOpened.current
    ) {
      openDrawer();
      hasAutoOpened.current = true;
    }
  }, [isLoading, filteredItems.length, isDrawerOpen, openDrawer]);

  // Hide the drawer entirely if there are no quickstart items for the user
  // Do this check first, before any rendering happens
  if (!isLoading && filteredItems.length === 0) {
    // Also close the drawer context if it's currently open to prevent layout issues
    if (isDrawerOpen) {
      closeDrawer();
    }
    return null;
  }

  // During loading, if drawer is open but we don't know if user will have items yet,
  // close it preemptively to prevent flash and reset auto-open tracking
  if (isLoading && isDrawerOpen) {
    closeDrawer();
    hasAutoOpened.current = false; // Reset for new user
  }

  return (
    <Drawer
      sx={{
        '& .v5-MuiDrawer-paper': {
          width: drawerWidth,
          boxSizing: 'border-box',
          backgroundColor: theme =>
            `${
              (theme as ThemeConfig).palette?.rhdh?.general
                .sidebarBackgroundColor
            }`,
          justifyContent: 'space-between',
        },
        // Only apply header offset when global header exists
        'body:has(#global-header) &': {
          '& .v5-MuiDrawer-paper': {
            top: '64px !important',
            height: 'calc(100vh - 64px) !important',
          },
        },
      }}
      variant="persistent"
      anchor="right"
      open={isDrawerOpen}
    >
      <Quickstart
        quickstartItems={filteredItems}
        handleDrawerClose={closeDrawer}
        isLoading={isLoading}
      />
    </Drawer>
  );
};
