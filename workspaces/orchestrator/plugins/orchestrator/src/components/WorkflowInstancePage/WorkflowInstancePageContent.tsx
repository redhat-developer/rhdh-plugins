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

import Box from '@mui/material/Box';
import Grid from '@mui/material/Grid';
import Typography from '@mui/material/Typography';
import { DateTime } from 'luxon';
import { makeStyles } from 'tss-react/mui';

import {
  InputSchemaResponseDTO,
  orchestratorAdminViewPermission,
  orchestratorInstanceAdminViewPermission,
  ProcessInstanceDTO,
} from '@red-hat-developer-hub/backstage-plugin-orchestrator-common';

import { orchestratorApiRef } from '../../api/api';
import { VALUE_UNAVAILABLE } from '../../constants';
import { useTranslation } from '../../hooks/useTranslation';
import { useWorkflowInstanceCardHeightMode } from '../../hooks/useWorkflowInstanceCardHeightMode';
import { formatDuration } from '../../utils/DurationUtils';
import {
  getInstanceVariables,
  hasInstanceVariables,
} from '../../utils/instanceVariables';
import { WorkflowRunDetail } from '../types/WorkflowRunDetail';
import { VariablesDialog } from './VariablesDialog';
import { WorkflowInputs } from './WorkflowInputs';
import { WorkflowInstanceProgressReactFlow } from './WorkflowInstanceProgressReactFlow';
import { WorkflowResult } from './WorkflowResult';
import { WorkflowRunDetails } from './WorkflowRunDetails';

export const mapProcessInstanceToDetails = (
  instance: ProcessInstanceDTO,
  t: any,
): WorkflowRunDetail => {
  const start = instance.start ? DateTime.fromISO(instance.start) : undefined;
  let duration: string = VALUE_UNAVAILABLE;
  if (start && instance.end) {
    const end = DateTime.fromISO(instance.end);
    const diffMs = end.diff(start).toMillis();
    duration = formatDuration(diffMs, t);
  }
  const started =
    start?.toLocaleString(DateTime.DATETIME_SHORT_WITH_SECONDS) ??
    VALUE_UNAVAILABLE;

  return {
    id: instance.id,
    processName: instance.processName || VALUE_UNAVAILABLE,
    workflowId: instance.processId,
    start: started,
    startIso: instance.start,
    duration,
    state: instance.state,
    description: instance.description,
    version: instance.version,
    initiatorEntity: instance.initiatorEntity,
    targetEntity: instance.targetEntity,
    hasVariables: hasInstanceVariables(instance.workflowdata),
  };
};

const useStyles = makeStyles()(theme => ({
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
  contentModeCard: {
    width: '100%',
    maxWidth: '100%',
    minWidth: 0,
  },
  contentCardOverflow: {
    minWidth: 0,
    maxWidth: '100%',
    overflowX: 'auto',
    wordBreak: 'break-word',
  },
  contentModeLayout: {
    display: 'grid',
    gridTemplateColumns: 'minmax(0, 1fr) minmax(0, 1fr)',
    gap: theme.spacing(2),
    width: '100%',
    alignItems: 'start',
  },
  contentModeColumn: {
    display: 'flex',
    flexDirection: 'column',
    gap: theme.spacing(2),
    minWidth: 0,
    maxWidth: '100%',
  },
  titleContainer: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  detailsTitle: {
    fontWeight: 700,
  },
}));

export const WorkflowInstancePageContent: React.FC<{
  instance: ProcessInstanceDTO;
}> = ({ instance }) => {
  const { t } = useTranslation();
  const { classes } = useStyles();
  const orchestratorApi = useApi(orchestratorApiRef);
  const cardHeightMode = useWorkflowInstanceCardHeightMode();
  const isFixedHeightMode = cardHeightMode !== 'content';
  const topRowClassName = isFixedHeightMode ? classes.topRowCard : '';
  const bottomRowClassName = isFixedHeightMode ? classes.bottomRowCard : '';
  const cardOverflowClassName = isFixedHeightMode
    ? classes.cardClassName
    : classes.contentCardOverflow;
  const contentModeCardClassName = isFixedHeightMode
    ? ''
    : classes.contentModeCard;

  const details = useMemo(
    () => mapProcessInstanceToDetails(instance, t),
    [instance, t],
  );

  const workflowdata = instance?.workflowdata;
  const instanceVariables = getInstanceVariables(workflowdata);
  const workflowId = instance.processId;
  const instanceId = instance.id;
  const {
    value: inputSchemaResponse,
    loading,
    error: responseError,
  } = useAsync(async (): Promise<InputSchemaResponseDTO> => {
    const res = await orchestratorApi.getWorkflowDataInputSchema(
      workflowId,
      instanceId,
    );
    return res.data;
  }, [orchestratorApi, workflowId, instanceId]);

  const {
    value: workflowSource,
    loading: loadingWorkflowSource,
    error: workflowSourceError,
  } = useAsync(async (): Promise<string | undefined> => {
    const res = await orchestratorApi.getWorkflowSource(workflowId);
    return res.data;
  }, [orchestratorApi, workflowId]);

  const [isVariablesDialogOpen, setIsVariablesDialogOpen] = useState(false);

  const toggleVariablesDialog = useCallback(() => {
    setIsVariablesDialogOpen(prev => !prev);
  }, []);

  const adminView = usePermission({
    permission: orchestratorAdminViewPermission,
  });
  const instanceAdminView = usePermission({
    permission: orchestratorInstanceAdminViewPermission,
  });
  const canViewVariables = adminView.allowed || instanceAdminView.allowed;

  const viewVariables = canViewVariables && (
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

  const detailsCard = (
    <InfoCard
      title={
        <div className={classes.titleContainer}>
          <Typography
            component="span"
            variant="h5"
            className={classes.detailsTitle}
          >
            {t('common.details')}
          </Typography>
          {viewVariables}
        </div>
      }
      divider={false}
      className={`${topRowClassName} ${contentModeCardClassName}`.trim()}
      cardClassName={cardOverflowClassName}
    >
      <WorkflowRunDetails details={details} />
    </InfoCard>
  );

  const resultCard = (
    <WorkflowResult
      className={`${topRowClassName} ${contentModeCardClassName}`.trim()}
      cardClassName={cardOverflowClassName}
      instance={instance}
    />
  );

  const inputsCard = (
    <WorkflowInputs
      className={`${bottomRowClassName} ${contentModeCardClassName}`.trim()}
      cardClassName={cardOverflowClassName}
      value={inputSchemaResponse}
      loading={loading}
      responseError={responseError}
    />
  );

  const progressGraphCard = (
    <InfoCard
      title={t('workflow.progress')}
      divider={false}
      className={`${bottomRowClassName} ${contentModeCardClassName}`.trim()}
      cardClassName={cardOverflowClassName}
    >
      <WorkflowInstanceProgressReactFlow
        workflowSource={workflowSource}
        loadingWorkflowSource={loadingWorkflowSource}
        errorWorkflowSource={workflowSourceError}
        workflowError={instance.error}
        workflowNodes={instance.nodes}
        workflowStatus={instance.state}
      />
    </InfoCard>
  );

  return (
    <Content noPadding>
      <VariablesDialog
        open={isVariablesDialogOpen}
        onClose={toggleVariablesDialog}
        instanceVariables={instanceVariables}
      />
      <Grid container spacing={2}>
        {isFixedHeightMode ? (
          <>
            <Grid item xs={6} zeroMinWidth>
              {detailsCard}
            </Grid>
            <Grid item xs={6} zeroMinWidth>
              {resultCard}
            </Grid>
            <Grid item xs={6} zeroMinWidth>
              {inputsCard}
            </Grid>
            <Grid item xs={6} zeroMinWidth>
              {progressGraphCard}
            </Grid>
          </>
        ) : (
          <Grid item xs={12}>
            <Box className={classes.contentModeLayout}>
              <Box className={classes.contentModeColumn}>
                {detailsCard}
                {inputsCard}
              </Box>
              <Box className={classes.contentModeColumn}>
                {resultCard}
                {progressGraphCard}
              </Box>
            </Box>
          </Grid>
        )}
      </Grid>
    </Content>
  );
};
WorkflowInstancePageContent.displayName = 'WorkflowInstancePageContent';
