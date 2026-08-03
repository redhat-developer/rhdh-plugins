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
import { DORA_CLEANUP_EXPIRED_DATA_TASK_ID } from '../constants';
import { parseDoraDataRetentionDays } from '../metricProviders/DoraConfig';
import { CleanupExpiredDataTask } from './CleanupExpiredDataTask';
import { daysToMilliseconds } from './utils';

jest.mock('./utils', () => ({
  daysToMilliseconds: jest.fn((days: number) => days * 24 * 60 * 60 * 1000),
}));

jest.mock('../metricProviders/DoraConfig', () => ({
  parseDoraDataRetentionDays: jest.fn(),
}));

describe('CleanupExpiredDataTask', () => {
  let mockScheduler: ReturnType<typeof mockServices.scheduler.mock>;
  let mockLogger: ReturnType<typeof mockServices.logger.mock>;
  let mockConfig: ReturnType<typeof mockServices.rootConfig.mock>;
  let mockDeployments: { deleteOlderThan: jest.Mock };
  let mockIncidents: { deleteOlderThan: jest.Mock };
  let mockPullRequests: { deleteOlderThan: jest.Mock };
  let mockTaskRunner: { run: jest.Mock };
  let task: CleanupExpiredDataTask;

  beforeEach(() => {
    jest.useFakeTimers();
    jest.setSystemTime(new Date('2024-01-15T12:00:00.000Z'));

    mockScheduler = mockServices.scheduler.mock();
    mockLogger = mockServices.logger.mock();
    mockConfig = mockServices.rootConfig.mock();
    mockDeployments = { deleteOlderThan: jest.fn().mockResolvedValue(0) };
    mockIncidents = { deleteOlderThan: jest.fn().mockResolvedValue(0) };
    mockPullRequests = { deleteOlderThan: jest.fn().mockResolvedValue(0) };

    mockTaskRunner = {
      run: jest.fn().mockResolvedValue(undefined),
    };

    mockScheduler.createScheduledTaskRunner.mockReturnValue(
      mockTaskRunner as any,
    );

    task = new CleanupExpiredDataTask({
      scheduler: mockScheduler,
      logger: mockLogger,
      config: mockConfig,
      deployments: mockDeployments as any,
      incidents: mockIncidents as any,
      pullRequests: mockPullRequests as any,
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
    const mockDaysToMilliseconds = daysToMilliseconds as jest.Mock;
    const mockParseDoraDataRetentionDays =
      parseDoraDataRetentionDays as jest.Mock;

    beforeEach(async () => {
      mockParseDoraDataRetentionDays.mockReturnValue(2);
      mockDeployments.deleteOlderThan.mockResolvedValue(3);
      mockIncidents.deleteOlderThan.mockResolvedValue(4);
      mockPullRequests.deleteOlderThan.mockResolvedValue(5);

      await (task as any).cleanupExpiredData(mockLogger);
    });

    it('reads retention days from DoraConfig', () => {
      expect(mockParseDoraDataRetentionDays).toHaveBeenCalledWith(mockConfig);
    });

    it('converts retention days to milliseconds', () => {
      expect(mockDaysToMilliseconds).toHaveBeenCalledWith(2);
    });

    it('deletes data older than the retention cutoff', () => {
      const expectedDate = new Date('2024-01-13T12:00:00.000Z');
      expect(mockPullRequests.deleteOlderThan).toHaveBeenCalledWith(
        expectedDate,
      );
      expect(mockDeployments.deleteOlderThan).toHaveBeenCalledWith(
        expectedDate,
      );
      expect(mockIncidents.deleteOlderThan).toHaveBeenCalledWith(expectedDate);
    });

    it('logs deleted counts', () => {
      expect(mockLogger.info).toHaveBeenCalledWith(
        'Deleted 3 deployments, 4 incidents, 5 pull requests older than 2 days',
      );
    });
  });
});
