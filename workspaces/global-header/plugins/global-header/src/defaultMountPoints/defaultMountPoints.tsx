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
import { LogoutButton } from '../components/LogoutButton/LogoutButton';
import { CreateDropdown } from '../components/HeaderDropdownComponent/CreateDropdown';
import { ProfileDropdown } from '../components/HeaderDropdownComponent/ProfileDropdown';
import { RegisterAComponentSection } from '../components/HeaderDropdownComponent/RegisterAComponentSection';
import { SoftwareTemplatesSection } from '../components/HeaderDropdownComponent/SoftwareTemplatesSection';
import { SearchComponent } from '../components/SearchComponent/SearchComponent';
import { SupportButton } from '../components/SupportButton/SupportButton';
import {
  ComponentType,
  CreateDropdownMountPoint,
  GlobalHeaderComponentMountPoint,
  ProfileDropdownMountPoint,
} from '../types';
import { NotificationButton } from '../components/NotificationButton/NotificationButton';
import { Divider } from '../components/Divider/Divider';
import { MenuItemLink } from '../components/MenuItemLink/MenuItemLink';

/**
 * default Global Header Components mount points
 *
 * @public
 */
export const defaultGlobalHeaderComponentsMountPoints: GlobalHeaderComponentMountPoint[] =
  [
    {
      Component: SearchComponent,
      config: {
        type: ComponentType.SEARCH,
        priority: 1000, // the greater the number, the more to the left it will be
      },
    },
    {
      Component: CreateDropdown,
      config: {
        priority: 900,
      },
    },
    {
      Component: SupportButton,
      config: {
        priority: 800,
      },
    },
    {
      Component: NotificationButton,
      config: {
        priority: 700,
      },
    },
    {
      Component: Divider,
      config: {
        priority: 200,
      },
    },
    {
      Component: ProfileDropdown,
      config: {
        priority: 100, // the greater the number, the more to the left it will be
      },
    },
  ];

export const defaultCreateDropdownMountPoints: CreateDropdownMountPoint[] = [
  {
    Component: SoftwareTemplatesSection as React.ComponentType,
    config: {
      type: ComponentType.LIST,
      priority: 200,
    },
  },
  {
    Component: RegisterAComponentSection as React.ComponentType,
    config: {
      type: ComponentType.LINK,
      priority: 100,
    },
  },
];

export const defaultProfileDropdownMountPoints: ProfileDropdownMountPoint[] = [
  {
    Component: MenuItemLink as React.ComponentType,
    config: {
      type: ComponentType.LINK,
      priority: 200,
      props: {
        title: 'Settings',
        icon: 'manageAccounts',
        link: '/settings',
      },
    },
  },
  {
    Component: LogoutButton,
    config: {
      type: ComponentType.LOGOUT,
      priority: 100,
    },
  },
];
