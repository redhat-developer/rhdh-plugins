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

/**
 * Adds a telemetry column to the jobs table to store execution metrics as JSON.
 *
 * @public
 */
export async function up(knex: Knex): Promise<void> {
  await knex.schema.alterTable('jobs', table => {
    table.text('telemetry'); // JSON-serialized Telemetry object
  });
}

/**
 * Removes the telemetry column from the jobs table.
 *
 * @public
 */
export async function down(knex: Knex): Promise<void> {
  await knex.schema.alterTable('jobs', table => {
    table.dropColumn('telemetry');
  });
}
