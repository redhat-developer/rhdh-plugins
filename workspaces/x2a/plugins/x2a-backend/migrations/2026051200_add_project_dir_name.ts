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

const MAX_BASE_NAME_LENGTH = 64;
const SHORT_ID_LENGTH = 6;
const DEFAULT_BASE_NAME = 'project';

function computeDirName(id: string, name: string): string {
  let sanitized = name
    .toLowerCase()
    .replace(/[^a-z0-9-]/g, '-')
    .replace(/-{2,}/g, '-');

  let start = 0;
  while (start < sanitized.length && sanitized[start] === '-') start++;
  sanitized = sanitized.substring(start);

  let end = sanitized.length;
  while (end > 0 && sanitized[end - 1] === '-') end--;
  sanitized = sanitized.substring(0, end);

  sanitized = sanitized.substring(0, MAX_BASE_NAME_LENGTH);
  while (sanitized.length > 0 && sanitized[sanitized.length - 1] === '-') {
    sanitized = sanitized.substring(0, sanitized.length - 1);
  }

  const baseName = sanitized || DEFAULT_BASE_NAME;
  const shortId = id.substring(0, SHORT_ID_LENGTH);
  return `${baseName}-${shortId}`;
}

/**
 * Adds the dir_name column and renames created_by to owned_by in the projects table.
 * Backfills dir_name for existing rows.
 *
 * @public
 */
export async function up(knex: Knex): Promise<void> {
  await knex.schema.alterTable('projects', table => {
    table.string('dir_name').nullable();
    table.renameColumn('created_by', 'owned_by');
  });

  const rows: Array<{ id: string; name: string }> = await knex('projects')
    .select('id', 'name')
    .whereNull('dir_name');

  for (const row of rows) {
    await knex('projects')
      .where('id', row.id)
      .update({ dir_name: computeDirName(row.id, row.name) });
  }

  // SQLite does not support ALTER COLUMN to set NOT NULL after the fact.
  // For PostgreSQL we can tighten the constraint now that all rows are backfilled.
  const client = knex.client.config.client;
  if (client === 'pg' || client === 'postgresql') {
    await knex.raw('ALTER TABLE projects ALTER COLUMN dir_name SET NOT NULL');
  }
}

/**
 * Reverts: drops dir_name and renames owned_by back to created_by.
 *
 * @public
 */
export async function down(knex: Knex): Promise<void> {
  await knex.schema.alterTable('projects', table => {
    table.renameColumn('owned_by', 'created_by');
    table.dropColumn('dir_name');
  });
}
