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
import { scrollbarStyles } from '../../theme/tokens';

export const CARD_GAP = 16;

/** Main welcome screen container -- fills the scroll area, content flows top-down. */
export const getContainerSx = (theme: Theme): SxProps<Theme> => ({
  display: 'flex',
  flexDirection: 'column',
  flex: '1 1 0',
  minHeight: 0,
  height: '100%',
  pt: 1,
  pb: 0.5,
  background: theme.palette.background.default,
  overflow: 'hidden',
});

/** Hero title + tagline + agent strip. */
export const getHeroSx = (): SxProps<Theme> => ({
  textAlign: 'center',
  mb: 3,
  px: { xs: 2, sm: 3 },
  pt: 2,
});

/** Title text — prominent h4. */
export const getTitleSx = (primaryColor: string): SxProps<Theme> => ({
  fontWeight: 800,
  fontSize: { xs: '1.5rem', sm: '1.75rem' },
  letterSpacing: '-0.02em',
  color: primaryColor,
  mb: 0.5,
});

/** Prompt groups scrollable area -- grows to fill, left-aligned, constrained width. */
export const getPromptGroupsContainerSx = (
  _isDark: boolean,
  theme?: Theme,
): SxProps<Theme> => ({
  flex: '1 1 0',
  minHeight: 0,
  display: 'flex',
  flexDirection: 'column',
  overflowY: 'auto',
  overflowX: 'clip',
  px: { xs: 2, sm: 3 },
  maxWidth: 1100,
  width: '100%',
  mx: 'auto',
  boxSizing: 'border-box',
  ...(theme ? scrollbarStyles(theme) : {}),
});

/** Lane header icon (small colored square). */
export const getLaneIconSx = (
  theme: Theme,
  laneColor: string,
): SxProps<Theme> => ({
  width: 24,
  height: 24,
  borderRadius: 1,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  backgroundColor: laneColor,
  color: theme.palette.common.white,
  '& svg': { fontSize: 14 },
});

/** Compact hero for agent playground (no-agent-selected state). */
export const getPlaygroundHeroSx = (): SxProps<Theme> => ({
  textAlign: 'center',
  pt: { xs: 3, sm: 4 },
  pb: 1,
  px: { xs: 2, sm: 3 },
  flexShrink: 0,
});

/** Inline search bar container. */
export const getSearchBarSx = (theme: Theme): SxProps<Theme> => ({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  gap: 1,
  px: { xs: 2, sm: 3 },
  pb: 1.5,
  pt: 0.5,
  flexShrink: 0,
  maxWidth: 1100,
  width: '100%',
  mx: 'auto',
  boxSizing: 'border-box',
  '& .MuiOutlinedInput-root': {
    borderRadius: 5,
    fontSize: '0.85rem',
    height: 42,
    bgcolor: alpha(theme.palette.background.paper, theme.palette.mode === 'dark' ? 0.5 : 0.8),
    '&.Mui-focused': {
      boxShadow: `0 0 0 2px ${alpha(theme.palette.primary.main, 0.15)}`,
    },
  },
});

/** Responsive agent grid. */
export const getAgentGridSx = (theme: Theme): SxProps<Theme> => ({
  display: 'grid',
  gridTemplateColumns: {
    xs: '1fr',
    sm: 'repeat(2, 1fr)',
    md: 'repeat(3, 1fr)',
  },
  gap: 2,
  px: { xs: 2, sm: 3 },
  pb: 3,
  maxWidth: 1100,
  width: '100%',
  mx: 'auto',
  boxSizing: 'border-box',
  ...(theme ? scrollbarStyles(theme) : {}),
});

/** Scrollable wrapper for the grid area. */
export const getGridScrollAreaSx = (theme: Theme): SxProps<Theme> => ({
  flex: '1 1 0',
  minHeight: 0,
  overflowY: 'auto',
  overflowX: 'clip',
  ...(theme ? scrollbarStyles(theme) : {}),
});

/** Individual swim lane card. */
export const getCardSx = (
  isDark: boolean,
  laneColor: string,
  isComingSoon: boolean,
): SxProps<Theme> => ({
  width: '100%',
  minHeight: 72,
  flexShrink: 0,
  position: 'relative',
  overflow: 'visible',
  backgroundColor: isDark ? alpha(laneColor, 0.06) : alpha(laneColor, 0.03),
  border: `1px solid ${alpha(laneColor, isDark ? 0.15 : 0.12)}`,
  borderRadius: 2,
  boxShadow: 'none',
  transition: 'border-color 0.15s ease, box-shadow 0.15s ease',
  opacity: isComingSoon ? 0.5 : 1,
  cursor: isComingSoon ? 'not-allowed' : 'pointer',
  ...(!isComingSoon && {
    '&:hover': {
      borderColor: alpha(laneColor, isDark ? 0.35 : 0.3),
      boxShadow: `0 2px 8px ${alpha(laneColor, isDark ? 0.15 : 0.1)}`,
    },
  }),
  '& .MuiCardActionArea-root, & .MuiButtonBase-root': {
    display: 'block',
    textAlign: 'left',
    justifyContent: 'flex-start',
  },
});

/** Card icon circle. */
export const getCardIconSx = (
  theme: Theme,
  isDark: boolean,
  laneColor: string,
  isComingSoon: boolean,
): SxProps<Theme> => {
  const gray = theme.palette.text.secondary;
  const alphaValue = isDark ? 0.2 : 0.12;
  let iconColor: string;
  if (isComingSoon) {
    iconColor = isDark
      ? theme.palette.text.disabled
      : theme.palette.text.secondary;
  } else {
    iconColor = laneColor;
  }

  return {
    width: 32,
    height: 32,
    borderRadius: '50%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
    backgroundColor: isComingSoon
      ? alpha(gray, alphaValue)
      : alpha(laneColor, alphaValue),
    color: iconColor,
    '& svg': { fontSize: 16 },
  };
};
