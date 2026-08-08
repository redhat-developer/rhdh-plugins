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

import { NotFoundError } from '@backstage/errors';

import {
  WorkflowDefinition,
  WorkflowInfo,
} from '@red-hat-developer-hub/backstage-plugin-orchestrator-common';

import { OrchestratorService } from './OrchestratorService';

/**
 * Resolves a workflow's info, service URL, and definition, throwing
 * `NotFoundError` on any missing piece. Shared by the `execute-workflow`
 * and `get-workflow-schema` MCP actions, which both need this same
 * "workflow exists, has a service URL, and has a fetchable definition"
 * precondition before doing their own thing with it.
 */
export const resolveWorkflowDefinition = async (
  orchestratorService: OrchestratorService,
  workflowId: string,
): Promise<{
  workflowInfo: WorkflowInfo;
  serviceUrl: string;
  definition: WorkflowDefinition;
}> => {
  const workflowInfo = await orchestratorService.fetchWorkflowInfo({
    definitionId: workflowId,
  });
  if (!workflowInfo) {
    throw new NotFoundError(`Workflow "${workflowId}" not found`);
  }

  const serviceUrl = workflowInfo.serviceUrl;
  if (!serviceUrl) {
    throw new NotFoundError(
      `Workflow "${workflowId}" does not have a service URL configured`,
    );
  }

  const definition = await orchestratorService.fetchWorkflowDefinition({
    definitionId: workflowId,
  });
  if (!definition) {
    throw new NotFoundError(
      `Workflow definition for "${workflowId}" not found`,
    );
  }

  return { workflowInfo, serviceUrl, definition };
};
