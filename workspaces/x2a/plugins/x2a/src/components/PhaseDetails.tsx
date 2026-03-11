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

import { useState } from 'react';
import useAsync from 'react-use/lib/useAsync';

import { LogViewer, Progress } from '@backstage/core-components';
import { Button } from '@backstage/ui';
import { Box, Chip, Grid, Typography } from '@material-ui/core';
import {
  Job,
  MigrationPhase,
  ModulePhase,
} from '@red-hat-developer-hub/backstage-plugin-x2a-common';

import { useTranslation } from '../hooks/useTranslation';
import { useClientService } from '../ClientService';
import { ItemField } from './ItemField';
import { humanizeDate } from './tools';
import { PhaseTelemetry } from './PhaseTelemetry';

const getStatusChip = (status: string | undefined, t: any) => {
  if (!status) {
    return (
      <Chip
        label={t('modulePage.phases.statuses.notStarted')}
        size="small"
        variant="outlined"
      />
    );
  }

  const statusConfig: Record<
    string,
    { labelKey: string; color: 'primary' | 'secondary' | 'default' }
  > = {
    success: {
      labelKey: 'modulePage.phases.statuses.success',
      color: 'primary',
    },
    error: { labelKey: 'modulePage.phases.statuses.error', color: 'secondary' },
    running: {
      labelKey: 'modulePage.phases.statuses.running',
      color: 'default',
    },
    pending: {
      labelKey: 'modulePage.phases.statuses.pending',
      color: 'default',
    },
  };

  const config = statusConfig[status] || { labelKey: status, color: 'default' };
  return <Chip label={t(config.labelKey)} size="small" color={config.color} />;
};

const computeDuration = (phase?: Job): string => {
  if (!phase?.startedAt) {
    return '-';
  }
  const end = phase.finishedAt ? new Date(phase.finishedAt) : new Date();
  const diffMs = end.getTime() - new Date(phase.startedAt).getTime();
  const totalSeconds = Math.floor(diffMs / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  if (minutes > 0) {
    return `${minutes}m ${seconds}s`;
  }
  return `${seconds}s`;
};

const PhaseRunAction = ({
  phase,
  phaseName,
  onRunPhase,
}: {
  phase?: Job;
  phaseName: MigrationPhase;
  onRunPhase?: (phase: MigrationPhase) => void;
}) => {
  const { t } = useTranslation();

  const previousRunSucceeded = phase?.status === 'success';

  const getInstructions = () => {
    if (phaseName === 'init') {
      return t('modulePage.phases.resyncMigrationPlanInstructions');
    }
    if (phaseName === 'analyze') {
      return previousRunSucceeded
        ? t('modulePage.phases.reanalyzeInstructions')
        : t('modulePage.phases.analyzeInstructions');
    }
    if (phaseName === 'migrate') {
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
    if (phaseName === 'analyze') {
      return previousRunSucceeded
        ? t('modulePage.phases.rerunAnalyze')
        : t('modulePage.phases.runAnalyze');
    }
    if (phaseName === 'migrate') {
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

  return (
    <>
      <Grid item xs={12}>
        <Button variant="primary" onPress={() => onRunPhase?.(phaseName)}>
          {getActionText()}
        </Button>
      </Grid>
      <Grid item xs={12}>
        <Typography>{getInstructions()}</Typography>
      </Grid>
    </>
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
  } & OptionalModuleId,
) => {
  const { t } = useTranslation();
  const clientService = useClientService();
  const empty = t('module.phases.none');
  const [showLog, setShowLog] = useState(false);

  const { phase, projectId, phaseName, onRunPhase } = props;
  const moduleId = 'moduleId' in props ? props.moduleId : undefined;

  const duration = computeDuration(phase);

  const {
    value: logText,
    loading: logLoading,
    error: logError,
  } = useAsync(async () => {
    if (!showLog || !phase) {
      return undefined;
    }

    if (phaseName === 'init') {
      const response = await clientService.projectsProjectIdLogGet({
        path: { projectId },
        query: { streaming: false },
      });
      return await response.text();
    }

    const response = await clientService.projectsProjectIdModulesModuleIdLogGet(
      {
        path: { projectId, moduleId: moduleId as string },
        query: { phase: phaseName as ModulePhase, streaming: false },
      },
    );
    return await response.text();
  }, [showLog, phase?.id, projectId, moduleId]);

  return (
    <Grid container direction="row" spacing={3}>
      {onRunPhase && (
        <PhaseRunAction
          phase={phase}
          phaseName={phaseName}
          onRunPhase={onRunPhase}
        />
      )}

      {/* TODO: Button for canceling the current job execution */}

      <Grid item xs={2}>
        <Box>
          <Typography variant="body2" color="textSecondary" gutterBottom>
            {t('modulePage.phases.status')}
          </Typography>
          {getStatusChip(phase?.status, t)}
        </Box>
      </Grid>
      <Grid item xs={10}>
        <ItemField
          label={t('modulePage.phases.errorDetails')}
          value={phase?.errorDetails || empty}
        />
      </Grid>

      <Grid item xs={2}>
        <ItemField
          label={t('modulePage.phases.startedAt')}
          value={phase?.startedAt ? humanizeDate(phase.startedAt) : empty}
        />
      </Grid>
      <Grid item xs={2}>
        <ItemField label={t('modulePage.phases.duration')} value={duration} />
      </Grid>
      <Grid item xs={2}>
        <ItemField
          label={t('modulePage.phases.k8sJobName')}
          value={phase?.k8sJobName || empty}
        />
      </Grid>
      <Grid item xs={2}>
        <ItemField
          label={t('modulePage.phases.id')}
          value={phase?.id || empty}
        />
      </Grid>
      <Grid item xs={2}>
        <ItemField
          label={t('modulePage.phases.commitId')}
          value={phase?.commitId || empty}
        />
      </Grid>

      {phase && (
        <Grid item xs={12}>
          <Button variant="secondary" onPress={() => setShowLog(prev => !prev)}>
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
            <div style={{ height: 400 }}>
              <LogViewer
                text={logText || t('modulePage.phases.noLogsAvailable')}
              />
            </div>
          )}
        </Grid>
      )}

      {phase?.telemetry && (
        <>
          <Grid item xs={12}>
            <Typography variant="h6" gutterBottom>
              {t('modulePage.phases.telemetry.title')}
            </Typography>
          </Grid>
          <Grid item xs={12}>
            <PhaseTelemetry telemetry={phase.telemetry} />
          </Grid>
        </>
      )}
    </Grid>
  );
};
