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
import { Fragment } from 'react';
import {
  Sidebar,
  SidebarDivider,
  SidebarGroup,
  SidebarItem,
  SidebarScrollWrapper,
  SidebarSpace,
  SidebarSubmenu,
  SidebarSubmenuItem,
} from '@backstage/core-components';
import { NavContentBlueprint } from '@backstage/plugin-app-react';
import { SidebarLogo } from './SidebarLogo';
import { useSidebarItems } from './SidebarItemsContext';
// eslint-disable-next-line no-restricted-imports
import MenuIcon from '@material-ui/icons';
// eslint-disable-next-line no-restricted-imports
import SearchIcon from '@material-ui/icons';
import { SidebarSearchModal } from '@backstage/plugin-search';
import { UserSettingsSignInAvatar } from '@backstage/plugin-user-settings';
import { NotificationsSidebarItem } from '@backstage/plugin-notifications';

import type { AppSidebarGroup } from './extensions/AppSidebarGroup';
import type { AppSidebarItem } from './extensions/AppSidebarItem';

function SidebarNavItem({ item }: { item: AppSidebarItem }) {
  if (item.element) {
    return item.element;
  }
  if (item.href) {
    return (
      <SidebarItem
        icon={item.icon ?? (() => null)}
        to={item.href}
        text={item.title}
      />
    );
  }
  return null;
}

function SidebarNavGroup({ group }: { group: AppSidebarGroup }) {
  const sortedChildren = [...group.children].sort(
    (a, b) => (b.priority ?? 0) - (a.priority ?? 0),
  );

  return (
    <SidebarItem icon={group.icon ?? (() => null)} text={group.title}>
      <SidebarSubmenu title={group.title}>
        {sortedChildren.map(child =>
          child.element ? (
            <Fragment key={child.id}>{child.element}</Fragment>
          ) : (
            <SidebarSubmenuItem
              key={child.id}
              title={child.title}
              to={child.href ?? ''}
              icon={child.icon}
            />
          ),
        )}
      </SidebarSubmenu>
    </SidebarItem>
  );
}

function ContributedSidebarItems() {
  const { items, groups } = useSidebarItems();

  const sortedItems = [...items].sort(
    (a, b) => (b.priority ?? 0) - (a.priority ?? 0),
  );
  const sortedGroups = [...groups].sort(
    (a, b) => (b.priority ?? 0) - (a.priority ?? 0),
  );

  return (
    <>
      {sortedGroups.map(group => (
        <SidebarNavGroup key={group.id} group={group} />
      ))}
      {sortedItems.map(item => (
        <SidebarNavItem key={item.id} item={item} />
      ))}
    </>
  );
}

export const SidebarContent = NavContentBlueprint.make({
  params: {
    component: ({ navItems }) => {
      const nav = navItems.withComponent(item => (
        <SidebarItem icon={() => item.icon} to={item.href} text={item.title} />
      ));

      // Skipped items
      nav.take('page:search'); // Using search modal instead

      return (
        <Sidebar>
          <SidebarLogo />
          <SidebarGroup label="Search" icon={<SearchIcon />} to="/search">
            <SidebarSearchModal />
          </SidebarGroup>
          <SidebarDivider />
          <SidebarGroup label="Menu" icon={<MenuIcon />}>
            {nav.take('page:catalog')}
            {nav.take('page:scaffolder')}
            <SidebarDivider />
            <SidebarScrollWrapper>
              {nav.rest({ sortBy: 'title' })}
              <ContributedSidebarItems />
            </SidebarScrollWrapper>
          </SidebarGroup>
          <SidebarSpace />
          <SidebarDivider />
          <NotificationsSidebarItem />
          <SidebarDivider />
          <SidebarGroup
            label="Settings"
            icon={<UserSettingsSignInAvatar />}
            to="/settings"
          >
            {nav.take('page:app-visualizer')}
            {nav.take('page:user-settings')}
          </SidebarGroup>
        </Sidebar>
      );
    },
  },
});
