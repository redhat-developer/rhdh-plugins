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

import { isValidElement, useMemo } from 'react';
import {
  Sidebar,
  SidebarItem,
  SidebarSubmenu,
  SidebarSubmenuItem,
} from '@backstage/core-components';
import { iconsApiRef, useApi } from '@backstage/frontend-plugin-api';
import type { IconComponent } from '@backstage/frontend-plugin-api';
import type { NavContentNavItems } from '@backstage/plugin-app-react';
import type {
  SidebarElementData,
  SidebarItemData,
  SidebarItemGroupData,
} from '@red-hat-developer-hub/backstage-plugin-app-react';
import ExtensionIcon from '@mui/icons-material/Extension';

import {
  buildSidebarModel,
  type SidebarModelGroup,
  type SidebarModelIcon,
  type SidebarModelItem,
} from './buildSidebarModel';

/**
 * Props for {@link AppSidebar}.
 *
 * @public
 */
export interface AppSidebarProps {
  /** Items contributed via `SidebarItemBlueprint`. */
  items: SidebarItemData[];
  /** Groups contributed via `SidebarItemGroupBlueprint`. */
  groups: SidebarItemGroupData[];
  /** Custom elements contributed via `SidebarElementBlueprint`. */
  elements?: SidebarElementData[];
  /** Nav items auto-discovered by Backstage from page extensions. */
  navItems?: NavContentNavItems;
}

function useSidebarIcon(icon: SidebarModelIcon | undefined): IconComponent {
  const iconsApi = useApi(iconsApiRef);
  return useMemo<IconComponent>(() => {
    if (icon === undefined) {
      return ExtensionIcon;
    }
    if (typeof icon === 'string') {
      const element = iconsApi.icon(icon);
      return element ? () => element : ExtensionIcon;
    }
    if (isValidElement(icon)) {
      const element = icon;
      return () => element;
    }
    return icon as IconComponent;
  }, [icon, iconsApi]);
}

function SidebarModelItemEntry({ item }: { item: SidebarModelItem }) {
  const icon = useSidebarIcon(item.icon);
  if (item.to) {
    return (
      <SidebarItem
        icon={icon}
        text={item.title}
        to={item.to}
        onClick={item.onClick}
      />
    );
  }
  return (
    <SidebarItem
      icon={icon}
      text={item.title}
      onClick={() => item.onClick?.()}
    />
  );
}

function SidebarModelSubmenuItem({ item }: { item: SidebarModelItem }) {
  const icon = useSidebarIcon(item.icon);
  return <SidebarSubmenuItem title={item.title} to={item.to} icon={icon} />;
}

function SidebarModelGroupEntry({ group }: { group: SidebarModelGroup }) {
  const icon = useSidebarIcon(group.icon);
  if (group.items.length === 0) {
    if (!group.to) {
      return null;
    }
    return <SidebarItem icon={icon} text={group.title} to={group.to} />;
  }
  return (
    <SidebarItem icon={icon} text={group.title} to={group.to}>
      <SidebarSubmenu title={group.title}>
        {group.items.map(item => (
          <SidebarModelSubmenuItem key={item.id} item={item} />
        ))}
      </SidebarSubmenu>
    </SidebarItem>
  );
}

/**
 * Sidebar that renders contributed items, groups and custom elements ordered
 * by priority (higher first, ties broken by title). Grouped items render in a
 * submenu, custom elements render their own component at the top level, and
 * nav items auto-discovered from page extensions are merged in unless a
 * contributed item already links to the same path.
 *
 * @public
 */
export const AppSidebar = ({
  items,
  groups,
  elements,
  navItems,
}: AppSidebarProps) => {
  const entries = buildSidebarModel({
    items,
    groups,
    elements,
    navItems: navItems?.rest(),
  });

  return (
    <Sidebar>
      {entries.map(entry => {
        switch (entry.kind) {
          case 'item':
            return (
              <SidebarModelItemEntry key={entry.item.id} item={entry.item} />
            );
          case 'group':
            return (
              <SidebarModelGroupEntry
                key={entry.group.id}
                group={entry.group}
              />
            );
          case 'element': {
            const Element = entry.element.component;
            return <Element key={entry.element.id} />;
          }
          default:
            return null;
        }
      })}
    </Sidebar>
  );
};
