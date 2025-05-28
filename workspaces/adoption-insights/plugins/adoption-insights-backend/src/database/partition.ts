import { Knex } from 'knex';
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
import { LoggerService, SchedulerService } from '@backstage/backend-plugin-api';
import {
  extractOverlappingPartition,
  isPartitionOverlapError,
  parsePartitionDate,
} from '../utils/partition';

type AttemptTracker = Map<string, number>;

export const createPartition = async (
  knex: Knex,
  year: number,
  month: number,
  attempts: AttemptTracker = new Map(),
  maxRetries = 1,
) => {
  const start = new Date(year, month - 1, 1);
  const end = new Date(year, month, 1);

  const startDate = start.toISOString().slice(0, 10);
  const endDate = end.toISOString().slice(0, 10);

  const partitionName = `events_${year}_${month.toString().padStart(2, '0')}`;
  const key = `${year}_${month}`;

  // track max attempts
  const currentAttempt = attempts.get(key) ?? 0;
  if (currentAttempt > maxRetries) {
    throw new Error(`Exceeded max retries for partition ${key}`);
  }
  attempts.set(key, currentAttempt + 1);

  try {
    await knex.schema.raw(`
      CREATE TABLE IF NOT EXISTS ${partitionName} 
      PARTITION OF events
      FOR VALUES FROM ('${startDate}') TO ('${endDate}');
    `);
  } catch (error) {
    if (isPartitionOverlapError(error)) {
      const overlappingPartition = extractOverlappingPartition(error.message);
      const { year: y, month: m } = parsePartitionDate(overlappingPartition);

      await knex.schema.raw(
        `DROP TABLE IF EXISTS ${overlappingPartition} CASCADE`,
      );

      // Recreate the dropped overlapping partition
      await createPartition(knex, y, m, attempts, maxRetries);

      // Retry the current one
      await createPartition(knex, year, month, attempts, maxRetries);
    } else {
      throw error;
    }
  }
};

export const schedulePartition = async (
  client: Knex,
  services: {
    logger: LoggerService;
    scheduler: SchedulerService;
  },
) => {
  const { logger, scheduler } = services;
  const partitionEventsTable = async () => {
    const year = new Date().getFullYear();
    const month = new Date().getMonth() + 1;
    logger.info(
      `Creating partition for ${year}_${month.toString().padStart(2, '0')}`,
    );
    await createPartition(client, year, month);
  };

  const runner = scheduler.createScheduledTaskRunner({
    frequency: { cron: '0 0 1 * *' }, // Runs at midnight on the 1st of every month
    timeout: { seconds: 30 },
  });

  runner.run({
    id: 'create-partition',
    fn: partitionEventsTable,
  });

  logger.info('[TASK] Running initial execution on startup...');
  await partitionEventsTable();
};
