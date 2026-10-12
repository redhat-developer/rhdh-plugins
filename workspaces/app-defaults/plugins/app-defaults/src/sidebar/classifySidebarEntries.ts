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

import type { SidebarModelEntry } from './buildSidebarModel';
import { isDefaultSidebarPath } from './defaultSidebarPaths';

/** Layout sections used when rendering {@link AppSidebar}. */
export interface ClassifiedSidebarEntries {
  /** Logo, search, and other entries pinned above the scroll area (priority > 0). */
  chrome: SidebarModelEntry[];
  /** Flexible / fixed spacers that push the bottom block down. */
  spacers: SidebarModelEntry[];
  /** Default / built-in menu entries (top section). */
  top: SidebarModelEntry[];
  /** Optional plugin menu entries (middle section). */
  middle: SidebarModelEntry[];
  /** Administration, Settings, notifications, and other sticky bottom entries. */
  bottom: SidebarModelEntry[];
}

function entryPriority(entry: SidebarModelEntry): number {
  switch (entry.kind) {
    case 'item':
      return entry.item.priority;
    case 'group':
      return entry.group.priority;
    case 'element':
      return entry.element.priority;
    default:
      return 0;
  }
}

function isSpacerElement(entry: SidebarModelEntry): boolean {
  return (
    entry.kind === 'element' && entry.element.id.startsWith('sidebar-spacer:')
  );
}

function isDividerElement(entry: SidebarModelEntry): boolean {
  return (
    entry.kind === 'element' && entry.element.id.startsWith('sidebar-divider:')
  );
}

/**
 * True when a top-level menu entry belongs in the default (top) section.
 * Groups qualify when every child (or the group's own `to`) is a default path.
 */
export function isDefaultMenuEntry(entry: SidebarModelEntry): boolean {
  if (entry.kind === 'item') {
    return isDefaultSidebarPath(entry.item.to);
  }
  if (entry.kind === 'group') {
    if (entry.group.id === 'admin' || entry.group.id === 'settings') {
      return false;
    }
    if (isDefaultSidebarPath(entry.group.to)) {
      return true;
    }
    if (entry.group.items.length === 0) {
      return false;
    }
    return entry.group.items.every(item => isDefaultSidebarPath(item.to));
  }
  return false;
}

function isBottomMenuEntry(entry: SidebarModelEntry): boolean {
  if (entry.kind === 'group') {
    return entry.group.id === 'admin' || entry.group.id === 'settings';
  }
  if (entry.kind === 'element') {
    return entryPriority(entry) < 0;
  }
  if (entry.kind === 'item') {
    return entryPriority(entry) < 0;
  }
  return false;
}

/**
 * Splits a priority-ordered sidebar model into chrome / top / middle / bottom
 * sections. Static section dividers (`sidebar-divider:*` with priority ≤ 0)
 * are dropped so {@link AppSidebar} can insert conditional ones. The search
 * divider (priority > 0) stays in chrome. Positive-priority spacers (logo gap)
 * stay in chrome; negative-priority spacers push the bottom block down.
 */
export function classifySidebarEntries(
  entries: SidebarModelEntry[],
): ClassifiedSidebarEntries {
  const chrome: SidebarModelEntry[] = [];
  const spacers: SidebarModelEntry[] = [];
  const top: SidebarModelEntry[] = [];
  const middle: SidebarModelEntry[] = [];
  const bottom: SidebarModelEntry[] = [];

  for (const entry of entries) {
    if (isDividerElement(entry)) {
      if (entryPriority(entry) > 0) {
        chrome.push(entry);
      }
      continue;
    }
    if (isSpacerElement(entry)) {
      // Logo gap (priority > 0) stays pinned with chrome; grow spacer is bottom.
      if (entryPriority(entry) > 0) {
        chrome.push(entry);
      } else {
        spacers.push(entry);
      }
      continue;
    }
    if (entryPriority(entry) > 0) {
      chrome.push(entry);
      continue;
    }
    if (isBottomMenuEntry(entry)) {
      bottom.push(entry);
      continue;
    }
    if (isDefaultMenuEntry(entry)) {
      top.push(entry);
    } else {
      middle.push(entry);
    }
  }

  return { chrome, spacers, top, middle, bottom };
}
