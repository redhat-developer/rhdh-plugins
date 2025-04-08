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
  ApplicationLauncherDropdownMountPoint,
  CreateDropdownMountPoint,
  GlobalHeaderComponentMountPoint,
  ProfileDropdownMountPoint,
} from '../types';
import { NotificationButton } from '../components/NotificationButton/NotificationButton';
import { Divider } from '../components/Divider/Divider';
import { MenuItemLink } from '../components/MenuItemLink/MenuItemLink';
import { Spacer } from '../components/Spacer/Spacer';
import { StarredDropdown } from '../components/HeaderDropdownComponent/StarredDropdown';
import { ApplicationLauncherDropdown } from '../components/HeaderDropdownComponent/ApplicationLauncherDropdown';

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
    // Notice: 1.5 ships with a Create link instead of a dropdown!!!
    {
      Component: CreateDropdown,
      config: {
        priority: 90,
        layout: {
          display: {
            sm: 'none',
            md: 'block',
          },
          mr: 1.5,
        } as any as React.CSSProperties, // I don't used MUI v5 specific `sx` types here to allow us changing the implementation later
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
      Component: SupportButton,
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

export const defaultCreateDropdownMountPoints: CreateDropdownMountPoint[] = [
  {
    Component: SoftwareTemplatesSection as React.ComponentType,
    config: {
      priority: 200,
    },
  },
  {
    Component: RegisterAComponentSection as React.ComponentType,
    config: {
      priority: 100,
    },
  },
];

export const defaultProfileDropdownMountPoints: ProfileDropdownMountPoint[] = [
  {
    Component: MenuItemLink as React.ComponentType,
    config: {
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
      priority: 100,
    },
  },
];

export const defaultApplicationLauncherDropdownMountPoints: ApplicationLauncherDropdownMountPoint[] =
  [
    {
      Component: MenuItemLink as React.ComponentType,
      config: {
        section: 'Red Hat AI',
        sectionLink: 'https://www.redhat.com/en/products/ai',
        sectionLinkLabel: 'Read more',
        priority: 200,
        props: {
          title: 'Podman Desktop',
          icon: 'https://podman-desktop.io/img/logo.svg',
          link: 'https://podman-desktop.io/',
        },
      },
    },
    {
      Component: MenuItemLink as React.ComponentType,
      config: {
        section: 'Red Hat AI',
        priority: 180,
        props: {
          title: 'OpenShift AI',
          icon: 'https://upload.wikimedia.org/wikipedia/commons/d/d8/Red_Hat_logo.svg',
          link: 'https://www.redhat.com/en/technologies/cloud-computing/openshift/openshift-ai',
        },
      },
    },
    {
      Component: MenuItemLink as React.ComponentType,
      config: {
        section: 'Quick Links',
        priority: 150,
        props: {
          title: 'Slack',
          icon: 'https://upload.wikimedia.org/wikipedia/commons/d/d5/Slack_icon_2019.svg',
          link: 'https://slack.com/',
        },
      },
    },
    {
      Component: MenuItemLink as React.ComponentType,
      config: {
        section: 'Quick Links',
        priority: 130,
        props: {
          title: 'ArgoCD',
          icon: 'https://argo-cd.readthedocs.io/en/stable/assets/logo.png',
          link: 'https://argo-cd.readthedocs.io/en/stable/',
        },
      },
    },
  ];
