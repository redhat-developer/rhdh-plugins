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
 * @param {import('knex').Knex} knex
 */
exports.up = async function up(knex) {
  await knex.schema.createTable(
    'retained_markdown',
    function retainedMarkdown(table) {
      table.string('source_id').notNullable();
      table.string('digest').notNullable();
      table.text('content').notNullable();
      table.integer('size_bytes').notNullable();
      table.string('stored_at').notNullable();
      table.primary(['source_id', 'digest']);
    },
  );

  await knex.schema.createTable(
    'source_revision',
    function sourceRevision(table) {
      table.string('source_id').primary();
      table.string('current_revision').notNullable();
    },
  );

  await knex.schema.createTable(
    'reconcile_state',
    function reconcileState(table) {
      table.string('source_id').primary();
      table.string('ack_revision').notNullable();
      table.text('ack_retained_digests').notNullable();
      table.string('ack_at').notNullable();
    },
  );
};

/**
 * @param {import('knex').Knex} knex
 */
exports.down = async function down(knex) {
  await knex.schema.dropTableIfExists('reconcile_state');
  await knex.schema.dropTableIfExists('source_revision');
  await knex.schema.dropTableIfExists('retained_markdown');
};
