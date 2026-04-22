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

export * from './toolbarExtensions';
export * from './menuItemExtensions';

import {
  companyLogoExtension,
  searchExtension,
  spacerExtension,
  selfServiceButtonExtension,
  starredDropdownExtension,
  applicationLauncherDropdownExtension,
  helpDropdownExtension,
  notificationButtonExtension,
  dividerExtension,
  profileDropdownExtension,
} from './toolbarExtensions';

import {
  settingsMenuItemExtension,
  myProfileMenuItemExtension,
  logoutMenuItemExtension,
  supportButtonMenuItemExtension,
  appLauncherDevHubMenuItemExtension,
  appLauncherRhdhLocalMenuItemExtension,
} from './menuItemExtensions';

/**
 * All default toolbar component extensions.
 * @alpha
 */
export const defaultToolbarExtensions = [
  companyLogoExtension,
  searchExtension,
  spacerExtension,
  selfServiceButtonExtension,
  starredDropdownExtension,
  applicationLauncherDropdownExtension,
  helpDropdownExtension,
  notificationButtonExtension,
  dividerExtension,
  profileDropdownExtension,
];

/**
 * All default menu item extensions.
 * @alpha
 */
export const defaultMenuItemExtensions = [
  settingsMenuItemExtension,
  myProfileMenuItemExtension,
  logoutMenuItemExtension,
  supportButtonMenuItemExtension,
  appLauncherDevHubMenuItemExtension,
  appLauncherRhdhLocalMenuItemExtension,
];
