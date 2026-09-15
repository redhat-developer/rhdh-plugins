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

import type { ComponentType, ReactElement } from 'react';
import type { NavContentNavItem } from '@backstage/plugin-app-react';
import type {
  SidebarElementData,
  SidebarGroupSubmenu,
  SidebarIcon,
  SidebarItemData,
  SidebarItemGroupData,
} from '@red-hat-developer-hub/backstage-plugin-app-react';

/** Icon input accepted by the renderer: contributed icons plus auto-discovered nav icons. */
export type SidebarModelIcon = SidebarIcon | ReactElement;

/** A single renderable sidebar item. */
export interface SidebarModelItem {
  id: string;
  title: string;
  icon?: SidebarModelIcon;
  to?: string;
  onClick?: () => void;
  priority: number;
}

/** A renderable sidebar group with its already-sorted items. */
export interface SidebarModelGroup {
  id: string;
  title: string;
  icon?: SidebarModelIcon;
  to?: string;
  priority: number;
  submenu: SidebarGroupSubmenu;
  items: SidebarModelItem[];
}

/** A custom top-level element rendered with its own component. */
export interface SidebarModelElement {
  id: string;
  component: ComponentType<{}>;
  priority: number;
}

/** Top-level sidebar entry. */
export type SidebarModelEntry =
  | { kind: 'item'; item: SidebarModelItem }
  | { kind: 'group'; group: SidebarModelGroup }
  | { kind: 'element'; element: SidebarModelElement };

/** Inputs for {@link buildSidebarModel}. */
export interface SidebarModelInput {
  items: SidebarItemData[];
  groups: SidebarItemGroupData[];
  elements?: SidebarElementData[];
  navItems?: NavContentNavItem[];
}

const DEFAULT_PRIORITY = 0;

interface Sortable {
  priority: number;
  /** Tiebreaker between equal priorities: the title, or the id for elements. */
  sortKey: string;
}

function byPriorityThenSortKey(a: Sortable, b: Sortable): number {
  if (a.priority !== b.priority) {
    return b.priority - a.priority;
  }
  return a.sortKey.localeCompare(b.sortKey);
}

function sortableOf(entry: SidebarModelEntry): Sortable {
  switch (entry.kind) {
    case 'item':
      return { priority: entry.item.priority, sortKey: entry.item.title };
    case 'group':
      return { priority: entry.group.priority, sortKey: entry.group.title };
    case 'element':
      return { priority: entry.element.priority, sortKey: entry.element.id };
    default:
      throw new Error('Unknown sidebar entry kind');
  }
}

function toModelItem(item: SidebarItemData): SidebarModelItem {
  return {
    id: item.id,
    title: item.title,
    icon: item.icon,
    to: item.to,
    onClick: item.onClick,
    priority: item.priority ?? DEFAULT_PRIORITY,
  };
}

/**
 * Builds the ordered sidebar structure from contributed items and groups.
 *
 * - Top-level entries (groups plus ungrouped items) are sorted by `priority`,
 *   higher first, ties broken by title.
 * - Items referencing a group are nested inside it, sorted the same way.
 *   Groups default to the `inline` submenu style.
 * - Items referencing an unknown group fall back to the top level so that a
 *   misconfigured `group` never hides an entry.
 * - Nav items auto-discovered from page extensions are merged in at the
 *   default priority unless a contributed item already links to the same
 *   path, which lets a plugin take over the placement of its own page.
 * - Custom elements always render at the top level, sorted by priority with
 *   their extension id as tiebreaker.
 */
export function buildSidebarModel({
  items,
  groups,
  elements = [],
  navItems = [],
}: SidebarModelInput): SidebarModelEntry[] {
  const groupById = new Map<string, SidebarModelGroup>();
  for (const group of groups) {
    groupById.set(group.id, {
      id: group.id,
      title: group.title,
      icon: group.icon,
      to: group.to,
      priority: group.priority ?? DEFAULT_PRIORITY,
      submenu: group.submenu ?? 'inline',
      items: [],
    });
  }

  const topLevelItems: SidebarModelItem[] = [];
  for (const item of items) {
    const group = item.group ? groupById.get(item.group) : undefined;
    if (group) {
      group.items.push(toModelItem(item));
    } else {
      topLevelItems.push(toModelItem(item));
    }
  }

  const explicitPaths = new Set(
    items.flatMap(item => (item.to ? [item.to] : [])),
  );
  for (const navItem of navItems) {
    if (explicitPaths.has(navItem.href)) {
      continue;
    }
    topLevelItems.push({
      id: navItem.node.spec.id,
      title: navItem.title,
      icon: navItem.icon ?? undefined,
      to: navItem.href,
      priority: DEFAULT_PRIORITY,
    });
  }

  const entries: SidebarModelEntry[] = [
    ...topLevelItems.map(item => ({ kind: 'item' as const, item })),
    ...[...groupById.values()].map(group => {
      group.items.sort((a, b) =>
        byPriorityThenSortKey(
          { priority: a.priority, sortKey: a.title },
          { priority: b.priority, sortKey: b.title },
        ),
      );
      return { kind: 'group' as const, group };
    }),
    ...elements.map(element => ({
      kind: 'element' as const,
      element: {
        id: element.id,
        component: element.component,
        priority: element.priority ?? DEFAULT_PRIORITY,
      },
    })),
  ];

  return entries.sort((a, b) =>
    byPriorityThenSortKey(sortableOf(a), sortableOf(b)),
  );
}
