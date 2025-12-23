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

import { PropsWithChildren, useState, useCallback } from 'react';
import { TestDrawerContext } from './TestDrawerContext';

const DRAWER_ID = 'test-drawer';
const DEFAULT_DRAWER_WIDTH = 400;
const MIN_DRAWER_WIDTH = 300;
const MAX_DRAWER_WIDTH = 800;

/**
 * Provider component for the Test Drawer functionality
 *
 * @public
 */
export const TestDrawerProvider = ({ children }: PropsWithChildren) => {
  const [isDrawerOpen, setIsDrawerOpen] = useState<boolean>(false);
  const [drawerWidth, setDrawerWidth] = useState<number>(DEFAULT_DRAWER_WIDTH);

  const toggleDrawer = useCallback(() => {
    setIsDrawerOpen(prev => !prev);
  }, []);

  // Constrain drawer width to min/max bounds
  const handleSetDrawerWidth: React.Dispatch<React.SetStateAction<number>> =
    useCallback(value => {
      setDrawerWidth(prev => {
        const newWidth = typeof value === 'function' ? value(prev) : value;
        return Math.min(MAX_DRAWER_WIDTH, Math.max(MIN_DRAWER_WIDTH, newWidth));
      });
    }, []);

  return (
    <TestDrawerContext.Provider
      value={{
        id: DRAWER_ID,
        isDrawerOpen,
        toggleDrawer,
        drawerWidth,
        setDrawerWidth: handleSetDrawerWidth,
      }}
    >
      {children}
    </TestDrawerContext.Provider>
  );
};
