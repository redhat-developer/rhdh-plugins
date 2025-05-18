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

import { InfoCard } from '@backstage/core-components';
import { AboutField } from '@backstage/plugin-catalog';

import { Grid, makeStyles } from '@material-ui/core';
import { Skeleton } from '@material-ui/lab';

import { WorkflowOverviewDTO } from '@red-hat-developer-hub/backstage-plugin-orchestrator-common';

import WorkflowOverviewFormatter from '../../dataFormatters/WorkflowOverviewFormatter';
import { WorkflowStatus } from '../WorkflowStatus';

const useStyles = makeStyles({
  details: {
    overflowY: 'auto',
    minHeight: '10rem',
    maxHeight: '15rem',
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

  return (
    <InfoCard title="Details" className={classes.details}>
      <Grid container spacing={7} alignContent="flex-start" wrap="nowrap">
        <Grid item key="category">
          {/* AboutField requires the value to be defined as a prop as well */}
          <AboutField
            label="category"
            value={formattedWorkflowOverview?.category}
          >
            {loading ? (
              <Skeleton variant="text" />
            ) : (
              formattedWorkflowOverview?.category
            )}
          </AboutField>
        </Grid>
        <Grid item key="workflow status">
          {/* AboutField requires the value to be defined as a prop as well */}
          <AboutField
            label="workflow status"
            value={formattedWorkflowOverview?.availablity}
          >
            {loading ? (
              <Skeleton variant="text" />
            ) : (
              <b>
                <WorkflowStatus
                  availability={formattedWorkflowOverview?.availablity}
                />
              </b>
            )}
          </AboutField>
        </Grid>
        <Grid item md={7}>
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
