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

/**
 * Creates the jobs and artifacts table.
 *
 * @public
 */
export async function up(knex: Knex): Promise<void> {
  await knex.schema.createTable('jobs', table => {
    table.uuid('id').primary();
    table.text('log'); // Very long text for job logs
    table.timestamp('started_at').notNullable();
    table.timestamp('finished_at'); // Nullable since job might not be finished
    table
      .string('status')
      .notNullable()
      .defaultTo('pending')
      .checkIn(['pending', 'running', 'success', 'error']);
    table
      .string('phase')
      .notNullable()
      .defaultTo('init')
      .checkIn(['init', 'analyze', 'migrate', 'publish']);
    table.text('error_details');
    table.text('telemetry'); // JSON-serialized Telemetry object
    table.string('k8s_job_name');
    table.string('callback_token');
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

    // Optional indexes for frequent lookups
    table.index('started_at');
    table.index('finished_at');
    table.index('status');
    table.index('phase');
    table.index('k8s_job_name');
  });

  await knex.schema.createTable('artifacts', table => {
    table.uuid('id').primary();
    table.string('type').notNullable(); // The artifact type
    table.string('value').notNullable(); // The artifact string value
    table
      .uuid('job_id')
      .notNullable()
      .references('id')
      .inTable('jobs')
      .onDelete('CASCADE')
      .index();
  });
}

/**
 * Drops the jobs and artifacts table.
 *
 * @public
 */
export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTable('artifacts');
  await knex.schema.dropTable('jobs');
}
