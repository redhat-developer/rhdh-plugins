/*
 * Copyright 2024 The Backstage Authors
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

import { orchestratorApiRef } from '../api';
import { usePermissionArrayDecision } from '../hooks/usePermissionArray';
import { workflowRouteRef, workflowRunsRouteRef } from '../routes';
import { BaseOrchestratorPage } from './BaseOrchestratorPage';
import { WorkflowDefinitionViewerPage } from './WorkflowDefinitionViewerPage';
import { WorkflowRunsTabContent } from './WorkflowRunsTabContent';

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
    loading,
    error,
  } = useAsync(() => {
    return orchestratorApi.getWorkflowOverview(workflowId);
  }, []);

  return (
    <BaseOrchestratorPage
      title={workflowOverviewDTO?.data.name || workflowId}
      type="Workflows"
      typeLink="/orchestrator"
    >
      <TabbedLayout>
        <TabbedLayout.Route path="/" title="Workflow details">
          <WorkflowDefinitionViewerPage
            error={error}
            loadingPermission={loadingPermission}
            loading={loading}
            canRun={canRun}
            workflowOverviewDTO={workflowOverviewDTO}
          />
        </TabbedLayout.Route>
        <TabbedLayout.Route
          path={workflowRunsRouteRef.path.split('/').pop() || 'runs'}
          title="Workflow runs"
        >
          <WorkflowRunsTabContent
            error={error}
            loadingPermission={loadingPermission}
            loading={loading}
            canRun={canRun}
            workflowOverviewDTO={workflowOverviewDTO}
          />
        </TabbedLayout.Route>
      </TabbedLayout>
    </BaseOrchestratorPage>
  );
};
