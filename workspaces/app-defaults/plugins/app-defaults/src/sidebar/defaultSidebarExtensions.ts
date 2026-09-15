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

import { NotificationsSidebarItem } from '@backstage/plugin-notifications';
import { SidebarSearchModal } from '@backstage/plugin-search';
import {
  SidebarDividerBlueprint,
  SidebarElementBlueprint,
  SidebarSpacerBlueprint,
} from '@red-hat-developer-hub/backstage-plugin-app-react';

import { CompanyLogo } from './logo/CompanyLogo';

/**
 * Default sidebar layout shipped with the app defaults module.
 *
 * Top to bottom: the company logo, the search modal, everything contributed at priority 0
 * (auto-discovered pages, plugin items and groups), a spacer that pushes the
 * rest to the bottom, a divider, the notifications item, and a final
 * divider above anything pinned to the bottom (for example a settings group
 * with a priority below -90). The search modal and the notifications item
 * declare their page paths, so the plain auto-discovered entries for the
 * search and notifications pages are hidden.
 *
 * Each element can be disabled or moved from `app-config.yaml`, e.g.
 *
 * ```yaml
 * app:
 *   extensions:
 *     - sidebar-element:app/notifications: false
 *     - sidebar-spacer:app/bottom:
 *         config:
 *           priority: -20
 * ```
 */

/** Company logo linking home. Extension ID: `sidebar-element:app/logo`. */
export const sidebarLogoElement = SidebarElementBlueprint.make({
  name: 'logo',
  params: {
    component: CompanyLogo,
    priority: 2000,
  },
});

/** Search modal pinned to the top. Extension ID: `sidebar-element:app/search`. */
export const sidebarSearchElement = SidebarElementBlueprint.make({
  name: 'search',
  params: {
    component: SidebarSearchModal,
    to: '/search',
    priority: 1000,
  },
});

/** Pushes lower entries to the bottom. Extension ID: `sidebar-spacer:app/bottom`. */
export const sidebarBottomSpacer = SidebarSpacerBlueprint.make({
  name: 'bottom',
  params: { priority: -30 },
});

/** Separates the bottom block. Extension ID: `sidebar-divider:app/bottom`. */
export const sidebarBottomDivider = SidebarDividerBlueprint.make({
  name: 'bottom',
  params: { priority: -35 },
});

/** Notifications item. Extension ID: `sidebar-element:app/notifications`. */
export const sidebarNotificationsElement = SidebarElementBlueprint.make({
  name: 'notifications',
  params: {
    component: NotificationsSidebarItem,
    to: '/notifications',
    priority: -40,
  },
});

/** Divider above the settings block. Extension ID: `sidebar-divider:app/settings`. */
export const sidebarSettingsDivider = SidebarDividerBlueprint.make({
  name: 'settings',
  params: { priority: -90 },
});

/** All default sidebar layout extensions, in registration order. */
export const defaultSidebarExtensions = [
  sidebarLogoElement,
  sidebarSearchElement,
  sidebarBottomSpacer,
  sidebarBottomDivider,
  sidebarNotificationsElement,
  sidebarSettingsDivider,
];
