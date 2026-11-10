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

import type { ReactNode } from 'react';
import { useEffect } from 'react';
import { createPortal } from 'react-dom';

import { Box } from '@backstage/ui';

import {
  Backdrop,
  Drawer,
  DrawerContent,
  DrawerPanelContent,
} from '@patternfly/react-core';

import { injectPreviewDrawerFieldStyles } from './PreviewFile/previewDrawerFieldStyles';

const drawerPanelSurfaceStyle = {
  display: 'flex',
  flexDirection: 'column' as const,
  boxSizing: 'border-box' as const,
  width: '100%',
  minWidth: 0,
  maxWidth: '100%',
  height: '100vh',
  maxHeight: '100vh',
  overflowX: 'hidden' as const,
  overflowY: 'hidden' as const,
  /**
   * PF panel defaults to a floating surface token that can read as translucent in
   * RHDH; match the former MUI drawer paper with an opaque app surface.
   */
  backgroundColor:
    'var(--bui-bg-neutral-1, var(--pf-t--global--background--color--primary--default))',
  borderInlineStart:
    '1px solid var(--bui-border-1, var(--pf-t--global--border--color--default))',
  boxShadow: 'var(--bui-shadow-2, var(--pf-t--global--box-shadow--md))',
  pointerEvents: 'auto' as const,
};

/**
 * Right-anchored overlay panel using PatternFly viewport drawer.
 */
export const BulkImportRightDrawer = ({
  open,
  onClose,
  children,
  paperWidth = '40%',
  testId,
  variant = 'persistent',
}: {
  open: boolean;
  onClose: () => void;
  children: ReactNode;
  paperWidth?: string;
  testId?: string;
  variant?: 'persistent' | 'temporary';
}) => {
  useEffect(() => {
    injectPreviewDrawerFieldStyles();
  }, []);

  useEffect(() => {
    if (variant !== 'temporary' || !open) {
      return undefined;
    }
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [variant, open, onClose]);

  const drawer = (
    <>
      {variant === 'temporary' && (
        <Backdrop
          isVisible={open}
          onClick={onClose}
          data-testid={testId ? `${testId}-backdrop` : undefined}
        />
      )}
      <Drawer isExpanded={open} isViewport position="end" data-testid={testId}>
        <DrawerContent
          style={{ pointerEvents: 'none' }}
          panelContent={
            <DrawerPanelContent
              defaultSize={paperWidth}
              minSize="280px"
              maxSize="100%"
              hasNoBorder
              style={drawerPanelSurfaceStyle}
              focusTrap={
                variant === 'temporary' && open ? { enabled: true } : undefined
              }
            >
              <Box
                bg="neutral"
                className="bulk-import-right-drawer-content"
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  flex: 1,
                  minHeight: 0,
                  minWidth: 0,
                  width: '100%',
                  maxWidth: '100%',
                  height: '100%',
                  maxHeight: '100vh',
                  overflow: 'hidden',
                  boxSizing: 'border-box',
                }}
              >
                {children}
              </Box>
            </DrawerPanelContent>
          }
        />
      </Drawer>
    </>
  );

  return createPortal(drawer, document.body);
};
