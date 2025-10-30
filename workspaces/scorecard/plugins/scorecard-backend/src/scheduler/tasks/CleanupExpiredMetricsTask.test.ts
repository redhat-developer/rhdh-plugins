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
import { CleanupExpiredMetricsTask } from './CleanupExpiredMetricsTask';
import { mockDatabaseMetricValues } from '../../../__fixtures__/mockDatabaseMetricValues';
import { CLEANUP_EXPIRED_METRICS_ID } from '../constants';
import { daysToMilliseconds } from './utils';

jest.mock('uuid', () => ({
  v4: jest.fn(() => 'test-uuid-1234'),
}));

jest.mock('./utils', () => ({
  daysToMilliseconds: jest.fn((days: number) => days * 24 * 60 * 60 * 1000),
}));

describe('CleanupExpiredMetricsTask', () => {
  let mockScheduler: ReturnType<typeof mockServices.scheduler.mock>;
  let mockLogger: ReturnType<typeof mockServices.logger.mock>;
  let mockConfig: ReturnType<typeof mockServices.rootConfig.mock>;
  let mockDatabase: typeof mockDatabaseMetricValues;
  let mockTaskRunner: { run: jest.Mock };
  let task: CleanupExpiredMetricsTask;

  beforeEach(() => {
    jest.useFakeTimers();
    jest.setSystemTime(new Date('2024-01-15T12:00:00.000Z'));

    mockScheduler = mockServices.scheduler.mock();
    mockLogger = mockServices.logger.mock();
    mockConfig = mockServices.rootConfig.mock();
    mockDatabase = mockDatabaseMetricValues;

    mockTaskRunner = {
      run: jest.fn().mockResolvedValue(undefined),
    };

    mockScheduler.createScheduledTaskRunner.mockReturnValue(
      mockTaskRunner as any,
    );

    task = new CleanupExpiredMetricsTask({
      scheduler: mockScheduler,
      logger: mockLogger,
      database: mockDatabase,
      config: mockConfig,
    });
  });

  afterEach(() => {
    jest.clearAllMocks();
    jest.useRealTimers();
  });

  describe('constructor', () => {
    it('should create an instance with all dependencies', () => {
      expect(task).toBeInstanceOf(CleanupExpiredMetricsTask);
      expect((task as any).scheduler).toBe(mockScheduler);
      expect((task as any).logger).toBe(mockLogger);
      expect((task as any).database).toBe(mockDatabase);
      expect((task as any).config).toBe(mockConfig);
    });
  });

  describe('start', () => {
    beforeEach(async () => {
      (task as any).cleanupExpiredMetrics = jest
        .fn()
        .mockResolvedValue(undefined);
      await task.start();
    });

    it('should create a scheduled task runner with correct schedule', async () => {
      expect(mockScheduler.createScheduledTaskRunner).toHaveBeenCalledTimes(1);
      expect(mockScheduler.createScheduledTaskRunner).toHaveBeenCalledWith({
        frequency: { days: 1 },
        timeout: { minutes: 2 },
        initialDelay: { seconds: 3 },
      });
    });

    it('should run the task runner', async () => {
      expect(mockTaskRunner.run).toHaveBeenCalledTimes(1);
      expect(mockTaskRunner.run).toHaveBeenCalledWith({
        id: CLEANUP_EXPIRED_METRICS_ID,
        fn: expect.any(Function),
      });
    });
  });

  describe('cleanupExpiredMetrics', () => {
    const mockDaysToMilliseconds = daysToMilliseconds as jest.Mock;

    beforeEach(async () => {
      (task as any).getDataRetentionDays = jest.fn().mockReturnValue(2);
      mockDatabase.cleanupExpiredMetrics.mockResolvedValue(12);

      await (task as any).cleanupExpiredMetrics(mockLogger);
    });

    it('should get the data retention days', () => {
      expect((task as any).getDataRetentionDays).toHaveBeenCalled();
    });

    it('should convert days to milliseconds', () => {
      expect(mockDaysToMilliseconds).toHaveBeenCalledWith(2);
    });

    it('should cleanup expired metrics with correct date', () => {
      const expectedDate = new Date('2024-01-13T12:00:00.000Z');
      expect(mockDatabase.cleanupExpiredMetrics).toHaveBeenCalledWith(
        expectedDate,
      );
    });

    it('should log success message', () => {
      expect(mockLogger.info).toHaveBeenCalledWith(
        'Deleted 12 expired metrics older than 2 days',
      );
    });
  });

  describe('getDataRetentionDays', () => {
    it('should return the default data retention days if not configured', () => {
      mockConfig.getOptionalNumber.mockReturnValue(undefined);
      expect((task as any).getDataRetentionDays()).toBe(365);
    });

    it('should return the configured data retention days', () => {
      mockConfig.getOptionalNumber.mockReturnValue(2);
      expect((task as any).getDataRetentionDays()).toBe(2);
    });
  });
});
