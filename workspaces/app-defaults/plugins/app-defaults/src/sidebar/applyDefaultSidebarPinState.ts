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

import { ConfigApi } from '@backstage/core-plugin-api';

/**
 * localStorage key used by Backstage `SidebarPage` / `LocalStorage` in
 * `@backstage/core-components` (`packages/core-components/.../Sidebar/localStorage.ts`).
 * Must stay in sync with upstream; that helper is not part of the public API.
 */
export const SIDEBAR_PIN_STATE_STORAGE_KEY = 'sidebarPinState';

const DEFAULT_PINNED_CONFIG_KEY = 'app.sidebar.defaultPinned';

/**
 * Seeds the Backstage sidebar pin localStorage key from app-config when the
 * user has no saved preference.
 *
 * Precedence: saved localStorage value > `app.sidebar.defaultPinned` >
 * pinned (`true`, Backstage product fallback). Never overwrites an existing
 * saved preference. Invalid config values leave localStorage untouched so
 * Backstage keeps its pinned default.
 *
 * Must run synchronously before `SidebarPage` mounts, because that component
 * reads localStorage in its `useState` initializer and then writes the result
 * back on first effect.
 */
export function applyDefaultSidebarPinState(configApi: ConfigApi): void {
  if (typeof window === 'undefined' || !window.localStorage) {
    return;
  }

  if (window.localStorage.getItem(SIDEBAR_PIN_STATE_STORAGE_KEY) !== null) {
    return;
  }

  let defaultPinned: boolean | undefined;
  try {
    defaultPinned = configApi.getOptionalBoolean(DEFAULT_PINNED_CONFIG_KEY);
  } catch {
    // Invalid config → leave unset; SidebarPage falls back to pinned.
    return;
  }

  if (defaultPinned === undefined) {
    return;
  }

  window.localStorage.setItem(
    SIDEBAR_PIN_STATE_STORAGE_KEY,
    JSON.stringify(defaultPinned),
  );
}
