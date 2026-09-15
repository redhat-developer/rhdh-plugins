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
import { Button, MenuToggle } from '@patternfly/react-core';

const compactPlainIconButtonRadius =
  'var(--pf-t--global--border--radius--pill)';
const drawerCollapseButtonSize = 'var(--pf-t--global--spacer--2xl)';

/** Matches PF chatbot history drawer close button sizing. */
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
  '--pf-v6-c-button--BorderWidth': '0',
  '--pf-v6-c-button--m-plain--hover--BorderWidth': '0',
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

/** Force circular plain hover in overlay/docked compact surfaces. */
export const compactPlainIconButtonRadiusCss = {
  '--pf-v6-c-button--BorderRadius': `${compactPlainIconButtonRadius} !important`,
  '--pf-v6-c-button--m-plain--BorderRadius': `${compactPlainIconButtonRadius} !important`,
  '--pf-v6-c-menu-toggle--BorderRadius': `${compactPlainIconButtonRadius} !important`,
  '--pf-v6-c-menu-toggle--m-plain--BorderRadius': `${compactPlainIconButtonRadius} !important`,
  borderStartStartRadius: `${compactPlainIconButtonRadius} !important`,
  borderStartEndRadius: `${compactPlainIconButtonRadius} !important`,
  borderEndStartRadius: `${compactPlainIconButtonRadius} !important`,
  borderEndEndRadius: `${compactPlainIconButtonRadius} !important`,
} as const;

/** Options kebab in chat header: circular plain hover like compact icon buttons. */
export const chatHeaderOptionsToggleCss = {
  ...compactPlainIconButtonRadiusCss,
  display: 'inline-flex !important',
  alignItems: 'center',
  justifyContent: 'center',
  padding: '0 !important',
  borderRadius: `${compactPlainIconButtonRadius} !important`,
  backgroundColor:
    'var(--pf-t--global--background--color--action--plain--default) !important',
  '--pf-v6-c-menu-toggle--AlignItems': 'center',
  '--pf-v6-c-menu-toggle--JustifyContent': 'center',
  '--pf-v6-c-menu-toggle--MinWidth': 'unset',
  '--pf-v6-c-menu-toggle--PaddingInlineStart': '0',
  '--pf-v6-c-menu-toggle--PaddingInlineEnd': '0',
  '--pf-v6-c-menu-toggle--PaddingBlockStart': '0',
  '--pf-v6-c-menu-toggle--PaddingBlockEnd': '0',
  '--pf-v6-c-menu-toggle--m-plain--PaddingInlineStart': '0',
  '--pf-v6-c-menu-toggle--m-plain--PaddingInlineEnd': '0',
  '--pf-v6-c-menu-toggle--BorderWidth': '0',
  '--pf-v6-c-menu-toggle--m-plain--BorderWidth': '0',
  '--pf-v6-c-menu-toggle--hover--BorderWidth': '0',
  '--pf-v6-c-menu-toggle--m-plain--hover--BorderWidth': '0',
  '--pf-v6-c-menu-toggle--expanded--BorderWidth': '0',
  '--pf-v6-c-menu-toggle--m-plain--expanded--BorderWidth': '0',
  '--pf-v6-c-menu-toggle--BorderColor': 'transparent',
  '--pf-v6-c-menu-toggle--hover--BorderColor': 'transparent',
  '--pf-v6-c-menu-toggle--expanded--BorderColor': 'transparent',
  '--pf-v6-c-menu-toggle--BackgroundColor':
    'var(--pf-t--global--background--color--action--plain--default)',
  '--pf-v6-c-menu-toggle--hover--BackgroundColor':
    'var(--pf-t--global--background--color--action--plain--hover)',
  '--pf-v6-c-menu-toggle--m-plain--hover--BackgroundColor':
    'var(--pf-t--global--background--color--action--plain--hover)',
  '--pf-v6-c-menu-toggle--expanded--BackgroundColor':
    'var(--pf-t--global--background--color--action--plain--hover)',
  '&::before': {
    borderRadius: 'inherit !important',
    border: '0 !important',
  },
  '&:hover, &:focus-visible, &.pf-m-expanded, &[aria-expanded="true"]': {
    ...compactPlainIconButtonRadiusCss,
    borderRadius: `${compactPlainIconButtonRadius} !important`,
    backgroundColor:
      'var(--pf-t--global--background--color--action--plain--hover) !important',
    '--pf-v6-c-menu-toggle--hover--BackgroundColor':
      'var(--pf-t--global--background--color--action--plain--hover)',
    '--pf-v6-c-menu-toggle--m-plain--hover--BackgroundColor':
      'var(--pf-t--global--background--color--action--plain--hover)',
    '--pf-v6-c-menu-toggle--expanded--BackgroundColor':
      'var(--pf-t--global--background--color--action--plain--hover)',
  },
} as const;

/** Suppress PF plain button square focus ring so pill hover reads as a circle. */
export const plainCircleButtonAfterCss = {
  '&::after': {
    borderRadius: 'inherit !important',
    borderWidth: '0 !important',
    border: '0 !important',
  },
} as const;

/** Icon-only plain MenuToggle (sort, kebab): 32×32 with circular hover. */
export const compactPlainMenuToggleCss = {
  ...chatHeaderOptionsToggleCss,
  ...plainCircleButtonAfterCss,
  minWidth: '32px !important',
  width: '32px !important',
  height: '32px !important',
  lineHeight: 1,
  '--pf-v6-c-menu-toggle--MinWidth': '32px',
  '& svg': {
    display: 'block',
    flexShrink: 0,
  },
} as const;

/** Message bar model picker: text toggle, no icon-button hover (not 32×32). */
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

export const LIGHTSPEED_MESSAGE_BAR_MODEL_SELECTOR_CLASS =
  'lightspeed-message-bar-model-selector';

/** Attach / microphone in message bar: compact icon targets, no circular plain hover. */
export const messageBarAttachMicrophoneSelector =
  '& .pf-chatbot__button--attach, & .pf-v6-c-menu-toggle.pf-chatbot__button--attach, & .pf-v5-c-menu-toggle.pf-chatbot__button--attach, & .pf-chatbot__button--microphone';

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

export const messageBarAttachMicrophoneButtonCss = {
  width: `${messageBarActionControlSize} !important`,
  height: `${messageBarActionControlSize} !important`,
  minWidth: `${messageBarActionControlSize} !important`,
  padding: '0 !important',
  display: 'inline-flex !important',
  alignItems: 'center',
  justifyContent: 'center',
  alignSelf: 'center !important',
  flexShrink: 0,
  lineHeight: '1 !important',
  borderRadius: 'var(--pf-t--global--border--radius--small) !important',
  ...plainCircleButtonAfterCss,
  '--pf-v6-c-button--MinWidth': messageBarActionControlSize,
  '--pf-v6-c-menu-toggle--MinWidth': messageBarActionControlSize,
  '--pf-v6-c-button--AlignItems': 'center',
  '--pf-v6-c-button--JustifyContent': 'center',
  '--pf-v6-c-button--PaddingBlockStart': '0',
  '--pf-v6-c-button--PaddingBlockEnd': '0',
  '--pf-v6-c-button--PaddingInlineStart': '0',
  '--pf-v6-c-button--PaddingInlineEnd': '0',
  '--pf-v6-c-button__icon--MarginBlockStart': '0',
  '--pf-v6-c-button__icon--MarginBlockEnd': '0',
  '--pf-v6-c-button__icon--MarginInlineStart': '0',
  '--pf-v6-c-button__icon--MarginInlineEnd': '0',
  '--pf-v6-c-button--BorderRadius':
    'var(--pf-t--global--border--radius--small)',
  '--pf-v6-c-button--m-plain--BorderRadius':
    'var(--pf-t--global--border--radius--small)',
  '--pf-v6-c-menu-toggle--BorderRadius':
    'var(--pf-t--global--border--radius--small)',
  '--pf-v6-c-menu-toggle--m-plain--BorderRadius':
    'var(--pf-t--global--border--radius--small)',
  backgroundColor: 'transparent !important',
  '--pf-v6-c-button--BackgroundColor': 'transparent',
  '--pf-v6-c-button--hover--BackgroundColor': 'transparent',
  '--pf-v6-c-button--m-plain--BackgroundColor': 'transparent',
  '--pf-v6-c-button--m-plain--hover--BackgroundColor': 'transparent',
  '--pf-v6-c-menu-toggle--BackgroundColor': 'transparent',
  '--pf-v6-c-menu-toggle--hover--BackgroundColor': 'transparent',
  '--pf-v6-c-menu-toggle--m-plain--BackgroundColor': 'transparent',
  '--pf-v6-c-menu-toggle--m-plain--hover--BackgroundColor': 'transparent',
  '--pf-v6-c-menu-toggle--BorderWidth': '0',
  '--pf-v6-c-menu-toggle--m-plain--BorderWidth': '0',
  '&::before': {
    display: 'none !important',
  },
  '&:hover:not(:disabled), &:focus-visible:not(:disabled)': {
    backgroundColor: 'transparent !important',
    '--pf-v6-c-button--hover--BackgroundColor': 'transparent',
    '--pf-v6-c-button--m-plain--hover--BackgroundColor': 'transparent',
    '--pf-v6-c-menu-toggle--hover--BackgroundColor': 'transparent',
    '--pf-v6-c-menu-toggle--m-plain--hover--BackgroundColor': 'transparent',
  },
  '& .pf-v6-c-button__icon': {
    color: 'var(--pf-t--global--icon--color--subtle)',
    fontSize: '1.125rem',
    display: 'inline-flex !important',
    alignItems: 'center',
    justifyContent: 'center',
    lineHeight: 0,
    margin: '0 !important',
  },
  '& .pf-v6-c-button__icon .pf-v6-c-icon, & .pf-v6-c-button__icon .pf-v5-c-icon':
    {
      display: 'inline-flex',
      alignItems: 'center',
      justifyContent: 'center',
      lineHeight: 0,
    },
  '& .pf-v6-c-button__icon svg': {
    width: '1.125rem',
    height: '1.125rem',
  },
  '& .pf-v6-c-menu-toggle__icon, & .pf-v5-c-menu-toggle__icon': {
    fontSize: '1.125rem',
  },
  '& .pf-v6-c-menu-toggle__icon svg, & .pf-v5-c-menu-toggle__icon svg': {
    width: '1.125rem',
    height: '1.125rem',
  },
  '&:hover:not(:disabled) .pf-v6-c-button__icon': {
    color: 'var(--pf-t--global--icon--color--regular)',
  },
  '&.pf-m-compact': {
    width: `${messageBarActionControlSize} !important`,
    height: `${messageBarActionControlSize} !important`,
    minWidth: `${messageBarActionControlSize} !important`,
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

/** Send/stop in message bar: same 2.25rem box as attach/mic for row alignment. */
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

/**
 * Pill-shaped plain hover without forcing 32×32 — keeps PF default modal/action sizing.
 */
export const plainCircleHoverButtonCss = {
  ...compactPlainIconButtonRadiusCss,
  ...plainCircleButtonAfterCss,
  '--pf-v6-c-button--AlignItems': 'center',
  '--pf-v6-c-button--JustifyContent': 'center',
  '--pf-v6-c-button--BorderWidth': '0',
  '--pf-v6-c-button--m-plain--BorderWidth': '0',
  '--pf-v6-c-button--m-plain--hover--BorderWidth': '0',
  '--pf-v6-c-button--BackgroundColor':
    'var(--pf-t--global--background--color--action--plain--default)',
  '--pf-v6-c-button--hover--BackgroundColor':
    'var(--pf-t--global--background--color--action--plain--hover)',
  '--pf-v6-c-button--m-plain--BackgroundColor':
    'var(--pf-t--global--background--color--action--plain--default)',
  '--pf-v6-c-button--m-plain--hover--BackgroundColor':
    'var(--pf-t--global--background--color--action--plain--hover)',
  '&:hover:not(:disabled), &:focus-visible:not(:disabled)': {
    ...compactPlainIconButtonRadiusCss,
    '--pf-v6-c-button--hover--BackgroundColor':
      'var(--pf-t--global--background--color--action--plain--hover)',
    '--pf-v6-c-button--m-plain--hover--BackgroundColor':
      'var(--pf-t--global--background--color--action--plain--hover)',
  },
} as const;

/** Shared 32×32 plain icon button with circular hover (className or styled()). */
export const compactPlainCircleButtonCss = {
  ...compactPlainIconButtonRadiusCss,
  ...plainCircleButtonAfterCss,
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  padding: '6px !important',
  minWidth: '32px !important',
  width: '32px !important',
  height: '32px !important',
  lineHeight: 1,
  '--pf-v6-c-button--MinWidth': 'unset',
  '--pf-v6-c-button--AlignItems': 'center',
  '--pf-v6-c-button--JustifyContent': 'center',
  '--pf-v6-c-button--Gap': '0',
  '--pf-v6-c-button--m-plain--PaddingInlineStart': '0',
  '--pf-v6-c-button--m-plain--PaddingInlineEnd': '0',
  '--pf-v6-c-button--PaddingBlockStart': '0',
  '--pf-v6-c-button--PaddingBlockEnd': '0',
  '--pf-v6-c-button--BorderWidth': '0',
  '--pf-v6-c-button--m-plain--BorderWidth': '0',
  '--pf-v6-c-button--m-plain--hover--BorderWidth': '0',
  '--pf-v6-c-button--BackgroundColor':
    'var(--pf-t--global--background--color--action--plain--default)',
  '--pf-v6-c-button--hover--BackgroundColor':
    'var(--pf-t--global--background--color--action--plain--hover)',
  '--pf-v6-c-button--m-plain--BackgroundColor':
    'var(--pf-t--global--background--color--action--plain--default)',
  '--pf-v6-c-button--m-plain--hover--BackgroundColor':
    'var(--pf-t--global--background--color--action--plain--hover)',
  '& .pf-v6-c-button__icon': {
    margin: 0,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  '& svg': {
    display: 'block',
    flexShrink: 0,
  },
} as const;

/** 40×40 plain icon button with circular hover (table actions, etc.). */
export const mediumPlainCircleButtonCss = {
  ...compactPlainCircleButtonCss,
  padding: '8px !important',
  minWidth: '40px !important',
  width: '40px !important',
  height: '40px !important',
} as const;

const framedPlainIconButtonRadius = '12px';

const framedPlainIconButtonRadiusCss = {
  '--pf-v6-c-button--BorderRadius': `${framedPlainIconButtonRadius} !important`,
  '--pf-v6-c-button--m-plain--BorderRadius': `${framedPlainIconButtonRadius} !important`,
  borderStartStartRadius: `${framedPlainIconButtonRadius} !important`,
  borderStartEndRadius: `${framedPlainIconButtonRadius} !important`,
  borderEndStartRadius: `${framedPlainIconButtonRadius} !important`,
  borderEndEndRadius: `${framedPlainIconButtonRadius} !important`,
} as const;

const framedPlainIconButtonSurfaceCss = {
  ...framedPlainIconButtonRadiusCss,
  backgroundColor: 'transparent !important',
  '--pf-v6-c-button--BackgroundColor': 'transparent',
  '--pf-v6-c-button--hover--BackgroundColor': 'transparent',
  '--pf-v6-c-button--m-plain--BackgroundColor': 'transparent',
  '--pf-v6-c-button--m-plain--hover--BackgroundColor': 'transparent',
  '--pf-v6-c-button--m-clicked--BackgroundColor': 'transparent',
  '--pf-v6-c-button--m-plain--m-clicked--BackgroundColor': 'transparent',
} as const;

/** Fullscreen sidebar collapse buttons: PF history drawer close sizing. */
export const DrawerCollapseIconButton = styled(Button)({
  '&&': {
    ...drawerCollapseButtonSizeCss,
    ...compactPlainIconButtonRadiusCss,
    position: 'relative',
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    lineHeight: 0,
    '--pf-v6-c-button--BackgroundColor':
      'var(--pf-t--global--background--color--action--plain--default)',
    '--pf-v6-c-button--hover--BackgroundColor':
      'var(--pf-t--global--background--color--action--plain--hover)',
    '--pf-v6-c-button--m-plain--BackgroundColor':
      'var(--pf-t--global--background--color--action--plain--default)',
    '--pf-v6-c-button--m-plain--hover--BackgroundColor':
      'var(--pf-t--global--background--color--action--plain--hover)',
    '& .pf-v6-c-button__icon': drawerCollapseIconSlotCss,
    '& .pf-v6-c-button__icon svg': {
      display: 'block',
      flexShrink: 0,
    },
    '&:hover:not(:disabled), &:focus-visible:not(:disabled)': {
      ...compactPlainIconButtonRadiusCss,
      '--pf-v6-c-button--hover--BackgroundColor':
        'var(--pf-t--global--background--color--action--plain--hover)',
      '--pf-v6-c-button--m-plain--hover--BackgroundColor':
        'var(--pf-t--global--background--color--action--plain--hover)',
    },
  },
});

/** Overlay/docked header buttons: PF circular plain hover. */
export const CompactPlainIconButton = styled(Button)({
  '&&': {
    ...compactPlainCircleButtonCss,
    '&:hover:not(:disabled), &:focus-visible:not(:disabled)': {
      ...compactPlainIconButtonRadiusCss,
      '--pf-v6-c-button--hover--BackgroundColor':
        'var(--pf-t--global--background--color--action--plain--hover)',
      '--pf-v6-c-button--m-plain--hover--BackgroundColor':
        'var(--pf-t--global--background--color--action--plain--hover)',
    },
  },
});

/** Plain MenuToggle with the same circular hover as CompactPlainIconButton. */
export const CompactPlainMenuToggle = styled(MenuToggle)({
  '&&': compactPlainMenuToggleCss,
});

/** Fullscreen sidebar strip buttons: rounded square frame with shadow only on hover. */
export const FramedPlainIconButton = styled(Button)({
  '&&': {
    ...framedPlainIconButtonSurfaceCss,
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '8px !important',
    minWidth: '40px !important',
    width: '40px !important',
    height: '40px !important',
    lineHeight: 1,
    boxShadow:
      'var(--pf-t--global--box-shadow--sm, 0 1px 4px rgba(0, 0, 0, 0.12))',
    border: 'none !important',
    color: 'var(--pf-t--global--icon--color--subtle)',
    transition: 'box-shadow 0.15s',
    '& svg': {
      display: 'block',
      flexShrink: 0,
      width: 18,
      height: 18,
    },
    '&:hover:not(:disabled), &:focus-visible:not(:disabled)': {
      ...framedPlainIconButtonSurfaceCss,
      boxShadow:
        'var(--pf-t--global--box-shadow--md, 0 2px 6px rgba(0, 0, 0, 0.16))',
    },
  },
});

/** @deprecated Use CompactPlainIconButton or FramedPlainIconButton. */
export const PlainIconButton = CompactPlainIconButton;
