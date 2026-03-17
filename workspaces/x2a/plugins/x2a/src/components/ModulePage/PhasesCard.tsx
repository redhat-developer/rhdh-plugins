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

import { InfoCard } from '@backstage/core-components';
import { makeStyles, Box, Tabs, Tab } from '@material-ui/core';
import {
  MigrationPhase,
  Module,
  Project,
} from '@red-hat-developer-hub/backstage-plugin-x2a-common';

import { useTranslation } from '../../hooks/useTranslation';
import { PhaseDetails } from '../PhaseDetails';
import { PhaseStatusIcon } from '../PhaseStatus';
import { hasPhasePrerequisites } from '../tools';

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
    '& .MuiTab-wrapper': {
      flexDirection: 'row',
    },
  },
  tabLabel: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: theme.spacing(1),
    '& > span': {
      alignItems: 'center',
      '& svg, & img': {
        top: 0,
      },
    },
  },
  tabPanel: {
    paddingTop: theme.spacing(2),
  },
  hiddenPanel: {
    display: 'none',
  },
}));

export const PhasesCard = ({
  module,
  project,
  projectId,
  moduleId,
  activeTab,
  handleTabChange,
  onRunPhase,
  onCancelPhase,
}: {
  module?: Module;
  project?: Project;
  projectId: string;
  moduleId: string;
  activeTab: number;
  handleTabChange: (event: React.ChangeEvent<{}>, newValue: number) => void;
  onRunPhase?: (phase: MigrationPhase) => void;
  onCancelPhase?: (phase: MigrationPhase) => void;
}) => {
  const { t } = useTranslation();
  const classes = useStyles();

  const analyzePhase = module?.analyze;
  const migratePhase = module?.migrate;
  const publishPhase = module?.publish;

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
              <PhaseStatusIcon status={analyzePhase?.status} />
            </Box>
          }
        />
        <Tab
          className={classes.tab}
          label={
            <Box className={classes.tabLabel}>
              {t('module.phases.migrate')}
              <PhaseStatusIcon status={migratePhase?.status} />
            </Box>
          }
          disabled={
            !module ||
            !project ||
            !hasPhasePrerequisites(module, 'migrate', project)
          }
        />
        <Tab
          className={classes.tab}
          label={
            <Box className={classes.tabLabel}>
              {t('module.phases.publish')}
              <PhaseStatusIcon status={publishPhase?.status} />
            </Box>
          }
          disabled={
            !module ||
            !project ||
            !hasPhasePrerequisites(module, 'publish', project)
          }
        />
      </Tabs>

      <Box className={activeTab === 0 ? classes.tabPanel : classes.hiddenPanel}>
        <PhaseDetails
          phase={analyzePhase}
          phaseName="analyze"
          projectId={projectId}
          moduleId={moduleId}
          onRunPhase={onRunPhase}
          onCancelPhase={onCancelPhase}
        />
      </Box>
      <Box className={activeTab === 1 ? classes.tabPanel : classes.hiddenPanel}>
        <PhaseDetails
          phase={migratePhase}
          phaseName="migrate"
          projectId={projectId}
          moduleId={moduleId}
          onRunPhase={onRunPhase}
          onCancelPhase={onCancelPhase}
        />
      </Box>
      <Box className={activeTab === 2 ? classes.tabPanel : classes.hiddenPanel}>
        <PhaseDetails
          phase={publishPhase}
          phaseName="publish"
          projectId={projectId}
          moduleId={moduleId}
          onRunPhase={onRunPhase}
          onCancelPhase={onCancelPhase}
        />
      </Box>
    </InfoCard>
  );
};
