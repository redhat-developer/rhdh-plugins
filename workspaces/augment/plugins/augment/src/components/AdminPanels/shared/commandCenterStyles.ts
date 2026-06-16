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
import {
  layout,
  typeScale,
  typography as typographyTokens,
  subtleBorder as canonicalSubtleBorder,
  surface,
} from '../../../theme/tokens';

export const CONTENT_MAX_WIDTH = layout.content.adminMaxWidth;

export const HOVER_TRANSITION =
  'background-color 0.15s ease, border-color 0.15s ease';

export const PAGE_TITLE_SX: SxProps<Theme> = {
  ...typeScale.pageTitle,
  color: 'text.primary',
};

export const PAGE_SUBTITLE_SX: SxProps<Theme> = {
  ...typeScale.bodySmall,
  color: 'text.secondary',
  mt: 0.25,
};

export const SECTION_LABEL_SX: SxProps<Theme> = {
  ...typeScale.micro,
  fontWeight: typographyTokens.fontWeight.semibold,
  textTransform: 'uppercase',
  color: 'text.secondary',
};

export const TABLE_HEADER_CELL_SX = {
  fontWeight: typographyTokens.fontWeight.semibold,
  fontSize: typeScale.caption.fontSize,
  textTransform: 'uppercase',
  letterSpacing: '0.02em',
  bgcolor: 'background.default',
} as const;

export const TABLE_CELL_NAME_SX = {
  fontWeight: typographyTokens.fontWeight.semibold,
  fontSize: typeScale.body.fontSize,
} as const;

export const CHIP_SX = {
  height: 24,
  fontSize: typeScale.caption.fontSize,
} as const;

function surfaceBg(theme: Theme): string {
  return surface(theme, 'raised');
}

/**
 * Returns a full CSS border declaration.
 * Delegates to the canonical subtleBorder from tokens.
 */
export function subtleBorder(theme: Theme): string {
  return canonicalSubtleBorder(theme, 'medium');
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
