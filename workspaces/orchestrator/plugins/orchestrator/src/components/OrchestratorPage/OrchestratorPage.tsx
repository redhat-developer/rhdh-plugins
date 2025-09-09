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

import { TabbedLayout } from '@backstage/core-components';

import { Box } from '@material-ui/core';
import { makeStyles } from 'tss-react/mui';

import { workflowInstancesRouteRef } from '../../routes';
import { useIsDarkMode } from '../../utils/isDarkMode';
import { BaseOrchestratorPage } from '../ui/BaseOrchestratorPage';
import { WorkflowRunsTabContent } from './WorkflowRunsTabContent';
import { WorkflowsTabContent } from './WorkflowsTabContent';

const useStyles = makeStyles<{ isDarkMode: boolean }>()(
  (_, { isDarkMode }) => ({
    tabbedLayout: {
      '& .Mui-selected': {
        color: isDarkMode ? '#ffffff !important' : '#151515 !important',
      },
    },
  }),
);

export const OrchestratorPage = () => {
  const isDarkMode = useIsDarkMode();
  const { classes } = useStyles({ isDarkMode });

  return (
    <BaseOrchestratorPage title="Workflow Orchestrator" noPadding>
      <Box className={classes.tabbedLayout}>
        <TabbedLayout>
          <TabbedLayout.Route path="/" title="Workflows">
            <WorkflowsTabContent />
          </TabbedLayout.Route>
          <TabbedLayout.Route
            path={workflowInstancesRouteRef.path}
            title="All runs"
          >
            <WorkflowRunsTabContent />
          </TabbedLayout.Route>
        </TabbedLayout>
      </Box>
    </BaseOrchestratorPage>
  );
};
