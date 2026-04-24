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
import { useAppDrawer } from '@red-hat-developer-hub/backstage-plugin-app-react';

import { Quickstart } from '../components/Quickstart';
import { useQuickstartRole } from '../hooks/useQuickstartRole';
import { QuickstartItemData } from '../types';
import { filterQuickstartItemsByRole } from '../utils';
import { QUICKSTART_DRAWER_ID } from './const';

export const QuickstartDrawerContent = () => {
  const { isOpen, closeDrawer } = useAppDrawer();
  const { isLoading: roleLoading, userRole } = useQuickstartRole();
  const config = useApi(configApiRef);

  const drawerOpen = isOpen(QUICKSTART_DRAWER_ID);

  const quickstartItems: QuickstartItemData[] = useMemo(() => {
    try {
      if (!config?.has('app.quickstart')) return [];
      const items = config.get('app.quickstart') as unknown;
      if (!Array.isArray(items)) {
        // eslint-disable-next-line no-console
        console.warn('app.quickstart config is present but not an array');
        return [];
      }
      return items as QuickstartItemData[];
    } catch {
      return [];
    }
  }, [config]);

  const eligibleItems = useMemo(() => {
    return !roleLoading && userRole
      ? filterQuickstartItemsByRole(quickstartItems, userRole)
      : [];
  }, [roleLoading, userRole, quickstartItems]);

  const filteredItems = useMemo(() => {
    return drawerOpen ? eligibleItems : [];
  }, [drawerOpen, eligibleItems]);

  if (quickstartItems.length === 0) {
    return null;
  }

  if (!roleLoading && eligibleItems.length === 0) {
    return null;
  }

  return (
    <Quickstart
      quickstartItems={filteredItems}
      handleDrawerClose={() => closeDrawer(QUICKSTART_DRAWER_ID)}
      isLoading={roleLoading}
    />
  );
};
