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

import { createApiRef } from '@backstage/core-plugin-api';
import type { JsonObject } from '@backstage/types';

import { AxiosResponse } from 'axios';

import {
  AuthToken,
  ExecuteWorkflowResponseDTO,
  Filter,
  InputSchemaResponseDTO,
  PaginationInfoDTO,
  ProcessInstanceDTO,
  ProcessInstanceListResultDTO,
  WorkflowInstanceLogsDTO,
  WorkflowOverviewDTO,
  WorkflowOverviewListResultDTO,
} from '@red-hat-developer-hub/backstage-plugin-orchestrator-common';

export interface OrchestratorApi {
  abortWorkflowInstance(instanceId: string): Promise<AxiosResponse<string>>;

  retriggerInstance(
    workflowId: string,
    instanceId: string,
    authTokens?: AuthToken[],
  ): Promise<AxiosResponse<object>>;

  executeWorkflow(args: {
    workflowId: string;
    parameters: JsonObject;
    authTokens: AuthToken[];
    businessKey?: string;
    targetEntity?: string;
  }): Promise<AxiosResponse<ExecuteWorkflowResponseDTO>>;

  getWorkflowSource(workflowId: string): Promise<AxiosResponse<string>>;

  getInstance(instanceId: string): Promise<AxiosResponse<ProcessInstanceDTO>>;

  getWorkflowDataInputSchema(
    workflowId: string,
    instanceId?: string,
  ): Promise<AxiosResponse<InputSchemaResponseDTO>>;

  getWorkflowOverview(
    workflowId: string,
  ): Promise<AxiosResponse<WorkflowOverviewDTO>>;

  pingWorkflowService(workflowId: string): Promise<AxiosResponse<boolean>>;

  listWorkflowOverviews(
    paginationInfo?: PaginationInfoDTO,
    filters?: Filter,
  ): Promise<AxiosResponse<WorkflowOverviewListResultDTO>>;

  getWorkflowsOverviewForEntity(
    targetEntity: string,
    annotationWorkflowIds: string[],
  ): Promise<AxiosResponse<WorkflowOverviewListResultDTO>>;

  listInstances(
    paginationInfo?: PaginationInfoDTO,
    filters?: Filter,
  ): Promise<AxiosResponse<ProcessInstanceListResultDTO>>;

  getInstanceLogs(
    instanceId: string,
  ): Promise<AxiosResponse<WorkflowInstanceLogsDTO>>;
}

export const orchestratorApiRef = createApiRef<OrchestratorApi>({
  id: 'plugin.orchestrator.api',
});
