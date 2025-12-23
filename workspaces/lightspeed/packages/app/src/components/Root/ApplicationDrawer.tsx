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
  ComponentType,
  useState,
  useCallback,
  useMemo,
  useEffect,
} from 'react';
import { CustomDrawer } from './CustomDrawer';

/**
 * Partial drawer state exposed by drawer plugins
 *
 * @public
 */
export interface DrawerPartialState {
  id: string;
  isDrawerOpen: boolean;
  drawerWidth: number;
  setDrawerWidth: (width: number) => void;
}

/**
 * Props for drawer state exposer components
 *
 * @public
 */
export interface DrawerStateExposerProps {
  onStateChange: (state: DrawerPartialState) => void;
  onUnmount?: (id: string) => void;
}

/**
 * Drawer content configuration
 */
type DrawerContentType = {
  id: string;
  Component: ComponentType<any>;
  priority?: number;
};

/**
 * State exposer component type
 */
type StateExposerType = {
  Component: ComponentType<DrawerStateExposerProps>;
};

export interface ApplicationDrawerProps {
  /**
   * Array of drawer content configurations
   * Maps drawer IDs to their content components
   */
  drawerContents: DrawerContentType[];
  /**
   * Array of state exposer components from drawer plugins
   * These are typically mounted via `application/drawer-state` mount point
   *
   * In RHDH dynamic plugins, this would come from:
   * ```yaml
   * mountPoints:
   *   - mountPoint: application/drawer-state
   *     importName: TestDrawerStateExposer
   * ```
   */
  stateExposers?: StateExposerType[];
}

export const ApplicationDrawer = ({
  drawerContents,
  stateExposers = [],
}: ApplicationDrawerProps) => {
  // Collect drawer states from all state exposers
  const [drawerStates, setDrawerStates] = useState<
    Record<string, DrawerPartialState>
  >({});

  // Callback for state exposers to report their state
  const handleStateChange = useCallback((state: DrawerPartialState) => {
    setDrawerStates(prev => {
      // Only update if something actually changed
      const existing = prev[state.id];
      if (
        existing &&
        existing.isDrawerOpen === state.isDrawerOpen &&
        existing.drawerWidth === state.drawerWidth &&
        existing.setDrawerWidth === state.setDrawerWidth
      ) {
        return prev;
      }
      return { ...prev, [state.id]: state };
    });
  }, []);

  // Convert states record to array
  const statesArray = useMemo(
    () => Object.values(drawerStates),
    [drawerStates],
  );

  // Get active drawer - find the open drawer with highest priority
  const activeDrawer = useMemo(() => {
    return statesArray
      .filter(state => state.isDrawerOpen)
      .map(state => {
        const content = drawerContents.find(c => c.id === state.id);
        if (!content) return null;
        return { ...state, ...content };
      })
      .filter(Boolean)
      .sort((a, b) => (b?.priority ?? -1) - (a?.priority ?? -1))[0];
  }, [statesArray, drawerContents]);

  // Manage CSS classes and variables for layout adjustments
  useEffect(() => {
    if (activeDrawer) {
      const className = `docked-drawer-open`;
      const cssVar = `--docked-drawer-width`;

      document.body.classList.add(className);
      document.body.style.setProperty(cssVar, `${activeDrawer.drawerWidth}px`);

      return () => {
        document.body.classList.remove(className);
        document.body.style.removeProperty(cssVar);
      };
    }
    return undefined;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeDrawer?.id, activeDrawer?.drawerWidth]);

  // Wrapper to handle the width change callback type
  const handleWidthChange = useCallback(
    (width: number) => {
      activeDrawer?.setDrawerWidth(width);
    },
    [activeDrawer],
  );

  return (
    <>
      {/* Render all state exposers - they return null but report their state */}
      {stateExposers.map(({ Component }, index) => (
        <Component
          key={`${index}-${Component.displayName}`}
          onStateChange={handleStateChange}
        />
      ))}

      {/* Render the active drawer */}
      {activeDrawer && (
        <CustomDrawer
          isDrawerOpen
          drawerWidth={activeDrawer.drawerWidth}
          onWidthChange={handleWidthChange}
        >
          <activeDrawer.Component />
        </CustomDrawer>
      )}
    </>
  );
};
