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

import { createContext, useContext } from 'react';

/**
 * Type for TestDrawerContext
 *
 * @public
 */
export interface TestDrawerContextType {
  id: string;
  /**
   * Whether the drawer is open
   */
  isDrawerOpen: boolean;
  /**
   * Function to toggle the drawer state
   */
  toggleDrawer: () => void;
  /**
   * Current drawer width in pixels
   */
  drawerWidth: number;
  /**
   * Function to set the drawer width
   */
  setDrawerWidth: React.Dispatch<React.SetStateAction<number>>;
}

/**
 * Context for the Test Drawer
 *
 * @public
 */
export const TestDrawerContext = createContext<
  TestDrawerContextType | undefined
>(undefined);

/**
 * Hook to access the TestDrawerContext
 *
 * @public
 */
export const useTestDrawerContext = (): TestDrawerContextType => {
  const context = useContext(TestDrawerContext);
  if (!context) {
    throw new Error(
      'useTestDrawerContext must be used within a TestDrawerProvider',
    );
  }
  return context;
};

