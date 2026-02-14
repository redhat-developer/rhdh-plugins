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

import {
  Button,
  Card,
  CardBody,
  Tab,
  TabList,
  TabPanel,
  Tabs,
} from '@backstage/ui';
import { Grid, makeStyles, Typography } from '@material-ui/core';
import {
  Job,
  Module,
} from '@red-hat-developer-hub/backstage-plugin-x2a-common';
import { useTranslation } from '../../hooks/useTranslation';
import { ItemField } from '../ItemField';
import { humanizeDate } from '../tools';

const useStyles = makeStyles(() => ({
  tab: {
    width: '33%',
  },
}));

const RunAction = ({
  instructions,
  actionText,
}: {
  instructions: string;
  actionText: string;
}) => {
  return (
    <>
      <Grid item xs={12}>
        <Button variant="primary">{actionText}</Button>
      </Grid>
      <Grid item xs={12}>
        <Typography>{instructions}</Typography>
      </Grid>
    </>
  );
};

const PhaseDetails = ({ phase }: { phase?: Job }) => {
  const { t } = useTranslation();
  const empty = t('module.phases.none');

  // TODO: preselect the last tab when entering the page
  /*
          Details:Duration, logs
*/
  const duration = 'TODO: Duration';

  return (
    <Grid container direction="row" spacing={3}>
      {phase && (
        <RunAction
          instructions={t('modulePage.phases.reanalyzeInstructions')}
          actionText={t('modulePage.phases.rerunAnalyze')}
        />
      )}
      {!phase && (
        <RunAction
          instructions={t('modulePage.phases.analyzeInstructions')}
          actionText={t('modulePage.phases.runAnalyze')}
        />
      )}
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
          value={humanizeDate(phase?.startedAt || empty)}
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

      {/* Telemetry */}
    </Grid>
  );
};

export const PhasesCard = ({ module }: { module?: Module }) => {
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
            <PhaseDetails phase={analyzePhase} />
          </TabPanel>
          <TabPanel id="tab2">
            <PhaseDetails phase={migratePhase} />
          </TabPanel>
          <TabPanel id="tab3">
            <PhaseDetails phase={publishPhase} />
          </TabPanel>
        </Tabs>
      </CardBody>
    </Card>
  );
};
