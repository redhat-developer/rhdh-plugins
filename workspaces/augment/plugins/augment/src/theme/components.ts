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

import { styled, alpha } from '@mui/material/styles';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import {
  borderRadius,
  createThemeShadows,
  transitions,
  spacing,
} from './tokens';

/**
 * Gradient Button - Primary action button with solid brand color
 */
export const GradientButton = styled(Button)(({ theme }) => {
  const themeShadows = createThemeShadows(alpha, theme.palette.mode === 'dark');
  return {
    backgroundColor: theme.palette.primary.main,
    color: theme.palette.primary.contrastText,
    fontWeight: 600,
    textTransform: 'none',
    borderRadius: theme.spacing(borderRadius.sm),
    boxShadow: themeShadows.sm,
    transition: transitions.normal,

    '&:hover': {
      backgroundColor: theme.palette.primary.dark,
      boxShadow: themeShadows.md,
    },

    '&:active': {
      backgroundColor: theme.palette.primary.main,
    },

    '&:disabled': {
      background: theme.palette.action.disabledBackground,
      color: theme.palette.action.disabled,
      boxShadow: 'none',
    },
  };
});

/**
 * User Message Bubble - subtle background, doesn't overpower assistant text
 */
export const UserBubble = styled(Box)(({ theme }) => ({
  backgroundColor: alpha(
    theme.palette.text.primary,
    theme.palette.mode === 'dark' ? 0.12 : 0.06,
  ),
  color: theme.palette.text.primary,
  borderRadius: theme.spacing(borderRadius.md),
  padding: theme.spacing(spacing.md, spacing.lg),
  maxWidth: '80%',
  alignSelf: 'flex-end',
}));

/**
 * Assistant Message Bubble - clean, borderless, full-width
 */
export const AssistantBubble = styled(Box)(({ theme }) => ({
  backgroundColor: 'transparent',
  padding: theme.spacing(spacing.sm, 0),
  maxWidth: '100%',
}));

/**
 * Status Badge - Semantic status indicator
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
    gap: theme.spacing(spacing.xs),
    padding: theme.spacing(spacing.xs, spacing.sm),
    borderRadius: '9999px',
    backgroundColor: bg,
    color: color,
    fontSize: '0.75rem',
    fontWeight: 500,
    letterSpacing: '0.02em',
  };
});

/**
 * Scroll Container - Premium scrollbar styling (WebKit + Firefox)
 */
export const ScrollContainer = styled(Box)(({ theme }) => {
  const trackColor = alpha(theme.palette.text.primary, 0.02);
  const thumbColor = alpha(theme.palette.text.secondary, 0.35);
  const thumbHover = alpha(theme.palette.text.secondary, 0.55);

  return {
    overflowY: 'auto',
    scrollbarWidth: 'thin',
    scrollbarColor: `${thumbColor} ${trackColor}`,

    '&::-webkit-scrollbar': {
      width: 10,
      height: 10,
    },

    '&::-webkit-scrollbar-track': {
      backgroundColor: trackColor,
      borderRadius: 10,
    },

    '&::-webkit-scrollbar-thumb': {
      backgroundColor: thumbColor,
      borderRadius: 10,
      border: '2px solid transparent',
      backgroundClip: 'content-box',
      transition: transitions.normal,
    },

    '&::-webkit-scrollbar-thumb:hover': {
      backgroundColor: thumbHover,
    },
  };
});

/**
 * Sidebar Panel - Right/Left sidebar container
 */
export const SidebarPanel = styled(Box)(({ theme }) => ({
  height: '100%',
  backgroundColor: theme.palette.background.default,
  borderLeft: `1px solid ${alpha(theme.palette.divider, 0.3)}`,
  display: 'flex',
  flexDirection: 'column',
  transition: transitions.normal,
}));
