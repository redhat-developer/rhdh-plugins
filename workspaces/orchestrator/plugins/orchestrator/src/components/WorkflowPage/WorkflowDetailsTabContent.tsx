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

import React from 'react';
import { useAsync } from 'react-use';

import { InfoCard, ResponseErrorPanel } from '@backstage/core-components';
import { useApi, useRouteRefParams } from '@backstage/core-plugin-api';
import { usePermission } from '@backstage/plugin-permission-react';

import { Grid } from '@material-ui/core';

import {
  orchestratorAdminViewPermission,
  WorkflowOverviewDTO,
} from '@red-hat-developer-hub/backstage-plugin-orchestrator-common';

import { orchestratorApiRef } from '../../api';
import { workflowRouteRef } from '../../routes';
import ServerlessWorkflowEditor from './ServerlessWorkflowEditor';
import WorkflowDefinitionDetailsCard from './WorkflowDetailsCard';

interface Props {
  loadingWorkflowOverview: boolean;
  workflowOverviewDTO: WorkflowOverviewDTO | undefined;
  errorWorkflowOverview: Error | undefined;
}

export const WorkflowDetailsTabContent = ({
  loadingWorkflowOverview,
  workflowOverviewDTO,
  errorWorkflowOverview,
}: Props) => {
  const adminView = usePermission({
    permission: orchestratorAdminViewPermission,
  });
  const { workflowId } = useRouteRefParams(workflowRouteRef);
  const orchestratorApi = useApi(orchestratorApiRef);

  const { loading, value, error } = useAsync(() => {
    return orchestratorApi.getWorkflowSource(workflowId);
  }, []);

  return (
    <Grid container item direction="column" xs={12} spacing={2}>
      {errorWorkflowOverview && (
        <Grid item>
          <ResponseErrorPanel error={errorWorkflowOverview} />
        </Grid>
      )}
      <Grid item>
        <WorkflowDefinitionDetailsCard
          workflowOverview={workflowOverviewDTO}
          loading={loadingWorkflowOverview}
        />
      </Grid>
      {workflowOverviewDTO && adminView.allowed && value && (
        <Grid item>
          <InfoCard title="Workflow definition">
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
  );
};
