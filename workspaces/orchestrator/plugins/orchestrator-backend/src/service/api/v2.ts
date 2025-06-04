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

import { ParsedRequest } from 'openapi-backend';

import {
  AssessedProcessInstanceDTO,
  AuthToken,
  ExecuteWorkflowRequestDTO,
  ExecuteWorkflowResponseDTO,
  Filter,
  ProcessInstance,
  ProcessInstanceListResultDTO,
  ProcessInstanceState,
  WorkflowDTO,
  WorkflowInfo,
  WorkflowOverviewDTO,
  WorkflowOverviewListResultDTO,
  WorkflowRunStatusDTO,
} from '@red-hat-developer-hub/backstage-plugin-orchestrator-common';

import { Pagination } from '../../types/pagination';
import { retryAsyncFunction } from '../Helper';
import { OrchestratorService } from '../OrchestratorService';
import {
  mapToExecuteWorkflowResponseDTO,
  mapToProcessInstanceDTO,
  mapToWorkflowDTO,
  mapToWorkflowOverviewDTO,
  mapToWorkflowRunStatusDTO,
} from './mapping/V2Mappings';

const FETCH_INSTANCE_MAX_ATTEMPTS = 10;
const FETCH_INSTANCE_RETRY_DELAY_MS = 1000;

export class V2 {
  constructor(private readonly orchestratorService: OrchestratorService) {}

  public async getWorkflowsOverview(
    pagination: Pagination,
    filter?: Filter,
  ): Promise<WorkflowOverviewListResultDTO> {
    const overviews = await this.orchestratorService.fetchWorkflowOverviews({
      pagination,
      filter,
    });
    if (!overviews) {
      throw new Error("Couldn't fetch workflow overviews");
    }
    const result: WorkflowOverviewListResultDTO = {
      overviews: overviews.map(item => mapToWorkflowOverviewDTO(item)),
      paginationInfo: {
        pageSize: pagination.limit,
        offset: pagination.offset,
      },
    };
    return result;
  }

  public getWorkflowIds(): string[] {
    return this.orchestratorService.getWorkflowIds();
  }

  public async getWorkflowOverviewById(
    workflowId: string,
  ): Promise<WorkflowOverviewDTO> {
    const overview = await this.orchestratorService.fetchWorkflowOverview({
      definitionId: workflowId,
    });

    if (!overview) {
      throw new Error(`Couldn't fetch workflow overview for ${workflowId}`);
    }
    return mapToWorkflowOverviewDTO(overview);
  }

  public async getWorkflowById(workflowId: string): Promise<WorkflowDTO> {
    const resultV1 = await this.getWorkflowSourceById(workflowId);
    return mapToWorkflowDTO(resultV1);
  }

  public async getWorkflowSourceById(workflowId: string): Promise<string> {
    const source = await this.orchestratorService.fetchWorkflowSource({
      definitionId: workflowId,
    });

    if (!source) {
      throw new Error(`Couldn't fetch workflow source for ${workflowId}`);
    }

    return source;
  }

  public async getInstances(
    pagination?: Pagination,
    filter?: Filter,
    workflowIds?: string[],
  ): Promise<ProcessInstanceListResultDTO> {
    const instances = await this.orchestratorService.fetchInstances({
      pagination,
      filter,
      workflowIds,
    });

    const result: ProcessInstanceListResultDTO = {
      items: instances?.map(mapToProcessInstanceDTO),
      paginationInfo: {
        pageSize: pagination?.limit,
        offset: pagination?.offset,
      },
    };
    return result;
  }

  public async getInstanceById(
    instanceId: string,
    includeAssessment: boolean = false,
  ): Promise<AssessedProcessInstanceDTO> {
    const instance = await this.orchestratorService.fetchInstance({
      instanceId,
    });

    if (!instance) {
      throw new Error(`Couldn't fetch process instance ${instanceId}`);
    }

    let assessedByInstance: ProcessInstance | undefined;

    if (includeAssessment && instance.businessKey) {
      assessedByInstance = await this.orchestratorService.fetchInstance({
        instanceId: instance.businessKey,
      });
    }

    return {
      instance: mapToProcessInstanceDTO(instance),
      assessedBy: assessedByInstance
        ? mapToProcessInstanceDTO(assessedByInstance)
        : undefined,
    };
  }

  public async executeWorkflow(
    executeWorkflowRequestDTO: ExecuteWorkflowRequestDTO,
    workflowId: string,
    businessKey: string | undefined,
    initiatorEntity: string,
  ): Promise<ExecuteWorkflowResponseDTO> {
    const definition = await this.orchestratorService.fetchWorkflowInfo({
      definitionId: workflowId,
    });
    if (!definition) {
      throw new Error(`Couldn't fetch workflow definition for ${workflowId}`);
    }
    if (!definition.serviceUrl) {
      throw new Error(`ServiceURL is not defined for workflow ${workflowId}`);
    }
    const executionResponse = await this.orchestratorService.executeWorkflow({
      definitionId: workflowId,
      inputData: {
        workflowdata: executeWorkflowRequestDTO.inputData,
        initiatorEntity: initiatorEntity,
      },
      authTokens: executeWorkflowRequestDTO.authTokens as Array<AuthToken>,
      serviceUrl: definition.serviceUrl,
      businessKey,
    });

    if (!executionResponse) {
      throw new Error(`Couldn't execute workflow ${workflowId}`);
    }

    // Making sure the instance data is available before returning
    await retryAsyncFunction({
      asyncFn: () =>
        this.orchestratorService.fetchInstance({
          instanceId: executionResponse.id,
        }),
      maxAttempts: FETCH_INSTANCE_MAX_ATTEMPTS,
      delayMs: FETCH_INSTANCE_RETRY_DELAY_MS,
    });

    if (!executionResponse) {
      throw new Error('Error executing workflow with id ${workflowId}');
    }

    return mapToExecuteWorkflowResponseDTO(workflowId, executionResponse);
  }

  public async retriggerInstance(
    workflowId: string,
    instanceId: string,
  ): Promise<void> {
    const definition = await this.orchestratorService.fetchWorkflowInfo({
      definitionId: workflowId,
    });
    if (!definition) {
      throw new Error(`Couldn't fetch workflow definition for ${workflowId}`);
    }
    if (!definition.serviceUrl) {
      throw new Error(`ServiceURL is not defined for workflow ${workflowId}`);
    }
    const response = await this.orchestratorService.retriggerWorkflow({
      definitionId: workflowId,
      instanceId: instanceId,
      serviceUrl: definition.serviceUrl,
    });

    if (!response) {
      throw new Error(
        `Couldn't retrigger instance ${instanceId} of workflow ${workflowId}`,
      );
    }
  }

  public async abortWorkflow(
    workflowId: string,
    instanceId: string,
  ): Promise<string> {
    const definition = await this.orchestratorService.fetchWorkflowInfo({
      definitionId: workflowId,
    });
    if (!definition) {
      throw new Error(`Couldn't fetch workflow definition for ${workflowId}`);
    }
    if (!definition.serviceUrl) {
      throw new Error(`ServiceURL is not defined for workflow ${workflowId}`);
    }
    await this.orchestratorService.abortWorkflowInstance({
      definitionId: workflowId,
      instanceId: instanceId,
      serviceUrl: definition.serviceUrl,
    });
    return `Workflow instance ${instanceId} successfully aborted`;
  }

  public async getWorkflowStatuses(): Promise<WorkflowRunStatusDTO[]> {
    return [
      ProcessInstanceState.Active,
      ProcessInstanceState.Error,
      ProcessInstanceState.Completed,
      ProcessInstanceState.Aborted,
      ProcessInstanceState.Suspended,
      ProcessInstanceState.Pending,
    ].map(status => mapToWorkflowRunStatusDTO(status));
  }

  public async getWorkflowInputSchemaById(
    workflowId: string,
    serviceUrl: string,
  ): Promise<WorkflowInfo | undefined> {
    return this.orchestratorService.fetchWorkflowInfoOnService({
      definitionId: workflowId,
      serviceUrl: serviceUrl,
    });
  }

  public async pingWorkflowService(
    workflowId: string,
  ): Promise<boolean | undefined> {
    const definition = await this.orchestratorService.fetchWorkflowInfo({
      definitionId: workflowId,
    });
    if (!definition) {
      throw new Error(`Couldn't fetch workflow definition for ${workflowId}`);
    }
    if (!definition.serviceUrl) {
      throw new Error(`ServiceURL is not defined for workflow ${workflowId}`);
    }
    const isAvailableNow = await this.orchestratorService.pingWorkflowService({
      definitionId: workflowId,
      serviceUrl: definition.serviceUrl,
    });
    if (!isAvailableNow) {
      throw new Error(
        `Workflow service for workflow ${workflowId} at ${definition.serviceUrl}/management/processes/${workflowId} is not available at the moment.`,
      );
    }
    return isAvailableNow;
  }

  public extractQueryParam(
    req: ParsedRequest,
    key: string,
  ): string | undefined {
    return req.query[key] as string | undefined;
  }
}
