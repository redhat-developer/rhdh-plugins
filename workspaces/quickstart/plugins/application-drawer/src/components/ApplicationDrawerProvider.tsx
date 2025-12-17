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

import { PropsWithChildren, useCallback, useState, useMemo } from 'react';
import {
  ApplicationDrawerContext,
  DrawerContext,
} from './ApplicationDrawerContext';

/**
 * Provider component for the ApplicationDrawer functionality
 *
 * This provider should wrap all drawer providers (QuickstartDrawerProvider,
 * TestDrawerProvider, etc.) to allow them to register themselves.
 *
 * @public
 */
export const ApplicationDrawerProvider = ({ children }: PropsWithChildren) => {
  const [drawers, setDrawers] = useState<DrawerContext[]>([]);

  const addDrawerContext = useCallback(
    (
      id: string,
      context: {
        isDrawerOpen: boolean;
        drawerWidth?: number;
        setDrawerWidth?: React.Dispatch<React.SetStateAction<number>>;
      },
    ) => {
      setDrawers(prev => {
        const existingIndex = prev.findIndex(d => d.id === id);
        const newContext: DrawerContext = { id, ...context };

        if (existingIndex !== -1) {
          // Check if anything actually changed
          const existing = prev[existingIndex];
          if (
            existing.isDrawerOpen === newContext.isDrawerOpen &&
            existing.drawerWidth === newContext.drawerWidth
          ) {
            return prev;
          }
          const updated = [...prev];
          updated[existingIndex] = newContext;
          return updated;
        }
        return [...prev, newContext];
      });
    },
    [],
  );

  const getDrawers = useCallback(() => drawers, [drawers]);

  const contextValue = useMemo(
    () => ({
      addDrawerContext,
      getDrawers,
    }),
    [addDrawerContext, getDrawers],
  );

  return (
    <ApplicationDrawerContext.Provider value={contextValue}>
      {children}
    </ApplicationDrawerContext.Provider>
  );
};
