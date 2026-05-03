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
 * Marketplace styles -- all visual treatment in one customizable file.
 * Override these to change the marketplace look without touching component logic.
 */

import type { Theme, SxProps } from '@mui/material/styles';
import { alpha } from '@mui/material/styles';

function scrollbarThumbGradient(isDark: boolean, intensity: 'normal' | 'hover' = 'normal') {
  const o = intensity === 'hover' ? (isDark ? 0.7 : 0.6) : (isDark ? 0.5 : 0.45);
  return isDark
    ? `linear-gradient(180deg, rgba(99,102,241,${o}) 0%, rgba(168,85,247,${o - 0.1}) 30%, rgba(236,72,153,${o - 0.1}) 60%, rgba(6,182,212,${o}) 100%)`
    : `linear-gradient(180deg, rgba(79,70,229,${o}) 0%, rgba(139,92,246,${o - 0.05}) 30%, rgba(219,39,119,${o - 0.1}) 60%, rgba(14,165,233,${o}) 100%)`;
}

function scrollbarGlow(isDark: boolean, intensity: 'normal' | 'hover' = 'normal') {
  if (intensity === 'hover') {
    return isDark
      ? '0 0 16px rgba(139,92,246,0.5), 0 0 4px rgba(236,72,153,0.3), inset 0 1px 3px rgba(255,255,255,0.4), inset 0 -1px 2px rgba(0,0,0,0.15)'
      : '0 0 12px rgba(79,70,229,0.35), 0 0 4px rgba(219,39,119,0.2), inset 0 1px 3px rgba(255,255,255,0.7), inset 0 -1px 2px rgba(0,0,0,0.08)';
  }
  return isDark
    ? '0 0 10px rgba(139,92,246,0.35), inset 0 1px 2px rgba(255,255,255,0.3), inset 0 -1px 2px rgba(0,0,0,0.1)'
    : '0 0 8px rgba(79,70,229,0.25), inset 0 1px 2px rgba(255,255,255,0.8), inset 0 -1px 2px rgba(0,0,0,0.05)';
}

function scrollbarBorder(isDark: boolean, intensity: 'normal' | 'hover' = 'normal') {
  const o = intensity === 'hover' ? (isDark ? 0.35 : 0.4) : (isDark ? 0.2 : 0.3);
  return `1px solid rgba(255,255,255,${o})`;
}
import { GRID_COLUMNS, GRID_GAP, HERO_PADDING, SEARCH_PADDING, MAX_WIDTH, CARD_HEIGHT, AVATAR_SIZE } from './marketplace.constants';

export function heroSx(theme: Theme, isDark: boolean): SxProps<Theme> {
  return {
    borderRadius: 3,
    p: HERO_PADDING,
    mb: 2.5,
    background: isDark
      ? `linear-gradient(145deg, ${alpha(theme.palette.primary.dark, 0.2)} 0%, ${alpha(theme.palette.background.paper, 0.8)} 100%)`
      : `linear-gradient(145deg, ${alpha(theme.palette.primary.main, 0.06)} 0%, ${alpha(theme.palette.background.paper, 0.97)} 100%)`,
    border: `1px solid ${alpha(isDark ? theme.palette.common.white : theme.palette.common.black, isDark ? 0.06 : 0.04)}`,
  };
}

export function searchBarSx(theme: Theme, isDark: boolean): SxProps<Theme> {
  return {
    display: 'flex',
    gap: 1.5,
    mb: 2,
    alignItems: 'center',
    flexWrap: 'wrap',
    ...SEARCH_PADDING,
    borderRadius: 2,
    bgcolor: alpha(theme.palette.background.paper, isDark ? 0.25 : 0.5),
    border: `1px solid ${alpha(theme.palette.divider, isDark ? 0.08 : 0.05)}`,
  };
}

export function gridContainerSx(isDark: boolean): SxProps<Theme> {
  return {
    display: 'grid',
    gridTemplateColumns: {
      xs: `repeat(${GRID_COLUMNS.xs}, 1fr)`,
      sm: `repeat(${GRID_COLUMNS.sm}, 1fr)`,
      md: `repeat(${GRID_COLUMNS.md}, 1fr)`,
      lg: `repeat(${GRID_COLUMNS.lg}, 1fr)`,
    },
    gap: GRID_GAP,
    alignContent: 'start',
    overflowY: 'auto',
    overflowX: 'hidden',
    pb: 1,
    scrollbarWidth: 'thin',
    scrollbarColor: 'transparent transparent',
    '&:hover': {
      scrollbarColor: isDark ? 'rgba(140,130,220,0.4) transparent' : 'rgba(99,102,241,0.35) transparent',
    },
    '&::-webkit-scrollbar': {
      width: 8,
      background: 'transparent',
    },
    '&::-webkit-scrollbar-thumb': {
      backgroundColor: 'transparent',
      borderRadius: 6,
    },
    '&:hover::-webkit-scrollbar-thumb': {
      background: scrollbarThumbGradient(isDark, 'normal'),
      borderRadius: 6,
      border: scrollbarBorder(isDark, 'normal'),
      boxShadow: scrollbarGlow(isDark, 'normal'),
      backdropFilter: 'blur(8px) saturate(150%)',
      WebkitBackdropFilter: 'blur(8px) saturate(150%)',
    },
    '&::-webkit-scrollbar-thumb:hover': {
      background: scrollbarThumbGradient(isDark, 'hover'),
      borderRadius: 6,
      border: scrollbarBorder(isDark, 'hover'),
      boxShadow: scrollbarGlow(isDark, 'hover'),
      backdropFilter: 'blur(12px) saturate(180%)',
      WebkitBackdropFilter: 'blur(12px) saturate(180%)',
    },
    '&::-webkit-scrollbar-track': {
      background: 'transparent',
      borderRadius: 6,
    },
    '&:hover::-webkit-scrollbar-track': {
      background: isDark ? 'rgba(139,92,246,0.04)' : 'rgba(79,70,229,0.03)',
      borderRadius: 6,
    },
  };
}

export function cardSx(theme: Theme, isDark: boolean, accentColor: string): SxProps<Theme> {
  return {
    minHeight: CARD_HEIGHT,
    display: 'flex',
    alignItems: 'stretch',
    borderRadius: 2,
    overflow: 'hidden',
    cursor: 'pointer',
    transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
    bgcolor: isDark ? alpha(theme.palette.background.paper, 0.5) : theme.palette.background.paper,
    border: `1px solid ${alpha(isDark ? theme.palette.common.white : theme.palette.common.black, isDark ? 0.07 : 0.05)}`,
    boxShadow: isDark ? `0 1px 4px ${alpha('#000', 0.15)}` : `0 1px 4px ${alpha('#000', 0.03)}`,
    '&:hover': {
      transform: 'translateY(-2px)',
      borderColor: alpha(accentColor, isDark ? 0.35 : 0.25),
      boxShadow: isDark
        ? `0 6px 20px ${alpha('#000', 0.3)}, 0 0 0 1px ${alpha(accentColor, 0.15)}`
        : `0 6px 20px ${alpha('#000', 0.06)}, 0 0 0 1px ${alpha(accentColor, 0.12)}`,
    },
  };
}

export function cardAccentSx(accentColor: string, isReady: boolean): SxProps<Theme> {
  return {
    width: 3,
    flexShrink: 0,
    background: isReady
      ? `linear-gradient(180deg, ${accentColor}, ${alpha(accentColor, 0.3)})`
      : alpha(accentColor, 0.2),
  };
}

export function avatarSx(isDark: boolean, color: string): SxProps<Theme> {
  return {
    width: AVATAR_SIZE,
    height: AVATAR_SIZE,
    borderRadius: '50%',
    bgcolor: alpha(color, isDark ? 0.2 : 0.12),
    color,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontWeight: 800,
    fontSize: '1rem',
    flexShrink: 0,
    letterSpacing: '-0.02em',
  };
}

export const pageSx: SxProps<Theme> = {
  maxWidth: MAX_WIDTH,
  width: '100%',
  flex: 1,
  minHeight: 0,
  display: 'flex',
  flexDirection: 'column',
  px: { xs: 2, sm: 3, md: 4 },
  py: 2,
  minWidth: 0,
};

export function tabSx(theme: Theme, isDark: boolean): SxProps<Theme> {
  return {
    minHeight: 38,
    '& .MuiTab-root': {
      minHeight: 38,
      textTransform: 'none',
      fontWeight: 600,
      fontSize: '0.85rem',
      px: 2,
      mr: 0.5,
      borderRadius: '8px 8px 0 0',
      '&.Mui-selected': {
        fontWeight: 700,
        bgcolor: alpha(theme.palette.primary.main, isDark ? 0.08 : 0.04),
      },
    },
    '& .MuiTabs-indicator': {
      height: 2.5,
      borderRadius: '2px 2px 0 0',
    },
  };
}
