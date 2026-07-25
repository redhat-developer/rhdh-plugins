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
  Sidebar,
  SidebarDivider,
  SidebarItem,
  SidebarScrollWrapper,
  SidebarSpace,
} from '@backstage/core-components';
import type { NavContentNavItems } from '@backstage/plugin-app-react';

import type { AppSidebarItem } from '../types';

/**
 * Props for {@link ApplicationSidebar}.
 *
 * @public
 */
export interface ApplicationSidebarProps {
  /** Navigation items provided by the Backstage extension system. */
  navItems: NavContentNavItems;
  /** Extra sidebar items contributed by plugins via AppSidebarItemBlueprint. */
  items: AppSidebarItem[];
}

function SidebarContributedItem({ item }: { item: AppSidebarItem }) {
  const Icon = item.icon;
  const iconFn = () => <Icon />;
  if (item.to) {
    return <SidebarItem icon={iconFn} to={item.to} text={item.title} />;
  }
  return <SidebarItem icon={iconFn} text={item.title} onClick={() => {}} />;
}

/**
 * Default sidebar component that renders Backstage nav items alongside
 * plugin-contributed sidebar items in a standard layout.
 *
 * Nav items from the extension system are rendered as standard
 * `SidebarItem` links. Extra items from `AppSidebarItemBlueprint`
 * are sorted by priority (descending) and placed below a divider.
 *
 * @public
 */
export const ApplicationSidebar = ({
  navItems,
  items,
}: ApplicationSidebarProps) => {
  const sortedItems = [...items].sort(
    (a, b) => (b.priority ?? 0) - (a.priority ?? 0),
  );

  const nav = navItems.withComponent(item => (
    <SidebarItem icon={() => item.icon} to={item.href} text={item.title} />
  ));

  return (
    <Sidebar>
      <SidebarScrollWrapper>
        {nav.rest({ sortBy: 'title' })}
      </SidebarScrollWrapper>
      {sortedItems.length > 0 && (
        <>
          <SidebarSpace />
          <SidebarDivider />
          {sortedItems.map(item => (
            <SidebarContributedItem key={item.id} item={item} />
          ))}
        </>
      )}
    </Sidebar>
  );
};
