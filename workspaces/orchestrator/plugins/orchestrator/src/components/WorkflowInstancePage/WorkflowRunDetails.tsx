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

import { FC } from 'react';
import { useAsync } from 'react-use';

import { CopyTextButton, Link } from '@backstage/core-components';
import { useApi, useRouteRef } from '@backstage/core-plugin-api';
import { AboutField } from '@backstage/plugin-catalog';

import { Box } from '@material-ui/core';
import Grid from '@mui/material/Grid';
import Typography from '@mui/material/Typography';
import { makeStyles } from 'tss-react/mui';

import {
  capitalize,
  ProcessInstanceStatusDTO,
  WorkflowOverviewDTO,
} from '@redhat/backstage-plugin-orchestrator-common';

import { orchestratorApiRef } from '../../api';
import { VALUE_UNAVAILABLE } from '../../constants';
import { useTranslation } from '../../hooks/useTranslation';
import { workflowRouteRef } from '../../routes';
import { WorkflowRunDetail } from '../types/WorkflowRunDetail';
import { WorkflowInstanceStatusIndicator } from '../ui/WorkflowInstanceStatusIndicator';
import { WorkflowStatus } from '../ui/WorkflowStatus';

type WorkflowDetailsCardProps = {
  details: WorkflowRunDetail;
};

const useStyles = makeStyles()(_ => ({
  workflowId: {
    '& > div': {
      width: '80%',
    },
    '& > button': {
      maxHeight: '20px',
    },
  },
}));

export const WorkflowRunDetails: FC<WorkflowDetailsCardProps> = ({
  details,
}) => {
  const { t } = useTranslation();
  const { classes } = useStyles();
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
        <AboutField label={t('workflow.fields.workflow')}>
          <Link to={workflowPageLink({ workflowId: details.workflowId })}>
            <Typography variant="subtitle2" component="div">
              <b>{capitalize(details.processName)}</b>
            </Typography>
          </Link>
        </AboutField>
      </Grid>
      <Grid item md={5} key="Run status">
        <AboutField label={t('workflow.fields.runStatus')}>
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
        <AboutField label={t('workflow.fields.workflowStatus')}>
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
      <Grid item md={5} key="Run ID">
        <AboutField label={t('workflow.fields.workflowId')}>
          <Box
            display="flex"
            alignItems="center"
            className={classes.workflowId}
          >
            <Typography
              variant="subtitle2"
              component="div"
              overflow="hidden"
              noWrap
            >
              {details.id}
            </Typography>
            <CopyTextButton
              text={details.id}
              tooltipText={t('workflow.fields.workflowIdCopied')}
              tooltipDelay={2000}
            />
          </Box>
        </AboutField>
      </Grid>
      <Grid item md={7} key="Duration">
        <AboutField label={t('workflow.fields.duration')}>
          <Typography variant="subtitle2" component="div">
            <b>{details.duration}</b>
          </Typography>
        </AboutField>
      </Grid>
      <Grid item md={5} key="Started">
        <AboutField label={t('workflow.fields.started')}>
          <Typography variant="subtitle2" component="div">
            <b>{details.start}</b>
          </Typography>
        </AboutField>
      </Grid>
      <Grid item md={12} key="Description">
        <AboutField label={t('workflow.fields.description')}>
          <Typography variant="subtitle2" component="div">
            <b>{details.description ?? VALUE_UNAVAILABLE}</b>
          </Typography>
        </AboutField>
      </Grid>
    </Grid>
  );
};
WorkflowRunDetails.displayName = 'WorkflowDetails';
