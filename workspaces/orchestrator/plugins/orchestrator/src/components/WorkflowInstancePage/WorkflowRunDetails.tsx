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

import { Link } from '@backstage/core-components';
import { useApi, useRouteRef } from '@backstage/core-plugin-api';
import { AboutField } from '@backstage/plugin-catalog';

import Grid from '@mui/material/Grid';
import Typography from '@mui/material/Typography';

import {
  capitalize,
  ProcessInstanceStatusDTO,
  WorkflowOverviewDTO,
} from '@red-hat-developer-hub/backstage-plugin-orchestrator-common';

import { orchestratorApiRef } from '../../api';
import { VALUE_UNAVAILABLE } from '../../constants';
import { workflowRouteRef } from '../../routes';
import { WorkflowRunDetail } from '../types/WorkflowRunDetail';
import { WorkflowInstanceStatusIndicator } from '../ui/WorkflowInstanceStatusIndicator';
import { WorkflowStatus } from '../ui/WorkflowStatus';

type WorkflowDetailsCardProps = {
  details: WorkflowRunDetail;
};

export const WorkflowRunDetails: React.FC<WorkflowDetailsCardProps> = ({
  details,
}) => {
  const orchestratorApi = useApi(orchestratorApiRef);
  const { value, loading, error } =
    useAsync(async (): Promise<WorkflowOverviewDTO> => {
      const res = await orchestratorApi.getWorkflowOverview(details.workflowId);

      return res.data;
    }, [orchestratorApi]);

  const workflowPageLink = useRouteRef(workflowRouteRef);

  return (
    <Grid container alignContent="flex-start" spacing="1rem">
      <Grid item md={7} key="Workflow">
        <AboutField label="Workflow">
          <Link to={workflowPageLink({ workflowId: details.workflowId })}>
            <Typography variant="subtitle2" component="div">
              <b>{capitalize(details.processName)}</b>
            </Typography>
          </Link>
        </AboutField>
      </Grid>
      <Grid item md={5} key="Run status">
        <AboutField label="Run status">
          <Typography variant="subtitle2" component="div">
            <b>
              <WorkflowInstanceStatusIndicator
                status={details.state as ProcessInstanceStatusDTO}
              />
            </b>
          </Typography>
        </AboutField>
      </Grid>
      <Grid item md={7} key="Workflow Status">
        <AboutField label="Workflow Status">
          <Typography variant="subtitle2" component="div">
            <b>
              {!error && !loading ? (
                <WorkflowStatus availability={value?.isAvailable} />
              ) : (
                VALUE_UNAVAILABLE
              )}
            </b>
          </Typography>
        </AboutField>
      </Grid>
      <Grid item md={5} key="Duration">
        <AboutField label="Duration">
          <Typography variant="subtitle2" component="div">
            <b>{details.duration}</b>
          </Typography>
        </AboutField>
      </Grid>
      <Grid item md={7} key="Description">
        <AboutField label="Description">
          <Typography variant="subtitle2" component="div">
            <b>{details.description ?? VALUE_UNAVAILABLE}</b>
          </Typography>
        </AboutField>
      </Grid>
      <Grid item md={5} key="Started">
        <AboutField label="Started">
          <Typography variant="subtitle2" component="div">
            <b>{details.start}</b>
          </Typography>
        </AboutField>
      </Grid>
    </Grid>
  );
};
WorkflowRunDetails.displayName = 'WorkflowDetails';
