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

import {
  createPlugin,
  createComponentExtension,
} from '@backstage/core-plugin-api';

import { GlobalHeaderComponentProps } from './components/GlobalHeaderComponent';
import { MenuItemLinkProps } from './components/MenuItemLink/MenuItemLink';
import { SoftwareTemplatesSectionProps } from './components/HeaderDropdownComponent/SoftwareTemplatesSection';
import { RegisterAComponentSectionProps } from './components/HeaderDropdownComponent/RegisterAComponentSection';
import { CreateDropdownProps } from './components/HeaderDropdownComponent/CreateDropdown';
import { ProfileDropdownProps } from './components/HeaderDropdownComponent/ProfileDropdown';
import { SupportButtonProps } from './plugin';
import { HelpDropdownProps } from './components/HeaderDropdownComponent/HelpDropdown';
import { globalHeaderTranslationRef } from './translations';

export type { GlobalHeaderComponentProps } from './components/GlobalHeaderComponent';

export type { HeaderButtonProps } from './components/HeaderButton/HeaderButton';
export type { HeaderIconProps } from './components/HeaderIcon/HeaderIcon';
export type { HeaderIconButtonProps } from './components/HeaderIconButton/HeaderIconButton';
export type { CreateDropdownProps } from './components/HeaderDropdownComponent/CreateDropdown';
export type { ProfileDropdownProps } from './components/HeaderDropdownComponent/ProfileDropdown';
export type { HelpDropdownProps } from './components/HeaderDropdownComponent/HelpDropdown';

export type { MenuItemLinkProps } from './components/MenuItemLink/MenuItemLink';
export type { MenuItemConfig } from './components/HeaderDropdownComponent/MenuSection';
export type { SoftwareTemplatesSectionProps } from './components/HeaderDropdownComponent/SoftwareTemplatesSection';
export type { RegisterAComponentSectionProps } from './components/HeaderDropdownComponent/RegisterAComponentSection';
export type { DividerProps } from './components/Divider/Divider';
export type { SpacerProps } from './components/Spacer/Spacer';
export type { SupportButtonProps } from './components/SupportButton/SupportButton';
export type { NotificationButtonProps } from './components/NotificationButton/NotificationButton';
export type {
  LogoURLs,
  CompanyLogoProps,
} from './components/CompanyLogo/CompanyLogo';

export type {
  NotificationBannerProps,
  NotificationBannerDismiss,
} from './components/NotificationBanner';

export type {
  GlobalHeaderComponentMountPoint,
  GlobalHeaderComponentMountPointConfig,
} from './types';

export { defaultGlobalHeaderComponentsMountPoints } from './defaultMountPoints/defaultMountPoints';

/**
 * Global Header Plugin
 *
 * @public
 */
export const globalHeaderPlugin = createPlugin({
  id: 'global-header',
  __experimentalTranslations: {
    availableLanguages: ['en', 'de', 'es', 'fr', 'it', 'ja'],
    resources: [globalHeaderTranslationRef],
  },
} as any);

/**
 * Global Header
 *
 * @public
 */
export const GlobalHeader = globalHeaderPlugin.provide(
  createComponentExtension({
    name: 'GlobalHeader',
    component: {
      lazy: () => import('./components/GlobalHeader').then(m => m.GlobalHeader),
    },
  }),
);

/**
 * Global Header Component
 *
 * @public
 */
export const GlobalHeaderComponent: ComponentType<GlobalHeaderComponentProps> =
  globalHeaderPlugin.provide(
    createComponentExtension({
      name: 'GlobalHeaderComponent',
      component: {
        lazy: () =>
          import('./components/GlobalHeaderComponent').then(
            m => m.GlobalHeaderComponent,
          ),
      },
    }),
  );

/**
 * @public
 */
export const HeaderButton = globalHeaderPlugin.provide(
  createComponentExtension({
    name: 'HeaderButton',
    component: {
      lazy: () =>
        import('./components/HeaderButton/HeaderButton').then(
          m => m.HeaderButton,
        ),
    },
  }),
);

/**
 * @public
 */
export const HeaderIcon = globalHeaderPlugin.provide(
  createComponentExtension({
    name: 'HeaderIcon',
    component: {
      lazy: () =>
        import('./components/HeaderIcon/HeaderIcon').then(m => m.HeaderIcon),
    },
  }),
);

/**
 * @public
 */
export const HeaderIconButton = globalHeaderPlugin.provide(
  createComponentExtension({
    name: 'HeaderIconButton',
    component: {
      lazy: () =>
        import('./components/HeaderIconButton/HeaderIconButton').then(
          m => m.HeaderIconButton,
        ),
    },
  }),
);

/**
 * Search Component
 *
 * @public
 */
export const SearchComponent: ComponentType = globalHeaderPlugin.provide(
  createComponentExtension({
    name: 'SearchComponent',
    component: {
      lazy: () =>
        import('./components/SearchComponent/SearchComponent').then(
          m => m.SearchComponent,
        ),
    },
  }),
);

/**
 * Create Dropdown
 *
 * @public
 */
export const CreateDropdown: ComponentType<CreateDropdownProps> =
  globalHeaderPlugin.provide(
    createComponentExtension({
      name: 'CreateDropdown',
      component: {
        lazy: () =>
          import('./components/HeaderDropdownComponent/CreateDropdown').then(
            m => m.CreateDropdown,
          ),
      },
    }),
  );

/**
 * Profile Dropdown
 *
 * @public
 */
export const ProfileDropdown: ComponentType<ProfileDropdownProps> =
  globalHeaderPlugin.provide(
    createComponentExtension({
      name: 'ProfileDropdown',
      component: {
        lazy: () =>
          import('./components/HeaderDropdownComponent/ProfileDropdown').then(
            m => m.ProfileDropdown,
          ),
      },
    }),
  );

/**
 * Help Dropdown
 *
 * @public
 */
export const HelpDropdown: ComponentType<HelpDropdownProps> =
  globalHeaderPlugin.provide(
    createComponentExtension({
      name: 'HelpDropdown',
      component: {
        lazy: () =>
          import('./components/HeaderDropdownComponent/HelpDropdown').then(
            m => m.HelpDropdown,
          ),
      },
    }),
  );

/**
 * Software Templates List
 *
 * @public
 */
export const SoftwareTemplatesSection: ComponentType<SoftwareTemplatesSectionProps> =
  globalHeaderPlugin.provide(
    createComponentExtension({
      name: 'SoftwareTemplatesSection',
      component: {
        lazy: () =>
          import(
            './components/HeaderDropdownComponent/SoftwareTemplatesSection'
          ).then(m => m.SoftwareTemplatesSection),
      },
    }),
  );

/**
 * Register A Component Link
 *
 * @public
 */
export const RegisterAComponentSection: ComponentType<RegisterAComponentSectionProps> =
  globalHeaderPlugin.provide(
    createComponentExtension({
      name: 'RegisterAComponentSection',
      component: {
        lazy: () =>
          import(
            './components/HeaderDropdownComponent/RegisterAComponentSection'
          ).then(m => m.RegisterAComponentSection),
      },
    }),
  );

/**
 * Header Link
 *
 * @public
 */
export const MenuItemLink: ComponentType<MenuItemLinkProps> =
  globalHeaderPlugin.provide(
    createComponentExtension({
      name: 'MenuItemLink',
      component: {
        lazy: () =>
          import('./components/MenuItemLink/MenuItemLink').then(
            m => m.MenuItemLink,
          ),
      },
    }),
  );

/**
 * Header Logout Button
 *
 * @public
 */
export const LogoutButton: ComponentType = globalHeaderPlugin.provide(
  createComponentExtension({
    name: 'LogoutButton',
    component: {
      lazy: () =>
        import('./components/LogoutButton/LogoutButton').then(
          m => m.LogoutButton,
        ),
    },
  }),
);

/**
 * Spacer component that allow users to add a flexible spacing between components.
 *
 * Supports two props: `growFactor` with default 1 and `minWidth` width default 8 pixels.
 *
 * @public
 */
export const Spacer = globalHeaderPlugin.provide(
  createComponentExtension({
    name: 'Spacer',
    component: {
      lazy: () => import('./components/Spacer/Spacer').then(m => m.Spacer),
    },
  }),
);

/**
 * @public
 */
export const Divider = globalHeaderPlugin.provide(
  createComponentExtension({
    name: 'Divider',
    component: {
      lazy: () => import('./components/Divider/Divider').then(m => m.Divider),
    },
  }),
);

/**
 * @public
 */
export const SupportButton: ComponentType<SupportButtonProps> =
  globalHeaderPlugin.provide(
    createComponentExtension({
      name: 'SupportButton',
      component: {
        lazy: () =>
          import('./components/SupportButton/SupportButton').then(
            m => m.SupportButton,
          ),
      },
    }),
  );

/**
 * @public
 */
export const NotificationButton = globalHeaderPlugin.provide(
  createComponentExtension({
    name: 'NotificationButton',
    component: {
      lazy: () =>
        import('./components/NotificationButton/NotificationButton').then(
          m => m.NotificationButton,
        ),
    },
  }),
);

/**
 * NotificationBanner
 *
 * @public
 */
export const NotificationBanner = globalHeaderPlugin.provide(
  createComponentExtension({
    name: 'NotificationBanner',
    component: {
      lazy: () =>
        import('./components/NotificationBanner').then(
          m => m.NotificationBanner,
        ),
    },
  }),
);

/**
 * Starred Dropdown
 *
 * @public
 */
export const StarredDropdown = globalHeaderPlugin.provide(
  createComponentExtension({
    name: 'StarredDropdown',
    component: {
      lazy: () =>
        import('./components/HeaderDropdownComponent/StarredDropdown').then(
          m => m.StarredDropdown,
        ),
    },
  }),
);

/**
 * Application Launcher Dropdown
 *
 * @public
 */
export const ApplicationLauncherDropdown = globalHeaderPlugin.provide(
  createComponentExtension({
    name: 'ApplicationLauncherDropdown',
    component: {
      lazy: () =>
        import(
          './components/HeaderDropdownComponent/ApplicationLauncherDropdown'
        ).then(m => m.ApplicationLauncherDropdown),
    },
  }),
);

/**
 * Company Logo
 *
 * @public
 */
export const CompanyLogo = globalHeaderPlugin.provide(
  createComponentExtension({
    name: 'CompanyLogo',
    component: {
      lazy: () =>
        import('./components/CompanyLogo/CompanyLogo').then(m => m.CompanyLogo),
    },
  }),
);

/**
 * Translation resource for the global header plugin
 *
 * @public
 */
export { globalHeaderTranslations } from './translations';
