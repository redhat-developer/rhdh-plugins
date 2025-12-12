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
import { useImportFlow } from '../../hooks/useImportFlow';
import { useTranslation } from '../../hooks/useTranslation';
import { ImportFlow, ImportJobStatus } from '../../types';
import { ImportHistoryTable } from './ImportHistoryTable';

export const ImportHistoryPage = () => {
  const { repoUrl } = useParams();
  const importFlow = useImportFlow();
  const bulkImportApi = useApi(bulkImportApiRef);

  const { data, isLoading, isError } = useQuery(['repository', repoUrl], () =>
    bulkImportApi.getImportAction(decodeURIComponent(repoUrl!), ''),
  );
  const { t } = useTranslation();

  if (isLoading) {
    return <div>{t('importActions.loading')}</div>;
  }

  if (isError) {
    return <div>{t('importActions.errorFetchingData')}</div>;
  }

  const importJobStatus = data as ImportJobStatus;

  const isOrchestratorFlow = importFlow === ImportFlow.Orchestrator;

  return (
    <Page themeId="tool">
      <Header
        title={`${t(
          (isOrchestratorFlow
            ? 'workflows.workflowsFor'
            : 'tasks.tasksFor') as any,
          {
            importJobStatusId: importJobStatus?.id ?? '',
          },
        )}`}
      />
      <Content>
        <ImportHistoryTable
          tasks={importJobStatus?.tasks || []}
          workflows={importJobStatus?.workflows || []}
        />
      </Content>
    </Page>
  );
};
