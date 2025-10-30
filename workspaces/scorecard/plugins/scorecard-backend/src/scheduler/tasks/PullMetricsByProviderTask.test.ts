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
import { PullMetricsByProviderTask } from './PullMetricsByProviderTask';
import { MetricProvider } from '@red-hat-developer-hub/backstage-plugin-scorecard-node';
import { catalogServiceMock } from '@backstage/plugin-catalog-node/testUtils';
import { MockNumberProvider } from '../../../__fixtures__/mockProviders';
import type { Config } from '@backstage/config';
import { CATALOG_FILTER_EXISTS } from '@backstage/catalog-client';
import { mockDatabaseMetricValues } from '../../../__fixtures__/mockDatabaseMetricValues';

const scheduleConfig = {
  frequency: { hours: 2 },
  timeout: { minutes: 20 },
  initialDelay: { seconds: 5 },
};

describe('PullMetricsByProviderTask', () => {
  let mockScheduler: ReturnType<typeof mockServices.scheduler.mock>;
  let mockLogger: ReturnType<typeof mockServices.logger.mock>;
  let mockDatabase: typeof mockDatabaseMetricValues;
  let mockConfig: Config;
  let mockCatalog: ReturnType<typeof catalogServiceMock.mock>;
  let mockAuth: ReturnType<typeof mockServices.auth.mock>;
  let mockProvider: MetricProvider;
  let mockTaskRunner: { run: jest.Mock };

  let task: PullMetricsByProviderTask;

  beforeEach(() => {
    jest.useFakeTimers();
    jest.setSystemTime(new Date('2024-01-15T12:00:00.000Z'));

    mockScheduler = mockServices.scheduler.mock();
    mockLogger = mockServices.logger.mock();
    mockConfig = mockServices.rootConfig({
      data: {
        scorecard: {
          schedule: scheduleConfig,
        },
      },
    });
    mockDatabase = mockDatabaseMetricValues;
    mockCatalog = catalogServiceMock.mock();
    mockAuth = mockServices.auth.mock();
    mockProvider = new MockNumberProvider('github.test_metric', 'github');

    mockTaskRunner = {
      run: jest.fn().mockResolvedValue(undefined),
    };

    mockScheduler.createScheduledTaskRunner.mockReturnValue(
      mockTaskRunner as any,
    );

    task = new PullMetricsByProviderTask(
      {
        scheduler: mockScheduler,
        logger: mockLogger,
        database: mockDatabase,
        config: mockConfig,
        catalog: mockCatalog,
        auth: mockAuth,
      },
      mockProvider,
    );
  });

  afterEach(() => {
    jest.clearAllMocks();
    jest.useRealTimers();
  });

  describe('constructor', () => {
    it('should create an instance with all dependencies', () => {
      expect(task).toBeInstanceOf(PullMetricsByProviderTask);
      expect((task as any).scheduler).toBe(mockScheduler);
      expect((task as any).logger).toBe(mockLogger);
      expect((task as any).database).toBe(mockDatabase);
      expect((task as any).config).toBe(mockConfig);
      expect((task as any).catalog).toBe(mockCatalog);
      expect((task as any).auth).toBe(mockAuth);
      expect((task as any).provider).toBe(mockProvider);
    });
  });

  describe('start', () => {
    beforeEach(async () => {
      (task as any).getScheduleFromConfig = jest
        .fn()
        .mockReturnValue({ frequency: { hours: 1 } });
      (task as any).pullProviderMetrics = jest
        .fn()
        .mockResolvedValue(undefined);
      await (task as any).start();
    });

    it('should get scheduled from config', () => {
      expect((task as any).getScheduleFromConfig).toHaveBeenCalledWith(
        'scorecard.plugins.github.test_metric.schedule',
      );
    });

    it('should create a scheduled task runner with correct schedule', () => {
      expect(mockScheduler.createScheduledTaskRunner).toHaveBeenCalledTimes(1);
      expect(mockScheduler.createScheduledTaskRunner).toHaveBeenCalledWith({
        frequency: { hours: 1 },
      });
    });

    it('should run the task runner', () => {
      expect(mockTaskRunner.run).toHaveBeenCalledTimes(1);
      expect(mockTaskRunner.run).toHaveBeenCalledWith({
        id: 'github.test_metric',
        fn: expect.any(Function),
      });
    });
  });

  describe('getScheduleFromConfig', () => {
    it('should return the default schedule if not configured', () => {
      const config = (task as any).getScheduleFromConfig(
        'scorecard.schedule.notExists',
      );
      expect(config).toEqual({
        frequency: { hours: 1 },
        timeout: { minutes: 15 },
        initialDelay: { seconds: 3 },
      });
    });

    it('should return the schedule from config if configured', () => {
      const config = (task as any).getScheduleFromConfig('scorecard.schedule');
      expect(config).toEqual(scheduleConfig);
    });
  });

  describe('pullProviderMetrics', () => {
    const mockEntities = [
      { apiVersion: '1.0.0', kind: 'Component', metadata: { name: 'test1' } },
    ];

    beforeEach(async () => {
      mockCatalog.queryEntities.mockResolvedValueOnce({
        items: mockEntities,
        pageInfo: {
          nextCursor: undefined, // No next page
        },
        totalItems: 2,
      });
    });

    it('should log start pulling metrics', async () => {
      await (task as any).pullProviderMetrics(mockProvider, mockLogger);
      expect(mockLogger.info).toHaveBeenNthCalledWith(
        1,
        `Pulling metrics for github.test_metric`,
      );
    });

    it('should query catalog entities', async () => {
      await (task as any).pullProviderMetrics(mockProvider, mockLogger);
      expect(mockCatalog.queryEntities).toHaveBeenCalledWith(
        {
          filter: { 'metadata.annotations.mock/key': CATALOG_FILTER_EXISTS },
          limit: 50,
        },
        { credentials: undefined },
      );
    });

    it('should get catalog filter', async () => {
      const getCatalogFilterSpy = jest.spyOn(mockProvider, 'getCatalogFilter');
      await (task as any).pullProviderMetrics(mockProvider, mockLogger);
      expect(getCatalogFilterSpy).toHaveBeenCalledWith();
    });

    it('should get own service credentials', async () => {
      const getOwnServiceCredentialsSpy = jest.spyOn(
        mockAuth,
        'getOwnServiceCredentials',
      );
      await (task as any).pullProviderMetrics(mockProvider, mockLogger);
      expect(getOwnServiceCredentialsSpy).toHaveBeenCalledWith();
    });

    it('should calculate metric', async () => {
      const calculateMetricSpy = jest.spyOn(mockProvider, 'calculateMetric');
      await (task as any).pullProviderMetrics(mockProvider, mockLogger);
      expect(calculateMetricSpy).toHaveBeenNthCalledWith(1, mockEntities[0]);
    });

    it('should create metric values', async () => {
      const metricValues = [
        {
          catalog_entity_ref: 'component:default/test1',
          error_message: undefined,
          metric_id: 'github.test_metric',
          timestamp: new Date('2024-01-15T12:00:00.000Z'),
          value: 42,
        },
      ];

      const createMetricValuesSpy = jest.spyOn(
        mockDatabase,
        'createMetricValues',
      );
      await (task as any).pullProviderMetrics(mockProvider, mockLogger);
      expect(createMetricValuesSpy).toHaveBeenCalledWith(metricValues);
    });

    it('should log completion', async () => {
      await (task as any).pullProviderMetrics(mockProvider, mockLogger);
      expect(mockLogger.info).toHaveBeenNthCalledWith(
        2,
        `Completed metric pull for github.test_metric: processed 1 entities`,
      );
    });

    it('should throw error if pullProviderMetrics fails', async () => {
      (task as any).pullProviderMetrics = jest
        .fn()
        .mockRejectedValue(new Error('test error'));
      await expect(
        (task as any).pullProviderMetrics(mockProvider, mockLogger),
      ).rejects.toThrow('test error');
      await expect(
        (task as any).pullProviderMetrics(mockProvider, mockLogger),
      ).rejects.toThrow('test error');
    });
  });
});
