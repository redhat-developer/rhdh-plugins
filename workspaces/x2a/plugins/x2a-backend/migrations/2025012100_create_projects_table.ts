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
 * Creates the projects table.
 *
 * @public
 */
export async function up(knex: Knex): Promise<void> {
  await knex.schema.createTable('projects', table => {
    table.uuid('id').primary();
    table.string('name').notNullable();
    table.string('abbreviation').notNullable();
    table.text('description');
    table.string('source_repo_url').notNullable();
    table.string('source_repo_branch').notNullable();
    table.string('target_repo_url').notNullable();
    table.string('target_repo_branch').notNullable();
    table.string('created_by').notNullable();
    table.timestamp('created_at').defaultTo(knex.fn.now()).notNullable();

    // Add indexes for common query patterns
    table.index('created_at');
    table.index('created_by');
    table.index('name');
  });
}

/**
 * Drops the projects table.
 *
 * @public
 */
export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTable('projects');
}
