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

/**
 * Default toolbar component extensions (`gh-component`) for the global header.
 *
 * Heavy UI uses blueprint `loader` (ExtensionBoundary.lazyComponent).
 * Default on-mount widgets all `import()` `onMountHeaderBundle` so they share one
 * async chunk. Data-driven items (self-service) omit loader and let the
 * blueprint lazy-load HeaderIconButton from that same module.
 *
 * @internal
 */

import { GlobalHeaderComponentBlueprint } from '../extensions/blueprints';

/** @public */
export const companyLogoExtension = GlobalHeaderComponentBlueprint.make({
  name: 'company-logo',
  params: {
    priority: 200,
    loader: async () => {
      const { CompanyLogo } = await import('../components/onMountHeaderBundle');
      return () => <CompanyLogo to="/" />;
    },
  },
});

/** @public */
export const searchExtension = GlobalHeaderComponentBlueprint.make({
  name: 'search',
  params: {
    priority: 100,
    layout: { flexGrow: 1 },
    loader: () =>
      import('../components/onMountHeaderBundle').then(m => m.SearchComponent),
  },
});

/** @public */
export const spacerExtension = GlobalHeaderComponentBlueprint.make({
  name: 'spacer',
  params: {
    priority: 99,
    layout: { flexGrow: 0 },
    loader: () =>
      import('../components/onMountHeaderBundle').then(m => m.Spacer),
  },
});

/** @public */
export const selfServiceButtonExtension = GlobalHeaderComponentBlueprint.make({
  name: 'self-service-button',
  params: {
    title: 'Self-service',
    titleKey: 'create.title',
    icon: 'add',
    link: '/create',
    priority: 90,
  },
});

/** @public */
export const starredDropdownExtension = GlobalHeaderComponentBlueprint.make({
  name: 'starred-dropdown',
  params: {
    priority: 85,
    loader: () =>
      import('../components/onMountHeaderBundle').then(m => m.StarredDropdown),
  },
});

/** @public */
export const applicationLauncherDropdownExtension =
  GlobalHeaderComponentBlueprint.make({
    name: 'app-launcher-dropdown',
    params: {
      priority: 82,
      loader: () =>
        import('../components/onMountHeaderBundle').then(
          m => m.ApplicationLauncherDropdown,
        ),
    },
  });

/** @public */
export const helpDropdownExtension = GlobalHeaderComponentBlueprint.make({
  name: 'help-dropdown',
  params: {
    priority: 80,
    loader: () =>
      import('../components/onMountHeaderBundle').then(m => m.HelpDropdown),
  },
});

/** @public */
export const notificationButtonExtension = GlobalHeaderComponentBlueprint.make({
  name: 'notification-button',
  params: {
    priority: 70,
    loader: () =>
      import('../components/onMountHeaderBundle').then(
        m => m.NotificationButton,
      ),
  },
});

/** @public */
export const dividerExtension = GlobalHeaderComponentBlueprint.make({
  name: 'divider',
  params: {
    priority: 50,
    loader: () =>
      import('../components/onMountHeaderBundle').then(m => m.Divider),
  },
});

/** @public */
export const profileDropdownExtension = GlobalHeaderComponentBlueprint.make({
  name: 'profile-dropdown',
  params: {
    priority: 10,
    loader: () =>
      import('../components/onMountHeaderBundle').then(m => m.ProfileDropdown),
  },
});
