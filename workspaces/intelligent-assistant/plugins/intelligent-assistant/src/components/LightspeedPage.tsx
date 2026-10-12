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

import { Content, ErrorPage, Header, Page } from '@backstage/core-components';

import { styled } from '@mui/material/styles';

import { useIaChatPermission } from '../hooks/useIaChatPermission';
import { useIaNotebooksPermission } from '../hooks/useIaNotebooksPermission';
import { useTranslation } from '../hooks/useTranslation';
import { LightspeedChatContainer } from './LightspeedChatContainer';

/**
 * Fill the RHDH SidebarPage well.
 *
 * Theme sizes `BackstageSidebarPage` with a viewport calc, but forces
 * `SidebarPage > main { height: auto }` so catalog pages can grow and scroll.
 * Percentage heights on Page/Chatbot therefore collapse to content (and PF's
 * base `height: 70vh` / empty space under the well — RHDHBUGS-3925).
 *
 * Match the theme's shell calc so this route gets a definite height without
 * changing the theme rule for other plugins. Default page inset is 1.5rem
 * (same as theme `general.pageInset` fallback).
 *
 * Full-bleed fill also covers the shell's sticky ::before corner masks
 * (z-index 101) unless we stay under them and clip to the same radii as
 * BackstageSidebarPage (right edge / bottom-right with masthead).
 */
const PAGE_INSET = '1.5rem';
const shellHeightNoHeader = `calc(100vh - 2 * ${PAGE_INSET})`;
const shellHeightWithHeader = `calc(100vh - var(--rhdh-global-header-height, 64px) - ${PAGE_INSET})`;

const FullHeightPage = styled(Page)({
  // Mobile: theme does not size the shell with a viewport calc.
  height: '100% !important',
  maxHeight: '100%',
  minHeight: 0,
  flex: '1 1 auto',
  display: 'flex',
  flexDirection: 'column',
  overflow: 'hidden',
  // Keep chatbot chrome under SidebarPage ::before corner masks (z-index 101).
  position: 'relative',
  zIndex: 0,
  // Page wraps header + content; stretch content to the remaining height.
  '& > *:last-child': {
    flex: '1 1 auto',
    minHeight: 0,
  },
  // Desktop page-inset shell (same breakpoint / calc as theme SidebarPage).
  '@media (min-width: 600px)': {
    height: `${shellHeightNoHeader} !important`,
    maxHeight: shellHeightNoHeader,
    minHeight: shellHeightNoHeader,
    ':root:has(#global-header) &': {
      height: `${shellHeightWithHeader} !important`,
      maxHeight: shellHeightWithHeader,
      minHeight: shellHeightWithHeader,
    },
  },
});

const FullHeightContent = styled(Content)({
  minHeight: 0,
  height: '100%',
  flex: '1 1 auto',
  display: 'flex',
  flexDirection: 'column',
  overflow: 'hidden',
  // Match theme SidebarPage page-well rounding. Theme forces `main {
  // borderRadius: 0 }`, so round the inner content instead.
  '@media (min-width: 600px)': {
    borderRadius: '0 1rem 1rem 0',
    ':root:has(#global-header) &': {
      borderRadius: '0 0 1rem 0',
    },
  },
});

/**
 * Lightspeed Page - Routable fullscreen/embedded mode
 * @public
 */
export const LightspeedPage = () => {
  const { t } = useTranslation();
  const { allowed: hasChatAccess, loading: chatPermissionLoading } =
    useIaChatPermission();
  const { allowed: hasNotebooksAccess, loading: notebooksPermissionLoading } =
    useIaNotebooksPermission();

  const permissionsLoading =
    chatPermissionLoading || notebooksPermissionLoading;
  const hasPluginAccess = hasChatAccess || hasNotebooksAccess;

  if (!permissionsLoading && !hasPluginAccess) {
    return <ErrorPage status="404" statusMessage="Page not found" />;
  }

  return (
    <FullHeightPage themeId="tool">
      <Header
        title={t('page.title')}
        style={{ display: 'none' }}
        pageTitleOverride={t('page.title')}
      />
      <FullHeightContent noPadding stretch>
        <LightspeedChatContainer />
      </FullHeightContent>
    </FullHeightPage>
  );
};
