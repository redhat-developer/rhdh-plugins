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
  await knex.schema.createTable('dora_deployments', table => {
    table.string('id').primary().notNullable();
    table.string('catalog_entity_ref').notNullable();
    table.string('collector_id').notNullable();
    table.string('original_deployment_id').notNullable();
    table.string('commit_sha').notNullable();
    table.string('environment').nullable();
    table.dateTime('created_at', { precision: 0 }).notNullable();
    table.string('result').notNullable();

    table.unique([
      'catalog_entity_ref',
      'collector_id',
      'original_deployment_id',
    ]);
    // Deployment reads: entity + collector + created_at window (ordered by created_at)
    table.index(
      ['catalog_entity_ref', 'collector_id', 'created_at'],
      'dora_deployments_entity_collector_created_at_idx',
    );
  });

  await knex.schema.createTable('dora_incidents', table => {
    table.string('id').primary().notNullable();
    table.string('catalog_entity_ref').notNullable();
    table.string('collector_id').notNullable();
    table.string('original_incident_id').notNullable();
    table.dateTime('created_at', { precision: 0 }).notNullable();
    table.dateTime('updated_at', { precision: 0 }).notNullable();
    table.dateTime('resolution_at', { precision: 0 }).nullable();

    table.unique([
      'catalog_entity_ref',
      'collector_id',
      'original_incident_id',
    ]);
    // Incident reads: entity + collector + created_at window (ordered by created_at)
    table.index(
      ['catalog_entity_ref', 'collector_id', 'created_at'],
      'dora_incidents_entity_collector_created_at_idx',
    );
  });

  await knex.schema.createTable('dora_pull_requests', table => {
    table.string('id').primary().notNullable();
    table.string('catalog_entity_ref').notNullable();
    table.string('collector_id').notNullable();
    table.string('original_pr_id').notNullable();
    table.dateTime('first_commit_at', { precision: 0 }).notNullable();
    table
      .string('deployment_id')
      .references('id')
      .inTable('dora_deployments')
      .onDelete('CASCADE')
      .nullable();

    table.unique([
      'catalog_entity_ref',
      'collector_id',
      'original_pr_id',
      'deployment_id',
    ]);
    // Lead-time reads: PRs for one entity/collector/deployment
    table.index(
      ['catalog_entity_ref', 'collector_id', 'deployment_id'],
      'dora_pull_requests_entity_collector_deployment_idx',
    );
  });
};

exports.down = async function down(knex) {
  await knex.schema.dropTable('dora_pull_requests');
  await knex.schema.dropTable('dora_incidents');
  await knex.schema.dropTable('dora_deployments');
};
