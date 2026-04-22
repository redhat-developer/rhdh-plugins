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

import { createContext, useContext, useMemo } from 'react';

import type {
  GlobalHeaderComponentData,
  GlobalHeaderMenuItemData,
} from '../types';

interface GlobalHeaderContextValue {
  components: GlobalHeaderComponentData[];
  menuItems: GlobalHeaderMenuItemData[];
}

const GlobalHeaderContext = createContext<GlobalHeaderContextValue>({
  components: [],
  menuItems: [],
});

/**
 * Provider that distributes collected header extension data to child components.
 * Used internally by the globalHeaderModule wrapper factory.
 *
 * @internal
 */
export const GlobalHeaderProvider = ({
  components,
  menuItems,
  children,
}: GlobalHeaderContextValue & { children: React.ReactNode }) => {
  const value = useMemo(
    () => ({ components, menuItems }),
    [components, menuItems],
  );
  return (
    <GlobalHeaderContext.Provider value={value}>
      {children}
    </GlobalHeaderContext.Provider>
  );
};

/**
 * Returns all toolbar-level header components, sorted by priority (highest first).
 *
 * @alpha
 */
export function useGlobalHeaderComponents(): GlobalHeaderComponentData[] {
  return useContext(GlobalHeaderContext).components;
}

/**
 * Returns menu items for a specific dropdown target, sorted by priority (highest first).
 *
 * @alpha
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
