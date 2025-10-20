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

import { useCallback, useMemo, useState } from 'react';
import { useAsync } from 'react-use';

import { Content, InfoCard, Link } from '@backstage/core-components';
import { useApi } from '@backstage/core-plugin-api';
import { usePermission } from '@backstage/plugin-permission-react';

import Grid from '@mui/material/Grid';
import Typography from '@mui/material/Typography';
import moment from 'moment';
import { makeStyles } from 'tss-react/mui';

import {
  InputSchemaResponseDTO,
  orchestratorAdminViewPermission,
  ProcessInstanceDTO,
  WorkflowDataDTO,
} from '@redhat/backstage-plugin-orchestrator-common';

import { orchestratorApiRef } from '../../api/api';
import { VALUE_UNAVAILABLE } from '../../constants';
import { useTranslation } from '../../hooks/useTranslation';
import { WorkflowRunDetail } from '../types/WorkflowRunDetail';
import { VariablesDialog } from './VariablesDialog';
import { WorkflowInputs } from './WorkflowInputs';
import { WorkflowProgress } from './WorkflowProgress';
import { WorkflowResult } from './WorkflowResult';
import { WorkflowRunDetails } from './WorkflowRunDetails';

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
    state: instance.state,
    description: instance.description,
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
  titleContainer: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
}));

export const WorkflowInstancePageContent: React.FC<{
  instance: ProcessInstanceDTO;
}> = ({ instance }) => {
  const { t } = useTranslation();
  const { classes } = useStyles();
  const orchestratorApi = useApi(orchestratorApiRef);

  const details = useMemo(
    () => mapProcessInstanceToDetails(instance),
    [instance],
  );

  const workflowdata = instance?.workflowdata;
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
  const workflowId = instance.processId;
  const instanceId = instance.id;
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

  const toggleVariablesDialog = useCallback(() => {
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
        <b>{t('run.viewVariables')}</b>
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
            title={
              <div className={classes.titleContainer}>
                <Typography component="span">{t('common.details')}</Typography>
                {viewVariables}
              </div>
            }
            divider={false}
            className={classes.topRowCard}
            cardClassName={classes.cardClassName}
          >
            <WorkflowRunDetails details={details} />
          </InfoCard>
        </Grid>

        <Grid item xs={6}>
          <WorkflowResult
            className={classes.topRowCard}
            cardClassName={classes.cardClassName}
            instance={instance}
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
            title={t('workflow.progress')}
            divider={false}
            className={classes.bottomRowCard}
            cardClassName={classes.cardClassName}
          >
            <WorkflowProgress
              workflowError={instance.error}
              workflowNodes={instance.nodes}
              workflowStatus={instance.state}
            />
          </InfoCard>
        </Grid>
      </Grid>
    </Content>
  );
};
WorkflowInstancePageContent.displayName = 'WorkflowInstancePageContent';
