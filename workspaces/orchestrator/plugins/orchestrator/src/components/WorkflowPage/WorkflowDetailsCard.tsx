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

import { useMemo } from 'react';

import { InfoCard } from '@backstage/core-components';
import { AboutField } from '@backstage/plugin-catalog';

import Grid from '@mui/material/Grid';
import Skeleton from '@mui/material/Skeleton';
import { makeStyles } from 'tss-react/mui';

import { WorkflowOverviewDTO } from '@redhat/backstage-plugin-orchestrator-common';

import WorkflowOverviewFormatter from '../../dataFormatters/WorkflowOverviewFormatter';
import { useTranslation } from '../../hooks/useTranslation';
import { WorkflowStatus } from '../ui/WorkflowStatus';

const useStyles = makeStyles()(() => ({
  details: {
    overflowY: 'auto',
    minHeight: '10rem',
    maxHeight: '15rem',
  },
}));

const WorkflowDefinitionDetailsCard = ({
  loading,
  workflowOverview,
}: {
  loading: boolean;
  workflowOverview?: WorkflowOverviewDTO;
}) => {
  const { t } = useTranslation();
  const { classes } = useStyles();

  const formattedWorkflowOverview = useMemo(
    () =>
      workflowOverview
        ? WorkflowOverviewFormatter.format(workflowOverview)
        : undefined,
    [workflowOverview],
  );

  return (
    <InfoCard title={t('workflow.details')} className={classes.details}>
      <Grid container spacing={7} alignContent="flex-start" wrap="nowrap">
        <Grid item key="workflow status">
          {/* AboutField requires the value to be defined as a prop as well */}
          <AboutField
            label={t('workflow.fields.workflowStatus')}
            value={formattedWorkflowOverview?.availability}
          >
            {loading ? (
              <Skeleton variant="text" />
            ) : (
              <b>
                <WorkflowStatus
                  availability={formattedWorkflowOverview?.availability}
                />
              </b>
            )}
          </AboutField>
        </Grid>
        <Grid item md={7}>
          <AboutField
            label={t('workflow.fields.description')}
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
