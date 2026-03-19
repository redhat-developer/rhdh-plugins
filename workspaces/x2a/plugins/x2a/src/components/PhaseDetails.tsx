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
import {
  ButtonGroup,
  Button,
  Grid,
  makeStyles,
  Typography,
} from '@material-ui/core';
import {
  Job,
  MigrationPhase,
  ModulePhase,
} from '@red-hat-developer-hub/backstage-plugin-x2a-common';

import { useTranslation } from '../hooks/useTranslation';
import { useClientService } from '../ClientService';
import { ItemField } from './ItemField';
import {
  canCancelPhase,
  formatDuration,
  humanizeDate,
  secondsBetween,
} from './tools';
import { PhaseTelemetry } from './PhaseTelemetry';
import { PhaseStatus } from './PhaseStatus';

const useStyles = makeStyles(theme => ({
  buttonGroup: {
    gap: theme.spacing(1),
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

  const previousRunSucceeded = phase?.status === 'success';
  if (!onRunPhase) {
    return null;
  }

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
      <ButtonGroup
        orientation="horizontal"
        size="small"
        className={classes.buttonGroup}
      >
        <Button
          variant="outlined"
          color="primary"
          disabled={isDisabled}
          onClick={() => {
            onRunPhase(phaseName);
          }}
        >
          {getActionText()}
        </Button>

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

      <Typography>{getInstructions()}</Typography>
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
    onCancelPhase?: (phase: MigrationPhase) => void;
  } & OptionalModuleId,
) => {
  const { t } = useTranslation();
  const clientService = useClientService();
  const empty = t('module.phases.none');
  const [showLog, setShowLog] = useState(false);

  const { phase, projectId, phaseName, onRunPhase, onCancelPhase } = props;
  const moduleId = 'moduleId' in props ? props.moduleId : undefined;

  const duration =
    phase?.startedAt && phase?.finishedAt
      ? formatDuration(t, secondsBetween(phase.startedAt, phase.finishedAt))
      : empty;

  const canRunPhase = phase?.status !== 'running';

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

      <Grid item xs={2}>
        <ItemField
          label={t('modulePage.phases.status')}
          value={<PhaseStatus status={phase?.status} />}
        />
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
