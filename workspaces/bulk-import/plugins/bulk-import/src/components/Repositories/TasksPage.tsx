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
import { useParams } from 'react-router-dom';

import { Content, Header, Page } from '@backstage/core-components';
import { useApi } from '@backstage/core-plugin-api';

import { useQuery } from '@tanstack/react-query';

import { bulkImportApiRef } from '../../api/BulkImportBackendClient';
import { useTranslation } from '../../hooks/useTranslation';
import { ImportJobStatus } from '../../types';
import { TasksTable } from './TasksTable';

export const TasksPage = () => {
  const { repoUrl } = useParams();
  const bulkImportApi = useApi(bulkImportApiRef);

  const { data, isLoading, isError } = useQuery(['repository', repoUrl], () =>
    bulkImportApi.getImportAction(decodeURIComponent(repoUrl!), ''),
  );
  const { t } = useTranslation();

  if (isLoading) {
    return <div>{t('tasks.loading')}</div>;
  }

  if (isError) {
    return <div>{t('tasks.errorFetchingData')}</div>;
  }

  const importJobStatus = data as ImportJobStatus;

  return (
    <Page themeId="tool">
      <Header
        title={`${t('tasks.tasksFor' as any, { importJobStatusId: importJobStatus?.id ?? '' })}`}
      />
      <Content>
        <TasksTable tasks={importJobStatus?.tasks || []} />
      </Content>
    </Page>
  );
};
