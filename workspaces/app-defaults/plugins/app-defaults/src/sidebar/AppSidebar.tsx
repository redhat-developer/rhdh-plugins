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
  SidebarDivider,
  SidebarItem,
  SidebarSubmenu,
  SidebarSubmenuItem,
  useSidebarOpenState,
} from '@backstage/core-components';
import {
  configApiRef,
  iconsApiRef,
  useApi,
} from '@backstage/frontend-plugin-api';
import type { IconComponent } from '@backstage/frontend-plugin-api';
import type { NavContentNavItems } from '@backstage/plugin-app-react';
import { usePermission } from '@backstage/plugin-permission-react';
import { policyEntityCreatePermission } from '@backstage-community/plugin-rbac-common';
import type {
  SidebarElementData,
  SidebarItemData,
  SidebarItemGroupData,
} from '@red-hat-developer-hub/backstage-plugin-app-react';
import Box from '@mui/material/Box';
import Collapse from '@mui/material/Collapse';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ExtensionIcon from '@mui/icons-material/Extension';

import {
  buildSidebarModel,
  type SidebarModelEntry,
  type SidebarModelGroup,
  type SidebarModelIcon,
  type SidebarModelItem,
} from './buildSidebarModel';
import { classifySidebarEntries } from './classifySidebarEntries';
import {
  readConfigSidebarGroups,
  readConfigSidebarItems,
} from './readSidebarConfig';
import { SIDEBAR_MASTHEAD_OFFSET_CSS } from './sidebarMastheadOffset';
import { useHasGlobalHeader } from './useHasGlobalHeader';
import { useTranslateTitle } from '../pageLayout/useTranslateTitle';

const GLOBAL_HEADER_HEIGHT_VAR = '--rhdh-global-header-height';

function isLogoChromeEntry(entry: SidebarModelEntry): boolean {
  return (
    entry.kind === 'element' &&
    (entry.element.id === 'sidebar-element:app/logo' ||
      entry.element.id === 'sidebar-spacer:app/logo')
  );
}

function isSearchChromeEntry(entry: SidebarModelEntry): boolean {
  return (
    entry.kind === 'element' &&
    (entry.element.id === 'sidebar-element:app/search' ||
      entry.element.id === 'sidebar-divider:app/search')
  );
}

/**
 * Keeps Search (+ its divider) immediately below the logo chrome, ahead of
 * any other positive-priority contributions.
 */
function orderChromeEntries(entries: SidebarModelEntry[]): SidebarModelEntry[] {
  const logo: SidebarModelEntry[] = [];
  const search: SidebarModelEntry[] = [];
  const rest: SidebarModelEntry[] = [];
  for (const entry of entries) {
    if (isLogoChromeEntry(entry)) {
      logo.push(entry);
    } else if (isSearchChromeEntry(entry)) {
      search.push(entry);
    } else {
      rest.push(entry);
    }
  }
  return [...logo, ...search, ...rest];
}

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
  const translate = useTranslateTitle('pages');
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
  const translate = useTranslateTitle('pages');
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
  const translate = useTranslateTitle('pages');
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
  const translate = useTranslateTitle('pages');
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
  const translate = useTranslateTitle('pages');
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
 * Sidebar that renders contributed items, groups and custom elements in three
 * menu sections (default / optional plugins / admin+settings), ordered by
 * priority within each section. Grouped items render in a collapsible list
 * below the group entry or in a flyout submenu, custom elements render their
 * own component, and nav items auto-discovered from page extensions are merged
 * in unless a contributed item already links to the same path.
 *
 * Default (top) vs optional (middle) placement uses an allowlist of built-in
 * paths. A divider is shown between top and middle only when the middle
 * section has entries, and between the scroll area and the bottom block only
 * when the bottom block has visible entries.
 *
 * Administration is shown only when the user has admin permission and the
 * group still has visible children. Settings and the company logo are hidden
 * by default when the global header is present (settings live in the header
 * user menu; the masthead already shows the logo) and can be forced on or off
 * with `app.sidebar.settings` and `app.sidebar.logo`.
 *
 * Items and groups declared under `app.sidebar` in `app-config.yaml` are
 * merged into the same model, so deployers can add entries without writing a
 * plugin. They are appended after the contributed ones, which lets a
 * configured group override a contributed group with the same `id`.
 *
 * @public
 */
export const AppSidebar = ({
  items,
  groups,
  elements,
  navItems,
}: AppSidebarProps) => {
  const configApi = useApi(configApiRef);
  const configItems = useMemo(
    () => readConfigSidebarItems(configApi),
    [configApi],
  );
  const configGroups = useMemo(
    () => readConfigSidebarGroups(configApi),
    [configApi],
  );
  const hasGlobalHeader = useHasGlobalHeader();
  const settingsConfig = configApi.getOptionalBoolean('app.sidebar.settings');
  const showSettings = settingsConfig ?? !hasGlobalHeader;
  const logoConfig = configApi.getOptionalBoolean('app.sidebar.logo');
  const showLogo = logoConfig ?? !hasGlobalHeader;

  const { loading: adminPermissionLoading, allowed: canShowAdministration } =
    usePermission({
      permission: policyEntityCreatePermission,
      resourceRef: undefined,
    });

  const entries = buildSidebarModel({
    items: [...items, ...configItems],
    groups: [...groups, ...configGroups],
    elements,
    navItems: navItems?.rest(),
  });

  const { chrome, spacers, top, middle, bottom } = useMemo(
    () => classifySidebarEntries(entries),
    [entries],
  );

  const visibleChrome = useMemo(
    () =>
      orderChromeEntries(
        showLogo ? chrome : chrome.filter(entry => !isLogoChromeEntry(entry)),
      ),
    [chrome, showLogo],
  );

  const visibleSpacers = useMemo(
    () =>
      showLogo ? spacers : spacers.filter(entry => !isLogoChromeEntry(entry)),
    [spacers, showLogo],
  );

  useEffect(() => {
    if (!hasGlobalHeader) {
      document.documentElement.style.removeProperty(GLOBAL_HEADER_HEIGHT_VAR);
      return undefined;
    }

    const header = document.getElementById('global-header');
    if (!header) {
      return undefined;
    }

    const publishHeight = () => {
      const height = Math.round(header.getBoundingClientRect().height);
      document.documentElement.style.setProperty(
        GLOBAL_HEADER_HEIGHT_VAR,
        `${height}px`,
      );
    };

    publishHeight();

    if (typeof ResizeObserver === 'undefined') {
      return () => {
        document.documentElement.style.removeProperty(GLOBAL_HEADER_HEIGHT_VAR);
      };
    }

    const observer = new ResizeObserver(publishHeight);
    observer.observe(header);
    return () => {
      observer.disconnect();
      document.documentElement.style.removeProperty(GLOBAL_HEADER_HEIGHT_VAR);
    };
  }, [hasGlobalHeader]);

  const visibleBottom = useMemo(
    () =>
      bottom.filter(entry => {
        if (entry.kind === 'group' && entry.group.id === 'settings') {
          return showSettings;
        }
        if (entry.kind === 'group' && entry.group.id === 'admin') {
          return (
            !adminPermissionLoading &&
            canShowAdministration &&
            entry.group.items.length > 0
          );
        }
        return true;
      }),
    [bottom, showSettings, adminPermissionLoading, canShowAdministration],
  );

  const renderEntry = (entry: SidebarModelEntry) => {
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

  return (
    <>
      {hasGlobalHeader ? (
        <style data-rhdh-sidebar-masthead-offset="">
          {SIDEBAR_MASTHEAD_OFFSET_CSS}
        </style>
      ) : null}
      <Sidebar>
        {visibleChrome.map(renderEntry)}
        {/*
          Custom scroller instead of Backstage SidebarScrollWrapper, which
          toggles overflow on hover and shifts items when the classic
          scrollbar appears. scrollbar-gutter: stable keeps alignment fixed.
        */}
        <Box
          data-testid="sidebar-menu-scroll"
          sx={{
            flex: '0 1 auto',
            minHeight: '48px',
            width: '100%',
            overflowX: 'hidden',
            overflowY: 'auto',
            scrollbarGutter: 'stable',
          }}
        >
          {top.map(renderEntry)}
          {middle.length > 0 && top.length > 0 ? <SidebarDivider /> : null}
          {middle.map(renderEntry)}
        </Box>
        {visibleSpacers.map(renderEntry)}
        {visibleBottom.length > 0 ? <SidebarDivider /> : null}
        {visibleBottom.map(renderEntry)}
      </Sidebar>
    </>
  );
};
