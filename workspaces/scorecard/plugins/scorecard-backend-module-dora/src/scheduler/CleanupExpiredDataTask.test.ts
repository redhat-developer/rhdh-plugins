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
import { DORA_CLEANUP_EXPIRED_DATA_TASK_ID } from '../constants';
import {
  mockDoraDeploymentsStore,
  mockDoraIncidentsStore,
  mockDoraLastSyncStore,
  mockDoraPullRequestsStore,
} from '../metricProviders/__fixtures__';
import { CleanupExpiredDataTask } from './CleanupExpiredDataTask';

describe('CleanupExpiredDataTask', () => {
  let mockScheduler: jest.Mocked<SchedulerService>;
  let mockLogger: jest.Mocked<LoggerService>;
  let mockTaskRunner: jest.Mocked<Pick<SchedulerServiceTaskRunner, 'run'>>;
  let task: CleanupExpiredDataTask;

  beforeEach(() => {
    jest.useFakeTimers();
    jest.setSystemTime(new Date('2024-01-15T12:00:00.000Z'));
    jest.clearAllMocks();

    mockScheduler = mockServices.scheduler.mock();
    mockLogger = mockServices.logger.mock();
    mockDoraDeploymentsStore.deleteOlderThan.mockResolvedValue(0);
    mockDoraIncidentsStore.deleteOlderThan.mockResolvedValue(0);
    mockDoraLastSyncStore.deleteOlderThan.mockResolvedValue(0);
    mockDoraPullRequestsStore.deleteForDeploymentsOlderThan.mockResolvedValue(
      0,
    );

    mockTaskRunner = {
      run: jest.fn().mockResolvedValue(undefined),
    };

    mockScheduler.createScheduledTaskRunner.mockReturnValue(
      mockTaskRunner as SchedulerServiceTaskRunner,
    );

    task = new CleanupExpiredDataTask({
      scheduler: mockScheduler,
      logger: mockLogger,
      dataRetentionDays: 30,
      deployments: mockDoraDeploymentsStore,
      incidents: mockDoraIncidentsStore,
      pullRequests: mockDoraPullRequestsStore,
      lastSync: mockDoraLastSyncStore,
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
    beforeEach(async () => {
      mockDoraPullRequestsStore.deleteForDeploymentsOlderThan.mockResolvedValue(
        5,
      );
      mockDoraDeploymentsStore.deleteOlderThan.mockResolvedValue(3);
      mockDoraIncidentsStore.deleteOlderThan.mockResolvedValue(4);
      mockDoraLastSyncStore.deleteOlderThan.mockResolvedValue(2);

      await (task as any).cleanupExpiredData(mockLogger);
    });

    it('deletes data older than the retention cutoff', () => {
      // today is 2024-01-15T12:00:00.000Z, cutoff is 30 days
      const expectedDate = new Date('2023-12-16T12:00:00.000Z');
      expect(
        mockDoraPullRequestsStore.deleteForDeploymentsOlderThan,
      ).toHaveBeenCalledWith(expectedDate);
      expect(mockDoraDeploymentsStore.deleteOlderThan).toHaveBeenCalledWith(
        expectedDate,
      );
      expect(mockDoraIncidentsStore.deleteOlderThan).toHaveBeenCalledWith(
        expectedDate,
      );
      expect(mockDoraLastSyncStore.deleteOlderThan).toHaveBeenCalledWith(
        expectedDate,
      );
    });

    it('deletes pull requests before deployments', () => {
      const pullRequestOrder =
        mockDoraPullRequestsStore.deleteForDeploymentsOlderThan.mock
          .invocationCallOrder[0];
      const deploymentOrder =
        mockDoraDeploymentsStore.deleteOlderThan.mock.invocationCallOrder[0];

      expect(pullRequestOrder).toBeLessThan(deploymentOrder);
    });

    it('logs deleted counts', () => {
      expect(mockLogger.info).toHaveBeenCalledWith(
        'Deleted 3 deployments, 4 incidents, 5 pull requests, 2 sync watermarks older than 30 days',
      );
    });
  });
});
