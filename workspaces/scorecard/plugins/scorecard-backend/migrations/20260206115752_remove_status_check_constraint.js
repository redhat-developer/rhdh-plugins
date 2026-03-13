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

exports.up = async function up(knex) {
  // Remove the status_check constraint that limits status values to 'success', 'warning', 'error'
  const client = knex.client.config.client;

  if (client === 'sqlite3' || client === 'better-sqlite3') {
    await knex.raw(`
      ALTER TABLE metric_values
      RENAME COLUMN status TO status_old;
    `);

    await knex.raw(`
      ALTER TABLE metric_values
      ADD COLUMN status VARCHAR(255) NULL;
    `);

    await knex.raw(`
      UPDATE metric_values
      SET status = status_old;
    `);

    await knex.raw(`
      ALTER TABLE metric_values
      DROP COLUMN status_old;
    `);
  } else {
    await knex.schema.alterTable('metric_values', table => {
      table.dropChecks(['status_check']);
    });
  }
};

exports.down = async function down(knex) {
  // Re-add the status_check constraint

  // Fail if any incompatible rows with status values that don't match the constraint
  const incompatibleRows = await knex('metric_values')
    .whereNotIn('status', ['success', 'warning', 'error'])
    .whereNotNull('status')
    .count('* as count')
    .first();
  if (incompatibleRows && incompatibleRows.count > 0) {
    throw new Error(
      `Cannot rollback migration: Found ${incompatibleRows.count} rows with status values ` +
        `outside of ['success', 'warning', 'error']. Please migrate or remove these rows before rolling back.`,
    );
  }

  const client = knex.client.config.client;

  if (client === 'sqlite3' || client === 'better-sqlite3') {
    await knex.raw(`
      ALTER TABLE metric_values
      RENAME COLUMN status TO status_old;
    `);

    await knex.raw(`
      ALTER TABLE metric_values
      ADD COLUMN status VARCHAR(255) NULL
      CHECK (status IN ('success', 'warning', 'error'));
    `);

    await knex.raw(`
      UPDATE metric_values
      SET status = status_old;
    `);

    await knex.raw(`
      ALTER TABLE metric_values
      DROP COLUMN status_old;
    `);
  } else {
    await knex.raw(
      "ALTER TABLE metric_values ADD CONSTRAINT status_check CHECK (status IN ('success', 'warning', 'error'))",
    );
  }
};
