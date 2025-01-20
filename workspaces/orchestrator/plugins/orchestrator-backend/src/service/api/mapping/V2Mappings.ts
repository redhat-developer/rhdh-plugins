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

import moment from 'moment';

import {
  capitalize,
  ExecuteWorkflowResponseDTO,
  extractWorkflowFormat,
  fromWorkflowSource,
  getWorkflowCategory,
  NodeInstance,
  NodeInstanceDTO,
  ProcessInstance,
  ProcessInstanceDTO,
  ProcessInstanceState,
  ProcessInstanceStatusDTO,
  WorkflowCategory,
  WorkflowCategoryDTO,
  WorkflowDefinition,
  WorkflowDTO,
  WorkflowExecutionResponse,
  WorkflowFormatDTO,
  WorkflowOverview,
  WorkflowOverviewDTO,
  WorkflowRunStatusDTO,
  type ProcessInstanceStatusDTO as ProcessInstanceStatusDTOType,
} from '@red-hat-developer-hub/backstage-plugin-orchestrator-common';

// Mapping functions
export function mapToWorkflowOverviewDTO(
  overview: WorkflowOverview,
): WorkflowOverviewDTO {
  return {
    name: overview.name,
    format: overview.format,
    workflowId: overview.workflowId,
    description: overview.description,
    lastRunId: overview.lastRunId,
    lastRunStatus: overview.lastRunStatus
      ? getProcessInstancesStatusDTOFromString(overview.lastRunStatus)
      : undefined,
    lastTriggeredMs: overview.lastTriggeredMs,
    category: mapWorkflowCategoryDTOFromString(overview.category),
  };
}

export function mapWorkflowCategoryDTOFromString(
  category?: string,
): WorkflowCategoryDTO {
  return category?.toLocaleLowerCase() === 'assessment'
    ? 'assessment'
    : 'infrastructure';
}

export function getWorkflowCategoryDTO(
  definition: WorkflowDefinition | undefined,
): WorkflowCategoryDTO {
  return getWorkflowCategory(definition);
}

export function getWorkflowFormatDTO(source: string): WorkflowFormatDTO {
  return extractWorkflowFormat(source);
}

export function mapToWorkflowDTO(source: string): WorkflowDTO {
  const definition = fromWorkflowSource(source);
  return {
    annotations: definition.annotations,
    category: getWorkflowCategoryDTO(definition),
    description: definition.description,
    name: definition.name,
    format: getWorkflowFormatDTO(source),
    id: definition.id,
  };
}

export function mapWorkflowCategoryDTO(
  category?: WorkflowCategory,
): WorkflowCategoryDTO {
  if (category === WorkflowCategory.ASSESSMENT) {
    return 'assessment';
  }
  return 'infrastructure';
}

export function getProcessInstancesStatusDTOFromString(
  state: string,
): ProcessInstanceStatusDTOType {
  if (
    !Object.values(ProcessInstanceStatusDTO).includes(
      state as ProcessInstanceStatusDTOType,
    )
  ) {
    throw new Error(
      `state ${state} is not one of the values of type ProcessInstanceStatusDTO`,
    );
  }
  return state as ProcessInstanceStatusDTOType;
}

export function mapToProcessInstanceDTO(
  processInstance: ProcessInstance,
): ProcessInstanceDTO {
  const start = moment(processInstance.start);
  const end = moment(processInstance.end);
  const duration = processInstance.end
    ? moment.duration(start.diff(end)).humanize()
    : undefined;

  let variables: Record<string, unknown> | undefined;
  if (typeof processInstance?.variables === 'string') {
    variables = JSON.parse(processInstance?.variables);
  } else {
    variables = processInstance?.variables;
  }

  return {
    id: processInstance.id,
    processId: processInstance.processId,
    processName: processInstance.processName,
    description: processInstance.description,
    serviceUrl: processInstance.serviceUrl,
    endpoint: processInstance.endpoint,
    error: processInstance.error,
    category: mapWorkflowCategoryDTO(processInstance.category),
    start: processInstance.start,
    end: processInstance.end,
    duration: duration,
    // @ts-ignore
    workflowdata: variables?.workflowdata,
    assessmentInstanceId: variables?.orchestratorAssessmentInstanceId as string,
    state: processInstance.state
      ? getProcessInstancesStatusDTOFromString(processInstance.state)
      : undefined,
    nodes: processInstance.nodes.map(mapToNodeInstanceDTO),
  };
}

export function mapToNodeInstanceDTO(
  nodeInstance: NodeInstance,
): NodeInstanceDTO {
  return { ...nodeInstance, __typename: 'NodeInstance' };
}

export function mapToExecuteWorkflowResponseDTO(
  workflowId: string,
  workflowExecutionResponse: WorkflowExecutionResponse,
): ExecuteWorkflowResponseDTO {
  if (!workflowExecutionResponse?.id) {
    throw new Error(
      `Error while mapping ExecuteWorkflowResponse to ExecuteWorkflowResponseDTO for workflow with id ${workflowId}`,
    );
  }

  return {
    id: workflowExecutionResponse.id,
  };
}

export function mapToWorkflowRunStatusDTO(
  status: ProcessInstanceState,
): WorkflowRunStatusDTO {
  return {
    key: capitalize(status),
    value: status,
  };
}
