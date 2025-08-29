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

import { ResponseErrorPanel } from '@backstage/core-components';

import Grid from '@mui/material/Grid';

import { WorkflowOverviewDTO } from '@red-hat-developer-hub/backstage-plugin-orchestrator-common';

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

      {/* 
          TODO: Add the workflow editor here when https://github.com/apache/incubator-kie-tools/issues/3197 is fixed.
          Mind reverting the changes in the PR https://github.com/redhat-developer/rhdh-plugins/pull/1381 when the issue is fixed.
       */}
    </Grid>
  );
};
