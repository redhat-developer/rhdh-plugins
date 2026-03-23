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
  useCallback,
  useContext,
  useMemo,
  useState,
} from 'react';

import type { AppDrawerApi } from './types';

const DEFAULT_WIDTH = 500;

const noopApi: AppDrawerApi = {
  openDrawer: () => {},
  closeDrawer: () => {},
  toggleDrawer: () => {},
  isOpen: () => false,
  activeDrawerId: null,
  getWidth: () => 500,
  setWidth: () => {},
};

const AppDrawerContext = createContext<AppDrawerApi>(noopApi);

/**
 * Provider that holds all drawer state. Wrap the app root with this so that
 * useAppDrawer() is accessible from any component.
 *
 * @public
 */
export const AppDrawerProvider = ({
  children,
}: {
  children: React.ReactNode;
}) => {
  const [activeDrawerId, setActiveDrawerId] = useState<string | null>(null);
  const [widths, setWidths] = useState<Map<string, number>>(() => new Map());

  const openDrawer = useCallback((id: string) => {
    setActiveDrawerId(id);
  }, []);

  const closeDrawer = useCallback((id: string) => {
    setActiveDrawerId(prev => (prev === id ? null : prev));
  }, []);

  const toggleDrawer = useCallback((id: string) => {
    setActiveDrawerId(prev => (prev === id ? null : id));
  }, []);

  const isOpen = useCallback(
    (id: string) => activeDrawerId === id,
    [activeDrawerId],
  );

  const getWidth = useCallback(
    (id: string) => widths.get(id) ?? DEFAULT_WIDTH,
    [widths],
  );

  const setWidth = useCallback((id: string, width: number) => {
    setWidths(prev => {
      const next = new Map(prev);
      next.set(id, width);
      return next;
    });
  }, []);

  const api = useMemo<AppDrawerApi>(
    () => ({
      openDrawer,
      closeDrawer,
      toggleDrawer,
      isOpen,
      activeDrawerId,
      getWidth,
      setWidth,
    }),
    [
      openDrawer,
      closeDrawer,
      toggleDrawer,
      isOpen,
      activeDrawerId,
      getWidth,
      setWidth,
    ],
  );

  return (
    <AppDrawerContext.Provider value={api}>
      {children}
    </AppDrawerContext.Provider>
  );
};

/**
 * Hook to access the app drawer API. Returns a no-op implementation if used
 * outside AppDrawerProvider, so it's safe to call unconditionally.
 *
 * @public
 */
export const useAppDrawer = (): AppDrawerApi => {
  return useContext(AppDrawerContext);
};
