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

import type { CSSProperties, ReactNode } from 'react';
import { useEffect } from 'react';
import { createPortal } from 'react-dom';

import { Box } from '@backstage/ui';

import {
  bulkImportDrawerScrimColor,
  bulkImportDrawerZIndex,
  bulkImportOpaqueSurfaceColor,
} from './bulkImportSurfaces';
import { injectPreviewDrawerFieldStyles } from './PreviewFile/previewDrawerFieldStyles';

const drawerPanelStyle = (paperWidth: string): CSSProperties => ({
  position: 'absolute',
  top: 0,
  right: 0,
  bottom: 0,
  width: paperWidth,
  minWidth: 280,
  maxWidth: '100%',
  display: 'flex',
  flexDirection: 'column',
  boxSizing: 'border-box',
  overflow: 'hidden',
  backgroundColor: bulkImportOpaqueSurfaceColor,
  borderInlineStart:
    '1px solid var(--bui-border-1, var(--pf-t--global--border--color--default))',
  boxShadow: 'var(--bui-shadow-2, var(--pf-t--global--box-shadow--md))',
  pointerEvents: 'auto',
});

/**
 * Right-anchored modal side panel (portal). Uses an opaque PF primary surface
 * and full-viewport scrim so page content cannot show through the panel.
 */
export const BulkImportRightDrawer = ({
  open,
  onClose,
  children,
  paperWidth = '40%',
  testId,
  variant = 'temporary',
}: {
  open: boolean;
  onClose: () => void;
  children: ReactNode;
  paperWidth?: string;
  testId?: string;
  /** `temporary` shows scrim and closes on outside click; `persistent` is panel-only. */
  variant?: 'persistent' | 'temporary';
}) => {
  useEffect(() => {
    injectPreviewDrawerFieldStyles();
  }, []);

  useEffect(() => {
    if (!open) {
      return undefined;
    }
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [open, onClose]);

  useEffect(() => {
    if (!open) {
      return undefined;
    }
    const { overflow } = document.body.style;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = overflow;
    };
  }, [open]);

  if (!open) {
    return null;
  }

  const showScrim = variant === 'temporary';

  const drawer = (
    <div
      className="bulk-import-right-drawer"
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: bulkImportDrawerZIndex,
        pointerEvents: 'auto',
      }}
      data-testid={testId}
    >
      {showScrim && (
        <button
          type="button"
          aria-label="Close drawer"
          data-testid={testId ? `${testId}-backdrop` : undefined}
          onClick={onClose}
          style={{
            position: 'absolute',
            inset: 0,
            margin: 0,
            padding: 0,
            border: 'none',
            cursor: 'default',
            backgroundColor: bulkImportDrawerScrimColor,
          }}
        />
      )}
      <aside
        className="bulk-import-right-drawer__panel"
        role="dialog"
        aria-modal={showScrim ? true : undefined}
        style={drawerPanelStyle(paperWidth)}
      >
        <Box
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
            backgroundColor: bulkImportOpaqueSurfaceColor,
          }}
        >
          {children}
        </Box>
      </aside>
    </div>
  );

  return createPortal(drawer, document.body);
};
