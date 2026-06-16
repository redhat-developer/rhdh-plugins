/*
 * Copyright Red Hat, Inc.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import { LoggerService } from '@backstage/backend-plugin-api';

import {
  ProcessInstance,
  ProcessInstanceState,
  WorkflowInfo,
} from '@red-hat-developer-hub/backstage-plugin-orchestrator-common';

import { OrchestratorKafkaServiceOptions } from '../types/kafka';
import { DataIndexService } from './DataIndexService';
import { SonataFlowService } from './SonataFlowService';

jest.mock('node:crypto', () => ({
  ...jest.requireActual('node:crypto'),
  randomUUID: () => '12345',
}));

describe('SonataFlowService', () => {
  let loggerMock: jest.Mocked<LoggerService>;
  let dataIndexServiceMock: jest.Mocked<DataIndexService>;
  let sonataFlowService: SonataFlowService;
  const serviceUrl = 'http://example.com/workflows';
  const definitionId = 'workflow-123';

  const setupTest = (responseConfig: {
    ok: boolean;
    status?: number;
    statusText?: string;
    json: any;
  }): Partial<Response> => {
    const mockResponse: Partial<Response> = {
      ok: responseConfig.ok,
      status: responseConfig.status || (responseConfig.ok ? 200 : 500),
      statusText: responseConfig.statusText,
      json: jest.fn().mockResolvedValue(responseConfig.json),
    };
    global.fetch = jest.fn().mockResolvedValue(mockResponse as any);
    return mockResponse;
  };
  beforeAll(() => {
    loggerMock = {
      info: jest.fn(),
      debug: jest.fn(),
      error: jest.fn(),
      warn: jest.fn(),
      child: jest.fn(),
    } as any;
    dataIndexServiceMock = {} as any;
    sonataFlowService = new SonataFlowService(dataIndexServiceMock, loggerMock);
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  afterEach(() => {
    jest.resetAllMocks();
  });

  describe('fetchWorkflowInfoOnService', () => {
    const urlToFetch =
      'http://example.com/workflows/management/processes/workflow-123';
    beforeEach(() => {
      jest.clearAllMocks();
    });

    it('should return workflow info when the fetch response is ok', async () => {
      // Given
      const mockResponse: Partial<Response> = {
        ok: true,
        json: jest.fn().mockResolvedValue({ id: definitionId }),
      };
      global.fetch = jest.fn().mockResolvedValue(mockResponse as any);

      // When
      const result = await sonataFlowService.fetchWorkflowInfoOnService({
        definitionId,
        serviceUrl,
      });

      expect(fetch).toHaveBeenCalledWith(urlToFetch);
      expect(result).toEqual({ id: definitionId });
      expect(loggerMock.debug).toHaveBeenCalledWith(
        `Fetch workflow info result: {"id":"${definitionId}"}`,
      );
    });

    it('should propagate thrown error when the fetch response is not ok', async () => {
      // Given
      const mockResponse: Partial<Response> = {
        ok: false,
        status: 500,
        statusText: 'Internal Server Error',
        json: jest.fn().mockResolvedValue({
          message: 'Something went wrong',
          details: 'Error details',
          stack: 'Error stack trace',
        }),
      };
      global.fetch = jest.fn().mockResolvedValue(mockResponse as any);

      // When
      let result;
      try {
        await sonataFlowService.fetchWorkflowInfoOnService({
          definitionId,
          serviceUrl,
        });
      } catch (error: any) {
        result = error;
      }

      // Then
      expect(result).toBeDefined();
      expect(result.message).toContain(
        `HTTP GET request to http://example.com/workflows/management/processes/workflow-123 failed.`,
      );
      expect(result.message).toContain(`Status Code: 500`);
      expect(result.message).toContain(`Status Text: Internal Server Error`);
      expect(result.message).toContain(`Message: Something went wrong`);
      expect(result.message).toContain(`Details: Error details`);
      expect(result.message).toContain(`Stack Trace: Error stack trace`);
      expect(loggerMock.error).toHaveBeenCalledWith(
        'Error during operation \'Get workflow info\' on workflow workflow-123 with service URL http://example.com/workflows/management/processes/workflow-123: {"message":"Something went wrong","details":"Error details","stack":"Error stack trace"}',
      );
    });

    it('should throw informative error when fetch throws an error', async () => {
      // Given
      const errorMessage = 'Network Error';
      global.fetch = jest.fn().mockRejectedValue(new Error(errorMessage));

      // When
      let result;
      try {
        await sonataFlowService.fetchWorkflowInfoOnService({
          definitionId,
          serviceUrl,
        });
      } catch (error: any) {
        result = error;
      }

      // Then
      expect(result).toBeDefined();
      expect(result.message).toContain(
        `Error during operation 'Get workflow info' on workflow ${definitionId} with service URL ${urlToFetch} : fetch failed`,
      );
      expect(loggerMock.error).toHaveBeenCalledWith(
        expect.stringContaining('Network Error'),
      );
    });
  });

  describe('executeWorkflowAsCloudEvent', () => {
    const runErrorTestAsCloudEventNoKafkaImplementation =
      async (): Promise<void> => {
        await sonataFlowService.executeWorkflowAsCloudEvent({
          definitionId,
          workflowSource: 'workflowSource',
          workflowEventType: 'workflowEventType',
          contextAttribute: 'contextAttribute',
        });
      };
    beforeEach(() => {
      jest.clearAllMocks();
    });

    it('should return the an error when no orchestrator kafka config is implemented', async () => {
      let result;
      try {
        await runErrorTestAsCloudEventNoKafkaImplementation();
      } catch (error: any) {
        result = error;
      }

      expect(result).toBeDefined();
      expect(result.message).toEqual(
        'No Orchestrator kafka implementation added',
      );
    });
    it('should return the contextAttributeId on successful send', async () => {
      const kafkaServiceOptionsMock: OrchestratorKafkaServiceOptions = {
        clientId: 'kafkaClientId',
        brokers: ['localhost:9091'],
      };
      const sonataFlowServiceWithKafka = new SonataFlowService(
        dataIndexServiceMock,
        loggerMock,
        kafkaServiceOptionsMock,
      );
      const spy = jest
        .spyOn(
          sonataFlowServiceWithKafka.getOrchestratorKafkaImpl() as any,
          'producer',
        )
        .mockImplementation(() => {
          return {
            connect: jest.fn(),
            send: jest.fn(),
            disconnect: jest.fn(),
          };
        });
      const result =
        await sonataFlowServiceWithKafka.executeWorkflowAsCloudEvent({
          definitionId,
          workflowSource: 'workflowSource',
          workflowEventType: 'workflowEventType',
          contextAttribute: 'lockid',
        });
      expect(spy).toHaveBeenCalled();
      expect(result).toBeDefined();
      expect(result?.id).toBeDefined();
      expect(result?.id).toEqual('12345');
    });

    it('should pass data from workflowdata payload into the clouevent data', async () => {
      const kafkaServiceOptionsMock: OrchestratorKafkaServiceOptions = {
        clientId: 'kafkaClientId',
        brokers: ['localhost:9091'],
      };
      const sonataFlowServiceWithKafka = new SonataFlowService(
        dataIndexServiceMock,
        loggerMock,
        kafkaServiceOptionsMock,
      );

      const sendMock = jest.fn();

      jest
        .spyOn(
          sonataFlowServiceWithKafka.getOrchestratorKafkaImpl() as any,
          'producer',
        )
        .mockImplementation(() => ({
          connect: jest.fn(),
          send: sendMock,
          disconnect: jest.fn(),
        }));

      const result =
        await sonataFlowServiceWithKafka.executeWorkflowAsCloudEvent({
          definitionId,
          workflowSource: 'workflowSource',
          workflowEventType: 'workflowEventType',
          contextAttribute: 'lockid',
          inputData: {
            workflowdata: {
              paramter1: '12345',
              isEvent: true,
            },
          },
        });

      expect(sendMock).toHaveBeenCalled();

      const { messages } = sendMock.mock.calls[0][0];
      const parsed = JSON.parse(messages[0].value);

      expect(parsed.data).toEqual({
        paramter1: '12345',
        lockid: '12345',
      });

      expect(parsed.isEvent).toBeUndefined();

      expect(result).toBeDefined();
      expect(result?.id).toBe('12345');
    });

    it('should error on a bad connection', async () => {
      const kafkaServiceOptionsMock: OrchestratorKafkaServiceOptions = {
        clientId: 'kafkaClientId',
        brokers: ['localhost:9091'],
      };
      const sonataFlowServiceWithKafka = new SonataFlowService(
        dataIndexServiceMock,
        loggerMock,
        kafkaServiceOptionsMock,
      );
      jest
        .spyOn(
          sonataFlowServiceWithKafka.getOrchestratorKafkaImpl() as any,
          'producer',
        )
        .mockImplementation(() => {
          return {
            connect: jest
              .fn()
              .mockRejectedValue(new Error('Wrong Connection Info')),
            send: jest.fn(),
            disconnect: jest.fn(),
          };
        });
      let result;
      try {
        result = await sonataFlowServiceWithKafka.executeWorkflowAsCloudEvent({
          definitionId,
          workflowSource: 'workflowSource',
          workflowEventType: 'workflowEventType',
          contextAttribute: 'lockid',
        });
      } catch (error: any) {
        result = error;
      }

      expect(result).toBeDefined();
      expect(result.message).toEqual(
        'Error with Kafka client with connection Options: clientId: kafkaClientId and broker: ["localhost:9091"]',
      );
    });
  });

  describe('executeWorkflow', () => {
    const inputData = { var1: 'value1' };
    const urlToFetch = 'http://example.com/workflows/workflow-123';
    const expectedFetchRequestInit = (): RequestInit => {
      return {
        method: 'POST',
        body: JSON.stringify(inputData),
        headers: { 'Content-Type': 'application/json' },
      };
    };

    const runErrorTest = async (): Promise<void> => {
      try {
        await sonataFlowService.executeWorkflow({
          definitionId,
          serviceUrl,
          inputData,
        });
      } catch (error) {
        throw error;
      }
    };

    beforeEach(() => {
      jest.clearAllMocks();
    });
    it('should return workflow execution response when ok is false but id is defined', async () => {
      // Given
      const mockResponse = {
        ok: false,
        json: { id: definitionId, status: 'completed' },
      };
      setupTest(mockResponse);

      // When
      const result = await sonataFlowService.executeWorkflow({
        definitionId,
        serviceUrl,
        inputData: { var1: 'value1' },
      });

      // Then
      expect(fetch).toHaveBeenCalledWith(
        urlToFetch,
        expectedFetchRequestInit(),
      );
      expect(result).toEqual({ id: definitionId, status: 'completed' });
      expect(loggerMock.debug).toHaveBeenCalledWith(
        'Execute workflow successful. Response: {"id":"workflow-123","status":"completed"}',
      );
    });

    it('should propagate thrown exception when the fetch response is not ok with extra info', async () => {
      // When
      setupTest({
        ok: false,
        status: 400,
        statusText: 'Bad Request',
        json: {
          details: 'Error details test',
          stack: 'Error stacktrace test',
          moreStuff: 'More details',
        },
      });

      let result;
      try {
        await runErrorTest();
      } catch (error: any) {
        result = error;
      }

      expect(result).toBeDefined();
      expect(result.message).toContain(
        `HTTP POST request to ${urlToFetch} failed.`,
      );
      expect(result.message).toContain(`Status Code: 400`);
      expect(result.message).toContain(`Status Text: Bad Request`);
      expect(result.message).toContain(`Details: Error details test`);
      expect(result.message).toContain(`Stack Trace: Error stacktrace test`);
      expect(loggerMock.error).toHaveBeenCalledWith(
        'Error during operation \'Execute\' on workflow workflow-123 with service URL http://example.com/workflows/workflow-123: {"details":"Error details test","stack":"Error stacktrace test","moreStuff":"More details"}',
      );
    });
    it('should throw informative error when fetch throws an error', async () => {
      // Given
      const errorMessage = 'Network Error';
      global.fetch = jest.fn().mockRejectedValue(new Error(errorMessage));

      // When
      let result;
      try {
        await runErrorTest();
      } catch (error: any) {
        result = error;
      }

      expect(result).toBeDefined();
      expect(result.message).toContain(
        `Error during operation 'Execute' on workflow ${definitionId} with service URL ${urlToFetch} : fetch failed`,
      );
      expect(loggerMock.error).toHaveBeenCalledWith(
        expect.stringContaining('Network Error'),
      );
    });
  });

  describe('retriggerInstance', () => {
    const instanceId = 'instance-456';
    const urlToFetch = `http://example.com/workflows/management/processes/workflow-123/instances/${instanceId}/retrigger`;

    const runErrorTest = async (): Promise<void> => {
      try {
        await sonataFlowService.retriggerInstance({
          definitionId,
          instanceId,
          serviceUrl,
        });
      } catch (error) {
        throw error;
      }
    };

    it('should retrigger a workflow instance successfully', async () => {
      // Given
      setupTest({ ok: true, json: {} });

      // When
      const result = await sonataFlowService.retriggerInstance({
        definitionId,
        instanceId,
        serviceUrl,
      });

      // Then
      expect(fetch).toHaveBeenCalledWith(urlToFetch, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      expect(result).toBe(true);
    });

    it('should retrigger a workflow instance successfully with auth token', async () => {
      // Given
      setupTest({ ok: true, json: {} });

      // When
      const result = await sonataFlowService.retriggerInstance({
        definitionId,
        instanceId,
        serviceUrl,
        authTokens: [
          {
            provider: 'test-provider-one',
            token: 'provider-one-token',
          },
          {
            provider: 'test-provider-two',
            token: 'provider-two-token',
          },
        ],
        backstageToken: 'test-user-token',
      });

      // Then
      expect(fetch).toHaveBeenCalledWith(urlToFetch, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Authorization-Backstage': 'test-user-token',
          'X-Authorization-Test-provider-one': 'provider-one-token',
          'X-Authorization-Test-provider-two': 'provider-two-token',
        },
      });
      expect(result).toBe(true);
    });

    it('should handle errors when retriggering a workflow instance', async () => {
      // Given
      setupTest({
        ok: false,
        status: 400,
        statusText: 'Bad Request',
        json: { message: 'Invalid input' },
      });

      // When
      let result;
      try {
        await runErrorTest();
      } catch (error: any) {
        result = error;
      }

      // Then
      expect(result).toBeDefined();
      expect(result.message).toContain(
        `HTTP POST request to ${urlToFetch} failed.`,
      );
      expect(result.message).toContain(`Status Code: 400`);
      expect(result.message).toContain(`Status Text: Bad Request`);
      expect(result.message).toContain(`Message: Invalid input`);
      expect(loggerMock.error).toHaveBeenCalledWith(
        'Error during operation \'Retrigger\' on workflow workflow-123 with service URL http://example.com/workflows/management/processes/workflow-123/instances/instance-456/retrigger: {"message":"Invalid input"}',
      );
    });

    it('should throw informative error when fetch throws an error during retrigger', async () => {
      // Given
      const errorMessage = 'Network Error';
      global.fetch = jest.fn().mockRejectedValue(new Error(errorMessage));

      // When
      let result;
      try {
        await sonataFlowService.retriggerInstance({
          definitionId,
          instanceId,
          serviceUrl,
        });
      } catch (error: any) {
        result = error;
      }

      // Then
      expect(result).toBeDefined();
      expect(result.message).toContain(
        `Error during operation 'Retrigger' on workflow ${definitionId} with service URL ${urlToFetch} : fetch failed`,
      );
      expect(loggerMock.error).toHaveBeenCalledWith(
        expect.stringContaining('Network Error'),
      );
    });
  });

  describe('abortInstance', () => {
    const instanceId = 'instance-456';
    const urlToFetch = `http://example.com/workflows/management/processes/workflow-123/instances/${instanceId}`;
    const operation = 'Abort';
    const logErrorPrefix = `Error during operation '${operation}' on workflow ${definitionId} with service URL ${urlToFetch}`;

    const runErrorTest = async (): Promise<void> => {
      try {
        await sonataFlowService.abortInstance({
          definitionId,
          instanceId,
          serviceUrl,
        });
      } catch (error) {
        throw error;
      }
    };

    it('should abort a workflow instance successfully', async () => {
      // Given
      setupTest({ ok: true, status: 204, json: {} });

      // When
      await sonataFlowService.abortInstance({
        definitionId,
        instanceId,
        serviceUrl,
      });

      // Then
      expect(fetch).toHaveBeenCalledWith(urlToFetch, { method: 'DELETE' });
    });

    it('should handle errors when aborting a workflow instance', async () => {
      // Given
      setupTest({
        ok: false,
        status: 404,
        statusText: 'Not Found',
        json: { message: 'Instance not found' },
      });

      // When
      let result;
      try {
        await runErrorTest();
      } catch (error: any) {
        result = error;
      }

      // Then
      expect(result).toBeDefined();
      expect(result.message).toContain(
        `HTTP DELETE request to ${urlToFetch} failed.`,
      );
      expect(result.message).toContain(`Status Code: 404`);
      expect(result.message).toContain(`Status Text: Not Found`);
      expect(result.message).toContain(`Message: Instance not found`);
      expect(loggerMock.error).toHaveBeenCalledWith(
        `${logErrorPrefix}: {\"message\":\"Instance not found\"}`,
      );
    });

    it('should throw informative error when fetch throws an error during abort', async () => {
      // Given
      const errorMessage = 'Network Error';
      global.fetch = jest.fn().mockRejectedValue(new Error(errorMessage));

      // When
      let result;
      try {
        await sonataFlowService.abortInstance({
          definitionId,
          instanceId,
          serviceUrl,
        });
      } catch (error: any) {
        result = error;
      }

      // Then
      expect(result).toBeDefined();
      expect(result.message).toContain(
        `Error during operation '${operation}' on workflow ${definitionId} with service URL ${urlToFetch} : fetch failed`,
      );
      expect(loggerMock.error).toHaveBeenCalledWith(
        expect.stringContaining('Network Error'),
      );
    });
  });

  describe('fetchWorkflowOverviews', () => {
    const NOW = new Date('2024-06-01T12:00:00Z');
    const WITHIN_30_DAYS = '2024-05-15T12:00:00Z';
    const OUTSIDE_30_DAYS = '2024-04-01T12:00:00Z';

    const workflowASource = JSON.stringify({
      id: 'workflow-a',
      specVersion: '0.8',
      name: 'Workflow A',
      version: '1.0',
      start: 'startState',
      states: [{ name: 'startState', type: 'inject', end: true }],
    });

    const workflowBSource = JSON.stringify({
      id: 'workflow-b',
      specVersion: '0.8',
      name: 'Workflow B',
      version: '2.0',
      start: 'startState',
      states: [{ name: 'startState', type: 'inject', end: true }],
    });

    const createProcessInstance = (
      overrides: Partial<ProcessInstance> &
        Pick<ProcessInstance, 'id' | 'processId'>,
    ): ProcessInstance => ({
      endpoint: 'http://example.com',
      nodes: [],
      version: '1.0',
      state: ProcessInstanceState.Completed,
      ...overrides,
    });

    beforeEach(() => {
      jest.useFakeTimers();
      jest.setSystemTime(NOW);
      dataIndexServiceMock.fetchInstances = jest.fn();
    });

    afterEach(() => {
      jest.useRealTimers();
    });

    it('returns an empty array when no workflow infos are found', async () => {
      dataIndexServiceMock.fetchWorkflowInfos = jest.fn().mockResolvedValue([]);

      const result = await sonataFlowService.fetchWorkflowOverviews({});

      expect(result).toEqual([]);
      expect(dataIndexServiceMock.fetchInstances).not.toHaveBeenCalled();
    });

    it('attaches successRatio and runsLastMonth from grouped instance stats', async () => {
      const workflowInfos: WorkflowInfo[] = [
        { id: 'workflow-a', source: workflowASource },
      ];

      dataIndexServiceMock.fetchWorkflowInfos = jest
        .fn()
        .mockResolvedValue(workflowInfos);
      dataIndexServiceMock.fetchInstances = jest.fn().mockResolvedValue([
        createProcessInstance({
          id: 'instance-1',
          processId: 'workflow-a',
          version: '1.0',
          state: ProcessInstanceState.Completed,
          start: WITHIN_30_DAYS,
        }),
        createProcessInstance({
          id: 'instance-2',
          processId: 'workflow-a',
          version: '1.0',
          state: ProcessInstanceState.Completed,
          start: WITHIN_30_DAYS,
        }),
        createProcessInstance({
          id: 'instance-3',
          processId: 'workflow-a',
          version: '1.0',
          state: ProcessInstanceState.Error,
          start: WITHIN_30_DAYS,
        }),
        createProcessInstance({
          id: 'instance-4',
          processId: 'workflow-a',
          version: '1.0',
          state: ProcessInstanceState.Completed,
          start: OUTSIDE_30_DAYS,
        }),
      ]);
      dataIndexServiceMock.fetchInstancesByDefinitionId = jest
        .fn()
        .mockResolvedValue([]);

      const result = await sonataFlowService.fetchWorkflowOverviews({});

      expect(result).toHaveLength(1);
      expect(result?.[0]).toMatchObject({
        workflowId: 'workflow-a',
        version: '1.0',
        workflowRunStats: {
          successRatio: 0.75,
          runsLastMonth: 3,
          successCount: 3,
          errorCount: 1,
          totalCount: 4,
        },
      });
    });

    it('calculates stats independently per workflow id and version', async () => {
      const workflowInfos: WorkflowInfo[] = [
        { id: 'workflow-a', source: workflowASource },
        { id: 'workflow-b', source: workflowBSource },
      ];

      dataIndexServiceMock.fetchWorkflowInfos = jest
        .fn()
        .mockResolvedValue(workflowInfos);
      dataIndexServiceMock.fetchInstances = jest.fn().mockResolvedValue([
        createProcessInstance({
          id: 'a-1',
          processId: 'workflow-a',
          version: '1.0',
          state: ProcessInstanceState.Completed,
          start: WITHIN_30_DAYS,
        }),
        createProcessInstance({
          id: 'a-2',
          processId: 'workflow-a',
          version: '1.0',
          state: ProcessInstanceState.Error,
          start: WITHIN_30_DAYS,
        }),
        createProcessInstance({
          id: 'b-1',
          processId: 'workflow-b',
          version: '2.0',
          state: ProcessInstanceState.Completed,
          start: WITHIN_30_DAYS,
        }),
        createProcessInstance({
          id: 'b-2',
          processId: 'workflow-b',
          version: '2.0',
          state: ProcessInstanceState.Completed,
          start: WITHIN_30_DAYS,
        }),
      ]);
      dataIndexServiceMock.fetchInstancesByDefinitionId = jest
        .fn()
        .mockResolvedValue([]);

      const result = await sonataFlowService.fetchWorkflowOverviews({});

      expect(result).toHaveLength(2);
      expect(result?.find(o => o.workflowId === 'workflow-a')).toMatchObject({
        workflowRunStats: {
          successRatio: 0.5,
          runsLastMonth: 2,
          successCount: 1,
          errorCount: 1,
          totalCount: 2,
        },
      });
      expect(result?.find(o => o.workflowId === 'workflow-b')).toMatchObject({
        workflowRunStats: {
          successRatio: 1,
          runsLastMonth: 2,
          successCount: 2,
          errorCount: 0,
          totalCount: 2,
        },
      });
    });

    it('leaves stats undefined when no instances match the workflow', async () => {
      const workflowInfos: WorkflowInfo[] = [
        { id: 'workflow-a', source: workflowASource },
      ];

      dataIndexServiceMock.fetchWorkflowInfos = jest
        .fn()
        .mockResolvedValue(workflowInfos);
      dataIndexServiceMock.fetchInstances = jest.fn().mockResolvedValue([
        createProcessInstance({
          id: 'other-1',
          processId: 'other-workflow',
          version: '1.0',
          start: WITHIN_30_DAYS,
        }),
      ]);
      dataIndexServiceMock.fetchInstancesByDefinitionId = jest
        .fn()
        .mockResolvedValue([]);

      const result = await sonataFlowService.fetchWorkflowOverviews({});

      expect(result).toHaveLength(1);
      expect(result?.[0].workflowRunStats).toBeUndefined();
    });

    it('excludes workflow infos without source', async () => {
      const workflowInfos: WorkflowInfo[] = [
        { id: 'workflow-a', source: workflowASource },
        { id: 'workflow-without-source' },
      ];

      dataIndexServiceMock.fetchWorkflowInfos = jest
        .fn()
        .mockResolvedValue(workflowInfos);
      dataIndexServiceMock.fetchInstances = jest.fn().mockResolvedValue([]);
      dataIndexServiceMock.fetchInstancesByDefinitionId = jest
        .fn()
        .mockResolvedValue([]);

      const result = await sonataFlowService.fetchWorkflowOverviews({});

      expect(result).toHaveLength(1);
      expect(result?.[0].workflowId).toBe('workflow-a');
    });
  });

  describe('fetchWorkflowOverview', () => {
    const NOW = new Date('2024-06-01T12:00:00Z');
    const WITHIN_30_DAYS = '2024-05-15T12:00:00Z';
    const OUTSIDE_30_DAYS = '2024-04-01T12:00:00Z';
    const workflowDefinitionId = 'workflow-a';

    const workflowSource = JSON.stringify({
      id: workflowDefinitionId,
      specVersion: '0.8',
      name: 'Workflow A',
      version: '1.0',
      start: 'startState',
      states: [{ name: 'startState', type: 'inject', end: true }],
    });

    const createProcessInstance = (
      overrides: Partial<ProcessInstance> &
        Pick<ProcessInstance, 'id' | 'processId'>,
    ): ProcessInstance => ({
      endpoint: 'http://example.com',
      nodes: [],
      version: '1.0',
      state: ProcessInstanceState.Completed,
      ...overrides,
    });

    beforeEach(() => {
      jest.useFakeTimers();
      jest.setSystemTime(NOW);
      dataIndexServiceMock.fetchWorkflowSource = jest.fn();
      dataIndexServiceMock.fetchInstances = jest.fn();
      dataIndexServiceMock.fetchInstancesByDefinitionId = jest
        .fn()
        .mockResolvedValue([]);
    });

    afterEach(() => {
      jest.useRealTimers();
    });

    it('returns undefined when workflow source is not found', async () => {
      dataIndexServiceMock.fetchWorkflowSource = jest
        .fn()
        .mockResolvedValue(undefined);

      const result =
        await sonataFlowService.fetchWorkflowOverview(workflowDefinitionId);

      expect(result).toBeUndefined();
      expect(dataIndexServiceMock.fetchWorkflowSource).toHaveBeenCalledWith(
        workflowDefinitionId,
      );
      expect(dataIndexServiceMock.fetchInstances).not.toHaveBeenCalled();
      expect(loggerMock.debug).toHaveBeenCalledWith(
        `Workflow source not found: ${workflowDefinitionId}`,
      );
    });

    it('fetches instances for the definition id and attaches workflowRunStats', async () => {
      dataIndexServiceMock.fetchWorkflowSource = jest
        .fn()
        .mockResolvedValue(workflowSource);
      dataIndexServiceMock.fetchInstances = jest.fn().mockResolvedValue([
        createProcessInstance({
          id: 'instance-1',
          processId: workflowDefinitionId,
          version: '1.0',
          state: ProcessInstanceState.Completed,
          start: WITHIN_30_DAYS,
        }),
        createProcessInstance({
          id: 'instance-2',
          processId: workflowDefinitionId,
          version: '1.0',
          state: ProcessInstanceState.Completed,
          start: WITHIN_30_DAYS,
        }),
        createProcessInstance({
          id: 'instance-3',
          processId: workflowDefinitionId,
          version: '1.0',
          state: ProcessInstanceState.Error,
          start: WITHIN_30_DAYS,
        }),
        createProcessInstance({
          id: 'instance-4',
          processId: workflowDefinitionId,
          version: '1.0',
          state: ProcessInstanceState.Completed,
          start: OUTSIDE_30_DAYS,
        }),
      ]);

      const result =
        await sonataFlowService.fetchWorkflowOverview(workflowDefinitionId);

      expect(dataIndexServiceMock.fetchInstances).toHaveBeenCalledWith({
        definitionIds: [workflowDefinitionId],
      });
      expect(result).toMatchObject({
        workflowId: workflowDefinitionId,
        version: '1.0',
        workflowRunStats: {
          successRatio: 0.75,
          runsLastMonth: 3,
          successCount: 3,
          errorCount: 1,
          totalCount: 4,
        },
      });
    });

    it('leaves workflowRunStats undefined when no instances match the workflow', async () => {
      dataIndexServiceMock.fetchWorkflowSource = jest
        .fn()
        .mockResolvedValue(workflowSource);
      dataIndexServiceMock.fetchInstances = jest.fn().mockResolvedValue([
        createProcessInstance({
          id: 'other-1',
          processId: 'other-workflow',
          version: '1.0',
          start: WITHIN_30_DAYS,
        }),
      ]);

      const result =
        await sonataFlowService.fetchWorkflowOverview(workflowDefinitionId);

      expect(result?.workflowId).toBe(workflowDefinitionId);
      expect(result?.workflowRunStats).toBeUndefined();
    });
  });
});
