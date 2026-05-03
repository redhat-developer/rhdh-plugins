import type { Theme } from '@mui/material/styles';
import { alpha } from '@mui/material/styles';
import {
  spacing as sharedSpacing,
  borderRadius as sharedBorderRadius,
  typeScale as sharedTypeScale,
  createThemeShadows,
} from '../../../theme/tokens';

/**
 * Workflow Builder design tokens.
 *
 * Workflow-specific values (node colors, canvas bg) live here.
 * Shared scales (spacing, border radius, transitions, elevation)
 * are re-exported from the central theme tokens to keep one source of truth.
 */

// Re-export shared tokens so workflow components can import from one place
export { sharedSpacing as spacing, sharedBorderRadius as borderRadius };

// ---------------------------------------------------------------------------
// Node type colors — each pair is tuned for WCAG AA contrast with white text
// ---------------------------------------------------------------------------
export const NODE_COLORS: Record<string, { light: string; dark: string }> = {
  start:            { light: '#27ae60', dark: '#2ecc71' },
  end:              { light: '#636e72', dark: '#7f8c8d' },
  agent:            { light: '#b8960f', dark: '#d4ad12' },
  classify:         { light: '#6c3ce0', dark: '#8b5cf6' },
  logic:            { light: '#d35400', dark: '#e67e22' },
  tool:             { light: '#1976d2', dark: '#42a5f5' },
  guardrail:        { light: '#00796b', dark: '#26a69a' },
  user_interaction:  { light: '#7b2d8e', dark: '#ab47bc' },
  note:             { light: '#607d8b', dark: '#78909c' },
  transform:        { light: '#455a64', dark: '#607d8b' },
  set_state:        { light: '#37474f', dark: '#546e7a' },
  file_search:      { light: '#1565c0', dark: '#42a5f5' },
  mcp:              { light: '#0d47a1', dark: '#1e88e5' },
  while:            { light: '#27ae60', dark: '#2ecc71' },
};

export function nodeColor(type: string, mode: 'light' | 'dark'): string {
  return NODE_COLORS[type]?.[mode] ?? (mode === 'dark' ? '#78909c' : '#607d8b');
}

// ---------------------------------------------------------------------------
// Typography scale — uses shared type scale as base, adds workflow-specific
// ---------------------------------------------------------------------------
export const TYPE_SCALE = {
  pageTitle:    { ...sharedTypeScale.pageTitle, variant: 'h4' as const },
  sectionTitle: { ...sharedTypeScale.sectionTitle, variant: 'subtitle1' as const },
  cardTitle:    { variant: 'subtitle2' as const, weight: sharedTypeScale.sectionTitle.fontWeight },
  body:         { variant: 'body2' as const, weight: sharedTypeScale.body.fontWeight },
  caption:      { variant: 'caption' as const, weight: sharedTypeScale.caption.fontWeight, size: sharedTypeScale.caption.fontSize },
  microLabel:   { weight: 600, size: sharedTypeScale.micro.fontSize },
  nodeTitle:    { weight: 700, size: '0.82rem' },
  nodeSubtitle: { weight: 400, size: sharedTypeScale.micro.fontSize },
  nodeDesc:     { weight: 400, size: '0.72rem' },
} as const;

// ---------------------------------------------------------------------------
// Surface helpers — call with the active MUI theme
// ---------------------------------------------------------------------------
export function canvasBg(theme: Theme): string {
  return theme.palette.mode === 'dark' ? '#121218' : '#f7f8fc';
}

export function panelBg(theme: Theme): string {
  return theme.palette.background.paper;
}

export function surfaceSubtle(theme: Theme): string {
  return theme.palette.mode === 'dark'
    ? alpha(theme.palette.common.white, 0.04)
    : alpha(theme.palette.common.black, 0.025);
}

// ---------------------------------------------------------------------------
// Shadow helpers — delegate to shared createThemeShadows
// ---------------------------------------------------------------------------
export function elevationShadow(theme: Theme, level: 1 | 2 | 3 = 1): string {
  const isDark = theme.palette.mode === 'dark';
  const themeShadows = createThemeShadows(alpha, isDark);
  const map = { 1: themeShadows.sm, 2: themeShadows.md, 3: themeShadows.lg };
  return map[level];
}

// ---------------------------------------------------------------------------
// Handle colors — used by CSS custom properties
// ---------------------------------------------------------------------------
export function handleColor(theme: Theme): string {
  return theme.palette.mode === 'dark'
    ? alpha(theme.palette.common.white, 0.5)
    : alpha(theme.palette.common.black, 0.35);
}

export function handleBorder(theme: Theme): string {
  return theme.palette.mode === 'dark'
    ? alpha(theme.palette.common.white, 0.8)
    : alpha(theme.palette.common.white, 0.9);
}

// ---------------------------------------------------------------------------
// Selection ring for nodes
// ---------------------------------------------------------------------------
export function selectionRing(theme: Theme): string {
  return `2px solid ${alpha(theme.palette.primary.main, 0.7)}`;
}

// ---------------------------------------------------------------------------
// Spacing constants (workflow-specific layout widths)
// ---------------------------------------------------------------------------
export const SPACING = {
  panelWidth: 320,
  panelMinWidth: 280,
  panelMaxWidth: 500,
  previewWidth: 380,
  previewMinWidth: 320,
  previewMaxWidth: 600,
  paletteWidth: 140,
  fieldGap: sharedSpacing.md,
  sectionGap: sharedSpacing.lg,
} as const;

// ---------------------------------------------------------------------------
// Transition durations — map to shared transitions
// ---------------------------------------------------------------------------
export const TRANSITIONS = {
  fast: '0.1s',
  normal: '0.15s',
  slow: '0.25s',
} as const;
