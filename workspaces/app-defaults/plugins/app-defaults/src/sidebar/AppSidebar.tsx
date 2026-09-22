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

import { isValidElement, useEffect, useMemo, useState } from 'react';
import { useLocation } from 'react-router-dom';
import {
  ErrorBoundary,
  Sidebar,
  SidebarItem,
  SidebarScrollWrapper,
  SidebarSubmenu,
  SidebarSubmenuItem,
  useSidebarOpenState,
} from '@backstage/core-components';
import {
  iconsApiRef,
  useApi,
  useTranslationRef,
} from '@backstage/frontend-plugin-api';
import type { IconComponent } from '@backstage/frontend-plugin-api';
import type { NavContentNavItems } from '@backstage/plugin-app-react';
import {
  appReactTranslationRef,
  type SidebarElementData,
  type SidebarItemData,
  type SidebarItemGroupData,
} from '@red-hat-developer-hub/backstage-plugin-app-react';
import Box from '@mui/material/Box';
import Collapse from '@mui/material/Collapse';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
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

/**
 * Returns a function that localizes a sidebar title. Titles are looked up
 * dynamically under the `pages.<title>` keys of the app-react translations
 * (keyed by the English title); unknown titles — including those contributed
 * by plugins we do not know about — fall through unchanged. i18next uses `.`
 * as its key separator, so any dot in the title is replaced with `_`.
 */
function useTranslateTitle(): (title: string) => string {
  const { t } = useTranslationRef(appReactTranslationRef);
  return useMemo(() => {
    const translate = t as unknown as (
      key: string,
      options: { defaultValue: string },
    ) => string;
    return (title: string) =>
      translate(`pages.${title.replaceAll('.', '_')}`, {
        defaultValue: title,
      });
  }, [t]);
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
  const translate = useTranslateTitle();
  const text = translate(item.title);
  if (item.to) {
    return (
      <SidebarItem
        icon={icon}
        text={text}
        to={item.to}
        onClick={item.onClick}
      />
    );
  }
  return (
    <SidebarItem icon={icon} text={text} onClick={() => item.onClick?.()} />
  );
}

function SidebarModelSubmenuItem({ item }: { item: SidebarModelItem }) {
  const icon = useSidebarIcon(item.icon);
  const translate = useTranslateTitle();
  return (
    <SidebarSubmenuItem
      title={translate(item.title)}
      to={item.to}
      icon={icon}
    />
  );
}

function isActivePath(pathname: string, to: string | undefined): boolean {
  if (!to) {
    return false;
  }
  if (to === '/') {
    return pathname === '/';
  }
  return pathname === to || pathname.startsWith(`${to}/`);
}

function SidebarModelInlineGroup({ group }: { group: SidebarModelGroup }) {
  const icon = useSidebarIcon(group.icon);
  const translate = useTranslateTitle();
  const title = translate(group.title);
  const { pathname } = useLocation();
  const { isOpen: isSidebarOpen } = useSidebarOpenState();
  const hasActiveItem = group.items.some(item =>
    isActivePath(pathname, item.to),
  );
  const [expanded, setExpanded] = useState(hasActiveItem);
  useEffect(() => {
    if (hasActiveItem) {
      setExpanded(true);
    }
  }, [hasActiveItem]);

  const toggle = () => setExpanded(value => !value);
  const arrow = expanded ? (
    <ExpandLessIcon fontSize="small" />
  ) : (
    <ExpandMoreIcon fontSize="small" />
  );

  return (
    <>
      {group.to ? (
        <SidebarItem icon={icon} text={title} to={group.to} onClick={toggle}>
          {arrow}
        </SidebarItem>
      ) : (
        <SidebarItem icon={icon} text={title} onClick={toggle}>
          {arrow}
        </SidebarItem>
      )}
      <Collapse in={expanded} unmountOnExit>
        <Box sx={{ pl: isSidebarOpen ? 2 : 0 }}>
          {group.items.map(item => (
            <SidebarModelItemEntry key={item.id} item={item} />
          ))}
        </Box>
      </Collapse>
    </>
  );
}

function SidebarModelFlyoutGroup({ group }: { group: SidebarModelGroup }) {
  const icon = useSidebarIcon(group.icon);
  const translate = useTranslateTitle();
  const title = translate(group.title);
  return (
    <SidebarItem icon={icon} text={title} to={group.to}>
      <SidebarSubmenu title={title}>
        {group.items.map(item => (
          <SidebarModelSubmenuItem key={item.id} item={item} />
        ))}
      </SidebarSubmenu>
    </SidebarItem>
  );
}

function SidebarModelGroupEntry({ group }: { group: SidebarModelGroup }) {
  const icon = useSidebarIcon(group.icon);
  const translate = useTranslateTitle();
  if (group.items.length === 0) {
    if (!group.to) {
      return null;
    }
    return (
      <SidebarItem icon={icon} text={translate(group.title)} to={group.to} />
    );
  }
  if (group.variant === 'flyout') {
    return <SidebarModelFlyoutGroup group={group} />;
  }
  return <SidebarModelInlineGroup group={group} />;
}

/**
 * Sidebar that renders contributed items, groups and custom elements ordered
 * by priority (higher first, ties broken by title). Grouped items render in a
 * collapsible list below the group entry or in a flyout submenu, custom
 * elements render their own component at the top level, and
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

  const renderEntry = (entry: (typeof entries)[number]) => {
    switch (entry.kind) {
      case 'item':
        return <SidebarModelItemEntry key={entry.item.id} item={entry.item} />;
      case 'group':
        return (
          <SidebarModelGroupEntry key={entry.group.id} group={entry.group} />
        );
      case 'element': {
        const Element = entry.element.component;
        return (
          <ErrorBoundary key={entry.element.id}>
            <Element />
          </ErrorBoundary>
        );
      }
      default:
        return null;
    }
  };

  // Entries are ordered by priority (higher first). Positive-priority entries
  // (logo, search) stay pinned above the scroll wrapper and negative-priority
  // entries (notifications, the Administration and Settings groups, and the
  // spacer that pushes them down) stay pinned below it. The main menu items at
  // the default priority scroll independently inside the wrapper.
  const entryPriority = (entry: (typeof entries)[number]) => {
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
  };
  const topEntries = entries.filter(entry => entryPriority(entry) > 0);
  const mainEntries = entries.filter(entry => entryPriority(entry) === 0);
  const bottomEntries = entries.filter(entry => entryPriority(entry) < 0);

  return (
    <Sidebar>
      {topEntries.map(renderEntry)}
      <SidebarScrollWrapper>
        {mainEntries.map(renderEntry)}
      </SidebarScrollWrapper>
      {bottomEntries.map(renderEntry)}
    </Sidebar>
  );
};
