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
import {
  LoggerService,
  SchedulerService,
} from '@backstage/backend-plugin-api/index';

export const createPartition = async (
  knex: Knex,
  year: number,
  month: number,
) => {
  const startDate = `${year}-${month.toString().padStart(2, '0')}-01`;
  const nextMonth = new Date(year, month, 1);
  nextMonth.setMonth(nextMonth.getMonth() + 1);
  const endDate = `${nextMonth.getFullYear()}-${(nextMonth.getMonth() + 1)
    .toString()
    .padStart(2, '0')}-01`;

  const partitionName = `events_${year}_${month}`;

  await knex.schema.raw(`
      CREATE TABLE IF NOT EXISTS ${partitionName} 
      PARTITION OF events
      FOR VALUES FROM ('${startDate}') TO ('${endDate}');
    `);
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
