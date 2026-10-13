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
 * Theme sizes `BackstageSidebarPage` with a viewport calc, but
 * `SidebarPage > main { height: auto }` so catalog pages can grow and scroll.
 * Percentage `height: 100%` on this Page therefore collapses to content and
 * leaves the page-inset chrome visible below the rounded well (notebooks list).
 *
 * Do not use `:root:has(#global-header) &` here — Emotion mangles that into a
 * never-matching selector. Theme already publishes `--rhdh-global-header-height`
 * when the masthead is present; use that token with the default page inset.
 *
 * Stay under SidebarPage ::before corner masks (z-index 101) and match the
 * masthead page-well radius (bottom-right).
 */
// Masthead sets --rhdh-global-header-height (top inset dropped). Without it,
// fallback 1.5rem matches the theme top page-inset so both gutters are covered.
const SIDEBAR_PAGE_WELL_HEIGHT =
  'calc(100vh - var(--rhdh-global-header-height, 1.5rem) - 1.5rem)';

const FullHeightPage = styled(Page)({
  boxSizing: 'border-box',
  height: `${SIDEBAR_PAGE_WELL_HEIGHT} !important`,
  minHeight: `${SIDEBAR_PAGE_WELL_HEIGHT} !important`,
  maxHeight: `${SIDEBAR_PAGE_WELL_HEIGHT} !important`,
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
});

const FullHeightContent = styled(Content)({
  minHeight: 0,
  height: '100%',
  flex: '1 1 auto',
  display: 'flex',
  flexDirection: 'column',
  overflow: 'hidden',
  // Match theme SidebarPage page-well rounding with masthead (bottom-right).
  // Theme forces `main { borderRadius: 0 }`, so round the inner content.
  '@media (min-width: 600px)': {
    borderRadius: '0 0 1rem 0',
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
