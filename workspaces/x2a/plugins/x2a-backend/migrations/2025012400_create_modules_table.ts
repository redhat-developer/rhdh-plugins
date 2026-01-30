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

import { Knex } from 'knex';

/**
 * Creates the modules table.
 *
 * @public
 */
export async function up(knex: Knex): Promise<void> {
  await knex.schema.createTable('modules', table => {
    table.uuid('id').primary();
    table.string('name').notNullable();
    table.string('source_path').notNullable();
    table
      .uuid('project_id')
      .notNullable()
      .references('id')
      .inTable('projects')
      .onDelete('CASCADE')
      .index();

    // Optional indexes for frequent lookups
    table.index('name');
    table.index('source_path');
  });
}

/**
 * Drops the modules table.
 *
 * @public
 */
export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTable('modules');
}
