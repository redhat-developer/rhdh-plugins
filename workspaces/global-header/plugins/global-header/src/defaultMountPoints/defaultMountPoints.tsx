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
import { LogoutButton } from '../components/HeaderButtonComponent/LogoutButton';
import { CreateDropdown } from '../components/HeaderDropdownComponent/CreateDropdown';
import { ProfileDropdown } from '../components/HeaderDropdownComponent/ProfileDropdown';
import { RegisterAComponentSection } from '../components/HeaderDropdownComponent/RegisterAComponentSection';
import { SoftwareTemplatesSection } from '../components/HeaderDropdownComponent/SoftwareTemplatesSection';
import { HeaderIconButton } from '../components/HeaderIconButtonComponent/HeaderIconButton';
import { HeaderLink } from '../components/HeaderLinkComponent/HeaderLink';
import { SearchComponent } from '../components/SearchComponent/SearchComponent';
import { ComponentType, Slot } from '../types';

/**
 * default Global Header Components mount points
 *
 * @public
 */
export const defaultGlobalHeaderComponentsMountPoints = [
  {
    Component: SearchComponent,
    config: {
      type: ComponentType.SEARCH,
      slot: Slot.HEADER_START,
      priority: 100, // the greater the number, the more to the left it will be
    },
  },
  {
    Component: CreateDropdown as React.ComponentType,
    config: {
      type: ComponentType.DROPDOWN_BUTTON,
      slot: Slot.HEADER_START,
      priority: 90,
      key: 'create',
    },
  },
  {
    Component: HeaderIconButton as React.ComponentType,
    config: {
      type: ComponentType.ICON_BUTTON,
      slot: Slot.HEADER_START,
      priority: 80,
      props: {
        icon: 'support',
        tooltip: 'Support (external site)',
        to: 'https://developers.redhat.com/rhdh/overview',
      },
    },
  },
  {
    Component: HeaderIconButton as React.ComponentType,
    config: {
      type: ComponentType.ICON_BUTTON,
      slot: Slot.HEADER_START,
      priority: 70,
      props: {
        icon: 'notifications',
        tooltip: 'Notifications',
        to: '/notifications',
      },
    },
  },
  {
    Component: ProfileDropdown as React.ComponentType,
    config: {
      type: ComponentType.DROPDOWN_BUTTON,
      slot: Slot.HEADER_END,
      priority: 0, // the greater the number, the more to the left it will be
      key: 'profile',
    },
  },
];

export const defaultCreateDropdownMountPoints = [
  {
    Component: SoftwareTemplatesSection as React.ComponentType,
    config: {
      type: ComponentType.LIST,
      priority: 10,
    },
  },
  {
    Component: RegisterAComponentSection as React.ComponentType,
    config: {
      type: ComponentType.LINK,
      priority: 0,
    },
  },
];

export const defaultProfileDropdownMountPoints = [
  {
    Component: HeaderLink as React.ComponentType,
    config: {
      type: ComponentType.LINK,
      priority: 10,
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
      priority: 0,
    },
  },
];
