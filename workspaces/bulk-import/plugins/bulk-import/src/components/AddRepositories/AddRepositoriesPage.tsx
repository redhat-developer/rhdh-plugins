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

import { useState } from 'react';

import { Content, Header, Page, Progress } from '@backstage/core-components';
import { usePermission } from '@backstage/plugin-permission-react';

import Alert from '@mui/material/Alert';
import AlertTitle from '@mui/material/AlertTitle';

import { bulkImportPermission } from '@red-hat-developer-hub/backstage-plugin-bulk-import-common';

import { useNumberOfApprovalTools } from '../../hooks';
import { useTranslation } from '../../hooks/useTranslation';
import { AddRepositoriesForm } from './AddRepositoriesForm';
import { ConfigurableInstructions } from './ConfigurableInstructions';

export const AddRepositoriesPage = () => {
  const { t } = useTranslation();
  const [formError, setFormError] = useState<any>(null);

  const bulkImportViewPermissionResult = usePermission({
    permission: bulkImportPermission,
    resourceRef: bulkImportPermission.resourceType,
  });

  const { numberOfApprovalTools } = useNumberOfApprovalTools();

  // Show instructions section for all flows now that it's customizable
  // Only hide if no integrations are configured (missing configurations)
  const showInstructionsSection = numberOfApprovalTools > 0;

  const showContent = () => {
    if (bulkImportViewPermissionResult.loading) {
      return <Progress />;
    }
    if (bulkImportViewPermissionResult.allowed) {
      return (
        <>
          {showInstructionsSection && !formError && (
            <ConfigurableInstructions />
          )}
          <AddRepositoriesForm onErrorChange={setFormError} />
        </>
      );
    }
    return (
      <div style={{ padding: '24px' }}>
        <Alert severity="warning" data-testid="no-permission-alert">
          <AlertTitle>{t('permissions.title')}</AlertTitle>
          {t('permissions.addRepositoriesMessage')}
        </Alert>
      </div>
    );
  };
  return (
    <Page themeId="tool">
      <Header
        title={t('page.title')}
        style={{ borderBottom: '1px solid #ccc' }}
      />
      <Content noPadding>{showContent()}</Content>
    </Page>
  );
};
