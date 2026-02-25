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
import { Button } from '@backstage/ui';
import { LogViewer, Progress, InfoCard } from '@backstage/core-components';
import {
  Grid,
  makeStyles,
  Typography,
  Box,
  Chip,
  Tabs,
  Tab,
} from '@material-ui/core';
import CheckCircleIcon from '@material-ui/icons/CheckCircle';
import ErrorIcon from '@material-ui/icons/Error';
import HourglassEmptyIcon from '@material-ui/icons/HourglassEmpty';
import {
  Job,
  Module,
  ModulePhase,
} from '@red-hat-developer-hub/backstage-plugin-x2a-common';
import { useClientService } from '../../ClientService';
import { useTranslation } from '../../hooks/useTranslation';
import { ItemField } from '../ItemField';
import { humanizeDate } from '../tools';

const useStyles = makeStyles(theme => ({
  tabs: {
    borderBottom: `1px solid ${theme.palette.divider}`,
    marginBottom: theme.spacing(3),
  },
  tab: {
    minWidth: 120,
    width: '33.33%',
    maxWidth: '33.33%',
    minHeight: 64,
    fontSize: theme.typography.pxToRem(16),
    fontWeight: theme.typography.fontWeightMedium as number,
    textTransform: 'none' as const,
    padding: theme.spacing(2, 3),
    '&:hover': {
      backgroundColor: theme.palette.action.hover,
    },
  },
  tabLabel: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: theme.spacing(1),
  },
  statusIcon: {
    display: 'inline-flex',
    marginLeft: theme.spacing(1),
  },
  successIcon: {
    color: theme.palette.success.main,
  },
  tabPanel: {
    paddingTop: theme.spacing(2),
  },
  hiddenPanel: {
    display: 'none',
  },
}));

const getStatusIcon = (status?: string, classes?: any) => {
  switch (status) {
    case 'success':
      return (
        <CheckCircleIcon fontSize="small" className={classes?.successIcon} />
      );
    case 'error':
      return <ErrorIcon fontSize="small" color="error" />;
    case 'running':
      return <HourglassEmptyIcon fontSize="small" color="action" />;
    case 'pending':
      return <HourglassEmptyIcon fontSize="small" color="disabled" />;
    default:
      return null;
  }
};

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
        <Box>
          <Typography variant="body2" color="textSecondary" gutterBottom>
            {t('modulePage.phases.status')}
          </Typography>
          {getStatusChip(phase?.status, t)}
        </Box>
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
      <Grid item xs={3}>
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
  const [activeTab, setActiveTab] = useState(0);

  const analyzePhase = module?.analyze;
  const migratePhase = module?.migrate;
  const publishPhase = module?.publish;

  const moduleMigrationPlanArtifact = analyzePhase?.artifacts?.find(
    artifact => artifact.type === 'module_migration_plan',
  );
  const migratedSourcesArtifact = migratePhase?.artifacts?.find(
    artifact => artifact.type === 'migrated_sources',
  );

  const handleTabChange = (_event: React.ChangeEvent<{}>, newValue: number) => {
    setActiveTab(newValue);
  };

  return (
    <InfoCard title={t('modulePage.phases.title')} variant="gridItem">
      <Tabs
        value={activeTab}
        onChange={handleTabChange}
        className={classes.tabs}
        indicatorColor="primary"
        textColor="primary"
        variant="fullWidth"
      >
        <Tab
          className={classes.tab}
          label={
            <Box className={classes.tabLabel}>
              {t('module.phases.analyze')}
              <Box className={classes.statusIcon}>
                {getStatusIcon(analyzePhase?.status, classes)}
              </Box>
            </Box>
          }
        />
        <Tab
          className={classes.tab}
          label={
            <Box className={classes.tabLabel}>
              {t('module.phases.migrate')}
              <Box className={classes.statusIcon}>
                {getStatusIcon(migratePhase?.status, classes)}
              </Box>
            </Box>
          }
          disabled={!moduleMigrationPlanArtifact}
        />
        <Tab
          className={classes.tab}
          label={
            <Box className={classes.tabLabel}>
              {t('module.phases.publish')}
              <Box className={classes.statusIcon}>
                {getStatusIcon(publishPhase?.status, classes)}
              </Box>
            </Box>
          }
          disabled={!migratedSourcesArtifact}
        />
      </Tabs>

      <Box className={activeTab === 0 ? classes.tabPanel : classes.hiddenPanel}>
        <PhaseDetails
          phase={analyzePhase}
          phaseName="analyze"
          projectId={projectId}
          moduleId={moduleId}
          onRunPhase={onRunPhase}
        />
      </Box>
      <Box className={activeTab === 1 ? classes.tabPanel : classes.hiddenPanel}>
        <PhaseDetails
          phase={migratePhase}
          phaseName="migrate"
          projectId={projectId}
          moduleId={moduleId}
          onRunPhase={onRunPhase}
        />
      </Box>
      <Box className={activeTab === 2 ? classes.tabPanel : classes.hiddenPanel}>
        <PhaseDetails
          phase={publishPhase}
          phaseName="publish"
          projectId={projectId}
          moduleId={moduleId}
          onRunPhase={onRunPhase}
        />
      </Box>
    </InfoCard>
  );
};
