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
} from '@backstage/core-components';
import { NavContentBlueprint } from '@backstage/plugin-app-react';
import { SidebarLogo } from './SidebarLogo';
import CategoryIcon from '@mui/icons-material/Category';
import MenuIcon from '@mui/icons-material/Menu';
import GroupIcon from '@mui/icons-material/People';
import SearchIcon from '@mui/icons-material/Search';
import { MyGroupsSidebarItem } from '@backstage/plugin-org';
import { SidebarSearchModal } from '@backstage/plugin-search';
import type { IconComponent } from '@backstage/core-plugin-api';
import {
  UserSettingsSignInAvatar,
  Settings as SidebarSettings,
} from '@backstage/plugin-user-settings';

type NavItem = { to: string; text: string; icon: IconComponent; title: string };

/** Main nav order: Catalog, My Groups, APIs, Docs, Create, RBAC */
const MAIN_NAV_ORDER: Array<{
  match: (path: string) => boolean;
  order: number;
}> = [
  { match: p => p.includes('/catalog'), order: 1 },
  { match: p => p.includes('scorecard') || p.includes('my-groups'), order: 2 },
  { match: p => p.includes('/api-docs'), order: 3 },
  { match: p => p.includes('/docs') && !p.includes('/api-docs'), order: 4 },
  { match: p => p.includes('/create') || p.includes('/scaffolder'), order: 5 },
  { match: p => p.includes('/rbac'), order: 6 },
];

function mainNavOrder(path: string): number {
  const found = MAIN_NAV_ORDER.find(({ match }) => match(path));
  return found !== undefined ? found.order : 99;
}

function splitNavItems(items: NavItem[]) {
  const headerItems = items.filter(item => item.to.includes('/search'));
  const footerItems = items.filter(item => item.to.includes('/settings'));
  const mainCandidates = items.filter(
    item => !item.to.includes('/search') && !item.to.includes('/settings'),
  );
  const mainItems = [...mainCandidates].sort(
    (a, b) => mainNavOrder(a.to) - mainNavOrder(b.to),
  );
  return { headerItems, mainItems, footerItems };
}

export const SidebarContent = NavContentBlueprint.make({
  params: {
    component: ({ items }) => {
      const { headerItems, mainItems, footerItems } = splitNavItems(
        items as NavItem[],
      );
      const mainWithoutMyGroups = mainItems.filter(
        item =>
          !item.to.includes('my-groups') &&
          item.text?.toLowerCase() !== 'my groups' &&
          item.title?.toLowerCase() !== 'my groups',
      );
      return (
        <Sidebar>
          <SidebarLogo />
          {headerItems.length > 0 && (
            <>
              <SidebarGroup label="Search" icon={<SearchIcon />}>
                <SidebarSearchModal />
              </SidebarGroup>
              <SidebarDivider />
            </>
          )}
          <SidebarGroup label="Menu" icon={<MenuIcon />}>
            <SidebarScrollWrapper>
              {mainWithoutMyGroups.length === 0 ? (
                <MyGroupsSidebarItem
                  singularTitle="My Group"
                  pluralTitle="My Groups"
                  icon={GroupIcon}
                />
              ) : (
                mainWithoutMyGroups.map((item, index) => (
                  <Fragment key={`main-${index}`}>
                    <SidebarItem
                      to={item.to}
                      text={item.text}
                      title={item.title}
                      icon={
                        item.to.includes('/catalog') ? CategoryIcon : item.icon
                      }
                    />
                    {index === 0 && (
                      <MyGroupsSidebarItem
                        singularTitle="My Group"
                        pluralTitle="My Groups"
                        icon={GroupIcon}
                      />
                    )}
                  </Fragment>
                ))
              )}
            </SidebarScrollWrapper>
          </SidebarGroup>
          <SidebarSpace />
          {footerItems.length > 0 && (
            <>
              <SidebarDivider />
              <SidebarGroup
                label="Settings"
                icon={<UserSettingsSignInAvatar />}
              >
                <SidebarSettings />
              </SidebarGroup>
            </>
          )}
        </Sidebar>
      );
    },
  },
});
