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

import { Page, Header, Content, EmptyState } from '@backstage/core-components';
import { usePermission } from '@backstage/plugin-permission-react';
import { x2aAdminWritePermission } from '@red-hat-developer-hub/backstage-plugin-x2a-common';
import { useTranslation } from '../../hooks/useTranslation';
import { AdversarialAgentsTable } from './AdversarialAgentsTable';

export const AdversarialAgentsPage = () => {
  const { t } = useTranslation();
  const { allowed, loading } = usePermission({
    permission: x2aAdminWritePermission,
  });

  if (loading) {
    return (
      <Page themeId="tool">
        <Header
          title={t('adversarialAgentsPage.title')}
          subtitle={t('adversarialAgentsPage.subtitle')}
        />
        <Content />
      </Page>
    );
  }

  if (!allowed) {
    return (
      <Page themeId="tool">
        <Header
          title={t('adversarialAgentsPage.title')}
          subtitle={t('adversarialAgentsPage.subtitle')}
        />
        <Content>
          <EmptyState
            title={t('adversarialAgentsPage.notAllowed')}
            missing="info"
          />
        </Content>
      </Page>
    );
  }

  return (
    <Page themeId="tool">
      <Header
        title={t('adversarialAgentsPage.title')}
        subtitle={t('adversarialAgentsPage.subtitle')}
      />
      <Content>
        <AdversarialAgentsTable />
      </Content>
    </Page>
  );
};
