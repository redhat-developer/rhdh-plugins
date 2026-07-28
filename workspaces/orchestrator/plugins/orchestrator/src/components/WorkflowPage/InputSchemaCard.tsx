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

import { useAsync } from 'react-use';

import { Progress, ResponseErrorPanel } from '@backstage/core-components';
import { useApi } from '@backstage/core-plugin-api';

import Typography from '@mui/material/Typography';

import { orchestratorApiRef } from '../../api';
import { useTranslation } from '../../hooks/useTranslation';
import { useIsDarkMode } from '../../utils/isDarkMode';
import { FullWidthInfoCard } from '../ui/FullWidthInfoCard';
import { InfoCardTitleWithTooltip } from '../ui/InfoCardTitleWithTooltip';
import { JsonCodeBlock } from '../ui/JsonCodeBlock';

export const InputSchemaCard = ({ workflowId }: { workflowId: string }) => {
  const { t } = useTranslation();
  const isDarkMode = useIsDarkMode();
  const orchestratorApi = useApi(orchestratorApiRef);

  const { value, loading, error } = useAsync(async () => {
    const res = await orchestratorApi.getWorkflowDataInputSchema(workflowId);
    return res.data;
  }, [orchestratorApi, workflowId]);

  return (
    <FullWidthInfoCard
      title={
        <InfoCardTitleWithTooltip
          title={t('workflow.inputSchema')}
          tooltip={t('workflow.inputSchemaDescription')}
        />
      }
    >
      {loading && <Progress />}
      {error && <ResponseErrorPanel error={error} />}
      {!loading && !error && value?.inputSchema === undefined ? (
        <Typography>{t('messages.noInputSchemaWorkflow')}</Typography>
      ) : null}
      {!loading && !error && value?.inputSchema !== undefined ? (
        <JsonCodeBlock
          isDarkMode={isDarkMode}
          value={value.inputSchema}
          fullWidth
        />
      ) : null}
    </FullWidthInfoCard>
  );
};
