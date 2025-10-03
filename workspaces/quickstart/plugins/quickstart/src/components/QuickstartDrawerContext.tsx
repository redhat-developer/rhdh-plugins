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

import { createContext } from 'react';
import { UserRole } from '../types';

/**
 * Type for QuickstartDrawerContext
 *
 *  @public
 */
export interface QuickstartDrawerContextType {
  /**
   * The prop to check if the drawer is open
   */
  isDrawerOpen: boolean;
  /**
   * The function to open the drawer
   */
  openDrawer: () => void;
  /**
   * The function to close the drawer
   */
  closeDrawer: () => void;
  /**
   * The function to toggle the drawer state
   */
  toggleDrawer: () => void;
  /**
   * The prop for drawer width
   */
  drawerWidth: number;
  /**
   * The function for setting the drawer width
   */
  setDrawerWidth: React.Dispatch<React.SetStateAction<number>>;
  /**
   * The user's role for quickstart functionality
   */
  userRole: UserRole | null;
  /**
   * Whether the role is still loading
   */
  roleLoading: boolean;
}

/**
 * @public
 */
export const QuickstartDrawerContext = createContext<
  QuickstartDrawerContextType | undefined
>(undefined);
