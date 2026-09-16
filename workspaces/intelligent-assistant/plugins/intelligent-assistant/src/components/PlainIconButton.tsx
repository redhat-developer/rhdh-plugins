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

export const LIGHTSPEED_MESSAGE_BAR_MODEL_SELECTOR_CLASS =
  'lightspeed-message-bar-model-selector';

const messageBarActionControlSize = '2.25rem';

/** Keeps attach/mic tooltips and action groups on one horizontal center line. */
export const messageBarActionsAlignCss = {
  '& .pf-chatbot__message-bar-actions': {
    alignItems: 'center !important',
  },
  '& .pf-chatbot__message-bar-actions-group': {
    alignItems: 'center !important',
  },
  '& .pf-chatbot__message-bar-actions .pf-v6-c-tooltip, & .pf-chatbot__message-bar-actions .pf-v5-c-tooltip':
    {
      display: 'inline-flex !important',
      alignItems: 'center !important',
      alignSelf: 'center !important',
    },
} as const;

/** Message bar model picker: text toggle (not an icon-only control). */
export const messageBarModelSelectorToggleCss = {
  display: 'inline-flex !important',
  alignItems: 'center',
  gap: '4px',
  width: 'auto !important',
  minWidth: 'max-content !important',
  maxWidth: 'none !important',
  height: 'auto !important',
  padding: '4px 8px !important',
  border: 'none !important',
  borderRadius: 'var(--pf-t--global--border--radius--small) !important',
  backgroundColor: 'transparent !important',
  whiteSpace: 'nowrap',
  '--pf-v6-c-menu-toggle--MinWidth': 'max-content',
  '--pf-v6-c-menu-toggle--PaddingInlineStart': '8px',
  '--pf-v6-c-menu-toggle--PaddingInlineEnd': '8px',
  '--pf-v6-c-menu-toggle--PaddingBlockStart': '4px',
  '--pf-v6-c-menu-toggle--PaddingBlockEnd': '4px',
  '--pf-v6-c-menu-toggle--BorderWidth': '0',
  '--pf-v6-c-menu-toggle--m-plain--BorderWidth': '0',
  '--pf-v6-c-menu-toggle--BackgroundColor': 'transparent',
  '--pf-v6-c-menu-toggle--hover--BackgroundColor': 'transparent',
  '--pf-v6-c-menu-toggle--m-plain--BackgroundColor': 'transparent',
  '--pf-v6-c-menu-toggle--m-plain--hover--BackgroundColor': 'transparent',
  '--pf-v6-c-menu-toggle--expanded--BackgroundColor': 'transparent',
  '--pf-v6-c-menu-toggle--m-plain--expanded--BackgroundColor': 'transparent',
  '&::before': {
    display: 'none !important',
  },
  '&::after': {
    border: '0 !important',
    borderRadius: 'inherit !important',
  },
  '&:hover, &:focus-visible, &.pf-m-expanded, &[aria-expanded="true"]': {
    backgroundColor: 'transparent !important',
    '--pf-v6-c-menu-toggle--hover--BackgroundColor': 'transparent',
    '--pf-v6-c-menu-toggle--m-plain--hover--BackgroundColor': 'transparent',
    '--pf-v6-c-menu-toggle--expanded--BackgroundColor': 'transparent',
    '--pf-v6-c-menu-toggle--m-plain--expanded--BackgroundColor': 'transparent',
  },
} as const;

export const messageBarMicrophoneActiveButtonCss = {
  backgroundColor: 'var(--pf-t--global--color--brand--clicked) !important',
  '--pf-v6-c-button--BackgroundColor':
    'var(--pf-t--global--color--brand--clicked)',
  '--pf-v6-c-button--m-plain--BackgroundColor':
    'var(--pf-t--global--color--brand--clicked)',
  '& .pf-v6-c-button__icon': {
    color: 'var(--pf-t--global--icon--color--on-brand--default) !important',
  },
} as const;

export const messageBarMicrophoneActiveSelector =
  '& .pf-chatbot__button--microphone.pf-chatbot__button--microphone--active';

/** Send/stop in message bar: align with attach/mic control height. */
export const messageBarSendStopButtonCss = {
  width: `${messageBarActionControlSize} !important`,
  height: `${messageBarActionControlSize} !important`,
  minWidth: `${messageBarActionControlSize} !important`,
  padding: '0 !important',
  display: 'inline-flex !important',
  alignItems: 'center',
  justifyContent: 'center',
  alignSelf: 'center !important',
  '--pf-v6-c-button--AlignItems': 'center',
  '--pf-v6-c-button--JustifyContent': 'center',
  '--pf-v6-c-button--PaddingBlockStart': '0',
  '--pf-v6-c-button--PaddingBlockEnd': '0',
} as const;

export const messageBarSendStopSelector =
  '& .pf-chatbot__button--send, & .pf-chatbot__button--stop';

/** Chatbot history nav drawer close: custom icon + override chatbot pill sizing. */
export const chatHistoryDrawerCollapseCloseCss = {
  '& .pf-v6-c-drawer__close, & .pf-v5-c-drawer__close': {
    marginTop: 0,
    marginRight: 0,
  },
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
    ...messageBarActionsAlignCss,
    [messageBarMicrophoneActiveSelector]: messageBarMicrophoneActiveButtonCss,
    [messageBarSendStopSelector]: messageBarSendStopButtonCss,
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
