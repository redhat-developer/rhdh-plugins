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
 * Adds phase tracking and Kubernetes job metadata to the jobs table.
 *
 * @public
 */
export async function up(knex: Knex): Promise<void> {
  await knex.schema.alterTable('jobs', table => {
    table
      .string('phase')
      .notNullable()
      .defaultTo('init')
      .checkIn(['init', 'analyze', 'migrate', 'publish']);
    table.text('error_details');
    table.string('k8s_job_name');
    table.string('callback_token');
    table.index('phase');
    table.index('k8s_job_name');
  });
}

/**
 * Removes phase tracking and Kubernetes job metadata from the jobs table.
 *
 * @public
 */
export async function down(knex: Knex): Promise<void> {
  await knex.schema.alterTable('jobs', table => {
    table.dropIndex('phase');
    table.dropIndex('k8s_job_name');
    table.dropColumn('phase');
    table.dropColumn('error_details');
    table.dropColumn('k8s_job_name');
    table.dropColumn('callback_token');
  });
}
