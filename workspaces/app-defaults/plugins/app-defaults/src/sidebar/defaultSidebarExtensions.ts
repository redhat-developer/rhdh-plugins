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

import {
  SidebarDividerBlueprint,
  SidebarElementBlueprint,
  SidebarItemBlueprint,
  SidebarItemGroupBlueprint,
  SidebarSpacerBlueprint,
} from '@red-hat-developer-hub/backstage-plugin-app-react';
import { default as AdminIcon } from '@mui/icons-material/GppMaybeOutlined';
import { default as SettingsIcon } from '@mui/icons-material/ManageAccountsOutlined';
import { default as RbacIcon } from '@mui/icons-material/VpnKeyOutlined';

import { CompanyLogo } from './logo/CompanyLogo';
import { SidebarNotifications } from './SidebarNotifications';
import { SidebarSearch } from './SidebarSearch';

/**
 * Default sidebar layout shipped with the app defaults module.
 *
 * Top to bottom: the company logo, a small gap, the search modal, a divider
 * below search, then three menu sections rendered by `AppSidebar`:
 * 1. default / built-in items (path allowlist),
 * 2. optional plugin items (with a divider only when this section is non-empty),
 * 3. a spacer, then Administration / Settings / notifications (with a divider
 *    only when the bottom block has visible entries).
 *
 * The search modal and the notifications item declare their page paths, so
 * the plain auto-discovered entries for those pages are hidden. Search is
 * enabled by default; notifications stay disabled until opted in.
 *
 * The Administration group has no link of its own; it ships with the RBAC
 * item and collects any further items plugins contribute with
 * `group: 'admin'`. The RBAC item is route-guarded, so the group stays
 * hidden until the RBAC plugin (or another admin item) is present.
 * `AppSidebar` also hides Administration for users without admin permission.
 * The Settings group links to the settings page; it is hidden by default when
 * the global header is present and can be forced with `app.sidebar.settings`.
 * The company logo is likewise hidden when the global header is present and
 * can be forced with `app.sidebar.logo`.
 *
 * Each element can be disabled or moved from `app-config.yaml`, e.g.
 *
 * ```yaml
 * app:
 *   sidebar:
 *     settings: true
 *     logo: true
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

/**
 * Search modal pinned to the top. Extension ID: `sidebar-element:app/search`.
 * Claims `/search` so the auto-discovered Search page does not appear as a
 * regular middle-section item.
 */
export const sidebarSearchElement = SidebarElementBlueprint.make({
  name: 'search',
  params: {
    component: SidebarSearch,
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

/**
 * Notifications item. Disabled by default; enable via `app-config.yaml`.
 * Extension ID: `sidebar-element:app/notifications`.
 */
export const sidebarNotificationsElement = SidebarElementBlueprint.make({
  name: 'notifications',
  disabled: true,
  params: {
    component: SidebarNotifications,
    to: '/notifications',
    priority: -40,
  },
});

/**
 * Administration group. Ships with the route-guarded RBAC item below and
 * collects any further items a plugin contributes with `group: 'admin'`.
 * Stays hidden while it has no visible items. Extension ID:
 * `sidebar-item-group:app/admin`.
 */
export const sidebarAdminGroup = SidebarItemGroupBlueprint.make({
  name: 'admin',
  params: {
    id: 'admin',
    title: 'Administration',
    icon: AdminIcon,
    priority: -95,
  },
});

/**
 * RBAC item inside the Administration group, linking to the RBAC page. It is
 * guarded with `requiresRoute` so it only shows when the RBAC plugin is
 * installed and its page is registered at `/rbac`. Extension ID:
 * `sidebar-item:app/rbac`.
 */
export const sidebarRbacItem = SidebarItemBlueprint.make({
  name: 'rbac',
  params: {
    title: 'RBAC',
    icon: RbacIcon,
    to: '/rbac',
    group: 'admin',
    priority: 10,
    requiresRoute: true,
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
    icon: SettingsIcon,
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
  sidebarNotificationsElement,
  sidebarAdminGroup,
  sidebarRbacItem,
  sidebarSettingsGroup,
];
