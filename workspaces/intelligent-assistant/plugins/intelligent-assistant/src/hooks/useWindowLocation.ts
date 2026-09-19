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

import { useSyncExternalStore } from 'react';

import { subscribeToScreenContextLabel } from './screenContextLabelSubscription';

export type WindowLocationSnapshot = {
  pathname: string;
  search: string;
};

let cachedSnapshot: WindowLocationSnapshot = {
  pathname: '',
  search: '',
};

function getWindowLocationSnapshot(): WindowLocationSnapshot {
  const pathname = window.location.pathname;
  const search = window.location.search;
  if (
    cachedSnapshot.pathname !== pathname ||
    cachedSnapshot.search !== search
  ) {
    cachedSnapshot = { pathname, search };
  }
  return cachedSnapshot;
}

function subscribeToWindowLocation(onStoreChange: () => void): () => void {
  return subscribeToScreenContextLabel(onStoreChange);
}

/**
 * Subscribes to browser URL changes (including history.pushState/replaceState).
 * Use when the host app navigates outside the same React Router tree as Lightspeed.
 * History patching is installed on first subscribe via subscribeToScreenContextLabel.
 */
export function useWindowLocation(): WindowLocationSnapshot {
  return useSyncExternalStore(
    subscribeToWindowLocation,
    getWindowLocationSnapshot,
    getWindowLocationSnapshot,
  );
}
