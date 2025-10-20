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
  ProcessInstanceStatusDTO,
  WorkflowOverview,
  WorkflowRunStatusDTO,
} from '@redhat/backstage-plugin-orchestrator-common';

import {
  generateProcessInstance,
  generateTestExecuteWorkflowResponse,
  generateTestWorkflowOverview,
} from '../test-utils';
import {
  getProcessInstancesStatusDTOFromString,
  mapToExecuteWorkflowResponseDTO,
  mapToProcessInstanceDTO,
  mapToWorkflowOverviewDTO,
  mapToWorkflowRunStatusDTO,
} from './V2Mappings';

describe('scenarios to verify executeWorkflowResponseDTO', () => {
  it('correctly maps positive scenario response', async () => {
    const execWorkflowResp = generateTestExecuteWorkflowResponse();
    const mappedValue = mapToExecuteWorkflowResponseDTO(
      'test_workflowId',
      execWorkflowResp,
    );
    expect(mappedValue).toBeDefined();
    expect(mappedValue.id).toBeDefined();
    expect(Object.keys(mappedValue).length).toBe(1);
  });

  it('throws error when no id attribute present in response', async () => {
    expect(() => {
      mapToExecuteWorkflowResponseDTO('workflowId', { id: '' });
    }).toThrow(
      `Error while mapping ExecuteWorkflowResponse to ExecuteWorkflowResponseDTO for workflow with id`,
    );
  });
});

describe('scenarios to verify mapToWorkflowOverviewDTO', () => {
  it('correctly maps WorkflowOverview', () => {
    // Arrange
    const overview: WorkflowOverview = generateTestWorkflowOverview({});

    // Act
    const result = mapToWorkflowOverviewDTO(overview);

    // Assert
    expect(result.workflowId).toBe(overview.workflowId);
    expect(result.name).toBe(overview.name);
    expect(result.format).toBe(overview.format);
    expect(result.lastTriggeredMs).toBe(overview.lastTriggeredMs);

    expect(result.lastRunStatus).toBe(
      overview.lastRunStatus
        ? getProcessInstancesStatusDTOFromString(overview.lastRunStatus)
        : undefined,
    );
    expect(result.description).toBe(overview.description);
  });
});
describe('scenarios to verify mapToProcessInstanceDTO', () => {
  it('correctly maps ProcessInstanceDTO for not completed workflow', () => {
    // Arrange
    const processInstanceV1: ProcessInstance = generateProcessInstance(1);
    processInstanceV1.end = undefined;

    // Act
    const result = mapToProcessInstanceDTO(processInstanceV1);

    // Assert
    expect(result).toBeDefined();
    expect(result.id).toBeDefined();
    expect(result.start).toBeDefined();
    expect(result.start).toEqual(processInstanceV1.start);
    expect(result.end).toBeUndefined();
    expect(result.duration).toBeUndefined();
    expect(result.state).toBeDefined();
    expect(result.state).toEqual(
      getProcessInstancesStatusDTOFromString(
        result.state as ProcessInstanceStatusDTO,
      ),
    );
    expect(result.description).toEqual(processInstanceV1.description);
    expect(result.workflowdata).toEqual(
      // @ts-ignore
      processInstanceV1?.variables?.workflowdata,
    );
  });
  it('correctly maps ProcessInstanceDTO', () => {
    // Arrange
    const processIntanceV1: ProcessInstance = generateProcessInstance(1);

    const start = moment(processIntanceV1.start);
    const end = moment(processIntanceV1.end);
    const duration = moment.duration(start.diff(end)).humanize();
    // Act
    const result = mapToProcessInstanceDTO(processIntanceV1);

    // Assert
    expect(result.id).toBeDefined();
    expect(result.start).toEqual(processIntanceV1.start);
    expect(result.end).toBeDefined();
    expect(result.end).toEqual(processIntanceV1.end);
    expect(result.duration).toEqual(duration);

    expect(result).toBeDefined();
    if (!result.state) {
      throw new Error('result.state should be defined');
    }
    expect(result.state).toEqual(
      getProcessInstancesStatusDTOFromString(result.state),
    );
    expect(processIntanceV1.state).toBeDefined();
    expect(result.state).toEqual(
      getProcessInstancesStatusDTOFromString(
        processIntanceV1.state as ProcessInstanceStatusDTO,
      ),
    );
    expect(result.end).toEqual(processIntanceV1.end);
    expect(result.duration).toEqual(duration);
    expect(result.duration).toEqual('an hour');
    expect(result.description).toEqual(processIntanceV1.description);
    expect(result.workflowdata).toEqual(
      // @ts-ignore
      processIntanceV1?.variables?.workflowdata,
    );
  });
});

describe('scenarios to verify mapToWorkflowRunStatusDTO', () => {
  it('correctly maps ProcessInstanceState to WorkflowRunStatusDTO', async () => {
    const mappedValue: WorkflowRunStatusDTO = mapToWorkflowRunStatusDTO(
      ProcessInstanceState.Active,
    );

    expect(mappedValue).toBeDefined();
    expect(mappedValue.key).toBeDefined();
    expect(mappedValue.value).toBeDefined();
    expect(mappedValue.key).toEqual('Active');
    expect(mappedValue.value).toEqual('ACTIVE');
  });
});
