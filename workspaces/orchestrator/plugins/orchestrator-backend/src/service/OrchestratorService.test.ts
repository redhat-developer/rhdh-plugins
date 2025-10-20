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
  ProcessInstance,
  WorkflowDefinition,
  WorkflowExecutionResponse,
  WorkflowInfo,
  WorkflowOverview,
} from '@redhat/backstage-plugin-orchestrator-common';

import { DataIndexService } from './DataIndexService';
import { OrchestratorService } from './OrchestratorService';
import { SonataFlowService } from './SonataFlowService';
import { WorkflowCacheService } from './WorkflowCacheService';

// Mocked data helpers
const createInstanceIdMock = (x: number): string => `instance${x}`;
const createDefinitionIdMock = (x: number): string => `definition${x}`;
const createWorkflowInfoMock = (x: number): WorkflowInfo => {
  return {
    id: createDefinitionIdMock(x),
  };
};
const createWorkflowOverviewMock = (x: number): WorkflowOverview => {
  return {
    workflowId: createDefinitionIdMock(x),
    format: 'yaml',
  };
};
const createWorkflowOverviewsMock = (size: number): WorkflowOverview[] =>
  Array.from({ length: size }, (_, i) => createWorkflowOverviewMock(i + 1));
const createInstanceMock = (x: number): ProcessInstance => {
  return {
    id: createInstanceIdMock(x),
    processId: createDefinitionIdMock(x),
    endpoint: `endpoint${x}`,
    nodes: [],
  };
};
const createInstancesMock = (size: number): ProcessInstance[] => {
  const result: ProcessInstance[] = [];
  for (let i = 1; i <= size; i++) {
    result.push(createInstanceMock(i));
  }
  return result;
};

// Mocked data
const instanceId = createInstanceIdMock(1);
const definitionId = createDefinitionIdMock(1);
const workflowInfo = createWorkflowInfoMock(1);
const workflowOverview = createWorkflowOverviewMock(1);
const workflowOverviews = createWorkflowOverviewsMock(3);
const instance = createInstanceMock(1);
const instances = createInstancesMock(3);
const serviceUrl = 'http://localhost';
const inputData = { foo: 'bar' };

// Mocked dependencies
const sonataFlowServiceMock = {} as SonataFlowService;
const workflowCacheServiceMock = {} as WorkflowCacheService;
const dataIndexServiceMock = {} as DataIndexService;

// Target
const orchestratorService = new OrchestratorService(
  sonataFlowServiceMock,
  dataIndexServiceMock,
  workflowCacheServiceMock,
);

describe('OrchestratorService', () => {
  describe('abortWorkflowInstance', () => {
    beforeEach(() => {
      jest.clearAllMocks();
    });

    it('should execute the operation', async () => {
      sonataFlowServiceMock.abortInstance = jest.fn(
        (_args: {
          definitionId: string;
          instanceId: string;
          serviceUrl: string;
        }) => Promise.resolve(),
      );

      await orchestratorService.abortWorkflowInstance({
        definitionId,
        instanceId,
        serviceUrl,
      });

      expect(sonataFlowServiceMock.abortInstance).toHaveBeenCalled();
    });
  });

  describe('fetchInstances', () => {
    beforeEach(() => {
      jest.clearAllMocks();
    });

    it('should throw error when data index returns error', async () => {
      const errMsg = 'Failed to load instances';
      dataIndexServiceMock.fetchInstances = jest.fn().mockImplementation(() => {
        throw new Error(errMsg);
      });

      const promise = orchestratorService.fetchInstances({});
      await expect(promise).rejects.toThrow(errMsg);
    });

    it('should execute the operation', async () => {
      dataIndexServiceMock.fetchInstances = jest
        .fn()
        .mockResolvedValue(instances);

      const result = await orchestratorService.fetchInstances({});

      expect(result).toHaveLength(instances.length);
      expect(dataIndexServiceMock.fetchInstances).toHaveBeenCalled();
    });
  });

  describe('fetchWorkflowOverviews', () => {
    beforeEach(() => {
      jest.clearAllMocks();
    });

    it('should throw error when data index returns error', async () => {
      const errMsg = 'Failed to get workflows overview';
      sonataFlowServiceMock.fetchWorkflowOverviews = jest
        .fn()
        .mockImplementation(() => {
          throw new Error(errMsg);
        });

      const promise = orchestratorService.fetchWorkflowOverviews({});
      await expect(promise).rejects.toThrow();
    });

    it('should execute the operation', async () => {
      sonataFlowServiceMock.fetchWorkflowOverviews = jest
        .fn()
        .mockResolvedValue(workflowOverviews);
      workflowCacheServiceMock.isAvailable = jest.fn().mockReturnValue(true);

      const result = await orchestratorService.fetchWorkflowOverviews({});

      expect(result).toHaveLength(workflowOverviews.length);
      expect(sonataFlowServiceMock.fetchWorkflowOverviews).toHaveBeenCalled();
    });
  });

  describe('fetchWorkflowInfo', () => {
    beforeEach(() => {
      jest.clearAllMocks();
    });

    it('should execute the operation', async () => {
      dataIndexServiceMock.fetchWorkflowInfo = jest
        .fn()
        .mockResolvedValue(workflowInfo);

      const result = await orchestratorService.fetchWorkflowInfo({
        definitionId,
      });

      expect(result).toBeDefined();
    });
  });

  describe('fetchWorkflowSource', () => {
    const workflowSource = 'workflow source';
    beforeEach(() => {
      jest.clearAllMocks();
    });

    it('should execute the operation', async () => {
      dataIndexServiceMock.fetchWorkflowSource = jest
        .fn()
        .mockResolvedValue(workflowSource);

      const result = await orchestratorService.fetchWorkflowSource({
        definitionId,
      });

      expect(result).toBeDefined();
    });
  });

  describe('fetchInstanceVariables', () => {
    const variables: object = { foo: 'bar' };

    beforeEach(() => {
      jest.clearAllMocks();
    });

    it('should execute the operation', async () => {
      dataIndexServiceMock.fetchDefinitionIdByInstanceId = jest
        .fn()
        .mockResolvedValue(definitionId);
      dataIndexServiceMock.fetchInstanceVariables = jest
        .fn()
        .mockResolvedValue(variables);

      const result = await orchestratorService.fetchInstanceVariables({
        instanceId,
      });

      expect(result).toBeDefined();
    });
  });

  describe('fetchInstance', () => {
    beforeEach(() => {
      jest.clearAllMocks();
    });

    it('should execute the operation', async () => {
      dataIndexServiceMock.fetchInstance = jest
        .fn()
        .mockResolvedValue(instance);

      const result = await orchestratorService.fetchInstance({
        instanceId,
      });

      expect(result).toBeDefined();
    });
  });

  describe('fetchWorkflowInfoOnService', () => {
    beforeEach(() => {
      jest.clearAllMocks();
    });

    it('should execute the operation', async () => {
      sonataFlowServiceMock.fetchWorkflowInfoOnService = jest
        .fn()
        .mockResolvedValue(workflowInfo);

      const result = await orchestratorService.fetchWorkflowInfoOnService({
        definitionId,
        serviceUrl,
      });

      expect(result).toBeDefined();
    });
  });

  describe('fetchWorkflowDefinition', () => {
    const definition: WorkflowDefinition = {
      id: 'test_workflowId',
      specVersion: '0.8',
      states: [{}],
    };

    beforeEach(() => {
      jest.clearAllMocks();
    });

    it('should execute the operation', async () => {
      sonataFlowServiceMock.fetchWorkflowDefinition = jest
        .fn()
        .mockResolvedValue(definition);

      const result = await orchestratorService.fetchWorkflowDefinition({
        definitionId,
      });

      expect(result).toBeDefined();
    });
  });

  describe('fetchWorkflowOverview', () => {
    beforeEach(() => {
      jest.clearAllMocks();
    });

    it('should execute the operation', async () => {
      workflowCacheServiceMock.isAvailable = jest.fn().mockReturnValue(true);
      sonataFlowServiceMock.fetchWorkflowOverview = jest
        .fn()
        .mockResolvedValue(workflowOverview);

      const result = await orchestratorService.fetchWorkflowOverview({
        definitionId,
      });

      expect(result).toBeDefined();
    });
  });

  describe('executeWorkflow', () => {
    const executeResponse: WorkflowExecutionResponse = {
      id: createInstanceIdMock(1),
    };

    beforeEach(() => {
      jest.clearAllMocks();
    });

    it('should execute the operation', async () => {
      sonataFlowServiceMock.executeWorkflow = jest
        .fn()
        .mockResolvedValue(executeResponse);

      const result = await orchestratorService.executeWorkflow({
        definitionId,
        serviceUrl,
        inputData,
      });

      expect(result).toBeDefined();
    });
  });
});
