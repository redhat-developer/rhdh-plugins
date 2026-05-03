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

/**
 * Command Center shared styles.
 * All visual treatment for ops panels lives here -- fully customizable.
 */

import type { Theme, SxProps } from '@mui/material/styles';
import { alpha } from '@mui/material/styles';
import { CONTENT_MAX_WIDTH, SECTION_GAP, CARD_GAP } from './commandcenter.constants';

export function pageSx(): SxProps<Theme> {
  return {
    maxWidth: CONTENT_MAX_WIDTH,
    width: '100%',
    mx: 'auto',
    display: 'flex',
    flexDirection: 'column',
    gap: SECTION_GAP,
  };
}

export function sectionCardSx(theme: Theme, isDark: boolean): SxProps<Theme> {
  return {
    p: 3,
    borderRadius: 2.5,
    bgcolor: isDark ? alpha(theme.palette.background.paper, 0.5) : theme.palette.background.paper,
    border: `1px solid ${alpha(isDark ? theme.palette.common.white : theme.palette.common.black, isDark ? 0.07 : 0.05)}`,
    boxShadow: isDark ? `0 1px 4px ${alpha('#000', 0.15)}` : `0 1px 4px ${alpha('#000', 0.03)}`,
  };
}

export function statRowSx(): SxProps<Theme> {
  return {
    display: 'grid',
    gridTemplateColumns: { xs: 'repeat(2, 1fr)', md: 'repeat(4, 1fr)' },
    gap: CARD_GAP,
    overflow: 'hidden',
    minWidth: 0,
  };
}

export function twoColumnSx(): SxProps<Theme> {
  return {
    display: 'grid',
    gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' },
    gap: CARD_GAP,
    alignItems: 'stretch',
  };
}

export function actionBadgeSx(_theme: Theme, color: string, isDark: boolean): SxProps<Theme> {
  return {
    display: 'inline-flex',
    alignItems: 'center',
    gap: 0.75,
    px: 1.5,
    py: 0.5,
    borderRadius: 2,
    bgcolor: alpha(color, isDark ? 0.15 : 0.08),
    color,
    fontWeight: 600,
    fontSize: '0.8rem',
    cursor: 'pointer',
    transition: 'all 0.15s ease',
    '&:hover': {
      bgcolor: alpha(color, isDark ? 0.25 : 0.12),
    },
  };
}

export function reviewCardSx(theme: Theme, isDark: boolean): SxProps<Theme> {
  return {
    p: 2.5,
    borderRadius: 2,
    border: `1px solid ${alpha(isDark ? theme.palette.common.white : theme.palette.common.black, isDark ? 0.08 : 0.06)}`,
    bgcolor: isDark ? alpha(theme.palette.background.paper, 0.4) : theme.palette.background.paper,
    display: 'flex',
    alignItems: 'center',
    gap: 2,
    transition: 'all 0.2s ease',
    '&:hover': {
      borderColor: alpha(theme.palette.primary.main, isDark ? 0.3 : 0.2),
      boxShadow: `0 4px 12px ${alpha(theme.palette.primary.main, isDark ? 0.1 : 0.05)}`,
    },
  };
}

export function pageTitleSx(theme: Theme): SxProps<Theme> {
  return {
    fontWeight: 800,
    fontSize: '1.5rem',
    letterSpacing: '-0.02em',
    color: theme.palette.text.primary,
    mb: 0.5,
  };
}

export function pageSubtitleSx(theme: Theme): SxProps<Theme> {
  return {
    fontSize: '0.85rem',
    color: theme.palette.text.secondary,
  };
}
