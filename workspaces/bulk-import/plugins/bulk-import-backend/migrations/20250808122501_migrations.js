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

exports.up = function up(knex) {
  return knex.schema
    .createTable('repositories', function repositories(table) {
      table.increments('id').primary();
      table.string('url').notNullable().unique();
      table.string('approvalTool').notNullable();
    })
    .createTable('scaffolder_tasks', function scaffolder_tasks(table) {
      table.string('taskId').primary();
      table.json('scaffolderOptions');
      table.integer('repositoryId').notNullable();
      table
        .foreign('repositoryId')
        .references('id')
        .inTable('repositories')
        .onDelete('CASCADE');
      table.timestamp('executedAt', { useTz: true });
    })
    .createTable('task_locations', function task_locations(table) {
      table.increments('id').primary();
      table.string('taskId').notNullable();
      table
        .foreign('taskId')
        .references('taskId')
        .inTable('scaffolder_tasks')
        .onDelete('CASCADE');
      table.string('location').notNullable();
      table.string('type').notNullable().defaultTo('component');
    });
};

exports.down = function down(knex) {
  return knex.schema
    .dropTableIfExists('task_locations')
    .dropTableIfExists('scaffolder_tasks')
    .dropTableIfExists('repositories');
};
