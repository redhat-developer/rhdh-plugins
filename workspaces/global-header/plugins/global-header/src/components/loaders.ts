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

type CriticalHeaderBundle = typeof import('./criticalHeaderBundle');

/**
 * Lazy singleton — do not use a top-level `import()` here. This module is
 * statically imported from blueprint registration (`blueprints.tsx`,
 * `toolbarExtensions.tsx`), which runs before sign-in. A module-scope
 * `import()` would fetch the header chunk on the sign-in page.
 */
let criticalHeaderBundlePromise: Promise<CriticalHeaderBundle> | undefined;

export const loadCriticalHeaderBundle = (): Promise<CriticalHeaderBundle> => {
  if (!criticalHeaderBundlePromise) {
    criticalHeaderBundlePromise = import('./criticalHeaderBundle');
  }
  return criticalHeaderBundlePromise;
};

export const loadGlobalHeader = async () =>
  (await loadCriticalHeaderBundle()).GlobalHeader;

export const loadCompanyLogo = async () =>
  (await loadCriticalHeaderBundle()).CompanyLogo;

export const loadSearchComponent = async (): Promise<ComponentType<any>> =>
  (await loadCriticalHeaderBundle()).SearchComponent;

export const loadSpacer = async (): Promise<ComponentType<any>> =>
  (await loadCriticalHeaderBundle()).Spacer;

export const loadHeaderIconButton = async () =>
  (await loadCriticalHeaderBundle()).HeaderIconButton;

export const loadDivider = async (): Promise<ComponentType<any>> =>
  (await loadCriticalHeaderBundle()).Divider;

export const loadNotificationButton = async (): Promise<ComponentType<any>> =>
  (await loadCriticalHeaderBundle()).NotificationButton;

/** Dropdown trigger wrappers — same critical bundle as other first-paint UI. */
export const loadStarredDropdown = async () =>
  (await loadCriticalHeaderBundle()).StarredDropdown;

export const loadApplicationLauncherDropdown = async () =>
  (await loadCriticalHeaderBundle()).ApplicationLauncherDropdown;

export const loadHelpDropdown = async () =>
  (await loadCriticalHeaderBundle()).HelpDropdown;

export const loadProfileDropdown = async () =>
  (await loadCriticalHeaderBundle()).ProfileDropdown;
