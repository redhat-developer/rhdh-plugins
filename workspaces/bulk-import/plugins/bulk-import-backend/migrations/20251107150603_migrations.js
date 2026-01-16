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
  await knex.schema
    .createTable('orchestrator_repositories', function repositories(table) {
      table.increments('id').primary();
      table.string('url').notNullable().unique();
      table.string('approvalTool').notNullable();
    })
    .createTable('orchestrator_workflows', table => {
      table.comment('Stores the orchestrator workflow execution instances');
      table.increments('id').primary().comment('Primary key');
      table
        .string('instance_id')
        .notNullable()
        .unique()
        .comment('The workflow execution instance ID from the orchestrator');
      table
        .integer('repositoryId')
        .unsigned()
        .notNullable()
        .comment('The ID of the repository this workflow is for');
      table
        .foreign('repositoryId')
        .references('id')
        .inTable('orchestrator_repositories')
        .onDelete('CASCADE');
      table
        .timestamp('created_at')
        .defaultTo(knex.fn.now())
        .comment('Creation timestamp');
    });
};

/**
 * @param {import('knex').Knex} knex
 */
exports.down = async function down(knex) {
  await knex.schema.dropTable('orchestrator_workflows');
  await knex.schema.dropTable('orchestrator_repositories');
};
