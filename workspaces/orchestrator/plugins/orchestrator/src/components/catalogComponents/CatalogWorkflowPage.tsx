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

import { Content } from '@backstage/core-components';
import { useApi, useRouteRefParams } from '@backstage/core-plugin-api';

import { Grid } from '@material-ui/core';

import { orchestratorApiRef } from '../../api';
import { entityWorkflowRouteRef } from '../../routes';
import { WorkflowRunsTabContent } from '../OrchestratorPage/WorkflowRunsTabContent';
import { BaseOrchestratorPage } from '../ui/BaseOrchestratorPage';
import { RunButton } from '../WorkflowPage/RunButton';
import { WorkflowDetailsTabContent } from '../WorkflowPage/WorkflowDetailsTabContent';

export const CatalogWorkflowPage = () => {
  const { workflowId, kind, name, namespace } = useRouteRefParams(
    entityWorkflowRouteRef,
  );
  const orchestratorApi = useApi(orchestratorApiRef);

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
      type={name}
      typeLink={`/catalog/${namespace}/${kind}/${name}/workflows`}
      noPadding
    >
      <Content>
        <Grid container spacing={2}>
          <Grid item xs={12}>
            <RunButton
              isAvailable={workflowOverviewDTO?.data.isAvailable}
              entityRef={`${kind}:${namespace}/${name}`}
            />
          </Grid>
          <Grid item xs={12}>
            <WorkflowDetailsTabContent
              loadingWorkflowOverview={loadingWorkflowOverview}
              workflowOverviewDTO={workflowOverviewDTO?.data}
              errorWorkflowOverview={errorWorkflowOverview}
            />
          </Grid>
          <Grid item xs={12}>
            <WorkflowRunsTabContent />
          </Grid>
        </Grid>
      </Content>
    </BaseOrchestratorPage>
  );
};
