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
import { InfoCard } from '@backstage/core-components';
import { makeStyles, Box, Tabs, Tab } from '@material-ui/core';
import CheckCircleIcon from '@material-ui/icons/CheckCircle';
import ErrorIcon from '@material-ui/icons/Error';
import HourglassEmptyIcon from '@material-ui/icons/HourglassEmpty';
import {
  MigrationPhase,
  Module,
} from '@red-hat-developer-hub/backstage-plugin-x2a-common';
import { useTranslation } from '../../hooks/useTranslation';
import { PhaseDetails } from '../PhaseDetails';

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

export const PhasesCard = ({
  module,
  projectId,
  moduleId,
  onRunPhase,
}: {
  module?: Module;
  projectId: string;
  moduleId: string;
  onRunPhase?: (phase: MigrationPhase) => void;
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
