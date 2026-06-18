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

import { getOrCreateGlobalSingleton } from '@backstage/version-bridge';

/** @internal */
export const DEFAULT_WIDTH = 500;

/** @internal */
export interface DrawerState {
  activeDrawerId: string | null;
  widths: Map<string, number>;
}

function createDrawerStore() {
  let state: DrawerState = { activeDrawerId: null, widths: new Map() };
  const listeners = new Set<() => void>();

  function emit() {
    listeners.forEach(l => l());
  }

  function update(fn: (prev: DrawerState) => DrawerState) {
    state = fn(state);
    emit();
  }

  return {
    subscribe(listener: () => void) {
      listeners.add(listener);
      return () => {
        listeners.delete(listener);
      };
    },
    getSnapshot() {
      return state;
    },
    openDrawer(id: string) {
      update(s => ({ ...s, activeDrawerId: id }));
    },
    closeDrawer(id: string) {
      update(s => ({
        ...s,
        activeDrawerId: s.activeDrawerId === id ? null : s.activeDrawerId,
      }));
    },
    toggleDrawer(id: string) {
      update(s => ({
        ...s,
        activeDrawerId: s.activeDrawerId === id ? null : id,
      }));
    },
    setWidth(id: string, width: number) {
      update(s => {
        const next = new Map(s.widths);
        next.set(id, width);
        return { ...s, widths: next };
      });
    },
    reset() {
      state = { activeDrawerId: null, widths: new Map() };
      emit();
    },
  };
}

/**
 * Global drawer store backed by `@backstage/version-bridge` singleton.
 * Enables `useAppDrawer()` to work from any position in the React tree
 * without requiring a wrapping provider.
 *
 * @internal
 */
export const drawerStore = getOrCreateGlobalSingleton(
  'rhdh-app-drawer',
  createDrawerStore,
);
