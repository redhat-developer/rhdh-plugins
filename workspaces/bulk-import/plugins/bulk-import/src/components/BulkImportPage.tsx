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

import { Content, Header, Page, Progress } from '@backstage/core-components';
import { usePermission } from '@backstage/plugin-permission-react';
import { Alert } from '@backstage/ui';

import { Formik } from 'formik';

import { bulkImportPermission } from '@red-hat-developer-hub/backstage-plugin-bulk-import-common';

import { useTranslation } from '../hooks/useTranslation';
import {
  AddRepositoriesFormValues,
  ApprovalTool,
  RepositorySelection,
} from '../types';
import { DeleteDialogContextProvider } from './DeleteDialogContext';
import { DrawerContextProvider } from './DrawerContext';
import { RepositoriesList } from './Repositories/RepositoriesList';

export const BulkImportPage = () => {
  const { t } = useTranslation();
  const initialValues: AddRepositoriesFormValues = {
    repositoryType: RepositorySelection.Repository,
    repositories: {},
    excludedRepositories: {},
    approvalTool: ApprovalTool.Git,
  };

  const bulkImportViewPermissionResult = usePermission({
    permission: bulkImportPermission,
  });

  const showContent = () => {
    if (bulkImportViewPermissionResult.loading) {
      return <Progress />;
    }
    if (bulkImportViewPermissionResult.allowed) {
      return (
        <Formik
          initialValues={initialValues}
          enableReinitialize
          onSubmit={async (_values: AddRepositoriesFormValues) => {}}
        >
          <div style={{ width: '100%' }}>
            <RepositoriesList />
          </div>
        </Formik>
      );
    }
    return (
      <Alert
        status="warning"
        icon
        data-testid="no-permission-alert"
        title={t('permissions.title')}
        description={t('permissions.viewRepositoriesMessage')}
      />
    );
  };

  return (
    <Page themeId="tool">
      <Header
        title={t('page.title')}
        style={{ borderBottom: '1px solid var(--bui-border-1)' }}
      />
      <DrawerContextProvider>
        <DeleteDialogContextProvider>
          <Content>{showContent()}</Content>
        </DeleteDialogContextProvider>
      </DrawerContextProvider>
    </Page>
  );
};
