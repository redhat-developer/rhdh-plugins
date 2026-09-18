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

import type { ComponentType } from 'react';
import type { IconComponent } from '@backstage/frontend-plugin-api';

/**
 * Icon accepted by sidebar items and groups: either a React icon component or
 * the key of a system icon registered via `IconBundleBlueprint`
 * (for example `'home'` or `'category'`).
 *
 * @public
 */
export type SidebarIcon = IconComponent | string;

/**
 * Sidebar entry contributed by a plugin via {@link SidebarItemBlueprint}.
 *
 * @public
 */
export interface SidebarItemData {
  /** Extension ID of the contributing extension, used as a stable key. */
  id: string;
  /** Text shown next to the icon. */
  title: string;
  /** Icon shown in the sidebar. Falls back to a generic icon when unset or unknown. */
  icon?: SidebarIcon;
  /** Link target. Items inside a group must provide `to`. */
  to?: string;
  /** Click handler for items that trigger an action instead of navigating. */
  onClick?: () => void;
  /** Ordering priority. Higher values render first. Defaults to `0`. */
  priority?: number;
  /**
   * ID of the {@link SidebarItemGroupData} this item belongs to. Items
   * without a group, or whose group is not registered, render at the top
   * level.
   */
  group?: string;
}

/**
 * How a sidebar group presents its items.
 *
 * - `inline`: items render in a collapsible list directly below the group
 *   entry. The list opens on click and starts open when the current route
 *   matches one of the items. This is the default.
 * - `flyout`: items render in a submenu that flies out next to the sidebar
 *   while the group entry is hovered.
 *
 * @public
 */
export type SidebarGroupVariant = 'inline' | 'flyout';

/**
 * Sidebar group contributed by a plugin via {@link SidebarItemGroupBlueprint}.
 * Groups render as a sidebar entry that contains every
 * {@link SidebarItemData} referencing the group's `id`, either inline below
 * the entry or in a flyout submenu (see {@link SidebarGroupVariant}).
 *
 * @public
 */
export interface SidebarItemGroupData {
  /** Identifier referenced by `SidebarItemData.group`. */
  id: string;
  /** Text shown next to the icon. */
  title: string;
  /** Icon shown in the sidebar. Falls back to a generic icon when unset or unknown. */
  icon?: SidebarIcon;
  /** Optional link target for the group entry itself. */
  to?: string;
  /** Ordering priority. Higher values render first. Defaults to `0`. */
  priority?: number;
  /** How the group presents its items. Defaults to `'inline'`. */
  variant?: SidebarGroupVariant;
}

/**
 * Custom sidebar element contributed by a plugin via
 * {@link SidebarElementBlueprint}. Use this for entries that need their own
 * React component, such as the search modal or the notifications item.
 * Elements always render at the top level of the sidebar.
 *
 * @public
 */
export interface SidebarElementData {
  /** Extension ID of the contributing extension, used as a stable key. */
  id: string;
  /** Component rendered in place of a regular sidebar item. */
  component: ComponentType<{}>;
  /**
   * Path the element links to, if any. Sidebar items and auto-discovered
   * pages with the same `to` are hidden so the element replaces them.
   */
  to?: string;
  /** Ordering priority. Higher values render first. Defaults to `0`. */
  priority?: number;
}
