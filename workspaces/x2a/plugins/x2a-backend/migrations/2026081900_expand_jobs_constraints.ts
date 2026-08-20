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

import type { Knex } from 'knex';

const EXTENDED_PHASES = [
  'init',
  'analyze',
  'migrate',
  'publish',
  'adversarial-analyze',
  'adversarial-migrate',
];

const EXTENDED_STATUSES = [
  'pending',
  'running',
  'success',
  'error',
  'cancelled',
  'stale',
];

const ORIGINAL_STATUSES = [
  'pending',
  'running',
  'success',
  'error',
  'cancelled',
];

function createJobsTable(
  table: Knex.CreateTableBuilder,
  statuses: string[],
): void {
  table.uuid('id').primary();
  table.text('log');
  table.timestamp('started_at').notNullable();
  table.timestamp('finished_at');
  table.string('status').notNullable().defaultTo('pending').checkIn(statuses);
  table
    .string('phase')
    .notNullable()
    .defaultTo('init')
    .checkIn(EXTENDED_PHASES);
  table.text('error_details');
  table.text('telemetry');
  table.string('k8s_job_name');
  table.string('callback_token');
  table.string('commit_id').nullable();
  table
    .uuid('project_id')
    .notNullable()
    .references('id')
    .inTable('projects')
    .onDelete('CASCADE')
    .index();
  table
    .uuid('module_id')
    .nullable()
    .references('id')
    .inTable('modules')
    .onDelete('CASCADE')
    .index();
  table.index('started_at');
  table.index('finished_at');
  table.index('status');
  table.index('phase');
  table.index('k8s_job_name');
}

async function recreateJobsTableSqlite(
  knex: Knex,
  statuses: string[],
): Promise<void> {
  // Use a unique staging name — SQLite index names are global and the prior
  // adversarial migration left behind "jobs_new_*" index names when it
  // renamed jobs_new → jobs, so we cannot reuse that staging table name.
  const staging = 'jobs_status_expanded';
  await knex.schema.raw('PRAGMA foreign_keys = OFF');
  try {
    await knex.schema.createTable(staging, table =>
      createJobsTable(table, statuses),
    );
    await knex.schema.raw(`INSERT INTO ${staging} SELECT * FROM jobs`);
    await knex.schema.dropTable('jobs');
    await knex.schema.raw(`ALTER TABLE ${staging} RENAME TO jobs`);
  } finally {
    await knex.schema.raw('PRAGMA foreign_keys = ON');
  }
}

/**
 * Expands the jobs.status CHECK constraint to include 'stale',
 * needed for cascading invalidation of downstream phase jobs.
 *
 * @public
 */
export async function up(knex: Knex): Promise<void> {
  const client = knex.client.config.client;

  if (client === 'better-sqlite3') {
    await recreateJobsTableSqlite(knex, EXTENDED_STATUSES);
  } else {
    await knex.raw(
      `ALTER TABLE jobs DROP CONSTRAINT IF EXISTS jobs_status_check`,
    );
    await knex.raw(
      `ALTER TABLE jobs ADD CONSTRAINT jobs_status_check CHECK (status IN ('pending', 'running', 'success', 'error', 'cancelled', 'stale'))`,
    );
  }
}

/**
 * Reverts the jobs.status CHECK constraint to exclude 'stale'.
 * Note: rows with status='stale' will be lost on SQLite (cannot exist after revert).
 *
 * @public
 */
export async function down(knex: Knex): Promise<void> {
  const client = knex.client.config.client;

  if (client === 'better-sqlite3') {
    await recreateJobsTableSqlite(knex, ORIGINAL_STATUSES);
  } else {
    await knex.raw(
      `ALTER TABLE jobs DROP CONSTRAINT IF EXISTS jobs_status_check`,
    );
    await knex.raw(
      `ALTER TABLE jobs ADD CONSTRAINT jobs_status_check CHECK (status IN ('pending', 'running', 'success', 'error', 'cancelled'))`,
    );
  }
}
