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
import type { ComponentType } from 'react';
import { LogoutButton } from '../../components/LogoutButton/LogoutButton';
import { RegisterAComponentSection } from '../components/HeaderDropdownComponent/RegisterAComponentSection';
import { SoftwareTemplatesSection } from '../components/HeaderDropdownComponent/SoftwareTemplatesSection';
import { SupportButton } from '../../components/SupportButton/SupportButton';
import {
  ApplicationLauncherDropdownMountPoint,
  CreateDropdownMountPoint,
  HelpDropdownMountPoint,
  ProfileDropdownMountPoint,
} from '../types';
import { MenuItemLink } from '../../components/MenuItemLink/MenuItemLink';

export const defaultCreateDropdownMountPoints: CreateDropdownMountPoint[] = [
  {
    Component: SoftwareTemplatesSection as ComponentType,
    config: {
      priority: 200,
    },
  },
  {
    Component: RegisterAComponentSection as ComponentType,
    config: {
      priority: 100,
    },
  },
];

export const defaultProfileDropdownMountPoints: ProfileDropdownMountPoint[] = [
  {
    Component: MenuItemLink as ComponentType,
    config: {
      priority: 200,
      props: {
        title: 'Settings',
        titleKey: 'profile.settings',
        link: '/settings',
        icon: 'manageAccounts',
      },
    },
  },
  {
    Component: MenuItemLink as ComponentType,
    config: {
      priority: 150,
      props: {
        title: 'My profile',
        titleKey: 'profile.myProfile',
        icon: 'account',
        type: 'myProfile', // Semantic identifier
      },
    },
  },
  {
    Component: LogoutButton,
    config: {
      priority: 100,
    },
  },
];

export const defaultHelpDropdownMountPoints: HelpDropdownMountPoint[] = [
  {
    Component: MenuItemLink as ComponentType,
    config: {
      priority: 100,
      props: {
        title: 'Quick start',
        titleKey: 'help.quickStart',
        icon: 'quickstart',
        link: 'https://docs.redhat.com/en/documentation/red_hat_developer_hub/latest/',
      },
    },
  },
  {
    Component: SupportButton,
    config: {
      priority: 10,
    },
  },
];

export const defaultApplicationLauncherDropdownMountPoints: ApplicationLauncherDropdownMountPoint[] =
  [
    {
      Component: MenuItemLink as ComponentType,
      config: {
        section: 'applicationLauncher.sections.documentation',
        priority: 150,
        props: {
          title: 'Developer Hub',
          titleKey: 'applicationLauncher.developerHub',
          icon: 'developerHub',
          link: 'https://docs.redhat.com/en/documentation/red_hat_developer_hub',
        },
      },
    },
    {
      Component: MenuItemLink as ComponentType,
      config: {
        section: 'applicationLauncher.sections.developerTools',
        priority: 130,
        props: {
          title: 'RHDH Local',
          titleKey: 'applicationLauncher.rhdhLocal',
          icon: 'developerHub',
          link: 'https://github.com/redhat-developer/rhdh-local',
        },
      },
    },
  ];
