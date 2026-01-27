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
 * Adds project_id to jobs table and makes module_id nullable.
 * This allows init phase jobs (which operate on projects) to have no module.
 *
 * @public
 */
export async function up(knex: Knex): Promise<void> {
  await knex.schema.alterTable('jobs', table => {
    // Add project_id column
    table
      .uuid('project_id')
      .notNullable()
      .references('id')
      .inTable('projects')
      .onDelete('CASCADE')
      .index();

    // Make module_id nullable (init jobs don't have a module)
    table.uuid('module_id').nullable().alter();
  });
}

/**
 * Removes project_id from jobs table and makes module_id not nullable again.
 *
 * @public
 */
export async function down(knex: Knex): Promise<void> {
  await knex.schema.alterTable('jobs', table => {
    // Make module_id not nullable again
    table.uuid('module_id').notNullable().alter();

    // Drop project_id column
    table.dropColumn('project_id');
  });
}
