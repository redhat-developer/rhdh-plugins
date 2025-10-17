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
import { CLEANUP_EXPIRED_METRICS_ID } from '../constants';
import { v4 as uuid } from 'uuid';
import { daysToMilliseconds } from './utils';
import type { Config } from '@backstage/config';
import { SchedulerTask } from '../types';
import { DatabaseMetricValues } from '../../database/DatabaseMetricValues';

export class CleanupExpiredMetricsTask implements SchedulerTask {
  private static readonly CLEANUP_SCHEDULE: SchedulerServiceTaskScheduleDefinition =
    {
      frequency: { days: 1 },
      timeout: { minutes: 2 },
      initialDelay: { seconds: 3 },
    };
  private static readonly DEFAULT_DATA_RETENTION_DAYS = 365;

  constructor(
    private readonly scheduler: SchedulerService,
    private readonly logger: LoggerService,
    private readonly database: DatabaseMetricValues,
    private readonly config: Config,
  ) {}

  async start(): Promise<void> {
    const taskRunner = this.scheduler.createScheduledTaskRunner(
      CleanupExpiredMetricsTask.CLEANUP_SCHEDULE,
    );

    await taskRunner.run({
      id: CLEANUP_EXPIRED_METRICS_ID,
      fn: async () => {
        const logger = this.logger.child({
          taskId: CLEANUP_EXPIRED_METRICS_ID,
          taskInstanceId: uuid(),
        });

        try {
          await this.cleanupExpiredMetrics(logger);
        } catch (error) {
          logger.error('Failed to cleanup expired metrics', error);
        }
      },
    });
  }

  private async cleanupExpiredMetrics(logger: LoggerService): Promise<void> {
    const dataRetentionDays = this.getDataRetentionDays();

    const olderThan = new Date(
      Date.now() - daysToMilliseconds(dataRetentionDays),
    );

    try {
      const deletedCount = await this.database.cleanupExpiredMetrics(olderThan);
      logger.info(
        `Deleted ${deletedCount} expired metrics older than ${dataRetentionDays} days`,
      );
    } catch (error) {
      logger.error(`Failed to cleanup expired metrics:`, error);
      throw error;
    }
  }

  private getDataRetentionDays(): number {
    return (
      this.config.getOptionalNumber('scorecard.dataRetentionDays') ??
      CleanupExpiredMetricsTask.DEFAULT_DATA_RETENTION_DAYS
    );
  }
}
