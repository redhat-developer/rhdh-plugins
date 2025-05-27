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

import { DataIndexService } from './DataIndexService';
import { SonataFlowService } from './SonataFlowService';

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

    it('should propagate thrown error when fetch throws an error', async () => {
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
      expect(result.message).toEqual(`Network Error`);
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

    it('should propagate fetch thrown error', async () => {
      // When
      setupTest({
        ok: false,
        status: 500,
        statusText: 'Internal Server Error',
        json: {},
      });

      const errorMessage = 'Network Error';
      global.fetch = jest.fn().mockRejectedValue(new Error(errorMessage));
      let result;
      try {
        await runErrorTest();
      } catch (error: any) {
        result = error;
      }

      expect(result).toBeDefined();
      expect(result.message).toEqual('Network Error');
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
    it('should propagate thrown error when fetch throws an error', async () => {
      // Given
      const errorMessage = 'Network Error';
      global.fetch = jest.fn().mockRejectedValue(new Error(errorMessage));

      // When
      let result;
      try {
        await sonataFlowService.executeWorkflow({
          definitionId,
          serviceUrl,
          inputData: inputData,
        });
      } catch (error: any) {
        result = error;
      }

      expect(result).toBeDefined();
      expect(result.message).toEqual('Network Error');
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
      expect(fetch).toHaveBeenCalledWith(urlToFetch, { method: 'POST' });
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

    it('should propagate thrown error when fetch throws an error during retrigger', async () => {
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
      expect(result.message).toContain(`Network Error`);
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

    it('should propagate thrown error when fetch throws an error during abort', async () => {
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
      expect(result.message).toContain(`Network Error`);
    });
  });
});
