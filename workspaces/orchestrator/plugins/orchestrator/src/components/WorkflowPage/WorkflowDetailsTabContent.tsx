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

import { InfoCard, ResponseErrorPanel } from '@backstage/core-components';
import { useApi, useRouteRefParams } from '@backstage/core-plugin-api';
import { usePermission } from '@backstage/plugin-permission-react';

import Grid from '@mui/material/Grid';

import {
  orchestratorAdminViewPermission,
  WorkflowOverviewDTO,
} from '@red-hat-developer-hub/backstage-plugin-orchestrator-common';

import { orchestratorApiRef } from '../../api';
import { useTranslation } from '../../hooks/useTranslation';
import { entityWorkflowRouteRef, workflowRouteRef } from '../../routes';
import { InputSchemaCard } from './InputSchemaCard';
import ServerlessWorkflowEditor from './ServerlessWorkflowEditor';
import WorkflowDefinitionDetailsCard from './WorkflowDetailsCard';
import { WorkflowSuccessRatioCard } from './WorkflowSuccessRatioCard';

interface Props {
  loadingWorkflowOverview: boolean;
  workflowOverviewDTO: WorkflowOverviewDTO | undefined;
  errorWorkflowOverview: Error | undefined;
  showInputSchema?: boolean;
  showSuccessRatio?: boolean;
  detailsLayout?: 'default' | 'entity';
}

export const WorkflowDetailsTabContent = ({
  loadingWorkflowOverview,
  workflowOverviewDTO,
  errorWorkflowOverview,
  showInputSchema = true,
  showSuccessRatio = true,
  detailsLayout = 'default',
}: Props) => {
  const { t } = useTranslation();
  const adminView = usePermission({
    permission: orchestratorAdminViewPermission,
  });
  const { workflowId } = useRouteRefParams(workflowRouteRef);
  const orchestratorApi = useApi(orchestratorApiRef);

  const { loading, value, error } = useAsync(() => {
    return orchestratorApi.getWorkflowSource(workflowId);
  }, []);

  const { kind, name, namespace } = useRouteRefParams(entityWorkflowRouteRef);
  let entityRef: string | undefined = undefined;
  if (kind && namespace && name) {
    entityRef = `${kind}:${namespace}/${name}`;
  }

  return (
    <Grid item xs={12}>
      <Grid container spacing={2}>
        {errorWorkflowOverview && (
          <Grid item xs={12}>
            <ResponseErrorPanel error={errorWorkflowOverview} />
          </Grid>
        )}
        <Grid item xs={12} md={showInputSchema ? 6 : 12} zeroMinWidth>
          <Grid container direction="column" spacing={2} zeroMinWidth>
            <Grid item xs={12}>
              <WorkflowDefinitionDetailsCard
                workflowOverview={workflowOverviewDTO}
                loading={loadingWorkflowOverview}
                entityName={entityRef ? name : undefined}
                entityCatalogLink={
                  entityRef
                    ? `/catalog/${namespace}/${kind}/${name}`
                    : undefined
                }
                layout={detailsLayout}
              />
            </Grid>
            {showSuccessRatio ? (
              <Grid item xs={12}>
                <WorkflowSuccessRatioCard
                  workflowOverview={workflowOverviewDTO}
                  loading={loadingWorkflowOverview}
                />
              </Grid>
            ) : null}
            {workflowOverviewDTO &&
              adminView.allowed &&
              value &&
              !entityRef && (
                <Grid
                  item
                  xs={12}
                  sx={{ minWidth: 0, maxWidth: '100%', width: '100%' }}
                >
                  <InfoCard title={t('workflow.definition')}>
                    <ServerlessWorkflowEditor
                      format={workflowOverviewDTO.format}
                      loadingWorkflowSource={loading}
                      workflowSource={value.data}
                      errorWorkflowSource={error}
                    />
                  </InfoCard>
                </Grid>
              )}
          </Grid>
        </Grid>
        {showInputSchema ? (
          <Grid item xs={12} md={6} zeroMinWidth>
            <InputSchemaCard workflowId={workflowId} />
          </Grid>
        ) : null}
      </Grid>
    </Grid>
  );
};
