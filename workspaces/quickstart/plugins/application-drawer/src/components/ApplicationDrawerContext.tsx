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
 * Type for a drawer context
 *
 * @public
 */
export type DrawerContext = {
  id: string;
  isDrawerOpen: boolean;
  drawerWidth?: number;
  setDrawerWidth?: React.Dispatch<React.SetStateAction<number>>;
};

/**
 * Type for ApplicationDrawerContext
 *
 * @public
 */
export type ApplicationDrawerContextType = {
  addDrawerContext: (
    id: string,
    context: {
      isDrawerOpen: boolean;
      drawerWidth?: number;
      setDrawerWidth?: React.Dispatch<React.SetStateAction<number>>;
    },
  ) => void;
  getDrawers: () => DrawerContext[];
};

/**
 * Context for the Application Drawer
 *
 * Allows drawer providers (Quickstart, Lightspeed, etc.) to register
 * themselves so ApplicationDrawer can render the active one.
 *
 * @public
 */
export const ApplicationDrawerContext = createContext<
  ApplicationDrawerContextType | undefined
>(undefined);

/**
 * Hook to access the ApplicationDrawerContext
 *
 * @public
 */
export const useApplicationDrawerContext = (): ApplicationDrawerContextType => {
  const context = useContext(ApplicationDrawerContext);
  if (!context) {
    throw new Error(
      'useApplicationDrawerContext must be used within an ApplicationDrawerProvider',
    );
  }
  return context;
};
