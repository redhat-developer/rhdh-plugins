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
  useRef,
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
  closeDrawer: () => void;
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
   * These are typically mounted via `application/internal/drawer-state` mount point
   *
   * In RHDH dynamic plugins, this would come from:
   * ```yaml
   * mountPoints:
   *   - mountPoint: application/internal/drawer-state
   *     importName: TestDrawerStateExposer
   * ```
   */
  stateExposers?: StateExposerType[];
}

export const ApplicationDrawer = ({
  drawerContents,
  stateExposers = [],
}: ApplicationDrawerProps) => {
  const drawerStatesRef = useRef<Map<string, DrawerPartialState>>(new Map());
  const [activeDrawerId, setActiveDrawerId] = useState<string | null>(null);

  const handleStateChange = useCallback(
    (state: DrawerPartialState) => {
      const prev = drawerStatesRef.current.get(state.id);

      // If drawer just opened then make it the active drawer
      if (!prev?.isDrawerOpen && state.isDrawerOpen) {
        setActiveDrawerId(state.id);
      }
      // If drawer just closed and it was the active one, clear active drawer
      else if (
        prev?.isDrawerOpen &&
        !state.isDrawerOpen &&
        state.id === activeDrawerId
      ) {
        setActiveDrawerId(null);
      }

      drawerStatesRef.current.set(state.id, state);
    },
    [activeDrawerId],
  );

  const drawerStates = Array.from(drawerStatesRef.current.values());

  const allDrawers = useMemo(
    () =>
      drawerStates
        .map(state => {
          const content = drawerContents.find(c => c.id === state.id);
          if (!content) return null;

          return {
            state,
            Component: content.Component,
            priority: content.priority,
          };
        })
        .filter(Boolean),
    [drawerStates, drawerContents],
  );

  const activeDrawer =
    allDrawers.find(d => d?.state.id === activeDrawerId) || null;

  // Close all other drawers when one becomes active
  useEffect(() => {
    if (activeDrawerId) {
      drawerStates.forEach(state => {
        if (state.id !== activeDrawerId && state.isDrawerOpen) {
          state.closeDrawer();
        }
      });
    }
  }, [activeDrawerId, drawerStates]);

  // Manage CSS classes and variables for layout adjustments
  useEffect(() => {
    if (activeDrawer) {
      const className = 'docked-drawer-open';
      const cssVar = '--docked-drawer-width';

      document.body.classList.add(className);
      document.body.style.setProperty(
        cssVar,
        `${activeDrawer.state.drawerWidth}px`,
      );

      return () => {
        document.body.classList.remove(className);
        document.body.style.removeProperty(cssVar);
      };
    }
    return undefined;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeDrawer?.state.id, activeDrawer?.state.drawerWidth]);

  return (
    <>
      {/* Render all state exposers - they return null but report their state */}
      {stateExposers.map(({ Component }, index) => (
        <Component
          key={`drawer-${Component.displayName || index}`}
          onStateChange={handleStateChange}
        />
      ))}

      {/* Render the active drawer */}
      {activeDrawer && (
        <CustomDrawer
          isDrawerOpen={activeDrawer.state.isDrawerOpen}
          drawerWidth={activeDrawer.state.drawerWidth}
          onWidthChange={activeDrawer.state.setDrawerWidth}
        >
          <activeDrawer.Component />
        </CustomDrawer>
      )}
    </>
  );
};
