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

import type { AppSidebarGroup } from './extensions/AppSidebarGroup';
import type { AppSidebarItem } from './extensions/AppSidebarItem';

interface SidebarItemsContextValue {
  items: AppSidebarItem[];
  groups: AppSidebarGroup[];
}

const SidebarItemsContext = createContext<SidebarItemsContextValue>({
  items: [],
  groups: [],
});

/**
 * Provider that passes contributed sidebar items and groups from the wrapper
 * extension down to the sidebar renderer.
 *
 * @internal
 */
export const SidebarItemsProvider = ({
  items,
  groups,
  children,
}: SidebarItemsContextValue & { children: React.ReactNode }) => {
  const value = useMemo(() => ({ items, groups }), [items, groups]);
  return (
    <SidebarItemsContext.Provider value={value}>
      {children}
    </SidebarItemsContext.Provider>
  );
};

/**
 * Hook to access contributed sidebar items and groups.
 *
 * @internal
 */
export const useSidebarItems = (): SidebarItemsContextValue => {
  return useContext(SidebarItemsContext);
};
