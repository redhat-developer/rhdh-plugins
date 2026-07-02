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

import type {
  LoggerService,
  SchedulerService,
} from '@backstage/backend-plugin-api';

import type { DataIndexService } from './DataIndexService';
import type { SonataFlowService } from './SonataFlowService';
import { WorkflowCacheService } from './WorkflowCacheService';

const flushPromises = () => new Promise(resolve => process.nextTick(resolve));

describe('WorkflowCacheService', () => {
  let mockLogger: jest.Mocked<LoggerService>;
  let mockDataIndexService: jest.Mocked<DataIndexService>;
  let mockSonataFlowService: jest.Mocked<SonataFlowService>;
  let service: WorkflowCacheService;

  beforeEach(() => {
    mockLogger = {
      info: jest.fn(),
      warn: jest.fn(),
      error: jest.fn(),
      debug: jest.fn(),
      child: jest.fn(),
    } as unknown as jest.Mocked<LoggerService>;

    mockDataIndexService = {
      fetchWorkflowServiceUrls: jest.fn(),
    } as unknown as jest.Mocked<DataIndexService>;

    mockSonataFlowService = {
      pingWorkflowService: jest.fn(),
    } as unknown as jest.Mocked<SonataFlowService>;

    service = new WorkflowCacheService(
      mockLogger,
      mockDataIndexService,
      mockSonataFlowService,
    );
  });

  describe('definitionIds getter', () => {
    it('should return empty array initially', () => {
      expect(service.definitionIds).toEqual([]);
    });

    it('should return cached definition IDs as array', async () => {
      mockDataIndexService.fetchWorkflowServiceUrls.mockResolvedValue({
        'workflow-1': 'http://service1',
        'workflow-2': 'http://service2',
      });
      mockSonataFlowService.pingWorkflowService.mockResolvedValue({
        isAvailable: true,
      });

      const mockScheduler = {
        scheduleTask: jest.fn(({ fn }) => {
          fn();
        }),
      } as unknown as jest.Mocked<SchedulerService>;

      service.schedule({ scheduler: mockScheduler });
      await flushPromises();

      const ids = service.definitionIds;
      expect(ids).toContain('workflow-1');
      expect(ids).toContain('workflow-2');
      expect(ids).toHaveLength(2);
    });
  });

  describe('unavailableDefinitionIds getter', () => {
    it('should return empty array initially', () => {
      expect(service.unavailableDefinitionIds).toEqual([]);
    });

    it('should return unavailable workflow IDs as array', async () => {
      mockDataIndexService.fetchWorkflowServiceUrls.mockResolvedValue({
        'workflow-1': 'http://service1',
        'workflow-2': 'http://service2',
      });
      mockSonataFlowService.pingWorkflowService
        .mockResolvedValueOnce({ isAvailable: true })
        .mockResolvedValueOnce({ isAvailable: false });

      const mockScheduler = {
        scheduleTask: jest.fn(({ fn }) => {
          fn();
        }),
      } as unknown as jest.Mocked<SchedulerService>;

      service.schedule({ scheduler: mockScheduler });
      await flushPromises();

      const unavailableIds = service.unavailableDefinitionIds;
      expect(unavailableIds).toContain('workflow-2');
      expect(unavailableIds).toHaveLength(1);
    });
  });

  describe('isAvailable', () => {
    it('should return false when definitionId is undefined', () => {
      expect(service.isAvailable(undefined)).toBe(false);
    });

    it('should return false when definitionId is not in cache', () => {
      expect(service.isAvailable('non-existent-workflow')).toBe(false);
    });

    it('should return true when definitionId is in cache', async () => {
      mockDataIndexService.fetchWorkflowServiceUrls.mockResolvedValue({
        'workflow-1': 'http://service1',
      });
      mockSonataFlowService.pingWorkflowService.mockResolvedValue({
        isAvailable: true,
      });

      const mockScheduler = {
        scheduleTask: jest.fn(({ fn }) => {
          fn();
        }),
      } as unknown as jest.Mocked<SchedulerService>;

      service.schedule({ scheduler: mockScheduler });
      await flushPromises();

      expect(service.isAvailable('workflow-1')).toBe(true);
    });

    it('should throw error when cache handler is "throw" and workflow not available', async () => {
      mockDataIndexService.fetchWorkflowServiceUrls.mockResolvedValue({});
      mockSonataFlowService.pingWorkflowService.mockResolvedValue({
        isAvailable: true,
      });

      const mockScheduler = {
        scheduleTask: jest.fn(({ fn }) => {
          fn();
        }),
      } as unknown as jest.Mocked<SchedulerService>;

      service.schedule({ scheduler: mockScheduler });
      await flushPromises();

      expect(() => service.isAvailable('missing-workflow', 'throw')).toThrow(
        'Workflow service "missing-workflow" not available at the moment',
      );
    });

    it('should not throw when cache handler is "skip" and workflow not available', () => {
      expect(() =>
        service.isAvailable('missing-workflow', 'skip'),
      ).not.toThrow();
      expect(service.isAvailable('missing-workflow', 'skip')).toBe(false);
    });
  });

  describe('schedule', () => {
    it('should schedule task with default frequency and timeout', () => {
      const mockScheduler = {
        scheduleTask: jest.fn(),
      } as unknown as jest.Mocked<SchedulerService>;

      service.schedule({ scheduler: mockScheduler });

      expect(mockScheduler.scheduleTask).toHaveBeenCalledWith(
        expect.objectContaining({
          id: 'task__Orchestrator__WorkflowCacheService',
          frequency: { seconds: 5 },
          timeout: { minutes: 10 },
          fn: expect.any(Function),
        }),
      );
    });

    it('should schedule task with custom frequency and timeout', () => {
      const mockScheduler = {
        scheduleTask: jest.fn(),
      } as unknown as jest.Mocked<SchedulerService>;

      service.schedule({
        scheduler: mockScheduler,
        frequencyInSeconds: 30,
        timeoutInMinutes: 5,
      });

      expect(mockScheduler.scheduleTask).toHaveBeenCalledWith(
        expect.objectContaining({
          frequency: { seconds: 30 },
          timeout: { minutes: 5 },
        }),
      );
    });

    it('should handle task execution and update cache', async () => {
      mockDataIndexService.fetchWorkflowServiceUrls.mockResolvedValue({
        'workflow-1': 'http://service1',
      });
      mockSonataFlowService.pingWorkflowService.mockResolvedValue({
        isAvailable: true,
      });

      const mockScheduler = {
        scheduleTask: jest.fn(({ fn }) => {
          fn();
        }),
      } as unknown as jest.Mocked<SchedulerService>;

      service.schedule({ scheduler: mockScheduler });
      await flushPromises();

      expect(mockDataIndexService.fetchWorkflowServiceUrls).toHaveBeenCalled();
      expect(mockSonataFlowService.pingWorkflowService).toHaveBeenCalledWith({
        definitionId: 'workflow-1',
        serviceUrl: 'http://service1',
      });
      expect(service.definitionIds).toContain('workflow-1');
    });

    it('should remove workflows no longer in data index', async () => {
      mockDataIndexService.fetchWorkflowServiceUrls
        .mockResolvedValueOnce({
          'workflow-1': 'http://service1',
          'workflow-2': 'http://service2',
        })
        .mockResolvedValueOnce({
          'workflow-1': 'http://service1',
        });
      mockSonataFlowService.pingWorkflowService.mockResolvedValue({
        isAvailable: true,
      });

      let taskFn: () => Promise<void>;
      const mockScheduler = {
        scheduleTask: jest.fn(({ fn }) => {
          taskFn = fn;
        }),
      } as unknown as jest.Mocked<SchedulerService>;

      service.schedule({ scheduler: mockScheduler });
      await taskFn!();
      await flushPromises();
      await taskFn!();
      await flushPromises();

      expect(service.definitionIds).toContain('workflow-1');
      expect(service.definitionIds).not.toContain('workflow-2');
    });

    it('should move workflow to unavailable cache when ping fails', async () => {
      mockDataIndexService.fetchWorkflowServiceUrls.mockResolvedValue({
        'workflow-1': 'http://service1',
      });
      mockSonataFlowService.pingWorkflowService.mockResolvedValue({
        isAvailable: false,
      });

      const mockScheduler = {
        scheduleTask: jest.fn(({ fn }) => {
          fn();
        }),
      } as unknown as jest.Mocked<SchedulerService>;

      service.schedule({ scheduler: mockScheduler });
      await flushPromises();

      expect(service.unavailableDefinitionIds).toContain('workflow-1');
      expect(service.definitionIds).not.toContain('workflow-1');
    });

    it('should handle ping service throwing error', async () => {
      mockDataIndexService.fetchWorkflowServiceUrls.mockResolvedValue({
        'workflow-1': 'http://service1',
      });
      mockSonataFlowService.pingWorkflowService.mockRejectedValue(
        new Error('Network error'),
      );

      const mockScheduler = {
        scheduleTask: jest.fn(({ fn }) => {
          fn();
        }),
      } as unknown as jest.Mocked<SchedulerService>;

      service.schedule({ scheduler: mockScheduler });
      await flushPromises();

      expect(mockLogger.error).toHaveBeenCalledWith(
        expect.stringContaining('Ping workflow workflow-1 service threw error'),
      );
      expect(service.unavailableDefinitionIds).toContain('workflow-1');
    });

    it('should handle fetchWorkflowServiceUrls throwing error', async () => {
      mockDataIndexService.fetchWorkflowServiceUrls.mockRejectedValue(
        new Error('Data index error'),
      );

      const mockScheduler = {
        scheduleTask: jest.fn(({ fn }) => {
          fn();
        }),
      } as unknown as jest.Mocked<SchedulerService>;

      service.schedule({ scheduler: mockScheduler });
      await flushPromises();

      expect(mockLogger.error).toHaveBeenCalledWith(
        expect.stringContaining(
          'Error running task__Orchestrator__WorkflowCacheService',
        ),
      );
    });
  });
});
