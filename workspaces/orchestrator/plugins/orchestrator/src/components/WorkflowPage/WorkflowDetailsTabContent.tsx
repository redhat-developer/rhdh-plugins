/*
 * Copyright 2024 The Backstage Authors
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
import React, { useMemo } from 'react';

import { InfoCard } from '@backstage/core-components';
import { useRouteRefParams } from '@backstage/core-plugin-api';

import { Grid } from '@material-ui/core';

import { WorkflowOverviewDTO } from '@red-hat-developer-hub/backstage-plugin-orchestrator-common';

import { workflowRouteRef } from '../../routes';
import { EditorViewKind, WorkflowEditor } from '../WorkflowEditor';
import WorkflowDefinitionDetailsCard from './WorkflowDetailsCard';

interface Props {
  loading: boolean;
  workflowOverviewDTO: WorkflowOverviewDTO | undefined;
}

export const WorkflowDetailsTabContent = ({
  loading,
  workflowOverviewDTO,
}: Props) => {
  const { workflowId, format } = useRouteRefParams(workflowRouteRef);
  const workflowFormat = useMemo(
    () => (format === 'json' ? 'json' : 'yaml'),
    [format],
  );

  return (
    <>
      <Grid item>
        <WorkflowDefinitionDetailsCard
          workflowOverview={workflowOverviewDTO}
          loading={loading}
        />
      </Grid>
      <Grid item>
        <InfoCard title="Workflow definition">
          <div style={{ height: '600px' }}>
            <WorkflowEditor
              kind={EditorViewKind.EXTENDED_DIAGRAM_VIEWER}
              workflowId={workflowId}
              format={workflowFormat}
            />
          </div>
        </InfoCard>
      </Grid>
    </>
  );
};
