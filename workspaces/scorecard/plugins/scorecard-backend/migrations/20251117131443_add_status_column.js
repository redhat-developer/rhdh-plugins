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
  const client = knex.client.config.client;

  if (client === 'pg') {
    await knex.raw(`
        DO $$ BEGIN
          CREATE TYPE metric_values_status_enum AS ENUM ('success', 'warning', 'error');
        EXCEPTION
          WHEN duplicate_object THEN null;
        END $$;
      `);
    await knex.schema.alterTable('metric_values', table => {
      table.specificType('status', 'metric_values_status_enum').nullable();
    });
  } else {
    await knex.schema.alterTable('metric_values', table => {
      table.enum('status', ['success', 'warning', 'error']).nullable();
    });
  }
};

exports.down = async function down(knex) {
  await knex.schema.alterTable('metric_values', table => {
    table.dropColumn('status');
  });

  if (knex.client.config.client === 'pg') {
    await knex.raw('DROP TYPE IF EXISTS metric_values_status_enum');
  }
};
