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

import { SidebarItem } from '@backstage/core-components';
import WavingHandOutlinedIcon from '@mui/icons-material/WavingHandOutlined';
import { useQuickstartDrawerContext } from '@red-hat-developer-hub/backstage-plugin-quickstart';
import { configApiRef, useApi } from '@backstage/core-plugin-api';
import { useMemo } from 'react';
import {
  filterQuickstartItemsByRole,
  QuickstartItemData,
} from '@red-hat-developer-hub/backstage-plugin-quickstart';

export const QuickstartSidebarItem = () => {
  const configApi = useApi(configApiRef);
  const { toggleDrawer, userRole, roleLoading } = useQuickstartDrawerContext();

  // Get all quickstart items from config
  const quickstartItems: QuickstartItemData[] = useMemo(() => {
    try {
      return configApi?.has('app.quickstart')
        ? (configApi.get('app.quickstart') as QuickstartItemData[])
        : [];
    } catch {
      return [];
    }
  }, [configApi]);

  // Filter items based on user role
  const eligibleItems = useMemo(() => {
    return !roleLoading && userRole
      ? filterQuickstartItemsByRole(quickstartItems, userRole)
      : [];
  }, [roleLoading, userRole, quickstartItems]);

  // Hide nav item if no quickstart items are available to the current user
  if (roleLoading || eligibleItems.length === 0) {
    return null;
  }
  return (
    <SidebarItem
      text="Quickstart"
      icon={WavingHandOutlinedIcon}
      onClick={toggleDrawer}
    />
  );
};
