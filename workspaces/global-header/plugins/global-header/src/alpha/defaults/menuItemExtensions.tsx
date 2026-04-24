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
 * Default menu item extensions (`gh-menu-item`) for the global header dropdowns.
 *
 * - Items with only `component` (no data fields) are rendered directly by
 *   the dropdown — they control their own layout and `MenuItem` wrapping.
 * - Items with data fields (`title`, `link`, etc.) are grouped by `sectionLabel`
 *   and rendered through `MenuSection`.
 *
 * @internal
 */

import { GlobalHeaderMenuItemBlueprint } from '../extensions/blueprints';

import { LogoutButton } from '../../components/LogoutButton/LogoutButton';
import { SupportButton } from '../../components/SupportButton/SupportButton';
import { MyProfileMenuItem } from '../components/MyProfileMenuItem';

// ---------------------------------------------------------------------------
// Profile dropdown items
// ---------------------------------------------------------------------------

/** @alpha */
export const settingsMenuItemExtension = GlobalHeaderMenuItemBlueprint.make({
  name: 'settings',
  params: {
    target: 'profile',
    title: 'Settings',
    titleKey: 'profile.settings',
    link: '/settings',
    icon: 'manage_accounts',
    priority: 100,
  },
});

/** @alpha */
export const myProfileMenuItemExtension = GlobalHeaderMenuItemBlueprint.make({
  name: 'my-profile',
  params: {
    target: 'profile',
    component: MyProfileMenuItem,
    priority: 90,
  },
});

/** @alpha */
export const logoutMenuItemExtension = GlobalHeaderMenuItemBlueprint.make({
  name: 'logout',
  params: {
    target: 'profile',
    component: LogoutButton,
    priority: 10,
  },
});

// ---------------------------------------------------------------------------
// Help dropdown items
// ---------------------------------------------------------------------------

/** @alpha */
export const supportButtonMenuItemExtension =
  GlobalHeaderMenuItemBlueprint.make({
    name: 'support-button',
    params: {
      target: 'help',
      component: SupportButton,
      priority: 10,
    },
  });

// ---------------------------------------------------------------------------
// App launcher dropdown items
// ---------------------------------------------------------------------------

/** @alpha */
export const appLauncherDevHubMenuItemExtension =
  GlobalHeaderMenuItemBlueprint.make({
    name: 'app-launcher-devhub',
    params: {
      target: 'app-launcher',
      title: 'Developer Hub',
      titleKey: 'applicationLauncher.developerHub',
      link: 'https://docs.redhat.com/en/documentation/red_hat_developer_hub',
      icon: 'hub',
      sectionLabel: 'applicationLauncher.sections.documentation',
      priority: 150,
    },
  });

/** @alpha */
export const appLauncherRhdhLocalMenuItemExtension =
  GlobalHeaderMenuItemBlueprint.make({
    name: 'app-launcher-rhdh-local',
    params: {
      target: 'app-launcher',
      title: 'RHDH Local',
      titleKey: 'applicationLauncher.rhdhLocal',
      link: 'https://github.com/redhat-developer/rhdh-local',
      icon: 'hub',
      sectionLabel: 'applicationLauncher.sections.developerTools',
      priority: 100,
    },
  });
