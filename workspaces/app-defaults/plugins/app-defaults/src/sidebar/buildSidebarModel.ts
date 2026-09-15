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

import type { ReactElement } from 'react';
import type { NavContentNavItem } from '@backstage/plugin-app-react';
import type {
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
  items: SidebarModelItem[];
}

/** Top-level sidebar entry. */
export type SidebarModelEntry =
  | { kind: 'item'; item: SidebarModelItem }
  | { kind: 'group'; group: SidebarModelGroup };

const DEFAULT_PRIORITY = 0;

function byPriorityThenTitle(
  a: { priority: number; title: string },
  b: { priority: number; title: string },
): number {
  if (a.priority !== b.priority) {
    return b.priority - a.priority;
  }
  return a.title.localeCompare(b.title);
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
 * - Items referencing an unknown group fall back to the top level so that a
 *   misconfigured `group` never hides an entry.
 * - Nav items auto-discovered from page extensions are merged in at the
 *   default priority unless a contributed item already links to the same
 *   path, which lets a plugin take over the placement of its own page.
 */
export function buildSidebarModel(
  items: SidebarItemData[],
  groups: SidebarItemGroupData[],
  navItems: NavContentNavItem[] = [],
): SidebarModelEntry[] {
  const groupById = new Map<string, SidebarModelGroup>();
  for (const group of groups) {
    groupById.set(group.id, {
      id: group.id,
      title: group.title,
      icon: group.icon,
      to: group.to,
      priority: group.priority ?? DEFAULT_PRIORITY,
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
      group.items.sort(byPriorityThenTitle);
      return { kind: 'group' as const, group };
    }),
  ];

  return entries.sort((a, b) =>
    byPriorityThenTitle(
      a.kind === 'item' ? a.item : a.group,
      b.kind === 'item' ? b.item : b.group,
    ),
  );
}
