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

import type { Theme, SxProps } from '@mui/material/styles';
import { alpha } from '@mui/material/styles';

export const CONTENT_MAX_WIDTH = 1200;

export const HOVER_TRANSITION =
  'background-color 0.15s ease, border-color 0.15s ease';

export const PAGE_TITLE_SX: SxProps<Theme> = {
  fontWeight: 700,
  letterSpacing: '-0.01em',
  color: 'text.primary',
};

export const PAGE_SUBTITLE_SX: SxProps<Theme> = {
  color: 'text.secondary',
  mt: 0.25,
};

export const SECTION_LABEL_SX: SxProps<Theme> = {
  fontSize: '0.75rem',
  fontWeight: 600,
  letterSpacing: '0.04em',
  textTransform: 'uppercase',
  color: 'text.secondary',
};

export const TABLE_HEADER_CELL_SX = {
  fontWeight: 600,
  fontSize: '0.8125rem',
  textTransform: 'uppercase',
  letterSpacing: '0.04em',
  bgcolor: 'background.default',
} as const;

export const TABLE_CELL_NAME_SX = {
  fontWeight: 600,
  fontSize: '0.875rem',
} as const;

export const CHIP_SX = {
  height: 24,
  fontSize: '0.75rem',
} as const;

function surfaceBg(theme: Theme): string {
  const isDark = theme.palette.mode === 'dark';
  return isDark
    ? theme.palette.background.paper
    : alpha(theme.palette.background.paper, 0.6);
}

export function subtleBorder(theme: Theme): string {
  const isDark = theme.palette.mode === 'dark';
  return `1px solid ${alpha(theme.palette.divider, isDark ? 0.4 : 1)}`;
}

export function cardOutlineSx(theme: Theme): SxProps<Theme> {
  return {
    border: subtleBorder(theme),
    bgcolor: surfaceBg(theme),
  };
}

export function sectionCardSx(theme: Theme): SxProps<Theme> {
  return {
    bgcolor: surfaceBg(theme),
    border: subtleBorder(theme),
    borderRadius: 2,
    p: 2.5,
  };
}

export function tableContainerSx(theme: Theme): SxProps<Theme> {
  return {
    border: subtleBorder(theme),
    borderRadius: 2,
    bgcolor: surfaceBg(theme),
  };
}

export function emptyStateSx(theme: Theme): SxProps<Theme> {
  return {
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center',
    alignItems: 'center',
    py: 8,
    border: `1px dashed ${alpha(theme.palette.divider, 0.3)}`,
    borderRadius: 2,
    bgcolor: surfaceBg(theme),
    gap: 2,
  };
}
