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

import { LogViewer, Progress } from '@backstage/core-components';
import {
  Box,
  ButtonGroup,
  Button,
  Grid,
  makeStyles,
  Typography,
} from '@material-ui/core';
import {
  Job,
  JobStatus,
  MigrationPhase,
  ModulePhase,
  Phase,
} from '@red-hat-developer-hub/backstage-plugin-x2a-common';

import { useTranslation } from '../hooks/useTranslation';
import { useLogStream } from '../hooks/useLogStream';
import { useClientService } from '../ClientService';
import { canCancelPhase, downloadLogFile } from './tools';
import { TelemetrySection } from './PhaseTelemetry';
import { PhaseStatus } from './PhaseStatus';
import { PhaseMetadata } from './PhaseMetadata';

const useStyles = makeStyles(theme => ({
  buttonGroup: {
    gap: theme.spacing(1),
  },
  logViewerWrapper: {
    height: 400,
    '& a[role="row"]': {
      userSelect: 'none',
    },
  },
}));

const PhaseRunAction = ({
  phase,
  phaseName,
  isDisabled,
  onRunPhase,
  onCancelPhase,
}: {
  phase?: Job;
  phaseName: MigrationPhase;
  isDisabled: boolean;
  onRunPhase?: (phase: MigrationPhase) => void;
  onCancelPhase?: (phase: MigrationPhase) => void;
}) => {
  const { t } = useTranslation();
  const classes = useStyles();

  const isStale = !!phase?.status && JobStatus.from(phase.status).isStale();
  const previousRunSucceeded =
    !!phase?.status && (JobStatus.from(phase.status).isSuccess() || isStale);
  if (!onRunPhase) {
    return null;
  }

  const getInstructions = () => {
    if (isStale) {
      return t('modulePage.phases.staleInstructions');
    }
    if (phaseName === 'init') {
      return t('modulePage.phases.resyncMigrationPlanInstructions');
    }
    if (Phase.from(phaseName).isAnalyze()) {
      return previousRunSucceeded
        ? t('modulePage.phases.reanalyzeInstructions')
        : t('modulePage.phases.analyzeInstructions');
    }
    if (Phase.from(phaseName).isMigrate()) {
      return previousRunSucceeded
        ? t('modulePage.phases.remigrateInstructions')
        : t('modulePage.phases.migrateInstructions');
    }
    if (phaseName === 'publish') {
      return previousRunSucceeded
        ? t('modulePage.phases.republishInstructions')
        : t('modulePage.phases.publishInstructions');
    }
    return '';
  };

  const getActionText = () => {
    if (Phase.from(phaseName).isAnalyze()) {
      return previousRunSucceeded
        ? t('modulePage.phases.rerunAnalyze')
        : t('modulePage.phases.runAnalyze');
    }
    if (Phase.from(phaseName).isMigrate()) {
      return previousRunSucceeded
        ? t('modulePage.phases.rerunMigrate')
        : t('modulePage.phases.runMigrate');
    }
    if (phaseName === 'publish') {
      return previousRunSucceeded
        ? t('modulePage.phases.rerunPublish')
        : t('modulePage.phases.runPublish');
    }
    return '';
  };

  const instructions = getInstructions();
  const actionText = getActionText();

  return (
    <Box border={1} borderColor="divider" borderRadius={4} p={2}>
      {instructions && (
        <Typography variant="body2" gutterBottom>
          {instructions}
        </Typography>
      )}
      <ButtonGroup
        orientation="horizontal"
        size="small"
        className={classes.buttonGroup}
      >
        {actionText && (
          <Button
            variant="outlined"
            color="primary"
            disabled={isDisabled}
            onClick={() => {
              onRunPhase(phaseName);
            }}
          >
            {actionText}
          </Button>
        )}
        {canCancelPhase(phase?.status) && onCancelPhase && (
          <Button
            variant="outlined"
            onClick={() => {
              onCancelPhase(phaseName);
            }}
          >
            {t('modulePage.phases.cancel')}
          </Button>
        )}
      </ButtonGroup>
    </Box>
  );
};

type OptionalModuleId =
  | {
      phaseName: ModulePhase;
      moduleId: string;
    }
  | {
      phaseName: 'init';
    };

export const PhaseDetails = (
  props: {
    phase?: Job;
    projectId: string;
    onRunPhase?: (phase: MigrationPhase) => void;
    onCancelPhase?: (phase: MigrationPhase) => void;
  } & OptionalModuleId,
) => {
  const { t } = useTranslation();
  const classes = useStyles();
  const clientService = useClientService();
  const [showLog, setShowLog] = useState(false);

  const { phase, projectId, phaseName, onRunPhase, onCancelPhase } = props;
  const moduleId = 'moduleId' in props ? props.moduleId : undefined;

  const canRunPhase = phase?.status !== 'running';

  const fetchLog = useCallback(
    () =>
      phaseName === 'init'
        ? clientService.projectsProjectIdLogGet({
            path: { projectId },
            query: { streaming: true },
          })
        : clientService.projectsProjectIdModulesModuleIdLogGet({
            path: { projectId, moduleId: moduleId as string },
            query: { phase: phaseName as ModulePhase, streaming: true },
          }),
    [clientService, projectId, moduleId, phaseName],
  );

  const { logText, logStreamHasData, logLoading, logError } = useLogStream({
    enabled: showLog && !!phase,
    phaseId: phase?.id,
    phaseStatus: phase?.status,
    projectId,
    moduleId,
    phaseName,
    fetchLog,
  });

  const logViewerText = useMemo((): string => {
    if (logStreamHasData) {
      return logText ?? '';
    }
    if (logLoading) {
      return t('modulePage.phases.logWaitingForStream');
    }
    return logText || t('modulePage.phases.noLogsAvailable');
  }, [logStreamHasData, logText, logLoading, t]);

  return (
    <Grid container direction="row" spacing={3}>
      <Grid item xs={12}>
        {onRunPhase && (
          <PhaseRunAction
            isDisabled={!canRunPhase}
            phase={phase}
            phaseName={phaseName}
            onRunPhase={onRunPhase}
            onCancelPhase={onCancelPhase}
          />
        )}
      </Grid>

      <Grid item xs={12}>
        <PhaseMetadata
          phase={phase}
          status={<PhaseStatus status={phase?.status} />}
        />
        {phase?.errorDetails && (
          <Box mt={1}>
            <Typography variant="caption" color="textSecondary">
              {t('modulePage.phases.errorDetails')}
            </Typography>
            <Typography variant="body2" color="error">
              {phase.errorDetails}
            </Typography>
          </Box>
        )}
      </Grid>

      {phase && (
        <Grid item xs={12}>
          <Button
            variant="outlined"
            size="small"
            onClick={() => setShowLog(prev => !prev)}
          >
            {showLog
              ? t('modulePage.phases.hideLog')
              : t('modulePage.phases.viewLog')}
          </Button>
        </Grid>
      )}

      {showLog && (
        <Grid item xs={12}>
          {logLoading && <Progress />}
          {logError && (
            <Typography color="error">{logError.message}</Typography>
          )}
          {logText !== undefined && (
            <div className={classes.logViewerWrapper}>
              <LogViewer
                text={logViewerText}
                onDownloadLog={() =>
                  downloadLogFile(logText || '', `${phaseName}-${projectId}`)
                }
              />
            </div>
          )}
        </Grid>
      )}

      <TelemetrySection telemetry={phase?.telemetry} />
    </Grid>
  );
};
