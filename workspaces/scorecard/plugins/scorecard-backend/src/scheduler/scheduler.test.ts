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

import { mockServices } from '@backstage/backend-test-utils';
import { catalogServiceMock } from '@backstage/plugin-catalog-node/testUtils';
import { Scheduler } from './index';
import { MetricProvidersRegistry } from '../providers/MetricProvidersRegistry';
import { DatabaseMetricValues } from '../database/DatabaseMetricValues';
import { CleanupExpiredMetricsTask } from './tasks/CleanupExpiredMetricsTask';
import { PullMetricsByProviderTask } from './tasks/PullMetricsByProviderTask';
import {
  MockNumberProvider,
  MockBooleanProvider,
} from '../../__fixtures__/mockProviders';
import { mockDatabaseMetricValues } from '../../__fixtures__/mockDatabaseMetricValues';
import { mockMetricProvidersRegistry } from '../../__fixtures__/mockMetricProvidersRegistry';

jest.mock('./tasks/CleanupExpiredMetricsTask');
jest.mock('./tasks/PullMetricsByProviderTask');

const numberProvider = new MockNumberProvider('github.test_metric', 'github');
const booleanProvider = new MockBooleanProvider('jira.test_metric', 'jira');

describe('Scheduler', () => {
  let mockCleanupTask: jest.Mocked<CleanupExpiredMetricsTask>;
  let mockPullTask: jest.Mocked<PullMetricsByProviderTask>;

  let mockAuth: ReturnType<typeof mockServices.auth.mock>;
  let mockCatalog: ReturnType<typeof catalogServiceMock.mock>;
  let mockConfig: ReturnType<typeof mockServices.rootConfig.mock>;
  let mockLogger: ReturnType<typeof mockServices.logger.mock>;
  let mockScheduler: ReturnType<typeof mockServices.scheduler.mock>;
  let mockDatabase: jest.Mocked<DatabaseMetricValues>;
  let mockRegistry: jest.Mocked<MetricProvidersRegistry>;

  let scheduler: Scheduler;

  beforeEach(() => {
    jest.clearAllMocks();

    mockAuth = mockServices.auth.mock();
    mockCatalog = catalogServiceMock.mock();
    mockConfig = mockServices.rootConfig.mock();
    mockLogger = mockServices.logger.mock();
    mockScheduler = mockServices.scheduler.mock();

    mockDatabase = mockDatabaseMetricValues;
    mockRegistry = mockMetricProvidersRegistry;
    mockRegistry.listProviders.mockReturnValue([
      numberProvider,
      booleanProvider,
    ]);

    scheduler = Scheduler.create({
      auth: mockAuth,
      catalog: mockCatalog,
      config: mockConfig,
      logger: mockLogger,
      scheduler: mockScheduler,
      database: mockDatabase,
      metricProvidersRegistry: mockRegistry,
    });

    mockCleanupTask = {
      start: jest.fn().mockResolvedValue(undefined),
    } as any;

    mockPullTask = {
      start: jest.fn().mockResolvedValue(undefined),
    } as any;

    (CleanupExpiredMetricsTask as unknown as jest.Mock).mockImplementation(
      () => mockCleanupTask,
    );
    (PullMetricsByProviderTask as unknown as jest.Mock).mockImplementation(
      () => mockPullTask,
    );
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('constructor', () => {
    it('should add "auth" service to scheduler', () => {
      expect((scheduler as any).auth).toBe(mockAuth);
    });

    it('should add "catalog" service to scheduler', () => {
      expect((scheduler as any).catalog).toBe(mockCatalog);
    });

    it('should add "config" to scheduler', () => {
      expect((scheduler as any).config).toBe(mockConfig);
    });

    it('should add "logger" to scheduler', () => {
      expect((scheduler as any).logger).toBe(mockLogger);
    });

    it('should add "scheduler" service to scheduler', () => {
      expect((scheduler as any).scheduler).toBe(mockScheduler);
    });

    it('should add "database" to scheduler', () => {
      expect((scheduler as any).database).toBe(mockDatabase);
    });

    it('should add "metricProvidersRegistry" to scheduler', () => {
      expect((scheduler as any).metricProvidersRegistry).toBe(mockRegistry);
    });
  });

  describe('create', () => {
    it('should create a new Scheduler instance', () => {
      expect(scheduler).toBeInstanceOf(Scheduler);
    });
  });

  describe('start', () => {
    it('should only start tasks that are independent of providers when providers are not registered', async () => {
      mockRegistry.listProviders.mockReturnValue([]);

      await scheduler.start();

      expect(CleanupExpiredMetricsTask).toHaveBeenCalledTimes(1);
      expect(PullMetricsByProviderTask).toHaveBeenCalledTimes(0);

      expect(mockCleanupTask.start).toHaveBeenCalledTimes(1);

      expect(mockLogger.warn).toHaveBeenCalledTimes(0);
      expect(mockLogger.info).toHaveBeenCalledWith('Scheduled: 1/1 tasks');
    });

    it('should start all tasks when providers are registered', async () => {
      await scheduler.start();

      expect(CleanupExpiredMetricsTask).toHaveBeenCalledTimes(1);

      expect(PullMetricsByProviderTask).toHaveBeenCalledTimes(2);

      expect(mockCleanupTask.start).toHaveBeenCalledTimes(1);
      expect(mockPullTask.start).toHaveBeenCalledTimes(2);

      expect(mockLogger.info).toHaveBeenCalledWith('Scheduled: 3/3 tasks');
    });

    it('should handle task start failures gracefully', async () => {
      const taskError = new Error('Task failed to start');
      mockCleanupTask.start.mockRejectedValue(taskError);

      await scheduler.start();

      expect(mockCleanupTask.start).toHaveBeenCalledTimes(1);
      expect(mockPullTask.start).toHaveBeenCalledTimes(2);

      expect(mockLogger.warn).toHaveBeenCalledWith(
        "Failed to start task 'cleanup-expired-metrics': Error: Task failed to start",
      );

      expect(mockLogger.info).toHaveBeenCalledWith('Scheduled: 2/3 tasks');
    });
  });

  describe('initializeTasks', () => {
    it('should properly initialize CleanupExpiredMetricsTask with correct parameters', async () => {
      (scheduler as any).initializeTasks();
      const initializedTasks = (scheduler as any).tasks;

      expect(initializedTasks).toEqual([
        {
          name: 'cleanup-expired-metrics',
          task: mockCleanupTask,
        },
      ]);
    });
  });

  describe('initializeTasksByProviders', () => {
    it('should initialize tasks by provided providers', async () => {
      (scheduler as any).initializeTasksByProviders();

      const initializedTasks = (scheduler as any).tasks;

      expect(initializedTasks).toEqual([
        {
          name: 'github.test_metric',
          task: mockPullTask,
        },
        {
          name: 'jira.test_metric',
          task: mockPullTask,
        },
      ]);
    });

    it('should not initialize tasks when providers are not registered', async () => {
      mockRegistry.listProviders.mockReturnValue([]);

      (scheduler as any).initializeTasksByProviders();

      const initializedTasks = (scheduler as any).tasks;

      expect(initializedTasks).toEqual([]);
    });
  });

  describe('startTask', () => {
    it('should start a task', async () => {
      await (scheduler as any).startTask(
        'cleanup-expired-metrics',
        mockCleanupTask,
      );
      expect(mockCleanupTask.start).toHaveBeenCalledTimes(1);
    });

    it('should handle task start failures gracefully', async () => {
      const taskError = new Error('Task failed to start');
      (mockCleanupTask as any).start.mockRejectedValue(taskError);

      await expect(
        (scheduler as any).startTask(
          'cleanup-expired-metrics',
          mockCleanupTask,
        ),
      ).rejects.toThrow('Task failed to start');

      expect(mockLogger.error).toHaveBeenCalledWith(
        "Failed to start task 'cleanup-expired-metrics': Error: Task failed to start",
        taskError,
      );
    });
  });
});
