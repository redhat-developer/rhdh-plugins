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

import { useEffect } from 'react';
import { useTestDrawerContext } from './TestDrawerContext';

/**
 * Partial Test drawer state exposed to the ApplicationDrawer
 *
 * @public
 */
export type DrawerState = {
  id: string;
  isDrawerOpen: boolean;
  drawerWidth: number;
  setDrawerWidth: (width: number) => void;
};

/**
 * Props for drawer state exposer components
 *
 * @public
 */
export type DrawerStateExposerProps = {
  /**
   * Callback called whenever the drawer state changes
   */
  onStateChange: (state: DrawerState) => void;
};

/**
 * This exposes TestDrawer's partial context to the ApplicationDrawer
 *
 * It reads the TestDrawerContext and calls the onStateChange callback with the
 * partial state (id, isDrawerOpen, drawerWidth, setDrawerWidth).
 *
 * @public
 */
export const TestDrawerStateExposer = ({
  onStateChange,
}: DrawerStateExposerProps) => {
  const { id, isDrawerOpen, drawerWidth, setDrawerWidth } =
    useTestDrawerContext();

  useEffect(() => {
    onStateChange({
      id,
      isDrawerOpen,
      drawerWidth,
      setDrawerWidth,
    });
  }, [id, isDrawerOpen, drawerWidth, onStateChange, setDrawerWidth]);

  return null;
};
