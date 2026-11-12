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

import {
  createContext,
  useContext,
  useMemo,
  type Context,
  type ReactNode,
} from 'react';

import type {
  GlobalHeaderComponentData,
  GlobalHeaderMenuItemData,
} from '../types';

interface GlobalHeaderContextValue {
  components: GlobalHeaderComponentData[];
  menuItems: GlobalHeaderMenuItemData[];
}

const CONTEXT_KEY = '__global_header_context__' as keyof typeof globalThis;

function getOrCreateContext(): Context<GlobalHeaderContextValue> {
  const existing = (globalThis as any)[CONTEXT_KEY];
  if (existing) return existing as Context<GlobalHeaderContextValue>;
  const ctx = createContext<GlobalHeaderContextValue>({
    components: [],
    menuItems: [],
  });
  (globalThis as any)[CONTEXT_KEY] = ctx;
  return ctx;
}

const GlobalHeaderContext = getOrCreateContext();

/**
 * Provider that distributes collected header extension data to child components.
 * Used by the default global-header module wrapper factory.
 *
 * The React context instance is stored on `globalThis` so federated bundles that
 * load a second copy of this module still share one provider. Custom header or
 * dropdown UI must read data through
 * {@link useGlobalHeaderComponents} / {@link useGlobalHeaderMenuItems} from
 * `@red-hat-developer-hub/backstage-plugin-app-react` — do not create a private
 * React context, or duplicate module copies will silently see empty menus.
 *
 * @public
 */
export function GlobalHeaderProvider(props: {
  components: GlobalHeaderComponentData[];
  menuItems: GlobalHeaderMenuItemData[];
  children: ReactNode;
}) {
  const { components, menuItems, children } = props;
  const value = useMemo(
    () => ({ components, menuItems }),
    [components, menuItems],
  );
  return (
    <GlobalHeaderContext.Provider value={value}>
      {children}
    </GlobalHeaderContext.Provider>
  );
}

/**
 * Returns all toolbar-level header components, sorted by priority (highest first).
 *
 * Always import this hook from
 * `@red-hat-developer-hub/backstage-plugin-app-react` so it shares the same
 * `globalThis`-backed context as {@link GlobalHeaderProvider}.
 *
 * @public
 */
export function useGlobalHeaderComponents(): GlobalHeaderComponentData[] {
  return useContext(GlobalHeaderContext).components;
}

/**
 * Returns menu items for a specific dropdown target, sorted by priority (highest first).
 *
 * Always import this hook from
 * `@red-hat-developer-hub/backstage-plugin-app-react` so it shares the same
 * `globalThis`-backed context as {@link GlobalHeaderProvider}.
 *
 * @public
 */
export function useGlobalHeaderMenuItems(
  target: string,
): GlobalHeaderMenuItemData[] {
  const { menuItems } = useContext(GlobalHeaderContext);
  return useMemo(
    () => menuItems.filter(item => item.target === target),
    [menuItems, target],
  );
}
