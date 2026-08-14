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
  LoggerService,
  SchedulerService,
  SchedulerServiceTaskRunner,
} from '@backstage/backend-plugin-api';
import { mockServices } from '@backstage/backend-test-utils';
import type { Config } from '@backstage/config';
import { DORA_CLEANUP_EXPIRED_DATA_TASK_ID } from '../constants';
import { parseDoraDataRetentionDays } from '../metricProviders/DoraConfig';
import {
  mockDoraDeploymentsStore,
  mockDoraIncidentsStore,
  mockDoraPullRequestsStore,
} from '../metricProviders/__fixtures__';
import { CleanupExpiredDataTask } from './CleanupExpiredDataTask';

jest.mock('../metricProviders/DoraConfig', () => ({
  parseDoraDataRetentionDays: jest.fn(),
}));

describe('CleanupExpiredDataTask', () => {
  let mockScheduler: jest.Mocked<SchedulerService>;
  let mockLogger: jest.Mocked<LoggerService>;
  let mockConfig: Config;
  let mockTaskRunner: jest.Mocked<Pick<SchedulerServiceTaskRunner, 'run'>>;
  let task: CleanupExpiredDataTask;

  beforeEach(() => {
    jest.useFakeTimers();
    jest.setSystemTime(new Date('2024-01-15T12:00:00.000Z'));
    jest.clearAllMocks();

    mockScheduler = mockServices.scheduler.mock();
    mockLogger = mockServices.logger.mock();
    mockConfig = mockServices.rootConfig.mock();
    mockDoraDeploymentsStore.deleteOlderThan.mockResolvedValue(0);
    mockDoraIncidentsStore.deleteOlderThan.mockResolvedValue(0);
    mockDoraPullRequestsStore.deleteOlderThan.mockResolvedValue(0);

    mockTaskRunner = {
      run: jest.fn().mockResolvedValue(undefined),
    };

    mockScheduler.createScheduledTaskRunner.mockReturnValue(
      mockTaskRunner as SchedulerServiceTaskRunner,
    );

    task = new CleanupExpiredDataTask({
      scheduler: mockScheduler,
      logger: mockLogger,
      config: mockConfig,
      deployments: mockDoraDeploymentsStore,
      incidents: mockDoraIncidentsStore,
      pullRequests: mockDoraPullRequestsStore,
    });
  });

  afterEach(() => {
    jest.clearAllMocks();
    jest.useRealTimers();
  });

  describe('start', () => {
    beforeEach(async () => {
      (task as any).cleanupExpiredData = jest.fn().mockResolvedValue(undefined);
      await task.start();
    });

    it('creates a scheduled task runner with the daily schedule', () => {
      expect(mockScheduler.createScheduledTaskRunner).toHaveBeenCalledWith({
        frequency: { days: 1 },
        timeout: { minutes: 2 },
        initialDelay: { seconds: 3 },
      });
    });

    it('runs the task with the scorecard-dora cleanup id', () => {
      expect(mockTaskRunner.run).toHaveBeenCalledWith({
        id: DORA_CLEANUP_EXPIRED_DATA_TASK_ID,
        fn: expect.any(Function),
      });
    });
  });

  describe('cleanupExpiredData', () => {
    const mockParseDoraDataRetentionDays =
      parseDoraDataRetentionDays as jest.Mock;

    beforeEach(async () => {
      mockParseDoraDataRetentionDays.mockReturnValue(2);
      mockDoraDeploymentsStore.deleteOlderThan.mockResolvedValue(3);
      mockDoraIncidentsStore.deleteOlderThan.mockResolvedValue(4);
      mockDoraPullRequestsStore.deleteOlderThan.mockResolvedValue(5);

      await (task as any).cleanupExpiredData(mockLogger);
    });

    it('reads retention days from DoraConfig', () => {
      expect(mockParseDoraDataRetentionDays).toHaveBeenCalledWith(mockConfig);
    });

    it('deletes data older than the retention cutoff', () => {
      // today is 2024-01-15T12:00:00.000Z, cutoff is 2 days
      const expectedDate = new Date('2024-01-13T12:00:00.000Z');
      expect(mockDoraPullRequestsStore.deleteOlderThan).toHaveBeenCalledWith(
        expectedDate,
      );
      expect(mockDoraDeploymentsStore.deleteOlderThan).toHaveBeenCalledWith(
        expectedDate,
      );
      expect(mockDoraIncidentsStore.deleteOlderThan).toHaveBeenCalledWith(
        expectedDate,
      );
    });

    it('logs deleted counts', () => {
      expect(mockLogger.info).toHaveBeenCalledWith(
        'Deleted 3 deployments, 4 incidents, 5 pull requests older than 2 days',
      );
    });
  });
});
