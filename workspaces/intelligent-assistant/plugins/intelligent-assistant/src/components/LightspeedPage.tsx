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

import { useIaChatPermission } from '../hooks/useIaChatPermission';
import { useIaNotebooksPermission } from '../hooks/useIaNotebooksPermission';
import { useTranslation } from '../hooks/useTranslation';
import { LightspeedChatContainer } from './LightspeedChatContainer';

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
    <Page themeId="tool">
      <Header
        title={t('page.title')}
        style={{ display: 'none' }}
        pageTitleOverride={t('page.title')}
      />
      <Content noPadding>
        <LightspeedChatContainer />
      </Content>
    </Page>
  );
};
