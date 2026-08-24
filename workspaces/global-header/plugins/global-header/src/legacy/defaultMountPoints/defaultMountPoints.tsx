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
import { ProfileDropdown } from '../components/HeaderDropdownComponent/ProfileDropdown';
import { SearchComponent } from '../../components/SearchComponent/SearchComponent';
import { HeaderIconButton } from '../../components/HeaderIconButton/HeaderIconButton';
import { GlobalHeaderComponentMountPoint } from '../types';
import { NotificationButton } from '../../components/NotificationButton/NotificationButton';
import { Divider } from '../../components/Divider/Divider';
import { Spacer } from '../../components/Spacer/Spacer';
import { StarredDropdown } from '../../components/HeaderDropdownComponent/StarredDropdown';
import { ApplicationLauncherDropdown } from '../components/HeaderDropdownComponent/ApplicationLauncherDropdown';
import { CompanyLogo } from '../../components/CompanyLogo/CompanyLogo';
import { HelpDropdown } from '../components/HeaderDropdownComponent/HelpDropdown';

export {
  defaultApplicationLauncherDropdownMountPoints,
  defaultCreateDropdownMountPoints,
  defaultHelpDropdownMountPoints,
  defaultProfileDropdownMountPoints,
} from './defaultDropdownMountPoints';

/**
 * default Global Header Components mount points
 *
 * @public
 */
export const defaultGlobalHeaderComponentsMountPoints: GlobalHeaderComponentMountPoint[] =
  [
    {
      Component: CompanyLogo,
      config: {
        priority: 200,
        props: {
          to: '/catalog',
        },
      },
    },
    {
      Component: SearchComponent,
      config: {
        priority: 100, // the greater the number, the more to the left it will be
      },
    },
    {
      Component: Spacer,
      config: {
        priority: 99, // the greater the number, the more to the left it will be
        props: {
          growFactor: 0,
        },
      },
    },
    {
      Component: HeaderIconButton as ComponentType,
      config: {
        priority: 90,
        props: {
          title: 'Self-service',
          titleKey: 'create.title',
          icon: 'addCircleOutline',
          to: '/create',
        },
      },
    },
    {
      Component: StarredDropdown,
      config: {
        priority: 85,
      },
    },
    {
      Component: ApplicationLauncherDropdown,
      config: {
        priority: 82,
      },
    },
    {
      Component: HelpDropdown,
      config: {
        priority: 80,
      },
    },
    {
      Component: NotificationButton,
      config: {
        priority: 70,
      },
    },
    {
      Component: Divider,
      config: {
        priority: 50,
      },
    },
    {
      Component: ProfileDropdown,
      config: {
        priority: 10, // the greater the number, the more to the left it will be
      },
    },
  ];
