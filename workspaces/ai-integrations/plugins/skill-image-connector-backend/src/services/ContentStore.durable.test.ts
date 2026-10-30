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

import type { DatabaseService } from '@backstage/backend-plugin-api';
import { mockServices } from '@backstage/backend-test-utils';
import knex, { type Knex } from 'knex';
import { ContentStore } from './ContentStore';

const digestA = `sha256:${'a'.repeat(64)}`;
const digestB = `sha256:${'b'.repeat(64)}`;
const digestC = `sha256:${'c'.repeat(64)}`;

describe('ContentStore durable retention', () => {
  let database: Knex;
  let service: DatabaseService;

  beforeEach(() => {
    database = knex({
      client: 'better-sqlite3',
      connection: { filename: ':memory:' },
      useNullAsDefault: true,
    });
    service = { getClient: async () => database };
  });

  afterEach(async () => {
    await database.destroy();
  });

  async function openStore(): Promise<ContentStore> {
    const store = new ContentStore(mockServices.logger.mock());
    await store.initialize(service);
    return store;
  }

  it('preserves newer unacknowledged content and revisions after recovery', async () => {
    const store = await openStore();
    await store.store('source', digestA, '# A');
    await store.allocateRevision('source');
    await store.saveAcknowledgment('source', '1', [digestA]);
    await store.store('source', digestB, '# B');
    expect(await store.allocateRevision('source')).toBe('2');

    const recovered = await openStore();
    expect(await recovered.get('source', digestA)).toBe('# A');
    expect(await recovered.get('source', digestB)).toBe('# B');
    expect(await recovered.allocateRevision('source')).toBe('3');
  });

  it('preserves current-snapshot content omitted from the acknowledged retain set', async () => {
    const store = await openStore();
    await store.store('source', digestA, '# Current');
    await store.acknowledgeAndCleanup('source', '1', [], new Set([digestA]));

    const recovered = await openStore();
    expect(await recovered.get('source', digestA)).toBe('# Current');
    expect(await recovered.getLastAcknowledgment('source')).toMatchObject({
      revision: '1',
      retainedDigests: [],
    });
  });

  it('commits only authorized deletions and preserves other sources', async () => {
    const store = await openStore();
    await store.store('source', digestA, '# Retained');
    await store.store('source', digestB, '# Current');
    await store.store('source', digestC, '# Released');
    await store.store('other', digestC, '# Other source');
    expect(
      await store.acknowledgeAndCleanup(
        'source',
        '1',
        [digestA],
        new Set([digestB]),
      ),
    ).toBe(1);

    const recovered = await openStore();
    expect(await recovered.get('source', digestA)).toBe('# Retained');
    expect(await recovered.get('source', digestB)).toBe('# Current');
    expect(await recovered.get('source', digestC)).toBeUndefined();
    expect(await recovered.get('other', digestC)).toBe('# Other source');
  });

  it('rolls back acknowledgment and deletion together, allowing retry after restart', async () => {
    const store = await openStore();
    await store.store('source', digestA, '# Old');
    await store.store('source', digestB, '# Current');
    await store.saveAcknowledgment('source', '1', [digestA]);
    await database.raw(
      "CREATE TRIGGER reject_cleanup BEFORE DELETE ON retained_markdown BEGIN SELECT RAISE(FAIL, 'cleanup failed'); END",
    );

    await expect(
      store.acknowledgeAndCleanup('source', '2', [digestB], new Set([digestB])),
    ).rejects.toMatchObject({
      message: expect.stringContaining('cleanup failed'),
    });
    expect(await store.get('source', digestA)).toBe('# Old');
    expect(await store.getLastAcknowledgment('source')).toMatchObject({
      revision: '1',
    });
    const persisted = await database('reconcile_state')
      .where({ source_id: 'source' })
      .first();
    expect(persisted.ack_revision).toBe('1');

    const recovered = await openStore();
    expect(await recovered.get('source', digestA)).toBe('# Old');
    expect(await recovered.get('source', digestB)).toBe('# Current');
    await database.raw('DROP TRIGGER reject_cleanup');
    expect(
      await recovered.acknowledgeAndCleanup(
        'source',
        '2',
        [digestB],
        new Set([digestB]),
      ),
    ).toBe(1);
    expect(await recovered.get('source', digestA)).toBeUndefined();
    expect(await recovered.getLastAcknowledgment('source')).toMatchObject({
      revision: '2',
    });
    expect(
      await recovered.acknowledgeAndCleanup(
        'source',
        '2',
        [digestB],
        new Set([digestB]),
      ),
    ).toBe(0);
  });

  it('releases all content when both protected sets are empty', async () => {
    const store = await openStore();
    await store.store('source', digestA, '# Old');
    expect(
      await store.acknowledgeAndCleanup('source', '1', [], new Set()),
    ).toBe(1);
    await expect(
      (await openStore()).get('source', digestA),
    ).resolves.toBeUndefined();
  });

  it('rejects a lower retention budget after recovery without deleting persisted content', async () => {
    const store = await openStore();
    const markdown = '# Persisted content larger than the new budget';
    await store.store('source', digestA, markdown);
    const reduced = new ContentStore(mockServices.logger.mock(), 10);
    await reduced.initialize(service);
    await expect(reduced.validateRetentionLimit('source')).rejects.toThrow(
      /below already-retained bytes/,
    );
    expect(await (await openStore()).get('source', digestA)).toBe(markdown);
    expect(
      await database('retained_markdown').count('* as count').first(),
    ).toMatchObject({ count: 1 });
  });

  it('rejects configured database connection failure', async () => {
    const store = new ContentStore(mockServices.logger.mock());
    await expect(
      store.initialize({
        getClient: async () => {
          throw new Error('database unavailable');
        },
      }),
    ).rejects.toThrow('database unavailable');
  });

  it('rejects migration failure instead of publishing in volatile mode', async () => {
    const store = new ContentStore(mockServices.logger.mock());
    await database.schema.createTable('retained_markdown', table => {
      table.string('unexpected_column');
    });
    await expect(store.initialize(service)).rejects.toMatchObject({
      message: expect.stringContaining('already exists'),
    });
  });

  it('rejects revision recovery failure instead of resetting the counter', async () => {
    const store = await openStore();
    await store.allocateRevision('source');
    await database('source_revision').update({ current_revision: 'corrupt' });
    await expect(openStore()).rejects.toThrow();
  });
});
