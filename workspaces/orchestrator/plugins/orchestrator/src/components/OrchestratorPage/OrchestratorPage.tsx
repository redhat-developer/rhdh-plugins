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

import { ReactElement, ReactNode, useState } from 'react';

import { TabbedLayout } from '@backstage/core-components';

import AccountTreeIcon from '@mui/icons-material/AccountTree';
import PlaylistPlayIcon from '@mui/icons-material/PlaylistPlay';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import { makeStyles } from 'tss-react/mui';

import { useTranslation } from '../../hooks/useTranslation';
import { workflowInstancesRouteRef } from '../../routes';
import { useIsDarkMode } from '../../utils/isDarkMode';
import { BaseOrchestratorPage } from '../ui/BaseOrchestratorPage';
import { WorkflowRunsTabContent } from './WorkflowRunsTabContent';
import { WorkflowsTabContent } from './WorkflowsTabContent';

const TAB_ICON_PROPS = {
  fontSize: 'small' as const,
};

const TAB_LABEL_STYLE = {
  display: 'inline-flex',
  alignItems: 'center',
  gap: 8,
} as const;

// HeaderTabs uses @material-ui/core Tab (v4), which stacks separate icon/label
// vertically. Render both inline inside tabProps.icon and clear label instead.
const TabLabel = ({
  icon,
  children,
}: {
  icon: ReactElement;
  children: ReactNode;
}) => (
  <Typography component="span" style={TAB_LABEL_STYLE}>
    {icon}
    {children}
  </Typography>
);

const useStyles = makeStyles<{ isDarkMode: boolean }>()(
  (_, { isDarkMode }) => ({
    tabbedLayout: {
      '& .MuiTab-root': {
        minHeight: 48,
      },
      '& .Mui-selected': {
        color: isDarkMode ? '#ffffff !important' : '#151515 !important',
      },
    },
  }),
);

export const OrchestratorPage = () => {
  const { t } = useTranslation();
  const isDarkMode = useIsDarkMode();
  const { classes } = useStyles({ isDarkMode });
  const [workflowsCount, setWorkflowsCount] = useState<number | undefined>();

  const workflowsTabTitle =
    workflowsCount !== undefined
      ? t('table.title.workflows').replace('{{count}}', String(workflowsCount))
      : t('page.tabs.workflows');

  return (
    <BaseOrchestratorPage title={t('page.title')} noPadding>
      <Box className={classes.tabbedLayout}>
        <TabbedLayout>
          <TabbedLayout.Route
            path="/"
            title={workflowsTabTitle}
            tabProps={{
              label: '',
              icon: (
                <TabLabel icon={<AccountTreeIcon {...TAB_ICON_PROPS} />}>
                  {workflowsTabTitle}
                </TabLabel>
              ),
            }}
          >
            <WorkflowsTabContent onCountChange={setWorkflowsCount} />
          </TabbedLayout.Route>
          <TabbedLayout.Route
            path={workflowInstancesRouteRef.path}
            title={t('page.tabs.allRuns')}
            tabProps={{
              label: '',
              icon: (
                <TabLabel icon={<PlaylistPlayIcon {...TAB_ICON_PROPS} />}>
                  {t('page.tabs.allRuns')}
                </TabLabel>
              ),
            }}
          >
            <WorkflowRunsTabContent />
          </TabbedLayout.Route>
        </TabbedLayout>
      </Box>
    </BaseOrchestratorPage>
  );
};
