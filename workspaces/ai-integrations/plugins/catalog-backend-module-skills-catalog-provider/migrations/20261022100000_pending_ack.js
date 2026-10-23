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
 * Add pending acknowledgment table for D8 TechDocs retention
 * coordination (task 6.3).
 * @param {import('knex').Knex} knex
 */
exports.up = async function up(knex) {
  if (!(await knex.schema.hasTable('skills_provider_pending_ack'))) {
    await knex.schema.createTable('skills_provider_pending_ack', table => {
      table.string('provider_id').notNullable();
      table.string('source_type').notNullable();
      table.string('source_id').notNullable();
      table.string('connector_plugin_id').notNullable();
      table.string('revision').notNullable();
      table.text('retained_digests_json').notNullable().defaultTo('[]');
      table.text('expected_entity_urls_json').notNullable().defaultTo('{}');
      table.text('expected_removals_json').notNullable().defaultTo('[]');
      table.primary(['provider_id', 'source_type', 'source_id']);
    });
  }
};

/** @param {import('knex').Knex} knex */
exports.down = async function down(knex) {
  await knex.schema.dropTable('skills_provider_pending_ack');
};
