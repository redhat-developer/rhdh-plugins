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
import { useMemo } from 'react';

export const QuickstartDrawer = () => {
  const { isDrawerOpen, closeDrawer, drawerWidth } =
    useQuickstartDrawerContext();

  const apiHolder = useApiHolder();
  const config = apiHolder.get(configApiRef);
  const quickstartItems: QuickstartItemData[] = useMemo(() => {
    return config?.has('app.quickstart')
      ? (config.get('app.quickstart') as QuickstartItemData[])
      : [];
  }, [config]);

  const { isLoading, userRole } = useQuickstartRole();

  // Items available to the user based on cached/derived role
  const eligibleItems = useMemo(() => {
    return !isLoading && userRole
      ? filterQuickstartItemsByRole(quickstartItems, userRole)
      : [];
  }, [isLoading, userRole, quickstartItems]);

  // Only expose items to the body when drawer is open to avoid re-renders during close
  const filteredItems = useMemo(() => {
    return isDrawerOpen ? eligibleItems : [];
  }, [isDrawerOpen, eligibleItems]);

  // No auto-open logic here; the provider initializes per user (visited/open)

  // If no quickstart items are configured at all, don't render the drawer to avoid reserving space
  if (quickstartItems.length === 0) {
    return null;
  }

  // If there are no items for the user, hide the drawer entirely
  if (!isLoading && eligibleItems.length === 0) {
    return null;
  }

  // No role-fetching or filtering here when the drawer is closed

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
