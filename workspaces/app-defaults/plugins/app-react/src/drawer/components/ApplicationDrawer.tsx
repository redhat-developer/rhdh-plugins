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

import { useEffect, useRef } from 'react';

import { useAppDrawer } from '../hooks/useAppDrawer';
import { DrawerPanel } from './DrawerPanel';
import type { AppDrawerContent } from '../types';

const DEFAULT_WIDTH = 500;

/**
 * Props for {@link ApplicationDrawer}.
 *
 * @public
 */
export interface ApplicationDrawerProps {
  /** The main app content that will shift when a drawer opens. */
  children: React.ReactNode;
  /** Drawer content descriptors contributed by plugins. */
  contents: AppDrawerContent[];
}

/**
 * Wraps the main app content and renders the active drawer beside it.
 * Shifts the content area via margin-right so the persistent drawer
 * doesn't overlay the page.
 *
 * @public
 */
export const ApplicationDrawer = ({
  children,
  contents,
}: ApplicationDrawerProps) => {
  const { activeDrawerId, getWidth, setWidth } = useAppDrawer();
  const initializedRef = useRef<Set<string>>(new Set());

  useEffect(() => {
    contents.forEach(c => {
      if (
        c.defaultWidth &&
        !initializedRef.current.has(c.id) &&
        getWidth(c.id) === DEFAULT_WIDTH
      ) {
        initializedRef.current.add(c.id);
        setWidth(c.id, c.defaultWidth);
      }
    });
  }, [contents, getWidth, setWidth]);

  const activeContent = contents.find(c => c.id === activeDrawerId);
  const isOpen = !!activeContent;
  const width = activeDrawerId ? getWidth(activeDrawerId) : 0;

  useEffect(() => {
    if (isOpen) {
      document.body.classList.add('docked-drawer-open');
      document.body.style.setProperty('--docked-drawer-width', `${width}px`);
      return () => {
        document.body.classList.remove('docked-drawer-open');
        document.body.style.removeProperty('--docked-drawer-width');
      };
    }
    return undefined;
  }, [isOpen, width]);

  return (
    <>
      <div
        style={{
          transition: `margin-right 225ms cubic-bezier(${
            isOpen ? '0, 0, 0.2, 1' : '0.4, 0, 0.6, 1'
          })`,
          marginRight: isOpen ? `${width}px` : undefined,
        }}
      >
        {children}
      </div>
      {contents.length > 0 && (
        <DrawerPanel
          isDrawerOpen={isOpen}
          isResizable={activeContent?.resizable ?? false}
          drawerWidth={width}
          onWidthChange={w => activeDrawerId && setWidth(activeDrawerId, w)}
        >
          {activeContent?.element}
        </DrawerPanel>
      )}
    </>
  );
};
