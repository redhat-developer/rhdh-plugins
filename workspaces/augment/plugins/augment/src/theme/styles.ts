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

import { Theme, alpha, SxProps } from '@mui/material/styles';
import {
  spacing,
  borderRadius,
  createThemeShadows,
  transitions,
} from './tokens';

/**
 * Premium scrollbar styles (WebKit + Firefox standard properties)
 */
export const createScrollbarStyles = (theme: Theme): SxProps<Theme> => {
  const trackColor = alpha(theme.palette.text.primary, 0.02);
  const thumbColor = alpha(theme.palette.text.secondary, 0.35);
  const thumbHover = alpha(theme.palette.text.secondary, 0.55);

  return {
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
};

/**
 * Minimal scrollbar for compact areas (WebKit + Firefox standard properties)
 */
export const createMinimalScrollbarStyles = (theme: Theme): SxProps<Theme> => {
  const thumbColor = alpha(theme.palette.text.primary, 0.15);

  return {
    scrollbarWidth: 'thin',
    scrollbarColor: `${thumbColor} transparent`,
    '&::-webkit-scrollbar': {
      width: 5,
      height: 5,
    },
    '&::-webkit-scrollbar-thumb': {
      backgroundColor: thumbColor,
      borderRadius: 3,
    },
  };
};

/**
 * Creates primary button styles (solid, professional)
 */
export const createGradientButtonStyles = (theme: Theme): SxProps<Theme> => {
  const themeShadows = createThemeShadows(alpha, theme.palette.mode === 'dark');
  return {
    backgroundColor: theme.palette.primary.main,
    color: theme.palette.primary.contrastText,
    fontWeight: 600,
    textTransform: 'none',
    borderRadius: borderRadius.sm,
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
};

/**
 * Creates panel header styles
 */
export const createPanelHeaderStyles = (theme: Theme): SxProps<Theme> => ({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  pb: spacing.md,
  mb: spacing.sm,
  borderBottom: `1px solid ${theme.palette.divider}`,
});

/**
 * Fade-in animation keyframes (to be used with @keyframes)
 */
export const animations = {
  fadeInUp: {
    '@keyframes fadeInUp': {
      from: {
        opacity: 0,
        transform: 'translateY(10px)',
      },
      to: {
        opacity: 1,
        transform: 'translateY(0)',
      },
    },
    animation: 'fadeInUp 0.3s ease-out',
  },

  pulse: {
    '@keyframes pulse': {
      '0%, 100%': { opacity: 1 },
      '50%': { opacity: 0.5 },
    },
    animation: 'pulse 2s infinite',
  },

  shimmer: {
    '@keyframes shimmer': {
      '0%': { backgroundPosition: '-200% 0' },
      '100%': { backgroundPosition: '200% 0' },
    },
    animation: 'shimmer 2s infinite linear',
  },
};
