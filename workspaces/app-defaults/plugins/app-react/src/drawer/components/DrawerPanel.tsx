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

import { useCallback, useEffect, useRef } from 'react';

import Box from '@mui/material/Box';
import Drawer from '@mui/material/Drawer';

/**
 * Props for {@link DrawerPanel}.
 *
 * @public
 */
export interface DrawerPanelProps {
  /** Content rendered inside the drawer panel. */
  children: React.ReactNode;
  /** Whether the drawer is currently visible. */
  isDrawerOpen: boolean;
  /** Enable a drag handle on the left edge for resizing. */
  isResizable?: boolean;
  /** Current width of the drawer in pixels. */
  drawerWidth?: number;
  /** Called with the new width when the user drags the resize handle. */
  onWidthChange?: (width: number) => void;
  /** Minimum width the drawer can be resized to. */
  minWidth?: number;
  /** Maximum width the drawer can be resized to. */
  maxWidth?: number;
}

const DRAG_HANDLE_WIDTH = 6;

/**
 * Persistent right-anchored drawer panel. Supports optional drag-to-resize.
 *
 * @public
 */
export const DrawerPanel = (props: DrawerPanelProps) => {
  const {
    children,
    isDrawerOpen,
    isResizable = false,
    drawerWidth = 400,
    onWidthChange,
    minWidth = 400,
    maxWidth = 800,
  } = props;

  const dragging = useRef(false);
  const onWidthChangeRef = useRef(onWidthChange);
  const cleanupRef = useRef<(() => void) | null>(null);

  useEffect(() => {
    onWidthChangeRef.current = onWidthChange;
  });

  useEffect(() => {
    return () => {
      cleanupRef.current?.();
    };
  }, [isDrawerOpen]);

  const handleMouseDown = useCallback(
    (e: React.MouseEvent) => {
      if (!isResizable || !onWidthChangeRef.current) return;
      e.preventDefault();
      cleanupRef.current?.();
      dragging.current = true;

      const handleMouseMove = (moveEvent: MouseEvent) => {
        if (!dragging.current) return;
        const newWidth = Math.min(
          maxWidth,
          Math.max(minWidth, window.innerWidth - moveEvent.clientX),
        );
        onWidthChangeRef.current?.(newWidth);
      };

      const handleMouseUp = () => {
        dragging.current = false;
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
        cleanupRef.current = null;
      };

      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      cleanupRef.current = handleMouseUp;
    },
    [isResizable, minWidth, maxWidth],
  );

  return (
    <Drawer
      anchor="right"
      variant="persistent"
      open={isDrawerOpen}
      PaperProps={{
        style: { width: drawerWidth },
        sx: {
          boxSizing: 'border-box',
          backgroundColor: (theme: Record<string, any>) => {
            const palette = theme.palette as Record<string, any>;
            return (
              palette?.rhdh?.general?.sidebarBackgroundColor ||
              theme.palette.background.paper
            );
          },
          justifyContent: 'space-between',
        },
      }}
    >
      {isResizable && (
        <Box
          onMouseDown={handleMouseDown}
          sx={{
            position: 'absolute',
            top: 0,
            left: 0,
            bottom: 0,
            width: DRAG_HANDLE_WIDTH,
            cursor: 'col-resize',
            zIndex: 1,
            '&:hover': {
              backgroundColor: 'action.hover',
            },
          }}
          data-testid="drawer-resize-handle"
        />
      )}
      <Box sx={{ height: '100%', position: 'relative' }}>{children}</Box>
    </Drawer>
  );
};
