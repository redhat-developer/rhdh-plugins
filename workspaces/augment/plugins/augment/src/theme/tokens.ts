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
 * Augment Design Tokens
 *
 * These tokens define the visual foundation of the plugin.
 * Enterprises can override these values for custom branding.
 */

// =============================================================================
// SPACING SCALE
// =============================================================================

export const spacing = {
  /** 4px */
  xs: 0.5,
  /** 8px */
  sm: 1,
  /** 12px */
  md: 1.5,
  /** 16px */
  lg: 2,
  /** 24px */
  xl: 3,
  /** 32px */
  xxl: 4,
  /** 48px */
  xxxl: 6,
} as const;

// =============================================================================
// BORDER RADIUS
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
// SHADOWS
// =============================================================================

/**
 * Static shadow tokens — used as fallback values for non-themed contexts
 * (e.g. token type definitions, tests). Prefer {@link createThemeShadows}
 * for runtime code where a MUI `Theme` is available.
 */
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

// =============================================================================
// COLORS - Brand Palette
// =============================================================================

export const colors = {
  // Primary brand colors (can be overridden for enterprise branding)
  brand: {
    primary: '#1e40af', // Steel blue - professional, enterprise-grade
    primaryHover: '#2563eb',
    primaryLight: '#3b82f6',
    secondary: '#475569', // Slate - neutral complement
    secondaryHover: '#64748b',
  },

  // Semantic colors
  semantic: {
    success: '#059669', // Emerald 600 - deeper for better contrast
    successLight: '#10b981',
    successBg: 'rgba(5, 150, 105, 0.1)',

    warning: '#d97706', // Amber 600
    warningLight: '#f59e0b',
    warningBg: 'rgba(217, 119, 6, 0.1)',

    error: '#dc2626', // Red 600
    errorLight: '#ef4444',
    errorBg: 'rgba(220, 38, 38, 0.1)',

    info: '#2563eb', // Blue 600
    infoLight: '#3b82f6',
    infoBg: 'rgba(37, 99, 235, 0.1)',
  },

  // Surface colors for elevated panels
  surface: {
    background: 'rgba(255, 255, 255, 0.06)',
    backgroundHover: 'rgba(255, 255, 255, 0.09)',
    border: 'rgba(255, 255, 255, 0.12)',
    borderHover: 'rgba(255, 255, 255, 0.18)',
    backgroundLight: 'rgba(0, 0, 0, 0.03)',
    backgroundHoverLight: 'rgba(0, 0, 0, 0.05)',
    borderLight: 'rgba(0, 0, 0, 0.10)',
    borderHoverLight: 'rgba(0, 0, 0, 0.15)',
  },

  // Chat-specific colors
  chat: {
    userBubble: '#f1f5f9', // Slate-100 — subtle, doesn't overpower assistant text
    userBubbleDark: '#334155', // Slate-700
    aiBubble: 'transparent',
    aiBubbleLight: 'transparent',
  },

  // Scrollbar colors
  scrollbar: {
    thumb: 'rgba(100, 116, 139, 0.35)',
    thumbHover: 'rgba(100, 116, 139, 0.55)',
    track: 'rgba(255, 255, 255, 0.05)',
  },
} as const;

// =============================================================================
// TYPOGRAPHY
// =============================================================================

export const typography = {
  fontFamily: {
    primary:
      '-apple-system, BlinkMacSystemFont, "SF Pro Text", "SF Pro Display", "Helvetica Neue", "Segoe UI", "Roboto", sans-serif',
    mono: '"SF Mono", "JetBrains Mono", "Fira Code", "Cascadia Code", "Monaco", monospace',
  },

  fontSize: {
    xs: '0.75rem', // 12px
    sm: '0.8125rem', // 13px
    md: '0.875rem', // 14px
    lg: '1rem', // 16px
    xl: '1.125rem', // 18px
    xxl: '1.25rem', // 20px
    h1: '1.75rem', // 28px
    h2: '1.375rem', // 22px
    h3: '1.125rem', // 18px
  },

  fontWeight: {
    regular: 400,
    medium: 500,
    semibold: 600,
    bold: 700,
  },

  lineHeight: {
    tight: 1.2,
    normal: 1.5,
    relaxed: 1.75,
  },
} as const;

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
// Z-INDEX SCALE
// =============================================================================

export const zIndex = {
  base: 0,
  dropdown: 100,
  sticky: 200,
  fixed: 300,
  modal: 400,
  popover: 500,
  tooltip: 600,
} as const;

// =============================================================================
// LAYOUT
// =============================================================================

export const layout = {
  sidebar: {
    widthCollapsed: '56px',
    widthExpanded: '340px',
  },
  chat: {
    maxWidth: '1200px',
    inputMaxWidth: '1000px',
  },
  card: {
    width: 340,
    height: 130,
  },
} as const;

// =============================================================================
// THEME-AWARE SHADOWS
// =============================================================================

/**
 * Create shadows that adapt to the current theme mode.
 *
 * In dark mode, black shadows are nearly invisible against dark backgrounds,
 * so opacity is increased. Uses `alpha()` with `theme.palette.common.black`
 * to integrate with MUI's color system.
 */
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

// =============================================================================
// TYPE EXPORTS
// =============================================================================

export type Spacing = typeof spacing;
export type BorderRadius = typeof borderRadius;
export type Shadows = typeof shadows;
export type Colors = typeof colors;
export type Typography = typeof typography;
export type Transitions = typeof transitions;
export type ZIndex = typeof zIndex;
export type Layout = typeof layout;

/**
 * Complete design token configuration
 */
export interface DesignTokens {
  spacing: Spacing;
  borderRadius: BorderRadius;
  shadows: Shadows;
  colors: Colors;
  typography: Typography;
  transitions: Transitions;
  zIndex: ZIndex;
  layout: Layout;
}

/**
 * Default design tokens
 */
export const defaultTokens: DesignTokens = {
  spacing,
  borderRadius,
  shadows,
  colors,
  typography,
  transitions,
  zIndex,
  layout,
};

/**
 * Theme preset interface for createTokensFromPreset.
 * Defines color, typography, and spacing overrides for a preset.
 */
export interface ThemePresetInput {
  colors?: Partial<Colors>;
  typography?: Partial<Typography>;
  spacing?: Partial<Spacing>;
}

/**
 * Built-in theme presets. Each defines color overrides for a distinct visual style.
 * Precedence: explicit branding color fields > preset colors > default tokens.
 */
export const THEME_PRESETS = Object.freeze({
  /** Default blue/slate palette -- professional, balanced. */
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
  /** Enterprise -- neutral grays, conservative, corporate. */
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
  /** Vibrant -- saturated colors, energetic. */
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
  /** Dark Accent -- deep backgrounds, bright accent highlights. */
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

/** Valid theme preset name. Derived from THEME_PRESETS keys. */
export type ThemePresetName = keyof typeof THEME_PRESETS;

/** Type guard for validating preset names against THEME_PRESETS. */
export function isValidPresetName(name: string): name is ThemePresetName {
  return name in THEME_PRESETS;
}

/**
 * Create design tokens from a theme preset.
 *
 * @param preset - Theme preset containing color overrides
 * @returns Complete design token configuration with preset colors applied
 */
export const createTokensFromPreset = (
  preset: ThemePresetInput,
): DesignTokens => {
  return {
    ...defaultTokens,
    colors: {
      ...defaultTokens.colors,
      ...preset.colors,
    },
    typography: {
      ...defaultTokens.typography,
      ...(preset.typography || {}),
    },
    spacing: {
      ...defaultTokens.spacing,
      ...(preset.spacing || {}),
    },
  };
};
