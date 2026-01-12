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

import { useAsync } from 'react-use';

import { TabbedLayout } from '@backstage/core-components';
import { useApi, useRouteRefParams } from '@backstage/core-plugin-api';

import { Box } from '@material-ui/core';
import Grid from '@mui/material/Grid';
import { makeStyles } from 'tss-react/mui';

import { orchestratorApiRef } from '../../api';
import { useTranslation } from '../../hooks/useTranslation';
import { workflowRouteRef, workflowRunsRoutePath } from '../../routes';
import { useIsDarkMode } from '../../utils/isDarkMode';
import { WorkflowRunsTabContent } from '../OrchestratorPage/WorkflowRunsTabContent';
import { BaseOrchestratorPage } from '../ui/BaseOrchestratorPage';
import { RunButton } from './RunButton';
import { WorkflowDetailsTabContent } from './WorkflowDetailsTabContent';

const useStyles = makeStyles<{ isDarkMode: boolean }>()(
  (_, { isDarkMode }) => ({
    tabbedLayout: {
      '& .Mui-selected': {
        color: isDarkMode ? '#ffffff !important' : '#151515 !important',
      },
    },
  }),
);

export const WorkflowPage = () => {
  const { t } = useTranslation();
  const { workflowId } = useRouteRefParams(workflowRouteRef);
  const orchestratorApi = useApi(orchestratorApiRef);
  const isDarkMode = useIsDarkMode();
  const { classes } = useStyles({ isDarkMode });

  const {
    value: workflowOverviewDTO,
    loading: loadingWorkflowOverview,
    error: errorWorkflowOverview,
  } = useAsync(() => {
    return orchestratorApi.getWorkflowOverview(workflowId);
  }, []);

  return (
    <BaseOrchestratorPage
      title={workflowOverviewDTO?.data.name || workflowId}
      type="Orchestrator"
      typeLink="/orchestrator"
      noPadding
    >
      <Box className={classes.tabbedLayout}>
        <TabbedLayout>
          <TabbedLayout.Route path="/" title={t('page.tabs.workflowDetails')}>
            <Grid container spacing={2}>
              <RunButton isAvailable={workflowOverviewDTO?.data.isAvailable} />
              <WorkflowDetailsTabContent
                loadingWorkflowOverview={loadingWorkflowOverview}
                workflowOverviewDTO={workflowOverviewDTO?.data}
                errorWorkflowOverview={errorWorkflowOverview}
              />
            </Grid>
          </TabbedLayout.Route>
          <TabbedLayout.Route
            path={workflowRunsRoutePath}
            title={t('page.tabs.workflowRuns')}
          >
            <Grid container spacing={2}>
              <RunButton isAvailable={workflowOverviewDTO?.data.isAvailable} />
              <WorkflowRunsTabContent />
            </Grid>
          </TabbedLayout.Route>
        </TabbedLayout>
      </Box>
    </BaseOrchestratorPage>
  );
};
