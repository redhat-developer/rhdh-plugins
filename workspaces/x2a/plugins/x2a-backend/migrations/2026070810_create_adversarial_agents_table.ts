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
const ORIGINAL_PHASES = ['init', 'analyze', 'migrate', 'publish'];

function createJobsTable(table: Knex.CreateTableBuilder, phases: string[]) {
  table.uuid('id').primary();
  table.text('log');
  table.timestamp('started_at').notNullable();
  table.timestamp('finished_at');
  table
    .string('status')
    .notNullable()
    .defaultTo('pending')
    .checkIn(['pending', 'running', 'success', 'error', 'cancelled']);
  table.string('phase').notNullable().defaultTo('init').checkIn(phases);
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
  phases: string[],
): Promise<void> {
  await knex.schema.raw('PRAGMA foreign_keys = OFF');
  try {
    await knex.schema.createTable('jobs_new', table =>
      createJobsTable(table, phases),
    );
    await knex.schema.raw('INSERT INTO jobs_new SELECT * FROM jobs');
    await knex.schema.dropTable('jobs');
    await knex.schema.raw('ALTER TABLE jobs_new RENAME TO jobs');
  } finally {
    await knex.schema.raw('PRAGMA foreign_keys = ON');
  }
}

/**
 * Creates the adversarial_agents table, adds adversarial_agents column to projects,
 * and expands the jobs.phase CHECK constraint to include adversarial phases.
 *
 * @public
 */
export async function up(knex: Knex): Promise<void> {
  const client = knex.client.config.client;

  if (client === 'better-sqlite3') {
    await recreateJobsTableSqlite(knex, EXTENDED_PHASES);
  } else {
    // PostgreSQL: drop and recreate the named constraint
    await knex.raw(
      `ALTER TABLE jobs DROP CONSTRAINT IF EXISTS jobs_phase_check`,
    );
    await knex.raw(
      `ALTER TABLE jobs ADD CONSTRAINT jobs_phase_check CHECK (phase IN ('init', 'analyze', 'migrate', 'publish', 'adversarial-analyze', 'adversarial-migrate'))`,
    );
  }

  await knex.schema.createTable('adversarial_agents', table => {
    table.uuid('id').primary();
    table.string('name', 100).notNullable();
    table.text('prompt').notNullable();
    table.text('phases').notNullable();
    table.boolean('critical').notNullable().defaultTo(false);
    table.string('created_by', 255).notNullable();
    table.timestamp('created_at').notNullable().defaultTo(knex.fn.now());
    table.timestamp('updated_at').notNullable().defaultTo(knex.fn.now());

    table.index('updated_at');
    table.index('name');
  });
}

/**
 * Drops adversarial_agents column from projects, drops adversarial_agents table,
 * and restores the original jobs.phase CHECK constraint.
 *
 * @public
 */
export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTable('adversarial_agents');

  const client = knex.client.config.client;

  if (client === 'better-sqlite3') {
    await recreateJobsTableSqlite(knex, ORIGINAL_PHASES);
  } else {
    await knex.raw(
      `ALTER TABLE jobs DROP CONSTRAINT IF EXISTS jobs_phase_check`,
    );
    await knex.raw(
      `ALTER TABLE jobs ADD CONSTRAINT jobs_phase_check CHECK (phase IN ('init', 'analyze', 'migrate', 'publish'))`,
    );
  }
}
