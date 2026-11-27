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

import { useEffect } from 'react';

import { StatusRunning } from '@backstage/core-components';
import { Text } from '@backstage/ui';

import { useFormikContext } from 'formik';

import { useImportFlow } from '../../hooks/useImportFlow';
import { useTranslation } from '../../hooks/useTranslation';
import {
  AddRepositoriesFormValues,
  AddRepositoryData,
  ImportFlow,
  RepositoryStatus,
  TaskStatus,
} from '../../types';
import {
  areAllRowsSelected,
  getImportStatus,
} from '../../utils/repository-utils';
import {
  bulkImportTypographyBody2,
  bulkImportTypographySecondary,
} from '../bulkImportTypography';
import { PreviewFile } from '../PreviewFile/PreviewFile';

export const CatalogInfoStatus = ({
  data,
  isItemSelected,
  alreadyAdded = 0,
  isLoading,
  isDrawer,
  importStatus,
  taskOrWorkflowId,
  prUrl,
}: {
  data: AddRepositoryData;
  isLoading?: boolean;
  alreadyAdded?: number;
  isItemSelected?: boolean;
  isDrawer?: boolean;
  importStatus?: string;
  taskOrWorkflowId?: string;
  prUrl?: string;
}) => {
  const { t } = useTranslation();
  const { values, setFieldValue } =
    useFormikContext<AddRepositoriesFormValues>();

  useEffect(() => {
    if (
      importStatus === RepositoryStatus.ADDED ||
      importStatus === RepositoryStatus.WAIT_PR_APPROVAL ||
      importStatus === TaskStatus.Processing ||
      importStatus === TaskStatus.Completed
    ) {
      setFieldValue(`excludedRepositories.${data.id}`, {
        repoId: data.id,
        orgName: data.orgName,
        status: importStatus,
      });
    }
  }, [data.id, importStatus, setFieldValue, data.repoName, data.orgName]);

  const isSelected =
    isItemSelected || Object.keys(data.selectedRepositories || {}).length > 0;
  const allSelected = areAllRowsSelected(
    values.repositoryType,
    alreadyAdded,
    isItemSelected,
    data?.totalReposInOrg || 0,
    data?.selectedRepositories || {},
  );

  const importFlow = useImportFlow();

  if (
    importFlow !== ImportFlow.Scaffolder &&
    importFlow !== ImportFlow.Orchestrator &&
    !isDrawer &&
    (isSelected ||
      (data?.totalReposInOrg && data.totalReposInOrg > 0 && allSelected))
  ) {
    return <PreviewFile data={data} />;
  }

  if (!isDrawer && isLoading) {
    return (
      <StatusRunning>
        <Text
          as="span"
          style={{ ...bulkImportTypographyBody2, color: '#181818' }}
        >
          {t('catalogInfo.status.generating')}
        </Text>
      </StatusRunning>
    );
  }

  if (importStatus) {
    return (
      <Text as="span" style={bulkImportTypographyBody2}>
        {getImportStatus(
          importStatus,
          (key: string) => t(key as any, {}),
          true,
          prUrl,
          taskOrWorkflowId,
        )}
      </Text>
    );
  }

  if (isDrawer || data?.totalReposInOrg === 0) {
    return null;
  }

  return (
    <Text as="span" style={bulkImportTypographySecondary}>
      {t('status.readyToImport')}
    </Text>
  );
};
