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
  SidebarItemGroupBlueprint,
  SidebarSpacerBlueprint,
} from '@red-hat-developer-hub/backstage-plugin-app-react';
import GppMaybeOutlinedIcon from '@mui/icons-material/GppMaybeOutlined';
import ManageAccountsOutlinedIcon from '@mui/icons-material/ManageAccountsOutlined';

import { CompanyLogo } from './logo/CompanyLogo';

/**
 * Default sidebar layout shipped with the app defaults module.
 *
 * Top to bottom: the company logo, a small gap, the search modal, a divider,
 * everything contributed at priority 0
 * (auto-discovered pages, plugin items and groups), a spacer that pushes the
 * rest to the bottom, a divider, the notifications item, a final divider,
 * the Administration group, and the Settings group. The search modal and
 * the notifications item declare their page paths, so the plain
 * auto-discovered entries for the search and notifications pages are hidden.
 *
 * The Administration group has no link of its own, so it stays hidden until
 * a plugin contributes an item with `group: 'admin'`. The Settings group
 * links to the settings page and replaces the auto-discovered settings
 * entry; plugins can add items with `group: 'settings'`.
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

/** Gap below the logo. Extension ID: `sidebar-spacer:app/logo`. */
export const sidebarLogoSpacer = SidebarSpacerBlueprint.make({
  name: 'logo',
  params: { priority: 1500 },
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

/** Divider below the search. Extension ID: `sidebar-divider:app/search`. */
export const sidebarSearchDivider = SidebarDividerBlueprint.make({
  name: 'search',
  params: { priority: 900 },
});

/** Pushes lower entries to the bottom. Extension ID: `sidebar-spacer:app/bottom`. */
export const sidebarBottomSpacer = SidebarSpacerBlueprint.make({
  name: 'bottom',
  params: { priority: -30, grow: true },
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

/**
 * Administration group, hidden until a plugin adds an item with
 * `group: 'admin'`. Extension ID: `sidebar-item-group:app/admin`.
 */
export const sidebarAdminGroup = SidebarItemGroupBlueprint.make({
  name: 'admin',
  params: {
    id: 'admin',
    title: 'Administration',
    icon: GppMaybeOutlinedIcon,
    priority: -95,
  },
});

/**
 * Settings group at the very bottom, linking to the settings page. Plugins
 * can add items with `group: 'settings'`. Extension ID:
 * `sidebar-item-group:app/settings`.
 */
export const sidebarSettingsGroup = SidebarItemGroupBlueprint.make({
  name: 'settings',
  params: {
    id: 'settings',
    title: 'Settings',
    icon: ManageAccountsOutlinedIcon,
    to: '/settings',
    priority: -100,
  },
});

/** All default sidebar layout extensions, in registration order. */
export const defaultSidebarExtensions = [
  sidebarLogoElement,
  sidebarLogoSpacer,
  sidebarSearchElement,
  sidebarSearchDivider,
  sidebarBottomSpacer,
  sidebarBottomDivider,
  sidebarNotificationsElement,
  sidebarSettingsDivider,
  sidebarAdminGroup,
  sidebarSettingsGroup,
];
