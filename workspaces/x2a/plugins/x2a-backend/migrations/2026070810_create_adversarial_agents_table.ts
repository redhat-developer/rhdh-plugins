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
 * Creates the adversarial_agents table, adds adversarial_agents column to projects,
 * and expands the jobs.phase CHECK constraint to include adversarial phases (PostgreSQL only).
 *
 * @public
 */
export async function up(knex: Knex): Promise<void> {
  if (knex.client.config.client === 'pg') {
    await knex.schema.raw(
      `ALTER TABLE jobs DROP CONSTRAINT IF EXISTS jobs_phase_check`,
    );
    await knex.schema.raw(
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

  await knex.schema.alterTable('projects', table => {
    table.text('adversarial_agents').nullable();
  });
}

/**
 * Drops adversarial_agents column from projects, drops adversarial_agents table,
 * and restores the original jobs.phase CHECK constraint (PostgreSQL only).
 *
 * @public
 */
export async function down(knex: Knex): Promise<void> {
  await knex.schema.alterTable('projects', table => {
    table.dropColumn('adversarial_agents');
  });

  await knex.schema.dropTable('adversarial_agents');

  if (knex.client.config.client === 'pg') {
    await knex.schema.raw(
      `ALTER TABLE jobs DROP CONSTRAINT IF EXISTS jobs_phase_check`,
    );
    await knex.schema.raw(
      `ALTER TABLE jobs ADD CONSTRAINT jobs_phase_check CHECK (phase IN ('init', 'analyze', 'migrate', 'publish'))`,
    );
  }
}
