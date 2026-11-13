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

/**
 * Adopt compatible pre-migration development tables without deleting rows.
 * The migration lock serializes these checks with schema creation.
 * @param {import('knex').Knex} knex
 */
exports.up = async function up(knex) {
  const tables = [
    {
      name: 'skills_provider_committed_state',
      columns: [
        'provider_id',
        'source_type',
        'source_id',
        'observed_at',
        'entities_json',
      ],
      create(table) {
        table.string('provider_id').notNullable();
        table.string('source_type').notNullable();
        table.string('source_id').notNullable();
        table.string('observed_at').nullable();
        table.text('entities_json').notNullable().defaultTo('[]');
        table.primary(['provider_id', 'source_type', 'source_id']);
      },
    },
    {
      name: 'skills_provider_pending_delta',
      columns: [
        'provider_id',
        'source_type',
        'source_id',
        'upserts_json',
        'removals_json',
        'next_state_json',
      ],
      create(table) {
        table.string('provider_id').notNullable();
        table.string('source_type').notNullable();
        table.string('source_id').notNullable();
        table.text('upserts_json').notNullable().defaultTo('[]');
        table.text('removals_json').notNullable().defaultTo('[]');
        table.text('next_state_json').notNullable();
        table.primary(['provider_id', 'source_type', 'source_id']);
      },
    },
  ];
  for (const definition of tables) {
    if (await knex.schema.hasTable(definition.name)) {
      const info = await knex(definition.name).columnInfo();
      const missing = definition.columns.filter(column => !info[column]);
      if (missing.length) {
        throw new Error(
          `Cannot adopt ${definition.name}: missing columns ${missing.join(
            ', ',
          )}`,
        );
      }
    } else {
      await knex.schema.createTable(definition.name, definition.create);
    }
  }
};

/** @param {import('knex').Knex} knex */
exports.down = async function down(knex) {
  await knex.schema.dropTable('skills_provider_pending_delta');
  await knex.schema.dropTable('skills_provider_committed_state');
};
