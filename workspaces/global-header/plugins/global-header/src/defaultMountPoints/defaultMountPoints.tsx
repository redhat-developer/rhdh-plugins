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
import type { CSSProperties, ComponentType } from 'react';
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
import { CompanyLogo } from '../components/CompanyLogo/CompanyLogo';

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
          logo: 'data:image/png;base64,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TgyzMoT6FQEREAEREAERWJLASGE47NRQwjDFF9sLSpqQiLyoJGVivU7f/MRw6mOkB5E2fB5BQSph2AscfS4CIiACIiACInArAsOEYfTkprVHT28kDOk+TDlZos8K7PBdhWHUz9F4QjAHT7ddL6GRMEQso2tEQAREQAREQAREACMwWhgOOTWMFswYuthVSFEeLLZjE/x5MrjkCeF54W8sDCM/BUMV+0GR1kxmPsELjmkeLxpQai8CIiACIiACIiAClQkMFYaMU0OkgJQwdLnc/ojoW4jBI4E3FoaRxzclDBd8LNoV2WokAiIgAiIgAiIgAgCBJgzbqYPnzyUgNtH2m2fArc3fPz4+2snj07/tJOGPwBjpTX98fPzeG4TA6tkQf28fPMTgit8b7LE7CUOvjzc2XTt1fLH5qsvfX40d9fHouq7WHPTXblyfxwwycOUvi9/pWhEQAREQAREQARFYicCnxtKfCIiACIiACIiACIiACIiACIjAnQlIGN7Z+lq7CIiACIiACIiACIiACIiACPx8ilB/IiACIiACIiACIiACIiACIiACdyYgYXhn62vtIiACIiACIiACIiACIiACIqATQ/mACIiACIiACIiACIiACIiACIiATgzlAyIgAiIgAiIgAiIgAiIgAiJwcwIShjd3AC1fBERABERABERABERABERABCQM5QMiIAIiIAIiIAIiIAIiIAIicHMCEoY3dwAtXwREQAREQAREQAREQAREQAQkDOUDIiACIiACIiACIiACIiACInBzAhKGN3cALV8EREAEREAEREAEREAEREAEJAzlAyIgAiIgAiIgAiIgAiIgAiJwcwIShjd3AC1fBERABERABERABERABERABCQM5QMiIAIiIAIiIAIiIAIiIAIicHMCEoY3dwAtXwREQAREQAREQAREQAREQAQkDOUDIiACIiACIiACIiACIiACInBzAhKGN3cALV8EREAEREAEREAEREAEREAEJAzlAyIgAiIgAiIgAiIgAiIgAiJwcwIShjd3AC1fBERABERABERABERABERABCQM5QMiIAIiIAIiIAIiIAIiIAIicHMCEoY3dwAtXwREQAREQAREQAREQAREQAQkDOUDIiACIiACIiACIiACIiACInBzAhKGN3cALV8EROB9CPzz8fGfw2rav/92Wt3fh//+q/37j4+Pxz/1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',
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
        } as any as CSSProperties, // I don't used MUI v5 specific `sx` types here to allow us changing the implementation later
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
      Component: MenuItemLink as ComponentType,
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
      Component: MenuItemLink as ComponentType,
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
      Component: MenuItemLink as ComponentType,
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
      Component: MenuItemLink as ComponentType,
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
