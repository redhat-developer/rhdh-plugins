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

exports.up = async function (knex) {
  const client = knex.client.config.client;
  // Postgres event table schema with partitions, index to boost the performance.
  if (client === 'pg') {
    await knex.schema.raw(`
      CREATE TABLE events (
        id UUID DEFAULT gen_random_uuid(),
        action TEXT NOT NULL,
        subject TEXT NOT NULL,
        value TEXT,
        plugin_id TEXT NOT NULL,
        user_ref TEXT NOT NULL,
        attributes JSONB NOT NULL,
        context JSONB NOT NULL,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        PRIMARY KEY (id, created_at)
      ) PARTITION BY RANGE (created_at);
    `);

    // brin indexing not suppported in better-sqlite3.
    await knex.schema.raw(`
      CREATE INDEX idx_events_brin ON events USING brin (created_at);
    `);
  } else if (client === 'better-sqlite3') {
    // better-sqlite3 table does not support partition and jsonb columns.
    await knex.schema.createTable('events', table => {
      table.increments('id').primary();
      table.text('action').notNullable();
      table.text('subject').notNullable();
      table.text('value');
      table.text('plugin_id').notNullable();
      table.text('user_ref').notNullable();
      table.text('attributes').notNullable();
      table.text('context').notNullable();
      table.timestamp('created_at', { useTz: true }).defaultTo(knex.fn.now());
    });
  }

  // Add indexes
  await knex.schema.alterTable('events', table => {
    table.index(['created_at', 'user_ref'], 'idx_events_created_at_user_ref');
    table.index(['created_at', 'plugin_id'], 'idx_events_created_at_plugin');
    table.index(['action'], 'idx_events_action');
    table.index(['attributes'], 'idx_events_attributes', { using: 'gin' });
    table.index(['context'], 'idx_events_context', { using: 'gin' });
  });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = async function (knex) {
  await knex.schema.raw(`DROP TABLE events CASCADE`);
};
