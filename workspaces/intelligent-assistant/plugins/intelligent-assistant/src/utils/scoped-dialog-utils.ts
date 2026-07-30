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

export function getScopedDialogProps(isCompact: boolean): Partial<DialogProps> {
  if (!isCompact) return {};
  return {
    disablePortal: true,
    disableScrollLock: true,
    fullWidth: true,
    maxWidth: false,
    sx: {
      position: 'absolute',
      inset: 0,
      margin: 0,
      // padding: 0,
      '& [class*="Backdrop-root"]': {
        position: 'absolute',
      },
    },
    PaperProps: {
      sx: {
        margin: '24px !important',
        borderRadius: '12px !important',
        width: 'calc(100% - 48px) !important',
        maxWidth: 'calc(100% - 48px) !important',
        maxHeight: 'calc(100% - 48px) !important',
        overflowX: 'hidden',
        overflowY: 'auto',
        boxSizing: 'border-box',
      },
    },
  };
}
