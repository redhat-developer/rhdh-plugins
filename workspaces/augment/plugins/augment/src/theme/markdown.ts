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
import { type Theme, type SxProps, alpha } from '@mui/material/styles';
import {
  surfaceOverlay,
  subtleBorder,
  typeScale,
  typography as typographyTokens,
} from './tokens';

/**
 * Inset code-block background — uses a black overlay in both modes
 * for consistent depth perception.
 */
export function codeBlockBackground(theme: Theme): string {
  const isDark = theme.palette.mode === 'dark';
  return alpha(theme.palette.common.black, isDark ? 0.3 : 0.04);
}

/**
 * Shared markdown content styles used by both ChatMessage and StreamingMessage.
 * Extracted to avoid duplicated styles across components.
 */
export function getSharedMarkdownSx(
  theme: Theme,
  isUser: boolean = false,
): SxProps<Theme> {
  const isDark = theme.palette.mode === 'dark';
  const textColor = theme.palette.text.primary;
  const secondaryTextColor = theme.palette.text.secondary;

  let codeBg: string;
  if (isUser) {
    const base = isDark
      ? theme.palette.common.white
      : theme.palette.common.black;
    codeBg = alpha(base, isDark ? 0.12 : 0.08);
  } else {
    codeBg = surfaceOverlay(theme);
  }

  const border = subtleBorder(theme);

  return {
    fontSize: typeScale.body.fontSize,
    lineHeight: 1.65,
    color: textColor,
    wordBreak: 'break-word',

    '& p': { margin: 0 },
    '& p + p': { mt: 1.5 },

    '& h1': {
      fontSize: '1.375rem',
      mt: 3,
      mb: 1,
      fontWeight: typographyTokens.fontWeight.bold,
      lineHeight: 1.3,
      color: textColor,
    },
    '& h2': {
      fontSize: '1.2rem',
      mt: 2.5,
      mb: 1,
      fontWeight: typographyTokens.fontWeight.semibold,
      lineHeight: 1.35,
      color: textColor,
    },
    '& h3': {
      fontSize: '1.0625rem',
      mt: 2,
      mb: 0.75,
      fontWeight: typographyTokens.fontWeight.semibold,
      lineHeight: 1.4,
      color: textColor,
    },
    '& h4': {
      fontSize: typeScale.body.fontSize,
      mt: 1.5,
      mb: 0.5,
      fontWeight: typographyTokens.fontWeight.semibold,
      lineHeight: 1.4,
      color: textColor,
    },

    '& strong, & b': {
      fontWeight: typographyTokens.fontWeight.semibold,
      color: textColor,
    },
    '& em, & i': { fontStyle: 'italic' },

    '& code': {
      backgroundColor: codeBg,
      padding: '2px 6px',
      borderRadius: '4px',
      fontFamily: typographyTokens.fontFamily.mono,
      fontSize: '0.85em',
      fontWeight: typographyTokens.fontWeight.regular,
      wordBreak: 'break-all' as const,
    },

    '& pre': {
      backgroundColor: 'transparent',
      padding: 0,
      margin: 0,
      border: 'none',
      borderRadius: 0,
      overflowX: 'auto',
      '& code': {
        backgroundColor: 'transparent',
        padding: 0,
        fontSize: typeScale.code.fontSize,
        fontWeight: typographyTokens.fontWeight.regular,
        wordBreak: 'normal' as const,
      },
    },

    '& ul, & ol': {
      pl: 2.5,
      my: 1.25,
      '& li': {
        mb: 0.5,
        lineHeight: 1.6,
        '&::marker': { color: secondaryTextColor },
      },
    },
    '& li > ul, & li > ol': { mt: 0.5, mb: 0 },

    '& a': {
      color: isUser ? textColor : theme.palette.primary.main,
      textDecoration: 'underline',
      textUnderlineOffset: '2px',
      '&:hover': {
        textDecorationColor: isUser ? textColor : theme.palette.primary.main,
      },
    },

    '& blockquote': {
      borderLeft: `3px solid ${alpha(
        isDark ? theme.palette.common.white : theme.palette.common.black,
        isDark ? 0.15 : 0.12,
      )}`,
      pl: 2,
      ml: 0,
      my: 1.5,
      color: secondaryTextColor,
      fontStyle: 'italic',
    },

    '& hr': { border: 'none', borderTop: border, my: 2 },

    '& input[type="checkbox"]': { mr: 1 },

    '& .table-scroll-wrapper': {
      overflowX: 'auto' as const,
      width: '100%',
      my: 1.5,
      WebkitOverflowScrolling: 'touch' as const,
    },
    '& table': {
      borderCollapse: 'collapse' as const,
      width: '100%',
      fontSize: typeScale.bodySmall.fontSize,
      lineHeight: 1.5,
      tableLayout: 'auto' as const,
    },
    '& th, & td': {
      border: `1px solid ${theme.palette.divider}`,
      padding: theme.spacing(0.75, 1.25),
      textAlign: 'left' as const,
      wordBreak: 'normal' as const,
      overflowWrap: 'break-word' as const,
    },
    '& th': {
      backgroundColor: surfaceOverlay(theme, 'subtle'),
      fontWeight: typographyTokens.fontWeight.semibold,
      color: textColor,
      whiteSpace: 'nowrap' as const,
    },
    '& tr:nth-of-type(even)': {
      backgroundColor: surfaceOverlay(theme, 'faint'),
    },

    '& img': { maxWidth: '100%', borderRadius: '8px' },
  };
}
