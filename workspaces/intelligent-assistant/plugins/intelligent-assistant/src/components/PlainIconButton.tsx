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

import { styled } from '@mui/material/styles';
import type { Theme } from '@mui/material/styles';
import { Button } from '@patternfly/react-core';

import { LIGHTSPEED_CONTENT_BORDER } from './chatShellTokens';

const drawerCollapseButtonSize = 'var(--pf-t--global--spacer--2xl)';

const COLLAPSE_PANEL_ICON_SVG = `url("data:image/svg+xml,%3Csvg width='24' height='24' viewBox='0 0 24 24' fill='none' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M16 21V3H14V21H16ZM12 17V7L7 12L12 17Z' fill='black'/%3E%3C/svg%3E") no-repeat center`;

/** Notebook document sidebar collapse control sizing (not chat history drawer close). */
export const drawerCollapseButtonSizeCss = {
  width: `${drawerCollapseButtonSize} !important`,
  minWidth: `${drawerCollapseButtonSize} !important`,
  height: `${drawerCollapseButtonSize} !important`,
  '--pf-v6-c-button--MinWidth': 'unset',
  '--pf-v6-c-button--AlignItems': 'center',
  '--pf-v6-c-button--JustifyContent': 'center',
  '--pf-v6-c-button--Gap': '0',
  '--pf-v6-c-button--m-plain--PaddingInlineEnd': '0',
  '--pf-v6-c-button--m-plain--PaddingInlineStart': '0',
  '--pf-v6-c-button--PaddingBlockStart': '0',
  '--pf-v6-c-button--PaddingBlockEnd': '0',
  padding: '0 !important',
} as const;

/** Centers icon-only content in drawer collapse buttons. */
export const drawerCollapseIconSlotCss = {
  position: 'absolute',
  inset: 0,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  margin: 0,
  width: 'auto',
  height: 'auto',
  lineHeight: 0,
  '--pf-v6-c-button__icon--MarginInlineStart': '0',
  '--pf-v6-c-button__icon--MarginInlineEnd': '0',
} as const;

/** Chatbot history nav drawer close: custom icon + override chatbot pill sizing. */
export const chatHistoryDrawerCollapseCloseCss = {
  '& .pf-v6-c-drawer__close .pf-v6-c-button svg, & .pf-v5-c-drawer__close .pf-v5-c-button svg':
    {
      display: 'none',
    },
  '& .pf-v6-c-drawer__close .pf-v6-c-button, & .pf-v5-c-drawer__close .pf-v5-c-button':
    {
      width: 'auto !important',
      height: 'auto !important',
      minWidth: 'unset !important',
      borderRadius: 'var(--pf-t--global--border--radius--small) !important',
      display: 'inline-flex',
      alignItems: 'center',
      justifyContent: 'center',
      lineHeight: 0,
      '& .pf-v6-c-button__icon::before, & .pf-v5-c-button__icon::before': {
        content: '""',
        display: 'block',
        width: 24,
        height: 24,
        flexShrink: 0,
        mask: COLLAPSE_PANEL_ICON_SVG,
        WebkitMask: COLLAPSE_PANEL_ICON_SVG,
        maskSize: 'contain',
        WebkitMaskSize: 'contain',
        maskRepeat: 'no-repeat',
        WebkitMaskRepeat: 'no-repeat',
        maskPosition: 'center',
        WebkitMaskPosition: 'center',
        backgroundColor: 'currentColor',
      },
    },
} as const;

/** Message bar chrome shared by chat and notebook footers. */
export const lightspeedMessageBarShellCss = (theme: Theme) =>
  ({
    '& .pf-chatbot__message-bar': {
      backgroundColor:
        theme.palette.mode === 'light'
          ? theme.palette.grey[100]
          : 'var(--pf-t--global--background--color--secondary--default)',
      border: LIGHTSPEED_CONTENT_BORDER,
      borderRadius: 24,
      padding: theme.spacing(0.5),
      '&::after': {
        display: 'none',
      },
    },
  }) as const;

/** Notebook sidebar collapse control (custom icon mask + drawer sizing). */
export const DrawerCollapseIconButton = styled(Button)({
  '&&': {
    ...drawerCollapseButtonSizeCss,
    position: 'relative',
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    lineHeight: 0,
    '& .pf-v6-c-button__icon': drawerCollapseIconSlotCss,
    '& .pf-v6-c-button__icon svg': {
      display: 'block',
      flexShrink: 0,
    },
  },
});
