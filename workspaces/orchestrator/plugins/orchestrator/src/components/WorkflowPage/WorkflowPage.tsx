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

import React from 'react';
import { useAsync } from 'react-use';

import { TabbedLayout } from '@backstage/core-components';
import { useApi, useRouteRefParams } from '@backstage/core-plugin-api';

import {
  orchestratorWorkflowUsePermission,
  orchestratorWorkflowUseSpecificPermission,
} from '@red-hat-developer-hub/backstage-plugin-orchestrator-common';

import { orchestratorApiRef } from '../../api';
import { usePermissionArrayDecision } from '../../hooks/usePermissionArray';
import { workflowRouteRef, workflowRunsRoutePath } from '../../routes';
import { BaseOrchestratorPage } from '../BaseOrchestratorPage';
import { WorkflowRunsTabContent } from '../WorkflowRunsTabContent';
import { WorkflowDetailsTabContent } from './WorkflowDetailsTabContent';
import { WorkflowPageTabContent } from './WorkflowPageTabContent';

export const WorkflowPage = () => {
  const { workflowId } = useRouteRefParams(workflowRouteRef);
  const orchestratorApi = useApi(orchestratorApiRef);

  const { loading: loadingPermission, allowed: canRun } =
    usePermissionArrayDecision([
      orchestratorWorkflowUsePermission,
      orchestratorWorkflowUseSpecificPermission(workflowId),
    ]);

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
      type="Workflows"
      typeLink="/orchestrator"
      noPadding
    >
      <TabbedLayout>
        <TabbedLayout.Route path="/" title="Workflow details">
          <WorkflowPageTabContent
            errorWorkflowOverview={errorWorkflowOverview}
            loadingPermission={loadingPermission}
            canRun={canRun}
          >
            <WorkflowDetailsTabContent
              loading={loadingWorkflowOverview}
              workflowOverviewDTO={workflowOverviewDTO?.data}
            />
          </WorkflowPageTabContent>
        </TabbedLayout.Route>
        <TabbedLayout.Route path={workflowRunsRoutePath} title="Workflow runs">
          <WorkflowPageTabContent
            errorWorkflowOverview={errorWorkflowOverview}
            loadingPermission={loadingPermission}
            canRun={canRun}
          >
            <WorkflowRunsTabContent />
          </WorkflowPageTabContent>
        </TabbedLayout.Route>
      </TabbedLayout>
    </BaseOrchestratorPage>
  );
};
