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

import type { ConfigApi } from '@backstage/core-plugin-api';

import type { QuickstartItemData, UserRole } from '../types';
import { filterQuickstartItemsByRole } from './filterQuickstartItems';

/** Reads `app.quickstart` from config; returns [] when missing or invalid. */
export const getConfiguredQuickstartItems = (
  configApi?: ConfigApi,
): QuickstartItemData[] => {
  try {
    if (!configApi?.has('app.quickstart')) {
      return [];
    }
    const items = configApi.get('app.quickstart') as unknown;
    return Array.isArray(items) ? (items as QuickstartItemData[]) : [];
  } catch {
    return [];
  }
};

/** Configured items filtered for the current role (empty while role is loading). */
export const getEligibleQuickstartItems = (
  configApi: ConfigApi | undefined,
  roleLoading: boolean,
  userRole: UserRole | null | undefined,
): QuickstartItemData[] => {
  if (roleLoading || !userRole) {
    return [];
  }
  return filterQuickstartItemsByRole(
    getConfiguredQuickstartItems(configApi),
    userRole,
  );
};
