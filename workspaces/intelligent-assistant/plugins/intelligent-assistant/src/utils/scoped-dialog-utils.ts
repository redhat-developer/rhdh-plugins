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

import type { DialogProps } from '@mui/material/Dialog';
import type { SxProps, Theme } from '@mui/material/styles';

export type ScopedDialogPlacement = 'center' | 'top-right';

const topRightContainerSx = {
  '& .MuiDialog-container': {
    alignItems: 'flex-start',
    justifyContent: 'flex-end',
    padding: '16px',
  },
} as const;

export function getScopedDialogProps(
  isCompact: boolean,
  options?: { placement?: ScopedDialogPlacement },
): Partial<DialogProps> {
  const placement = options?.placement ?? 'center';
  const placementSx: SxProps<Theme> | undefined =
    placement === 'top-right' ? topRightContainerSx : undefined;

  if (!isCompact) {
    return placementSx ? { sx: placementSx } : {};
  }

  return {
    disablePortal: true,
    disableScrollLock: true,
    fullWidth: true,
    maxWidth: false,
    sx: {
      position: 'absolute',
      inset: 0,
      margin: 0,
      '& [class*="Backdrop-root"]': {
        position: 'absolute',
      },
      ...(placement === 'top-right' ? topRightContainerSx : {}),
    },
    PaperProps: {
      sx: {
        marginTop: '16px !important',
        marginBottom:
          placement === 'top-right' ? 'auto !important' : '16px !important',
        marginLeft:
          placement === 'top-right' ? 'auto !important' : '40px !important',
        marginRight:
          placement === 'top-right' ? '16px !important' : '40px !important',
        borderRadius: '12px !important',
        width:
          placement === 'top-right'
            ? 'min(400px, calc(100% - 32px)) !important'
            : 'calc(100% - 80px) !important',
        maxWidth:
          placement === 'top-right'
            ? 'min(400px, calc(100% - 32px)) !important'
            : 'min(480px, calc(100% - 80px)) !important',
        maxHeight: 'calc(100% - 32px) !important',
        overflowX: 'hidden',
        overflowY: 'auto',
        boxSizing: 'border-box',
      },
    },
  };
}
