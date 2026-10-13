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
 * Theme sizes `BackstageSidebarPage` with a viewport calc and
 * `SidebarPage > main { height: auto }` so catalog pages can grow and scroll.
 * This route overrides that with `height: 100% !important` so Page/Chatbot
 * fill the already-sized shell (avoids PF's base `height: 70vh` —
 * RHDHBUGS-3925).
 *
 * Do not re-declare a `100vh` calc on this Page: Emotion mangles
 * `:root:has(#global-header) &` into a never-matching selector, so a local
 * no-header calc under the masthead overflowed the shell and clipped the AI
 * footnote. Filling the parent well inherits the theme's correct inset/header
 * math instead.
 *
 * Stay under SidebarPage ::before corner masks (z-index 101) and match the
 * masthead page-well radius (bottom-right).
 */
const FullHeightPage = styled(Page)({
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
