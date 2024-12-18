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
import React from 'react';

import { InfoCard } from '@backstage/core-components';
import { AboutField } from '@backstage/plugin-catalog';

import { Grid, makeStyles } from '@material-ui/core';
import { Skeleton } from '@material-ui/lab';

import {
  ProcessInstanceStatusDTO,
  WorkflowOverviewDTO,
} from '@red-hat-developer-hub/backstage-plugin-orchestrator-common';

import { VALUE_UNAVAILABLE } from '../../constants';
import WorkflowOverviewFormatter from '../../dataFormatters/WorkflowOverviewFormatter';
import { WorkflowInstanceStatusIndicator } from '../WorkflowInstanceStatusIndicator';

const useStyles = makeStyles({
  details: {
    overflowY: 'auto',
    height: '15rem',
  },
});

const WorkflowDefinitionDetailsCard = ({
  loading,
  workflowOverview,
}: {
  loading: boolean;
  workflowOverview?: WorkflowOverviewDTO;
}) => {
  const classes = useStyles();

  const formattedWorkflowOverview = React.useMemo(
    () =>
      workflowOverview
        ? WorkflowOverviewFormatter.format(workflowOverview)
        : undefined,
    [workflowOverview],
  );

  const details = React.useMemo(
    () => [
      {
        label: 'type',
        value: formattedWorkflowOverview?.category,
      },

      {
        label: 'last run',
        value: formattedWorkflowOverview?.lastTriggered,
      },
      {
        label: 'last run status',
        value: formattedWorkflowOverview?.lastRunStatus,
        children:
          formattedWorkflowOverview?.lastRunStatus !== VALUE_UNAVAILABLE ? (
            <WorkflowInstanceStatusIndicator
              status={
                formattedWorkflowOverview?.lastRunStatus as ProcessInstanceStatusDTO
              }
              lastRunId={formattedWorkflowOverview?.lastRunId}
            />
          ) : (
            VALUE_UNAVAILABLE
          ),
      },
    ],
    [formattedWorkflowOverview],
  );

  return (
    <InfoCard title="Details" className={classes.details}>
      <Grid container spacing={3} alignContent="flex-start">
        <Grid container item md={4} spacing={3} alignContent="flex-start">
          {details?.map(({ label, value, children }) => (
            <Grid item md={6} key={label}>
              {/* AboutField requires the value to be defined as a prop as well */}
              <AboutField label={label} value={value}>
                {loading ? <Skeleton variant="text" /> : children || value}
              </AboutField>
            </Grid>
          ))}
        </Grid>
        <Grid item md={8}>
          <AboutField
            label="description"
            value={formattedWorkflowOverview?.description}
          >
            {loading ? (
              <Skeleton variant="text" />
            ) : (
              formattedWorkflowOverview?.description
            )}
          </AboutField>
        </Grid>
      </Grid>
    </InfoCard>
  );
};

export default WorkflowDefinitionDetailsCard;
