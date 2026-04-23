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

import { DateTime } from 'luxon';

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
} from '@red-hat-developer-hub/backstage-plugin-orchestrator-common';

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

export function generateTestWorkflowInfoForEventypeNoStartStates(
  id: string = 'test_workflowId',
): WorkflowInfo {
  return {
    id: id,
    source: `# yaml-language-server: $schema=https://raw.githubusercontent.com/serverlessworkflow/specification/refs/heads/0.8.x/schema/workflow.json
id: lock-flow
specVersion: "0.8"
key: lock-flow
version: "1.0.0"
events:
  - type: notify-event
    kind: produced
    name: notify-event
    correlation:
      - contextAttributeName: lockid
functions:
  - name: sysLog
    type: custom
    operation: sysout:INFO
start: listenToLock
states:
  - name: notifyLock
    type: operation
    actions:
      - eventRef:
          triggerEventRef: notify-event
      - functionRef:
          refName: sysLog
          arguments:
    transition: waitForRelease
    end:
      produceEvents:
        - eventRef: released-event
          data: '{test: "testYOOOOOOOOOOOOOOOO"}'`,
  };
}

export function generateTestWorkflowInfoForEventypeNoStartStateNameStates(
  id: string = 'test_workflowId',
): WorkflowInfo {
  return {
    id: id,
    source: `# yaml-language-server: $schema=https://raw.githubusercontent.com/serverlessworkflow/specification/refs/heads/0.8.x/schema/workflow.json
id: lock-flow
specVersion: "0.8"
key: lock-flow
version: "1.0.0"
events:
  - type: notify-event
    kind: produced
    name: notify-event
    correlation:
      - contextAttributeName: lockid
functions:
  - name: sysLog
    type: custom
    operation: sysout:INFO
start:
  stateName: listenToLock
states:
  - name: notifyLock
    type: operation
    actions:
      - eventRef:
          triggerEventRef: notify-event
      - functionRef:
          refName: sysLog
          arguments:
    transition: waitForRelease
    end:
      produceEvents:
        - eventRef: released-event
          data: '{test: "testYOOOOOOOOOOOOOOOO"}'`,
  };
}

export function generateTestWorkflowInfoForEventypeNoEventRef(
  id: string = 'test_workflowId',
): WorkflowInfo {
  return {
    id: id,
    source: `# yaml-language-server: $schema=https://raw.githubusercontent.com/serverlessworkflow/specification/refs/heads/0.8.x/schema/workflow.json
id: lock-flow
specVersion: "0.8"
key: lock-flow
version: "1.0.0"
events:
  - type: lock-event
    kind: consumed
    name: lock-event
    source: local
    correlation:
      - contextAttributeName: lockid
functions:
  - name: sysLog
    type: custom
    operation: sysout:INFO
start: listenToLock
states:
  - name: listenToLock
    type: event
    end:
      produceEvents:
        - eventRef: released-event
          data: '{test: "testYOOOOOOOOOOOOOOOO"}'`,
  };
}

export function generateTestWorkflowInfoForEventypeNoStartStateForEventRef(
  id: string = 'test_workflowId',
): WorkflowInfo {
  return {
    id: id,
    source: `# yaml-language-server: $schema=https://raw.githubusercontent.com/serverlessworkflow/specification/refs/heads/0.8.x/schema/workflow.json
id: lock-flow
specVersion: "0.8"
key: lock-flow
version: "1.0.0"
events:
  - type: released-event
    kind: produced
    name: released-event
    correlation:
      - contextAttributeName: lockid
functions:
  - name: sysLog
    type: custom
    operation: sysout:INFO
start: listenToLock
states:
  - name: listenToLock
    type: event
    onEvents:
      - eventRefs:
          - lock-event
        actions:
          - functionRef:
              refName: sysLog
              arguments:
    transition: notifyLock
    end:
      produceEvents:
        - eventRef: released-event
          data: '{test: "testYOOOOOOOOOOOOOOOO"}'`,
  };
}

export function generateTestWorkflowInfoForEventypeWithNoCorrelationContextAttribute(
  id: string = 'test_workflowId',
): WorkflowInfo {
  return {
    id: id,
    source: `# yaml-language-server: $schema=https://raw.githubusercontent.com/serverlessworkflow/specification/refs/heads/0.8.x/schema/workflow.json
id: lock-flow
specVersion: "0.8"
key: lock-flow
version: "1.0.0"
events:
  - type: lock-event
    kind: consumed
    name: lock-event
    source: local
functions:
  - name: sysLog
    type: custom
    operation: sysout:INFO
start: listenToLock
states:
  - name: listenToLock
    type: event
    onEvents:
      - eventRefs:
          - lock-event
        actions:
          - functionRef:
              refName: sysLog
              arguments:
    transition: notifyLock
    end:
      produceEvents:
        - eventRef: released-event
          data: '{test: "testYOOOOOOOOOOOOOOOO"}'`,
  };
}

export function generateTestWorkflowInfoForEventype(
  id: string = 'test_workflowId',
): WorkflowInfo {
  return {
    id: id,
    source: `# yaml-language-server: $schema=https://raw.githubusercontent.com/serverlessworkflow/specification/refs/heads/0.8.x/schema/workflow.json
id: lock-flow
specVersion: "0.8"
key: lock-flow
version: "1.0.0"
events:
  - type: lock-event
    kind: consumed
    name: lock-event
    source: local
    correlation:
      - contextAttributeName: lockid
  - type: release-event
    kind: consumed
    name: release-event
    source: local
    correlation:
      - contextAttributeName: lockid
  - type: notify-event
    kind: produced
    name: notify-event
    correlation:
      - contextAttributeName: lockid
  - type: released-event
    kind: produced
    name: released-event
    correlation:
      - contextAttributeName: lockid
functions:
  - name: sysLog
    type: custom
    operation: sysout:INFO
start: listenToLock
states:
  - name: listenToLock
    type: event
    onEvents:
      - eventRefs:
          - lock-event
        actions:
          - functionRef:
              refName: sysLog
              arguments:
    transition: notifyLock
  - name: notifyLock
    type: operation
    actions:
      - eventRef:
          triggerEventRef: notify-event
      - functionRef:
          refName: sysLog
          arguments:
    transition: waitForRelease
  - name: waitForRelease
    type: callback
    action:
      functionRef:
        refName: sysLog
        arguments:
    eventRef: release-event
    timeouts:
      eventTimeout: PT3M
    transition: releaseLock
  - name: releaseLock
    type: operation
    actions:
      - functionRef:
          refName: sysLog
          arguments:
    end:
      produceEvents:
        - eventRef: released-event
          data: '{test: "testYOOOOOOOOOOOOOOOO"}'`,
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
    end: DateTime.fromISO(BASE_DATE, { setZone: true })
      .plus({ hours: 1 })
      .toISO() as string,
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

export function generateProcessInstanceForEventType(
  id: number,
  correlationContextAttributeId: string,
): ProcessInstance {
  return {
    id: `processInstance${id}`,
    processId: `proceesId${id}`,
    nodes: [],
    endpoint: 'enpoint/foo',
    variables: {
      workflowdata: {
        lockid: correlationContextAttributeId,
      },
    },
  };
}
