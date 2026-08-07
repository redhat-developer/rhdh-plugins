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
 * First-paint widgets resolve through shared loaders in `components/loaders.ts`
 * (one critical async chunk). Dropdown menus use separate interaction loaders.
 *
 * @internal
 */

import { GlobalHeaderComponentBlueprint } from '../extensions/blueprints';
import {
  loadCompanyLogo,
  loadDivider,
  loadHelpDropdown,
  loadNotificationButton,
  loadProfileDropdown,
  loadSearchComponent,
  loadSpacer,
  loadStarredDropdown,
  loadApplicationLauncherDropdown,
} from '../components/loaders';

/** @public */
export const companyLogoExtension = GlobalHeaderComponentBlueprint.make({
  name: 'company-logo',
  params: {
    priority: 200,
    loader: async () => {
      const CompanyLogo = await loadCompanyLogo();
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
    loader: loadSearchComponent,
  },
});

/** @public */
export const spacerExtension = GlobalHeaderComponentBlueprint.make({
  name: 'spacer',
  params: {
    priority: 99,
    layout: { flexGrow: 0 },
    loader: loadSpacer,
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
    loader: loadStarredDropdown,
  },
});

/** @public */
export const applicationLauncherDropdownExtension =
  GlobalHeaderComponentBlueprint.make({
    name: 'app-launcher-dropdown',
    params: {
      priority: 82,
      loader: loadApplicationLauncherDropdown,
    },
  });

/** @public */
export const helpDropdownExtension = GlobalHeaderComponentBlueprint.make({
  name: 'help-dropdown',
  params: {
    priority: 80,
    loader: loadHelpDropdown,
  },
});

/** @public */
export const notificationButtonExtension = GlobalHeaderComponentBlueprint.make({
  name: 'notification-button',
  params: {
    priority: 70,
    loader: loadNotificationButton,
  },
});

/** @public */
export const dividerExtension = GlobalHeaderComponentBlueprint.make({
  name: 'divider',
  params: {
    priority: 50,
    loader: loadDivider,
  },
});

/** @public */
export const profileDropdownExtension = GlobalHeaderComponentBlueprint.make({
  name: 'profile-dropdown',
  params: {
    priority: 10,
    loader: loadProfileDropdown,
  },
});
