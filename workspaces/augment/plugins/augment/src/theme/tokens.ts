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

import { type Theme, alpha } from '@mui/material/styles';

/**
 * Augment Design Tokens
 *
 * Single source of truth for the plugin's visual language.
 * Every component should import from this file (via the theme barrel)
 * rather than defining ad-hoc values.
 *
 * CSS custom properties on `.augment-plugin-root` allow host Backstage
 * instances to override key values without forking the plugin.
 */

// =============================================================================
// SPACING SCALE (MUI spacing multipliers — 1 unit = 8px)
// =============================================================================

export const spacing = {
  /** 4px */
  xxs: 0.5,
  /** 8px */
  xs: 1,
  /** 12px */
  sm: 1.5,
  /** 16px */
  md: 2,
  /** 24px */
  lg: 3,
  /** 32px */
  xl: 4,
  /** 48px */
  xxl: 6,
} as const;

/**
 * Responsive horizontal padding for page-level containers.
 * Use as `px: containerPadding` inside `sx`.
 */
export const containerPadding = { xs: 2, sm: 3, md: 4 } as const;

// =============================================================================
// BORDER RADIUS (MUI spacing multipliers)
// =============================================================================

export const borderRadius = {
  /** 4px - subtle rounding */
  xs: 0.5,
  /** 8px - cards, buttons */
  sm: 1,
  /** 12px - panels */
  md: 1.5,
  /** 16px - modals */
  lg: 2,
  /** 20px - large cards */
  xl: 2.5,
  /** 24px - hero elements */
  xxl: 3,
  /** 9999px - pills */
  pill: '9999px',
} as const;

// =============================================================================
// TYPOGRAPHY SCALE
// =============================================================================

export const typeScale = {
  pageTitle: {
    fontSize: '1.25rem',
    lineHeight: 1.3,
    fontWeight: 700,
    letterSpacing: '-0.01em',
  },
  sectionTitle: {
    fontSize: '1rem',
    lineHeight: 1.4,
    fontWeight: 600,
    letterSpacing: '-0.005em',
  },
  body: {
    fontSize: '0.875rem',
    lineHeight: 1.5,
    fontWeight: 400,
    letterSpacing: '0em',
  },
  bodySmall: {
    fontSize: '0.8125rem',
    lineHeight: 1.5,
    fontWeight: 400,
    letterSpacing: '0em',
  },
  caption: {
    fontSize: '0.75rem',
    lineHeight: 1.4,
    fontWeight: 400,
    letterSpacing: '0.01em',
  },
  micro: {
    fontSize: '0.6875rem',
    lineHeight: 1.3,
    fontWeight: 500,
    letterSpacing: '0.02em',
  },
  code: {
    fontSize: '0.8125rem',
    lineHeight: 1.5,
    fontWeight: 400,
    letterSpacing: '0em',
  },
} as const;

export const typography = {
  fontFamily: {
    primary:
      '-apple-system, BlinkMacSystemFont, "SF Pro Text", "SF Pro Display", "Helvetica Neue", "Segoe UI", "Roboto", sans-serif',
    mono: '"SF Mono", "JetBrains Mono", "Fira Code", "Cascadia Code", "Monaco", monospace',
  },
  fontWeight: {
    regular: 400,
    medium: 500,
    semibold: 600,
    bold: 700,
  },
} as const;

// =============================================================================
// ICON SIZE SCALE
// =============================================================================

export const iconSize = {
  /** 14px — inline decorators, chip delete */
  xs: 14,
  /** 16px — compact controls, secondary actions */
  sm: 16,
  /** 18px — standard toolbar/action icons */
  md: 18,
  /** 22px — sidebar navigation icons */
  lg: 22,
  /** 24px — primary feature icons, cards */
  xl: 24,
} as const;

// =============================================================================
// INTERACTIVE ELEMENT SIZES
// =============================================================================

export const controlSize = {
  /** 6px — status dots */
  dot: 6,
  /** 32px — compact avatars, small controls */
  sm: 32,
  /** 36px — standard controls, buttons */
  md: 36,
  /** 40px — touch targets, large controls */
  lg: 40,
  /** 48px — prominent actions, mobile touch targets */
  xl: 48,
} as const;

// =============================================================================
// ELEVATION / SHADOWS
// =============================================================================

export const shadows = {
  /** Subtle elevation */
  sm: '0 1px 3px rgba(0,0,0,0.08)',
  /** Medium elevation */
  md: '0 4px 12px rgba(0,0,0,0.1)',
  /** High elevation */
  lg: '0 8px 24px rgba(0,0,0,0.12)',
  /** Floating elements */
  xl: '0 12px 40px rgba(0,0,0,0.15)',
  /** Inset */
  inset: 'inset 0 1px 2px rgba(0,0,0,0.1)',
} as const;

export function createThemeShadows(
  themeAlpha: (color: string, opacity: number) => string,
  isDark: boolean,
): Record<keyof Shadows, string> {
  const base = '#000';
  return {
    sm: `0 1px 3px ${themeAlpha(base, isDark ? 0.25 : 0.08)}`,
    md: `0 4px 12px ${themeAlpha(base, isDark ? 0.35 : 0.1)}`,
    lg: `0 8px 24px ${themeAlpha(base, isDark ? 0.45 : 0.12)}`,
    xl: `0 12px 40px ${themeAlpha(base, isDark ? 0.55 : 0.15)}`,
    inset: `inset 0 1px 2px ${themeAlpha(base, isDark ? 0.3 : 0.1)}`,
  };
}

export const elevation = {
  none: 'none',
  low: shadows.sm,
  medium: shadows.md,
  high: shadows.lg,
} as const;

// =============================================================================
// SURFACE HELPERS
// =============================================================================

/**
 * Mode-aware surface background helper.
 * Provides consistent surface hierarchy across light/dark modes.
 */
export function surface(
  theme: Theme,
  level: 'base' | 'raised' | 'overlay' | 'inset' = 'raised',
): string {
  const isDark = theme.palette.mode === 'dark';
  switch (level) {
    case 'base':
      return theme.palette.background.default;
    case 'raised':
      return theme.palette.background.paper;
    case 'overlay':
      return isDark
        ? alpha(theme.palette.background.paper, 0.95)
        : theme.palette.background.paper;
    case 'inset':
      return alpha(
        isDark ? theme.palette.common.white : theme.palette.common.black,
        isDark ? 0.06 : 0.03,
      );
    default:
      return theme.palette.background.paper;
  }
}

/**
 * Mode-aware surface overlay (alpha blend on top of existing background).
 */
export function surfaceOverlay(
  theme: Theme,
  level: 'faint' | 'subtle' | 'medium' | 'strong' = 'medium',
): string {
  const isDark = theme.palette.mode === 'dark';
  const base = isDark ? theme.palette.common.white : theme.palette.common.black;
  const map = {
    faint: alpha(base, isDark ? 0.04 : 0.02),
    subtle: alpha(base, isDark ? 0.06 : 0.03),
    medium: alpha(base, isDark ? 0.08 : 0.05),
    strong: alpha(base, isDark ? 0.12 : 0.08),
  };
  return map[level];
}

// =============================================================================
// BORDER HELPERS
// =============================================================================

/**
 * Canonical subtle border — returns a full CSS border declaration.
 * Use this everywhere instead of ad-hoc `1px solid ${alpha(...)}`.
 */
export function subtleBorder(
  theme: Theme,
  level: 'subtle' | 'medium' | 'strong' = 'subtle',
): string {
  const isDark = theme.palette.mode === 'dark';
  const alphaMap = {
    subtle: isDark ? 0.12 : 0.08,
    medium: isDark ? 0.25 : 0.15,
    strong: isDark ? 0.4 : 0.25,
  };
  return `1px solid ${alpha(
    isDark ? theme.palette.common.white : theme.palette.common.black,
    alphaMap[level],
  )}`;
}

/**
 * Returns just the border color (not the full declaration).
 * Useful for composing with other border properties.
 */
export function borderColor(
  theme: Theme,
  level: 'subtle' | 'medium' | 'strong' = 'subtle',
): string {
  const isDark = theme.palette.mode === 'dark';
  const alphaMap = {
    subtle: isDark ? 0.12 : 0.08,
    medium: isDark ? 0.25 : 0.15,
    strong: isDark ? 0.4 : 0.25,
  };
  return alpha(
    isDark ? theme.palette.common.white : theme.palette.common.black,
    alphaMap[level],
  );
}

// =============================================================================
// SCROLLBAR
// =============================================================================

/**
 * Canonical scrollbar styles. Use this as the single scrollbar implementation.
 */
export function scrollbarStyles(theme: Theme): Record<string, unknown> {
  const thumbColor = alpha(theme.palette.text.primary, 0.15);
  const thumbHover = alpha(theme.palette.text.primary, 0.25);
  return {
    scrollbarWidth: 'thin' as const,
    scrollbarColor: `${thumbColor} transparent`,
    '&::-webkit-scrollbar': { width: 6, height: 6 },
    '&::-webkit-scrollbar-thumb': {
      backgroundColor: thumbColor,
      borderRadius: 3,
    },
    '&::-webkit-scrollbar-thumb:hover': {
      backgroundColor: thumbHover,
    },
    '&::-webkit-scrollbar-track': { background: 'transparent' },
  };
}

// =============================================================================
// TRANSITIONS
// =============================================================================

export const transitions = {
  fast: 'all 0.15s ease',
  normal: 'all 0.2s ease',
  slow: 'all 0.3s ease',
  spring: 'all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)',
} as const;

// =============================================================================
// ANIMATIONS
// =============================================================================

export const animations = {
  fadeInUp: {
    '@keyframes augmentFadeInUp': {
      from: { opacity: 0, transform: 'translateY(10px)' },
      to: { opacity: 1, transform: 'translateY(0)' },
    },
    animation: 'augmentFadeInUp 0.3s ease-out',
  },
  fadeSlideIn: {
    '@keyframes augmentFadeSlideIn': {
      from: { opacity: 0, transform: 'translateY(4px)' },
      to: { opacity: 1, transform: 'translateY(0)' },
    },
    animation: 'augmentFadeSlideIn 0.25s ease-out',
  },
  pulse: {
    '@keyframes augmentPulse': {
      '0%, 100%': { opacity: 1 },
      '50%': { opacity: 0.5 },
    },
    animation: 'augmentPulse 2s infinite',
  },
  shimmer: {
    '@keyframes augmentShimmer': {
      '0%': { backgroundPosition: '-200% 0' },
      '100%': { backgroundPosition: '200% 0' },
    },
    animation: 'augmentShimmer 2s infinite linear',
  },
} as const;

// =============================================================================
// LAYOUT
// =============================================================================

export const layout = {
  sidebar: {
    widthCollapsed: '56px',
    widthExpanded: '340px',
  },
  content: {
    maxWidth: '1200px',
    adminMaxWidth: 960,
  },
} as const;

// =============================================================================
// THEME PRESETS
// =============================================================================

export const THEME_PRESETS = Object.freeze({
  default: {
    colors: {
      brand: {
        primary: '#1e40af',
        primaryHover: '#2563eb',
        primaryLight: '#3b82f6',
        secondary: '#475569',
        secondaryHover: '#64748b',
      },
    },
  },
  enterprise: {
    colors: {
      brand: {
        primary: '#374151',
        primaryHover: '#4b5563',
        primaryLight: '#6b7280',
        secondary: '#6b7280',
        secondaryHover: '#9ca3af',
      },
    },
  },
  vibrant: {
    colors: {
      brand: {
        primary: '#7c3aed',
        primaryHover: '#8b5cf6',
        primaryLight: '#a78bfa',
        secondary: '#0891b2',
        secondaryHover: '#06b6d4',
      },
    },
  },
  'dark-accent': {
    colors: {
      brand: {
        primary: '#f59e0b',
        primaryHover: '#fbbf24',
        primaryLight: '#fcd34d',
        secondary: '#334155',
        secondaryHover: '#475569',
      },
    },
  },
});

export type ThemePresetName = keyof typeof THEME_PRESETS;

export function isValidPresetName(name: string): name is ThemePresetName {
  return name in THEME_PRESETS;
}

// =============================================================================
// TYPE EXPORTS
// =============================================================================

export type Spacing = typeof spacing;
export type BorderRadius = typeof borderRadius;
export type Shadows = typeof shadows;
export type TypeScale = typeof typeScale;
export type Typography = typeof typography;
export type Transitions = typeof transitions;
export type Layout = typeof layout;
