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
import {
  Button,
  Card,
  CardBody,
  Tab,
  TabList,
  TabPanel,
  Tabs,
} from '@backstage/ui';
import { LogViewer, Progress } from '@backstage/core-components';
import { Grid, makeStyles, Typography } from '@material-ui/core';
import {
  Job,
  Module,
  ModulePhase,
} from '@red-hat-developer-hub/backstage-plugin-x2a-common';
import { useClientService } from '../../ClientService';
import { useTranslation } from '../../hooks/useTranslation';
import { ItemField } from '../ItemField';
import { humanizeDate } from '../tools';

const useStyles = makeStyles(() => ({
  tab: {
    width: '33%',
  },
}));

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
  phaseName: ModulePhase;
  onRunPhase?: (phase: ModulePhase) => void;
}) => {
  const { t } = useTranslation();

  const previousRunSucceeded = phase?.status === 'success';

  const getInstructions = () => {
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

const PhaseDetails = ({
  phase,
  phaseName,
  projectId,
  moduleId,
  onRunPhase,
}: {
  phase?: Job;
  phaseName: ModulePhase;
  projectId: string;
  moduleId: string;
  onRunPhase?: (phase: ModulePhase) => void;
}) => {
  const { t } = useTranslation();
  const clientService = useClientService();
  const empty = t('module.phases.none');
  const [showLog, setShowLog] = useState(false);

  const duration = computeDuration(phase);

  const {
    value: logText,
    loading: logLoading,
    error: logError,
  } = useAsync(async () => {
    if (!showLog || !phase) {
      return undefined;
    }
    const response = await clientService.projectsProjectIdModulesModuleIdLogGet(
      {
        path: { projectId, moduleId },
        query: { phase: phaseName },
      },
    );
    return await response.text();
  }, [showLog, phase?.id]);

  return (
    <Grid container direction="row" spacing={3}>
      <PhaseRunAction
        phase={phase}
        phaseName={phaseName}
        onRunPhase={onRunPhase}
      />
      {/* TODO: Button for canceling the current job execution */}

      <Grid item xs={3}>
        <ItemField
          label={t('modulePage.phases.status')}
          value={phase?.status || empty}
        />
      </Grid>
      <Grid item xs={9}>
        <ItemField
          label={t('modulePage.phases.errorDetails')}
          value={phase?.errorDetails || empty}
        />
      </Grid>

      <Grid item xs={3}>
        <ItemField
          label={t('modulePage.phases.startedAt')}
          value={phase?.startedAt ? humanizeDate(phase.startedAt) : empty}
        />
      </Grid>
      <Grid item xs={3}>
        <ItemField label={t('modulePage.phases.duration')} value={duration} />
      </Grid>
      <Grid item xs={3}>
        <ItemField
          label={t('modulePage.phases.k8sJobName')}
          value={phase?.k8sJobName || empty}
        />
      </Grid>
      <Grid item xs={3}>
        <ItemField
          label={t('modulePage.phases.id')}
          value={phase?.id || empty}
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
              <LogViewer text={logText} />
            </div>
          )}
        </Grid>
      )}

      {/* Telemetry */}
    </Grid>
  );
};

export const PhasesCard = ({
  module,
  projectId,
  moduleId,
  onRunPhase,
}: {
  module?: Module;
  projectId: string;
  moduleId: string;
  onRunPhase?: (phase: ModulePhase) => void;
}) => {
  const { t } = useTranslation();
  const classes = useStyles();

  const analyzePhase = module?.analyze;
  const migratePhase = module?.migrate;
  const publishPhase = module?.publish;

  const moduleMigrationPlanArtifact = analyzePhase?.artifacts?.find(
    artifact => artifact.type === 'module_migration_plan',
  );
  const migratedSourcesArtifact = migratePhase?.artifacts?.find(
    artifact => artifact.type === 'migrated_sources',
  );

  return (
    <Card>
      <CardBody>
        <Tabs orientation="vertical">
          <TabList>
            <Tab id="tab1" className={classes.tab}>
              {t('module.phases.analyze')}
            </Tab>
            <Tab
              id="tab2"
              className={classes.tab}
              isDisabled={!moduleMigrationPlanArtifact}
            >
              {t('module.phases.migrate')}
            </Tab>
            <Tab
              id="tab3"
              className={classes.tab}
              isDisabled={!migratedSourcesArtifact}
            >
              {t('module.phases.publish')}
            </Tab>
          </TabList>
          <TabPanel id="tab1">
            <PhaseDetails
              phase={analyzePhase}
              phaseName="analyze"
              projectId={projectId}
              moduleId={moduleId}
              onRunPhase={onRunPhase}
            />
          </TabPanel>
          <TabPanel id="tab2">
            <PhaseDetails
              phase={migratePhase}
              phaseName="migrate"
              projectId={projectId}
              moduleId={moduleId}
              onRunPhase={onRunPhase}
            />
          </TabPanel>
          <TabPanel id="tab3">
            <PhaseDetails
              phase={publishPhase}
              phaseName="publish"
              projectId={projectId}
              moduleId={moduleId}
              onRunPhase={onRunPhase}
            />
          </TabPanel>
        </Tabs>
      </CardBody>
    </Card>
  );
};
