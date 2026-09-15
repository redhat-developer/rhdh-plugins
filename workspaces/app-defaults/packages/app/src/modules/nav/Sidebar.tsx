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
  SidebarGroup,
  SidebarItem,
  SidebarScrollWrapper,
  SidebarSpace,
} from '@backstage/core-components';
import { useTranslationRef } from '@backstage/frontend-plugin-api';
import {
  NavContentBlueprint,
  type NavContentComponentProps,
  type NavContentNavItem,
} from '@backstage/plugin-app-react';
import { SidebarSearchModal } from '@backstage/plugin-search';
import { UserSettingsSignInAvatar } from '@backstage/plugin-user-settings';
import { NotificationsSidebarItem } from '@backstage/plugin-notifications';
import { useAppDrawer } from '@red-hat-developer-hub/backstage-plugin-app-react';
import { translationRef } from '@red-hat-developer-hub/backstage-plugin-app-defaults';
import BookmarksIcon from '@mui/icons-material/Bookmarks';
import ChatIcon from '@mui/icons-material/Chat';
import MenuIcon from '@mui/icons-material/Menu';
import SearchIcon from '@mui/icons-material/Search';

import { SidebarLogo } from './SidebarLogo';

const LEARNING_PATHS_PAGE_ID = 'page:app/learning-paths';
const API_DOCS_PAGE_ID = 'page:api-docs';

const ChatDrawerItem = () => {
  const { toggleDrawer } = useAppDrawer();
  return (
    <SidebarItem
      icon={() => <ChatIcon />}
      text="Chat"
      onClick={() => toggleDrawer('demo-chat')}
    />
  );
};

const NavSidebarItem = ({
  item,
  text,
}: {
  item: NavContentNavItem;
  text: string;
}) => (
  <SidebarItem icon={() => item.icon} to={item.href} text={text} />
);

const AppSidebarNav = ({ navItems }: NavContentComponentProps) => {
  const { t } = useTranslationRef(translationRef);

  const getNavItemText = (item: NavContentNavItem) =>
    item.href === '/learning-paths' ? t('menuItem.learningPaths') : item.title;

  const nav = navItems.withComponent(item => (
    <NavSidebarItem item={item} text={getNavItemText(item)} />
  ));

  nav.take('page:search');

  const referencesItems = [
    nav.take(API_DOCS_PAGE_ID),
    nav.take(LEARNING_PATHS_PAGE_ID),
  ].filter(Boolean);

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
        {referencesItems.length > 0 && (
          <>
            <SidebarGroup
              label={t('references.title')}
              icon={<BookmarksIcon />}
            >
              {referencesItems}
            </SidebarGroup>
            <SidebarDivider />
          </>
        )}
        <SidebarScrollWrapper>
          {nav.rest({ sortBy: 'title' })}
        </SidebarScrollWrapper>
      </SidebarGroup>
      <SidebarSpace />
      <SidebarDivider />
      <ChatDrawerItem />
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
};

export const SidebarContent: ReturnType<typeof NavContentBlueprint.make> =
  NavContentBlueprint.make({
    params: {
      component: props => <AppSidebarNav {...props} />,
    },
  });
