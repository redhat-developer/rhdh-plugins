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

import { InfoCard, ResponseErrorPanel } from '@backstage/core-components';

import { Grid } from '@material-ui/core';

import { WorkflowOverviewDTO } from '@red-hat-developer-hub/backstage-plugin-orchestrator-common';

import { EditorViewKind, WorkflowEditor } from '../WorkflowEditor';
import WorkflowDefinitionDetailsCard from './WorkflowDetailsCard';

interface Props {
  loading: boolean;
  workflowOverviewDTO: WorkflowOverviewDTO | undefined;
  errorWorkflowOverview: Error | undefined;
}

export const WorkflowDetailsTabContent = ({
  loading,
  workflowOverviewDTO,
  errorWorkflowOverview,
}: Props) => {
  return (
    <>
      {errorWorkflowOverview && (
        <Grid item>
          <ResponseErrorPanel error={errorWorkflowOverview} />
        </Grid>
      )}
      <Grid item>
        <WorkflowDefinitionDetailsCard
          workflowOverview={workflowOverviewDTO}
          loading={loading}
        />
      </Grid>
      <Grid item>
        {workflowOverviewDTO && (
          <InfoCard title="Workflow definition">
            <div style={{ height: '600px' }}>
              <WorkflowEditor
                kind={EditorViewKind.EXTENDED_DIAGRAM_VIEWER}
                workflowId={workflowOverviewDTO.workflowId}
                format={workflowOverviewDTO.format}
              />
            </div>
          </InfoCard>
        )}
      </Grid>
    </>
  );
};
