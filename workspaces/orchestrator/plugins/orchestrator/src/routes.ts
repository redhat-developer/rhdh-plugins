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
import { createRouteRef, createSubRouteRef } from '@backstage/core-plugin-api';

// orchestrator page
export const orchestratorRootRouteRef = createRouteRef({
  id: 'orchestrator', // display WorkflowsTabContent
});

export const workflowInstancesRouteRef = createSubRouteRef({
  id: 'orchestrator/instances',
  parent: orchestratorRootRouteRef,
  path: '/instances', // display WorkflowRunsTabContent
});

// single instance page
export const workflowInstanceRouteRef = createSubRouteRef({
  id: 'orchestrator/instances',
  parent: orchestratorRootRouteRef,
  path: '/instances/:instanceId', // display WorkflowInstancePage
});

// workflow page
export const workflowRouteRef = createSubRouteRef({
  id: 'orchestrator/workflows',
  parent: orchestratorRootRouteRef,
  path: '/workflows/:format/:workflowId', // display WorkflowDefinitionViewerPage
});

export const workflowRunsRouteRef = createSubRouteRef({
  id: 'orchestrator/workflows',
  parent: orchestratorRootRouteRef,
  path: '/runs', // display WorkflowRunsTabContentFiltered
});

// execute workflow page
export const executeWorkflowRouteRef = createSubRouteRef({
  id: 'orchestrator/workflows/execute',
  parent: orchestratorRootRouteRef,
  path: '/workflows/:workflowId/execute', // diaplsy ExecuteWorkflowPage
});
