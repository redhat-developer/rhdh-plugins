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
import { CreateButtonProps } from './components/HeaderDropdownComponent/CreateDropdown';
import { HeaderIconButtonProps } from './components/HeaderIconButtonComponent/HeaderIconButton';
import { ProfileDropdownProps } from './components/HeaderDropdownComponent/ProfileDropdown';
import { HeaderLinkProps } from './components/HeaderLinkComponent/HeaderLink';
import { SoftwareTemplatesSectionProps } from './components/HeaderDropdownComponent/SoftwareTemplatesSection';
import { RegisterAComponentSectionProps } from './components/HeaderDropdownComponent/RegisterAComponentSection';

export type { CreateButtonProps } from './components/HeaderDropdownComponent/CreateDropdown';
export type { HeaderLinkProps } from './components/HeaderLinkComponent/HeaderLink';
export type { MenuItemConfig } from './components/HeaderDropdownComponent/MenuSection';
export type { SoftwareTemplatesSectionProps } from './components/HeaderDropdownComponent/SoftwareTemplatesSection';
export type { RegisterAComponentSectionProps } from './components/HeaderDropdownComponent/RegisterAComponentSection';
export type { HeaderIconButtonProps } from './components/HeaderIconButtonComponent/HeaderIconButton';
export type { ProfileDropdownProps } from './components/HeaderDropdownComponent/ProfileDropdown';

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
export const CreateDropdown: React.ComponentType<CreateButtonProps> =
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
export const ProfileDropdown: React.ComponentType<ProfileDropdownProps> =
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
