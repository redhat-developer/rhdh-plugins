/* eslint-disable no-else-return */
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

import { load } from 'js-yaml';
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
  WorkflowExecutionResponse,
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

    let executionResponse: WorkflowExecutionResponse | undefined;

    // Figure out if we are sending as cloudevent are regular
    // The frontend will send the isEvent=true parameter in the inputData if it running as an Event
    const isEventType =
      (executeWorkflowRequestDTO.inputData as any)?.isEvent || false;

    // definition.source will be the yaml
    const parsedDefinitionSource: any = load(definition.source as string);

    if (isEventType) {
      // This is where we call the cloud event execute
      // All workflows should have this?
      const start = parsedDefinitionSource.start;

      // Find the start state from the list of states
      const startState = parsedDefinitionSource.states.filter(
        (val: { name: any }) => {
          return val.name === start;
        },
      );

      if (startState.length < 1) {
        // Remove this:
        console.log('No States that match the start state');
        throw new Error(
          'Error executing workflow with id ${workflowId}, No States that match the start state',
        );
      }

      // Look at the onEvents to get what it responds to
      // What happens if there are multiple events and event refs?
      // The kafka topic name will be: ${eventName}`
      const eventName = startState[0].onEvents[0].eventRefs[0];

      const workflowEventToUse = parsedDefinitionSource.events.filter(
        (val: { name: any }) => {
          return val.name === eventName;
        },
      );

      if (workflowEventToUse.length < 1) {
        throw new Error(
          'Error executing workflow with id ${workflowId}, No Events that match the start state eventRef',
        );
      }

      // This will be the key value for event correlation: ${correlationContextAttributeName}
      const correlationContextAttributeName =
        workflowEventToUse[0].correlation[0].contextAttributeName;

      executionResponse =
        await this.orchestratorService.executeWorkflowAsCloudEvent({
          definitionId: workflowId,
          workflowSource: workflowEventToUse[0].source,
          workflowEventType: eventName,
          contextAttribute: correlationContextAttributeName,
          inputData: {
            workflowdata: executeWorkflowRequestDTO.inputData,
            initiatorEntity: initiatorEntity,
            targetEntity: executeWorkflowRequestDTO.targetEntity,
          },
          authTokens: executeWorkflowRequestDTO.authTokens as Array<AuthToken>,
          backstageToken,
        });

      // We need to return the workflow instance ID
      // This is what is returned when executing a "normal" workflow
      // Wait a small amount so the workflow has a chance to get triggered
      // There is a very good possibility that the workflow will not be ready yet when we query here

      let currentInstanceToReturn: string | any[] = [];
      for (let i = 0; i < FETCH_INSTANCE_MAX_ATTEMPTS; i++) {
        const response = await this.orchestratorService.fetchInstances({
          workflowIds: [workflowId],
        });

        // eslint-disable-next-line no-loop-func
        currentInstanceToReturn = response.filter((val: any) => {
          return (
            val.variables.workflowdata[correlationContextAttributeName] ===
            executionResponse?.id
          );
        });

        if (currentInstanceToReturn.length > 0) {
          break;
        }
      }

      let currentInstanceIDToReturn;
      if (currentInstanceToReturn.length < 1) {
        // nothing returned yet,
        // doesn't mean this is an error since it might take time for the trigger to happen
        // return something else so the front-end knows to just show the list of workflow runs
        currentInstanceIDToReturn = 'kafkaEvent';
      } else {
        currentInstanceIDToReturn = currentInstanceToReturn[0]?.id;
      }

      // Return just the id of the response, which will be the instanceID or some identifier
      // to let the front end know the workflow isn't ready yet
      return {
        id: currentInstanceIDToReturn,
      };
    } else {
      executionResponse = await this.orchestratorService.executeWorkflow({
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
    }

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
