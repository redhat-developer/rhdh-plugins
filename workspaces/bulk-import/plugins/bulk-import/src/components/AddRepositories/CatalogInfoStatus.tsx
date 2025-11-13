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

import { useGitlabConfigured } from '../../hooks';
import { useImportFlow } from '../../hooks/useImportFlow';
import { useTranslation } from '../../hooks/useTranslation';
import {
  AddRepositoriesFormValues,
  AddRepositoryData,
  ImportFlow,
  RepositoryStatus,
} from '../../types';
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
}: {
  data: AddRepositoryData;
  isLoading?: boolean;
  alreadyAdded?: number;
  isItemSelected?: boolean;
  isDrawer?: boolean;
  importStatus?: string;
  taskId?: string;
}) => {
  const { t } = useTranslation();
  const { values, setFieldValue } =
    useFormikContext<AddRepositoriesFormValues>();
  const gitlabConfigured = useGitlabConfigured();

  useEffect(() => {
    if (importStatus === RepositoryStatus.ADDED) {
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
    return (
      <Typography component="span" style={{ color: '#6A6E73' }}>
        {getImportStatus(
          importStatus,
          (key: string) => t(key as any, {}),
          false,
          undefined,
          taskId,
          gitlabConfigured,
        )}
      </Typography>
    );
  }

  if (isDrawer || data?.totalReposInOrg === 0) {
    return null;
  }

  return (
    <Typography component="span">
      {t('catalogInfo.status.notGenerated')}
    </Typography>
  );
};
