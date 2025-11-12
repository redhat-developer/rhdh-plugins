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
  AuthToken,
  ExecuteWorkflowRequestDTO,
  ExecuteWorkflowResponseDTO,
  Filter,
  ProcessInstanceDTO,
  ProcessInstanceListResultDTO,
  ProcessInstanceState,
  RetriggerInstanceRequestDTO,
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

  public async getWorkflowsOverviewForEntity(
    targetEntity: string,
    annotationWorkflowIds: string[],
  ): Promise<WorkflowOverviewListResultDTO> {
    let combinedWorkflowIds: string[] = annotationWorkflowIds;

    if (targetEntity) {
      const definitionIdsFromInstances =
        await this.orchestratorService.fetchDefinitionIdsFromInstances({
          targetEntity,
        });

      if (definitionIdsFromInstances.length > 0) {
        combinedWorkflowIds = Array.from(
          new Set([...combinedWorkflowIds, ...definitionIdsFromInstances]),
        );
      }
    }

    // If no workflow IDs are provided, return empty result
    if (combinedWorkflowIds.length === 0) {
      return {
        overviews: [],
      };
    }

    const workflowIdsFilter: Filter = {
      field: 'id',
      operator: 'IN',
      value: combinedWorkflowIds,
    };

    return this.getWorkflowsOverview(
      undefined,
      workflowIdsFilter,
      targetEntity,
    );
  }

  public async getWorkflowsOverview(
    pagination?: Pagination,
    filter?: Filter,
    targetEntity?: string,
  ): Promise<WorkflowOverviewListResultDTO> {
    const overviews = await this.orchestratorService.fetchWorkflowOverviews({
      pagination,
      filter,
      targetEntity,
    });
    if (!overviews) {
      throw new Error("Couldn't fetch workflow overviews");
    }
    const result: WorkflowOverviewListResultDTO = {
      overviews: overviews.map(item => mapToWorkflowOverviewDTO(item)),
      paginationInfo: {
        pageSize: pagination?.limit,
        offset: pagination?.offset,
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
  ): Promise<ProcessInstanceDTO> {
    const instance = await this.orchestratorService.fetchInstance({
      instanceId,
    });

    if (!instance) {
      throw new Error(`Couldn't fetch process instance ${instanceId}`);
    }

    return mapToProcessInstanceDTO(instance);
  }

  public async getInstanceLogsById(instance: ProcessInstanceDTO): Promise<any> {
    // Fetch the logs, probably add something to that orchestrator service object? OR maybe a logViewerService object instead
    // We are not querying actual orchestrator since the logs don't live there
    // Query will be against the log provider, like Loki for example
    // logViewerService is probably going to be the new class/interface that other providers can implement in the future
    const baseURL = 'http://localhost:3100/loki/api/v1/query_range';
    const params = new URLSearchParams({
      query: `{service_name=~".+"} |="${instance.id}"`,
      start: instance.start as string,
      end: instance.end || '',
    });

    const urlToFetch = `${baseURL}?${params.toString()}`;

    const response = await fetch(urlToFetch);

    let allResults;
    if (response.status !== 200) {
      console.log('ERror', response.statusText, response);
    } else {
      const jsonResponse = await response.json();
      // Reduce the results into another array
      allResults = jsonResponse.data.result.reduce(
        (acc: any[], curr: { values: any[] }) => {
          curr.values.reduce((_innerAcc: any, innerCurr: any) => {
            acc.push(innerCurr);
          }, acc);
          return acc;
        },
        [],
      );
    }
    return allResults;
  }

  public async executeWorkflow(
    executeWorkflowRequestDTO: ExecuteWorkflowRequestDTO,
    workflowId: string,
    initiatorEntity: string,
    backstageToken: string | undefined,
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
        targetEntity: executeWorkflowRequestDTO.targetEntity,
      },
      authTokens: executeWorkflowRequestDTO.authTokens as Array<AuthToken>,
      serviceUrl: definition.serviceUrl,
      backstageToken,
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
    retriggerInstanceRequestDTO: RetriggerInstanceRequestDTO,
    backstageToken: string | undefined,
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
      authTokens: retriggerInstanceRequestDTO.authTokens as Array<AuthToken>,
      backstageToken,
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
