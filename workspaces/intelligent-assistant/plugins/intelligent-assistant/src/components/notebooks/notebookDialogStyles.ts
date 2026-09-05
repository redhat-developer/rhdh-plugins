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

import type { SxProps, Theme } from '@mui/material/styles';
import type { SystemStyleObject } from '@mui/system';

export const notebookDialogPaperSx = (
  isCompact: boolean,
): SystemStyleObject<Theme> => ({
  borderRadius: isCompact ? '12px' : '24px',
  maxWidth: isCompact ? 300 : 578,
});

export const notebookDialogTitleSx = (
  isCompact: boolean,
): SystemStyleObject<Theme> => ({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  p: isCompact ? '16px 16px 12px !important' : '24px 24px 16px',
});

export const notebookDialogTitleTextSx = (
  isCompact: boolean,
): SystemStyleObject<Theme> => ({
  fontWeight: isCompact ? 600 : 500,
  fontSize: isCompact ? '1.125rem' : '1.25rem',
  lineHeight: isCompact ? '1.5rem' : '1.625rem',
  letterSpacing: '-0.25px',
});

export const notebookDialogCloseButtonSx = {
  color: 'text.primary',
} as const;

export const notebookDialogContentSx = (
  isCompact: boolean,
): SystemStyleObject<Theme> => ({
  p: isCompact ? '0 16px 16px !important' : '0 24px 24px',
});

export const notebookDialogActionsSx = (
  isCompact: boolean,
): SystemStyleObject<Theme> => ({
  justifyContent: 'flex-start',
  p: isCompact ? '12px 16px !important' : '16px 24px',
  gap: 1,
});

/** Narrow Dialog Paper `sx` so it can sit in an `sx={[...]}` array. */
export const optionalStyle = (
  sx: SxProps<Theme> | undefined,
): SystemStyleObject<Theme> | false => {
  if (!sx || typeof sx === 'function' || Array.isArray(sx)) {
    return false;
  }
  return sx as SystemStyleObject<Theme>;
};
