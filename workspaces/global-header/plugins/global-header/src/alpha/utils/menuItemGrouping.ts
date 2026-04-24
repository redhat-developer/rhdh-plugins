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

import { MenuItemLink } from '../../components/MenuItemLink/MenuItemLink';
import type { GlobalHeaderMenuItemData } from '../types';
import type { MenuItemConfig } from '../../components/HeaderDropdownComponent/MenuSection';

/** A group of data-driven menu items sharing the same `sectionLabel` value. */
export interface SectionGroup {
  sectionLabel: string;
  sectionLink?: string;
  sectionLinkLabel?: string;
  items: MenuItemConfig[];
  priority: number;
}

/**
 * Groups data-driven menu items by their `sectionLabel` string.
 * Items without a `sectionLabel` default to `''` (rendered without a header).
 * Section metadata (`sectionLink`, `sectionLinkLabel`) is taken from
 * the first item encountered in each group.
 */
export function groupBySection(
  items: GlobalHeaderMenuItemData[],
): SectionGroup[] {
  const groups = new Map<string, SectionGroup>();
  for (const item of items) {
    const key = item.sectionLabel ?? '';
    let group = groups.get(key);
    if (!group) {
      group = {
        sectionLabel: key,
        sectionLink: item.sectionLink,
        sectionLinkLabel: item.sectionLinkLabel,
        items: [],
        priority: item.priority ?? 0,
      };
      groups.set(key, group);
    }
    group.priority = Math.max(group.priority, item.priority ?? 0);
    group.items.push({
      Component: (item.component ??
        MenuItemLink) as MenuItemConfig['Component'],
      label: item.title ?? '',
      labelKey: item.titleKey,
      icon: item.icon,
      subLabel: item.subTitle,
      subLabelKey: item.subTitleKey,
      link: item.link,
      onClick: item.onClick,
    });
  }
  return Array.from(groups.values());
}

/** A single element in the priority-sorted dropdown content list. */
export type DropdownEntry =
  | { type: 'component'; item: GlobalHeaderMenuItemData; priority: number }
  | { type: 'section'; group: SectionGroup; priority: number };

/**
 * Builds the final dropdown entry list by splitting items into standalone
 * components and data-driven section groups, then sorting by priority.
 */
export function buildDropdownEntries(
  menuItems: GlobalHeaderMenuItemData[],
): DropdownEntry[] {
  const custom = menuItems.filter(i => i.type === 'component');
  const data = menuItems.filter(i => i.type === 'data');
  const sections = groupBySection(data);

  const entries: DropdownEntry[] = [
    ...custom.map(item => ({
      type: 'component' as const,
      item,
      priority: item.priority ?? 0,
    })),
    ...sections.map(group => ({
      type: 'section' as const,
      group,
      priority: group.priority,
    })),
  ];

  return entries.sort((a, b) => b.priority - a.priority);
}
