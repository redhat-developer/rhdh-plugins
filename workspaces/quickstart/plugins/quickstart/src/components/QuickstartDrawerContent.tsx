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

import { useMemo } from 'react';
import { configApiRef, useApi } from '@backstage/core-plugin-api';
import { Quickstart } from './Quickstart';
import { useQuickstartDrawerContext } from '../hooks/useQuickstartDrawerContext';
import { QuickstartItemData } from '../types';
import { filterQuickstartItemsByRole } from '../utils';

export const QuickstartDrawerContent = () => {
  const { isDrawerOpen, closeDrawer, userRole, roleLoading } =
    useQuickstartDrawerContext();

  const config = useApi(configApiRef);
  const quickstartItems: QuickstartItemData[] = useMemo(() => {
    return config?.has('app.quickstart')
      ? (config.get('app.quickstart') as QuickstartItemData[])
      : [];
  }, [config]);

  // Items available to the user based on role from context
  const eligibleItems = useMemo(() => {
    return !roleLoading && userRole
      ? filterQuickstartItemsByRole(quickstartItems, userRole)
      : [];
  }, [roleLoading, userRole, quickstartItems]);

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
  if (!roleLoading && eligibleItems.length === 0) {
    return null;
  }

  // No role-fetching or filtering here when the drawer is closed

  return (
    <Quickstart
      quickstartItems={filteredItems}
      handleDrawerClose={closeDrawer}
      isLoading={roleLoading}
    />
  );
};
