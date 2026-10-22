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

import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import knex, { type Knex } from 'knex';
import { DatabaseReconciliationStore } from './reconciliation-store';

/** Real file-backed SQLite, reopened with a fresh connection for recovery tests. */
export async function createDurableTestDatabase() {
  const directory = await mkdtemp(join(tmpdir(), 'skills-provider-test-'));
  const connections: Knex[] = [];
  async function open(providerId = 'test') {
    const client = knex({
      client: 'better-sqlite3',
      connection: { filename: join(directory, 'state.sqlite') },
      useNullAsDefault: true,
      pool: { min: 1, max: 1 },
    });
    connections.push(client);
    const store = new DatabaseReconciliationStore(client, providerId);
    await store.initialize();
    return { client, store };
  }
  return {
    open,
    async close() {
      await Promise.all(connections.map(client => client.destroy()));
      await rm(directory, { recursive: true, force: true });
    },
  };
}
