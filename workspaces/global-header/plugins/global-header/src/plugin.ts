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

import React from 'react';
import {
  createPlugin,
  createComponentExtension,
} from '@backstage/core-plugin-api';
import { GlobalHeaderComponentProps } from './components/GlobalHeaderComponent';
import { HeaderLinkProps } from './components/HeaderLinkComponent/HeaderLink';
import { SoftwareTemplatesSectionProps } from './components/HeaderDropdownComponent/SoftwareTemplatesSection';
import { RegisterAComponentSectionProps } from './components/HeaderDropdownComponent/RegisterAComponentSection';
import { HeaderDropdownComponentProps, HeaderIconButtonProps } from './types';

export type { GlobalHeaderComponentProps } from './components/GlobalHeaderComponent';
export type { HeaderLinkProps } from './components/HeaderLinkComponent/HeaderLink';
export type { MenuItemConfig } from './components/HeaderDropdownComponent/MenuSection';
export type { SoftwareTemplatesSectionProps } from './components/HeaderDropdownComponent/SoftwareTemplatesSection';
export type { RegisterAComponentSectionProps } from './components/HeaderDropdownComponent/RegisterAComponentSection';
export type { SpacerProps } from './components/Spacer/Spacer';
export type {
  GlobalHeaderComponentMountPoint,
  GlobalHeaderComponentMountPointConfig,
  HeaderDropdownComponentProps,
  HeaderIconButtonProps,
} from './types';

export { defaultGlobalHeaderComponentsMountPoints } from './defaultMountPoints/defaultMountPoints';

export { ComponentType, Slot } from './types';

export type {
  NotificationBannerProps,
  NotificationBannerDismiss,
} from './components/NotificationBanner';

/**
 * Global Header Plugin
 *
 * @public
 */
export const globalHeaderPlugin = createPlugin({
  id: 'global-header',
});

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
export const GlobalHeaderComponent: React.ComponentType<GlobalHeaderComponentProps> =
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
 * Search Component
 *
 * @public
 */
export const SearchComponent: React.ComponentType = globalHeaderPlugin.provide(
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
export const CreateDropdown: React.ComponentType<HeaderDropdownComponentProps> =
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
 * Header Icon Button
 *
 * @public
 */
export const HeaderIconButton: React.ComponentType<HeaderIconButtonProps> =
  globalHeaderPlugin.provide(
    createComponentExtension({
      name: 'HeaderIconButton',
      component: {
        lazy: () =>
          import(
            './components/HeaderIconButtonComponent/HeaderIconButton'
          ).then(m => m.HeaderIconButton),
      },
    }),
  );

/**
 * Profile Dropdown
 *
 * @public
 */
export const ProfileDropdown: React.ComponentType<HeaderDropdownComponentProps> =
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
 * Software Templates List
 *
 * @public
 */
export const SoftwareTemplatesSection: React.ComponentType<SoftwareTemplatesSectionProps> =
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
export const RegisterAComponentSection: React.ComponentType<RegisterAComponentSectionProps> =
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
export const HeaderLink: React.ComponentType<HeaderLinkProps> =
  globalHeaderPlugin.provide(
    createComponentExtension({
      name: 'HeaderLink',
      component: {
        lazy: () =>
          import('./components/HeaderLinkComponent/HeaderLink').then(
            m => m.HeaderLink,
          ),
      },
    }),
  );

/**
 * Header Logout Button
 *
 * @public
 */
export const LogoutButton: React.ComponentType = globalHeaderPlugin.provide(
  createComponentExtension({
    name: 'LogoutButton',
    component: {
      lazy: () =>
        import('./components/HeaderButtonComponent/LogoutButton').then(
          m => m.LogoutButton,
        ),
    },
  }),
);

/**
 * Spacer component that allow users to add a flexibel spacing between components.
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
