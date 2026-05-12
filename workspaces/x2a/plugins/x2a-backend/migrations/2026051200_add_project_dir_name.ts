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
import { Project } from '../src/services/Project';

/**
 * Adds the dir_name column to the projects table and backfills existing rows.
 *
 * @public
 */
export async function up(knex: Knex): Promise<void> {
  await knex.schema.alterTable('projects', table => {
    table.string('dir_name').nullable();
  });

  const rows: Array<{ id: string; name: string }> = await knex('projects')
    .select('id', 'name')
    .whereNull('dir_name');

  for (const row of rows) {
    await knex('projects')
      .where('id', row.id)
      .update({ dir_name: new Project(row.id, row.name).dirName });
  }

  // SQLite does not support ALTER COLUMN to set NOT NULL after the fact.
  // For PostgreSQL we can tighten the constraint now that all rows are backfilled.
  const client = knex.client.config.client;
  if (client === 'pg' || client === 'postgresql') {
    await knex.raw('ALTER TABLE projects ALTER COLUMN dir_name SET NOT NULL');
  }
}

/**
 * Removes the dir_name column from the projects table.
 *
 * @public
 */
export async function down(knex: Knex): Promise<void> {
  await knex.schema.alterTable('projects', table => {
    table.dropColumn('dir_name');
  });
}
