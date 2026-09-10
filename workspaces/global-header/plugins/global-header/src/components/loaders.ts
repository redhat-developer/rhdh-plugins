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

type OnMountHeaderBundle = typeof import('./onMountHeaderBundle');

/**
 * Lazy singleton — do not use a top-level `import()` here. This module is
 * statically imported from blueprint registration (`blueprints.tsx`,
 * `toolbarExtensions.tsx`), which runs before sign-in. A module-scope
 * `import()` would fetch the header chunk on the sign-in page.
 */
let onMountHeaderBundlePromise: Promise<OnMountHeaderBundle> | undefined;

function getOnMountHeaderBundlePromise(): Promise<OnMountHeaderBundle> {
  if (!onMountHeaderBundlePromise) {
    onMountHeaderBundlePromise = import('./onMountHeaderBundle');
  }
  return onMountHeaderBundlePromise;
}

/** Returns the shared on-mount header bundle promise (starts fetch on first call). */
export const loadHeaderBundle = () => getOnMountHeaderBundlePromise();

export const loadGlobalHeader = async () =>
  (await getOnMountHeaderBundlePromise()).GlobalHeader;

export const loadCompanyLogo = async () =>
  (await getOnMountHeaderBundlePromise()).CompanyLogo;

export const loadSearchComponent = async (): Promise<ComponentType<any>> =>
  (await getOnMountHeaderBundlePromise()).SearchComponent;

export const loadSpacer = async (): Promise<ComponentType<any>> =>
  (await getOnMountHeaderBundlePromise()).Spacer;

export const loadHeaderIconButton = async () =>
  (await getOnMountHeaderBundlePromise()).HeaderIconButton;

export const loadDivider = async (): Promise<ComponentType<any>> =>
  (await getOnMountHeaderBundlePromise()).Divider;

export const loadNotificationButton = async (): Promise<ComponentType<any>> =>
  (await getOnMountHeaderBundlePromise()).NotificationButton;

/** Dropdown wrappers — separate async chunks, not part of the critical bundle. */
export const loadStarredDropdown = () =>
  import('./HeaderDropdownComponent/StarredDropdown').then(
    m => m.StarredDropdown,
  );

export const loadApplicationLauncherDropdown = () =>
  import('./ApplicationLauncherDropdown').then(
    m => m.ApplicationLauncherDropdown,
  );

export const loadHelpDropdown = () =>
  import('./HelpDropdown').then(m => m.HelpDropdown);

export const loadProfileDropdown = () =>
  import('./ProfileDropdown').then(m => m.ProfileDropdown);
