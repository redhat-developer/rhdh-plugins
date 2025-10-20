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
  ProcessInstance,
  ProcessInstanceState,
  ProcessInstanceStateValues,
  WorkflowDefinition,
  WorkflowExecutionResponse,
  WorkflowFormat,
  WorkflowInfo,
  WorkflowOverview,
  WorkflowOverviewListResult,
} from '@redhat/backstage-plugin-orchestrator-common';

const BASE_DATE = '2023-02-19T11:45:21.123Z';

interface WorkflowOverviewParams {
  suffix?: string;
  workflowId?: string;
  name?: string;
  format?: WorkflowFormat;
  lastTriggeredMs?: number;
  lastRunStatus?: ProcessInstanceStateValues;
  description?: string;
}
export function generateTestWorkflowOverview(
  params: WorkflowOverviewParams,
): WorkflowOverview {
  return {
    workflowId: params.workflowId ?? `testWorkflowId${params.suffix}`,
    name: params.name ?? `Test Workflow${params.suffix}`,
    format: params.format ?? 'yaml',
    lastTriggeredMs:
      params.lastTriggeredMs ?? Date.parse('2024-02-09T10:34:56Z'),
    lastRunStatus: params.lastRunStatus ?? ProcessInstanceState.Completed,
    description: params.description ?? 'Test Workflow Description',
  };
}

export function generateTestWorkflowOverviewList(
  howmany: number,
  inputParams?: WorkflowOverviewParams,
): WorkflowOverviewListResult {
  const res: WorkflowOverviewListResult = {
    items: [],
    offset: 0,
    limit: 0,
  };

  for (let i = 0; i < howmany; i++) {
    const params: WorkflowOverviewParams = inputParams ?? {};
    params.suffix = i.toString();
    res.items.push(generateTestWorkflowOverview(params));
  }

  return res;
}

export function generateTestWorkflowInfo(
  id: string = 'test_workflowId',
): WorkflowInfo {
  return {
    id: id,
    serviceUrl: 'mock/serviceurl',
  };
}

export function generateTestExecuteWorkflowResponse(
  id: string = 'test_execId',
): WorkflowExecutionResponse {
  return {
    id: id,
  };
}

export const generateWorkflowDefinition: WorkflowDefinition = {
  id: 'quarkus-backend-workflow-ci-switch',
  version: '1.0',
  specVersion: '0.8',
  name: '[WF] Create a starter Quarkus Backend application with a CI pipeline - CI Switch',
  description:
    '[WF] Create a starter Quarkus Backend application with a CI pipeline - CI Switch',
  annotations: ['test_annotation'],
  states: [
    {
      name: 'Test state',
      type: 'operation',
      end: true,
    },
  ],
};

export function generateProcessInstances(howmany: number): ProcessInstance[] {
  const processInstances: ProcessInstance[] = [];
  for (let i = 0; i < howmany; i++) {
    processInstances.push(generateProcessInstance(i));
  }
  return processInstances;
}

export function generateProcessInstance(id: number): ProcessInstance {
  return {
    id: `processInstance${id}`,
    processName: `name${id}`,
    processId: `proceesId${id}`,
    state: ProcessInstanceState.Active,
    start: BASE_DATE,
    end: moment(BASE_DATE).add(1, 'hour').toISOString(),
    nodes: [],
    endpoint: 'enpoint/foo',
    serviceUrl: 'service/bar',
    source: 'my-source',
    executionSummary: [
      'Workflow started at 2025-06-08T11:36:22.967Z',
      'Workflow completed at 2025-06-08T11:36:22.970Z',
    ],
    description: 'test description 1',
    variables: {
      foo: 'bar',
      workflowdata: {
        workflowOptions: {
          'my-category': {
            id: 'next-workflow-1',
            name: 'Next Workflow One',
          },
          'my-secod-category': [
            {
              id: 'next-workflow-20',
              name: 'Next Workflow Twenty',
            },
            {
              id: 'next-workflow-21',
              name: 'Next Workflow Twenty One',
            },
          ],
        },
      },
    },
  };
}
