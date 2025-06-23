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

import React, { useState } from 'react';
import { useAsync } from 'react-use';

import { Content, InfoCard, Link } from '@backstage/core-components';
import { useApi } from '@backstage/core-plugin-api';
import { usePermission } from '@backstage/plugin-permission-react';

import Grid from '@mui/material/Grid';
import Typography from '@mui/material/Typography';
import moment from 'moment';
import { makeStyles } from 'tss-react/mui';

import {
  AssessedProcessInstanceDTO,
  InputSchemaResponseDTO,
  orchestratorAdminViewPermission,
  ProcessInstanceDTO,
  WorkflowDataDTO,
} from '@red-hat-developer-hub/backstage-plugin-orchestrator-common';

import { orchestratorApiRef } from '../../api/api';
import { VALUE_UNAVAILABLE } from '../../constants';
import { WorkflowRunDetail } from '../WorkflowRunDetail';
import { WorkflowRunDetails } from '../WorkflowRunDetails';
import { VariablesDialog } from './VariablesDialog';
import { WorkflowInputs } from './WorkflowInputs';
import { WorkflowProgress } from './WorkflowProgress';
import { WorkflowResult } from './WorkflowResult';

export const mapProcessInstanceToDetails = (
  instance: ProcessInstanceDTO,
): WorkflowRunDetail => {
  const start = instance.start ? moment(instance.start) : undefined;
  let duration: string = VALUE_UNAVAILABLE;
  if (start && instance.end) {
    const end = moment(instance.end);
    duration = moment.duration(start.diff(end)).humanize();
  }
  const started = start?.toDate().toLocaleString() ?? VALUE_UNAVAILABLE;

  return {
    id: instance.id,
    processName: instance.processName || VALUE_UNAVAILABLE,
    workflowId: instance.processId,
    start: started,
    duration,
    category: instance.category,
    state: instance.state,
    description: instance.description,
    businessKey: instance.businessKey,
  };
};

const useStyles = makeStyles()(() => ({
  topRowCard: {
    height: '24rem',
  },
  bottomRowCard: {
    height: '42rem',
  },
  recommendedLabelContainer: {
    display: 'flex',
    alignItems: 'center',
    whiteSpace: 'nowrap',
  },
  recommendedLabel: { margin: '0 0.25rem' },
  cardClassName: {
    overflow: 'auto',
  },
}));

export const WorkflowInstancePageContent: React.FC<{
  assessedInstance: AssessedProcessInstanceDTO;
}> = ({ assessedInstance }) => {
  const { classes } = useStyles();
  const orchestratorApi = useApi(orchestratorApiRef);

  const details = React.useMemo(
    () => mapProcessInstanceToDetails(assessedInstance.instance),
    [assessedInstance.instance],
  );

  const workflowdata = assessedInstance.instance?.workflowdata;
  let instanceVariables: WorkflowDataDTO = {};
  if (workflowdata) {
    instanceVariables = {
      /* Since we are about to remove just the top-level property, shallow copy of the object is sufficient */
      ...workflowdata,
    };
    if (instanceVariables.hasOwnProperty('result')) {
      delete instanceVariables.result;
    }
  }
  const workflowId = assessedInstance.instance.processId;
  const instanceId = assessedInstance.instance.id;
  const {
    value,
    loading,
    error: responseError,
  } = useAsync(async (): Promise<InputSchemaResponseDTO> => {
    const res = await orchestratorApi.getWorkflowDataInputSchema(
      workflowId,
      instanceId,
    );
    return res.data;
  }, [orchestratorApi, workflowId]);

  const [isVariablesDialogOpen, setIsVariablesDialogOpen] = useState(false);

  const toggleVariablesDialog = React.useCallback(() => {
    setIsVariablesDialogOpen(prev => !prev);
  }, []);

  const adminView = usePermission({
    permission: orchestratorAdminViewPermission,
  });

  const viewVariables = adminView.allowed && (
    <Link
      to="#"
      onClick={e => {
        e.preventDefault();
        toggleVariablesDialog();
      }}
    >
      <Typography
        variant="subtitle2"
        component="div"
        style={{ textAlign: 'right' }}
      >
        <b>View variables</b>
      </Typography>
    </Link>
  );

  return (
    <Content noPadding>
      <VariablesDialog
        open={isVariablesDialogOpen}
        onClose={toggleVariablesDialog}
        instanceVariables={instanceVariables}
      />
      <Grid container spacing={2}>
        <Grid item xs={6}>
          <InfoCard
            title="Details"
            divider={false}
            className={classes.topRowCard}
            cardClassName={classes.cardClassName}
            icon={viewVariables}
          >
            <WorkflowRunDetails
              details={details}
              assessedBy={assessedInstance.assessedBy}
            />
          </InfoCard>
        </Grid>

        <Grid item xs={6}>
          <WorkflowResult
            className={classes.topRowCard}
            cardClassName={classes.cardClassName}
            assessedInstance={assessedInstance}
          />
        </Grid>

        <Grid item xs={6}>
          <WorkflowInputs
            className={classes.bottomRowCard}
            cardClassName={classes.cardClassName}
            value={value}
            loading={loading}
            responseError={responseError}
          />
        </Grid>

        <Grid item xs={6}>
          <InfoCard
            title="Workflow progress"
            divider={false}
            className={classes.bottomRowCard}
            cardClassName={classes.cardClassName}
          >
            <WorkflowProgress
              workflowError={assessedInstance.instance.error}
              workflowNodes={assessedInstance.instance.nodes}
              workflowStatus={assessedInstance.instance.state}
            />
          </InfoCard>
        </Grid>
      </Grid>
    </Content>
  );
};
WorkflowInstancePageContent.displayName = 'WorkflowInstancePageContent';
