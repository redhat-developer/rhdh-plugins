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
  SchedulerServiceTaskScheduleDefinition,
} from '@backstage/backend-plugin-api';
import { daysToMilliseconds } from '@red-hat-developer-hub/backstage-plugin-scorecard-node';
import { randomUUID } from 'node:crypto';
import { DORA_CLEANUP_EXPIRED_DATA_TASK_ID } from '../constants';
import type { DoraDeploymentsStore } from '../database/DatabaseDoraDeployments';
import type { DoraIncidentsStore } from '../database/DatabaseDoraIncidents';
import type { DoraLastSyncStore } from '../database/DatabaseDoraLastSync';
import type { DoraPullRequestsStore } from '../database/DatabaseDoraPullRequests';

type Options = {
  scheduler: SchedulerService;
  logger: LoggerService;
  dataRetentionDays: number;
  deployments: DoraDeploymentsStore;
  incidents: DoraIncidentsStore;
  pullRequests: DoraPullRequestsStore;
  lastSync: DoraLastSyncStore;
};

export class CleanupExpiredDataTask {
  private readonly logger: LoggerService;
  private readonly scheduler: SchedulerService;
  private readonly dataRetentionDays: number;
  private readonly deployments: DoraDeploymentsStore;
  private readonly incidents: DoraIncidentsStore;
  private readonly pullRequests: DoraPullRequestsStore;
  private readonly lastSync: DoraLastSyncStore;

  private static readonly CLEANUP_SCHEDULE: SchedulerServiceTaskScheduleDefinition =
    {
      frequency: { days: 1 },
      timeout: { minutes: 2 },
      initialDelay: { seconds: 3 },
    };

  constructor(options: Options) {
    this.logger = options.logger;
    this.scheduler = options.scheduler;
    this.dataRetentionDays = options.dataRetentionDays;
    this.deployments = options.deployments;
    this.incidents = options.incidents;
    this.pullRequests = options.pullRequests;
    this.lastSync = options.lastSync;
  }

  async start(): Promise<void> {
    const taskRunner = this.scheduler.createScheduledTaskRunner(
      CleanupExpiredDataTask.CLEANUP_SCHEDULE,
    );

    await taskRunner.run({
      id: DORA_CLEANUP_EXPIRED_DATA_TASK_ID,
      fn: async () => {
        const logger = this.logger.child({
          taskId: DORA_CLEANUP_EXPIRED_DATA_TASK_ID,
          taskInstanceId: randomUUID(),
        });

        try {
          await this.cleanupExpiredData(logger);
        } catch (error) {
          logger.error('Failed to cleanup expired DORA data', error);
        }
      },
    });
  }

  private async cleanupExpiredData(logger: LoggerService): Promise<void> {
    const olderThan = new Date(
      Date.now() - daysToMilliseconds(this.dataRetentionDays),
    );

    const deletedPullRequests =
      await this.pullRequests.deleteForDeploymentsOlderThan(olderThan);
    const deletedDeployments = await this.deployments.deleteOlderThan(
      olderThan,
    );
    const deletedIncidents = await this.incidents.deleteOlderThan(olderThan);
    const deletedLastSync = await this.lastSync.deleteOlderThan(olderThan);

    logger.info(
      `Deleted ${deletedDeployments} deployments, ${deletedIncidents} incidents, ` +
        `${deletedPullRequests} pull requests, ${deletedLastSync} sync watermarks older than ${this.dataRetentionDays} days`,
    );
  }
}
