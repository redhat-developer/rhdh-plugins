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
  createPermissionResourceRef,
  createPermissionRule,
} from '@backstage/plugin-permission-node';

import { z } from 'zod/v3';

import { ORCHESTRATOR_WORKFLOW_RESOURCE_TYPE } from '@red-hat-developer-hub/backstage-plugin-orchestrator-common';

export type OrchestratorFilter = {
  key: string;
  values: any[];
};

/**
 * The OrchestratorFilters type is a recursive type that can be used to create complex filter structures.
 * It can be used to create filters that are a combination of other filters, or a negation of a filter.
 *
 */
export type OrchestratorFilters =
  | { anyOf: OrchestratorFilters[] }
  | { allOf: OrchestratorFilters[] }
  | { not: OrchestratorFilters }
  | OrchestratorFilter;

export type WorkflowIdParam = { workflowId: string };

export type WorkflowIdRuleParams = {
  workflowIds: string[];
};

/**
 * Resource reference for orchestrator workflows
 */
export const orchestratorWorkflowResourceRef = createPermissionResourceRef<
  WorkflowIdParam,
  OrchestratorFilter
>().with({
  pluginId: 'orchestrator',
  resourceType: ORCHESTRATOR_WORKFLOW_RESOURCE_TYPE,
});

/**
 * Permission rule for orchestrator workflows
 */
export const isWorkflowId = createPermissionRule<
  typeof orchestratorWorkflowResourceRef,
  WorkflowIdRuleParams
>({
  name: 'IS_ALLOWED_WORKFLOW_ID',
  description: 'Allow workflows matching the specified workflow IDs',
  resourceRef: orchestratorWorkflowResourceRef,
  paramsSchema: z.object({
    workflowIds: z.array(z.string()).describe('List of workflows IDs to match'),
  }),
  apply: (workflow: WorkflowIdParam, { workflowIds }: WorkflowIdRuleParams) => {
    return workflowIds.includes(workflow.workflowId);
  },
  toQuery: ({ workflowIds }: WorkflowIdRuleParams) => ({
    key: 'workflowIds',
    values: workflowIds,
  }),
});

/**
 * All orchestrator permission rules
 */
export const orchestratorPermissionRules = [isWorkflowId];
