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
 * Shared styled components for the Augment plugin.
 *
 * These are thin, token-backed wrappers around MUI primitives.
 * Import via the theme barrel: `import { ... } from '../../theme'`.
 */

import { styled, alpha } from '@mui/material/styles';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import {
  borderRadius,
  typeScale,
  typography,
  spacing,
  transitions,
  createThemeShadows,
  scrollbarStyles,
} from './tokens';

/**
 * Primary action button with consistent styling across the plugin.
 * - No text transform (sentence case)
 * - Token-based border radius, shadows, transitions
 */
export const AugmentButton = styled(Button)(({ theme }) => {
  const themeShadows = createThemeShadows(alpha, theme.palette.mode === 'dark');
  return {
    fontWeight: typography.fontWeight.semibold,
    textTransform: 'none',
    borderRadius: theme.spacing(borderRadius.sm),
    boxShadow: themeShadows.sm,
    transition: transitions.normal,
    '&:hover': {
      boxShadow: themeShadows.md,
    },
    '&:disabled': {
      boxShadow: 'none',
    },
  };
});

/**
 * Card-like surface with consistent border, radius, padding.
 * Use instead of ad-hoc `Card variant="outlined"` or styled `Box`.
 */
export const SurfaceCard = styled(Box)(({ theme }) => ({
  backgroundColor: theme.palette.background.paper,
  border: `1px solid ${alpha(
    theme.palette.mode === 'dark'
      ? theme.palette.common.white
      : theme.palette.common.black,
    theme.palette.mode === 'dark' ? 0.12 : 0.08,
  )}`,
  borderRadius: theme.spacing(borderRadius.sm),
  padding: theme.spacing(spacing.md),
}));

/**
 * Section header with title + optional action slot layout.
 */
export const SectionHeader = styled(Box)({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  marginBottom: 12,
});

/**
 * Status dot indicator (online/offline/warning).
 * Renders at a consistent 6px size from `controlSize.dot`.
 */
export const StatusDot = styled(Box, {
  shouldForwardProp: prop => prop !== 'color',
})<{ color?: string }>(({ color }) => ({
  width: 6,
  height: 6,
  borderRadius: '50%',
  backgroundColor: color ?? 'currentColor',
  flexShrink: 0,
}));

/**
 * User message bubble — subtle background for chat.
 */
export const UserBubble = styled(Box)(({ theme }) => ({
  backgroundColor: alpha(
    theme.palette.text.primary,
    theme.palette.mode === 'dark' ? 0.12 : 0.06,
  ),
  color: theme.palette.text.primary,
  borderRadius: theme.spacing(borderRadius.md),
  padding: theme.spacing(spacing.sm, spacing.md),
  maxWidth: '80%',
  alignSelf: 'flex-end',
}));

/**
 * Status badge — pill-shaped semantic status indicator.
 */
export const StatusBadge = styled(Box, {
  shouldForwardProp: prop => prop !== 'status',
})<{ status?: 'success' | 'warning' | 'error' | 'info' | 'default' }>(({
  theme,
  status = 'default',
}) => {
  const colorMap = {
    success: {
      bg: alpha(theme.palette.success.main, 0.1),
      color: theme.palette.success.main,
    },
    warning: {
      bg: alpha(theme.palette.warning.main, 0.1),
      color: theme.palette.warning.main,
    },
    error: {
      bg: alpha(theme.palette.error.main, 0.1),
      color: theme.palette.error.main,
    },
    info: {
      bg: alpha(theme.palette.info.main, 0.1),
      color: theme.palette.info.main,
    },
    default: {
      bg: alpha(theme.palette.text.primary, 0.08),
      color: theme.palette.text.secondary,
    },
  };
  const { bg, color } = colorMap[status];
  return {
    display: 'inline-flex',
    alignItems: 'center',
    gap: theme.spacing(spacing.xxs),
    padding: theme.spacing(spacing.xxs, spacing.xs),
    borderRadius: borderRadius.pill,
    backgroundColor: bg,
    color,
    fontSize: typeScale.caption.fontSize,
    fontWeight: typography.fontWeight.medium,
    letterSpacing: '0.02em',
  };
});

/**
 * Scroll container with canonical plugin scrollbar styling.
 */
export const ScrollContainer = styled(Box)(({ theme }) => ({
  overflowY: 'auto',
  ...scrollbarStyles(theme),
}));
