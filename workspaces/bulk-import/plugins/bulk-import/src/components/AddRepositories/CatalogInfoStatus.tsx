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

import Typography from '@mui/material/Typography';
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
import { SHOW_STATUS_COLUMN } from '../../utils/constants';
import {
  areAllRowsSelected,
  getImportStatus,
} from '../../utils/repository-utils';
import { PreviewFile } from '../PreviewFile/PreviewFile';

export const CatalogInfoStatus = ({
  data,
  isItemSelected,
  alreadyAdded = 0,
  isLoading,
  isDrawer,
  importStatus,
  taskId,
  prUrl,
}: {
  data: AddRepositoryData;
  isLoading?: boolean;
  alreadyAdded?: number;
  isItemSelected?: boolean;
  isDrawer?: boolean;
  importStatus?: string;
  taskId?: string;
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
  const isScaffolderFlow = importFlow === ImportFlow.Scaffolder;

  // Don't show any status based on configuration
  if (!SHOW_STATUS_COLUMN && !isDrawer) {
    return null;
  }

  if (
    importFlow !== ImportFlow.Scaffolder &&
    !isDrawer &&
    (isSelected ||
      (data?.totalReposInOrg && data.totalReposInOrg > 0 && allSelected))
  ) {
    return <PreviewFile data={data} />;
  }

  if (!isDrawer && isLoading) {
    return (
      <StatusRunning>
        <Typography
          component="span"
          style={{ fontWeight: '400', fontSize: '0.875rem', color: '#181818' }}
        >
          {t('catalogInfo.status.generating')}
        </Typography>
      </StatusRunning>
    );
  }

  if (importStatus) {
    // For scaffolder flow, task statuses (Processing, Completed, etc.) should have normal color
    const isTaskStatus = taskId && importStatus.startsWith('TASK');
    const textColor = isScaffolderFlow && isTaskStatus ? undefined : '#6A6E73';

    return (
      <Typography component="span" style={{ color: textColor }}>
        {getImportStatus(
          importStatus,
          (key: string) => t(key as any, {}),
          true,
          prUrl,
          taskId,
        )}
      </Typography>
    );
  }

  if (isDrawer || data?.totalReposInOrg === 0) {
    return null;
  }

  // For scaffolder flow, show "Ready to import" instead of "Not generated"
  if (isScaffolderFlow) {
    return (
      <Typography component="span" style={{ color: '#6A6E73' }}>
        {t('status.readyToImport')}
      </Typography>
    );
  }

  return (
    <Typography component="span">
      {t('catalogInfo.status.notGenerated')}
    </Typography>
  );
};
