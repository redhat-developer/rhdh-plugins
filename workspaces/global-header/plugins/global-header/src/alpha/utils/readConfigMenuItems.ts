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

import type { Config } from '@backstage/config';

import type { GlobalHeaderMenuItemData } from '../types';

/**
 * Reads `globalHeader.menuItems` from the app config and maps
 * each entry into a {@link GlobalHeaderMenuItemData}.
 * Config-driven items are always `type: 'data'` (the default).
 */
export function readConfigMenuItems(
  configApi: Config,
): GlobalHeaderMenuItemData[] {
  const items = configApi.getOptionalConfigArray('globalHeader.menuItems');
  if (!items) return [];

  return items.map(item => ({
    target: item.getString('target'),
    type: 'data' as const,
    title: item.getString('title'),
    titleKey: item.getOptionalString('titleKey'),
    icon: item.getOptionalString('icon'),
    link: item.getString('link'),
    sectionLabel: item.getOptionalString('sectionLabel'),
    sectionLink: item.getOptionalString('sectionLink'),
    sectionLinkLabel: item.getOptionalString('sectionLinkLabel'),
    priority: item.getOptionalNumber('priority'),
  }));
}
