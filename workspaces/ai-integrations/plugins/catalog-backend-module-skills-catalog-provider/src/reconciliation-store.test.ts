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

import { createDurableTestDatabase } from './testUtils';
import type {
  PendingDelta,
  PendingAcknowledgment,
} from './reconciliation-store';
import type { CommittedSourceState } from './types';

const state: CommittedSourceState = {
  sourceType: 'oci',
  sourceId: 'quay-public',
  observedAt: '2026-01-15T10:00:00Z',
  entities: [
    {
      tuple: { type: 'oci', id: 'quay-public', key: 'quay.io/org/skill:v1' },
      catalogName: 'skill-test',
      digest: `sha256:${'a'.repeat(64)}`,
      entity: {
        apiVersion: 'backstage.io/v1alpha1',
        kind: 'AiResource',
        metadata: { name: 'skill-test' },
        spec: { type: 'skill' },
      },
    },
  ],
};
const delta: PendingDelta = {
  sourceType: state.sourceType,
  sourceId: state.sourceId,
  upserts: state.entities,
  removals: [],
  nextState: state,
};

describe('DatabaseReconciliationStore with file-backed SQLite', () => {
  let database: Awaited<ReturnType<typeof createDurableTestDatabase>>;
  beforeEach(async () => {
    database = await createDurableTestDatabase();
  });
  afterEach(async () => {
    await database.close();
  });

  it('recovers full committed entities and pending work through a new connection', async () => {
    const first = await database.open();
    await first.store.commitStateAndClearPending('oci', 'quay-public', state);
    await first.store.savePendingDelta(delta);
    await first.client.destroy();
    const second = await database.open();
    expect(await second.store.getCommittedState('oci', 'quay-public')).toEqual(
      state,
    );
    expect(await second.store.getPendingDelta('oci', 'quay-public')).toEqual(
      delta,
    );
    expect(await second.store.getAllCommittedStates()).toEqual([state]);
    expect(await second.store.getAllPendingDeltas()).toEqual([delta]);
  });

  it('persists exact release context through reopening and atomically rolls back failed acknowledgment writes', async () => {
    const first = await database.open();
    const ack: PendingAcknowledgment = {
      sourceType: 'oci',
      sourceId: 'quay-public',
      connectorPluginId: 'skill-image-connector',
      revision: '7',
      retainedDigests: [state.entities[0].digest],
      expectedEntityUrls: {
        'airesource:default/skill-test':
          'url:https://example/api/skill-image-connector/skilldocs/quay-public/digest',
      },
      expectedRemovals: ['airesource:old/removed'],
    };
    const pending = { ...delta, revision: '7', acknowledgment: ack };
    const previous = { ...state, observedAt: null, entities: [] };
    await first.store.commitStateAndClearPending(
      'oci',
      'quay-public',
      previous,
    );
    await first.store.savePendingDelta(pending);
    await first.client.destroy();
    const second = await database.open();
    expect(await second.store.getPendingDelta('oci', 'quay-public')).toEqual(
      pending,
    );
    await second.client.raw(
      `CREATE TRIGGER fail_ack BEFORE INSERT ON skills_provider_pending_ack BEGIN SELECT RAISE(ABORT, 'injected ack failure'); END`,
    );
    await expect(
      second.store.commitStateAndSaveAcknowledgment(
        'oci',
        'quay-public',
        state,
        ack,
      ),
    ).rejects.toMatchObject({
      message: expect.stringContaining('injected ack failure'),
    });
    expect(await second.store.getCommittedState('oci', 'quay-public')).toEqual(
      previous,
    );
    expect(await second.store.getPendingDelta('oci', 'quay-public')).toEqual(
      pending,
    );
    expect(
      await second.store.getPendingAcknowledgment('oci', 'quay-public'),
    ).toBeUndefined();
    await second.client.raw('DROP TRIGGER fail_ack');
    await second.store.commitStateAndSaveAcknowledgment(
      'oci',
      'quay-public',
      state,
      ack,
    );
    expect(
      await second.store.getPendingDelta('oci', 'quay-public'),
    ).toBeUndefined();
    const otherProvider = await database.open('other');
    expect(await otherProvider.store.getAllPendingAcknowledgments()).toEqual(
      [],
    );
    await second.client.destroy();
    const third = await database.open();
    expect(
      await third.store.getPendingAcknowledgment('oci', 'quay-public'),
    ).toEqual(ack);
    const nextAck = { ...ack, revision: '8' };
    await third.client.raw(
      `CREATE TRIGGER fail_ack_update BEFORE UPDATE ON skills_provider_pending_ack BEGIN SELECT RAISE(ABORT, 'injected ack update failure'); END`,
    );
    await expect(
      third.store.commitStateAndSaveAcknowledgment(
        'oci',
        'quay-public',
        { ...state, observedAt: 'new' },
        nextAck,
      ),
    ).rejects.toMatchObject({
      message: expect.stringContaining('injected ack update failure'),
    });
    expect(
      await third.store.getPendingAcknowledgment('oci', 'quay-public'),
    ).toEqual(ack);
    expect(await third.store.getCommittedState('oci', 'quay-public')).toEqual(
      state,
    );
  });

  it('isolates provider IDs and source identities across both tables', async () => {
    const a = await database.open('a');
    const b = await database.open('b');
    await a.store.commitStateAndClearPending('oci', 'quay-public', state);
    await a.store.savePendingDelta(delta);
    expect(
      (await b.store.getCommittedState('oci', 'quay-public')).entities,
    ).toEqual([]);
    expect(await b.store.getAllPendingDeltas()).toEqual([]);
    expect(await a.store.getPendingDelta('npx', 'quay-public')).toBeUndefined();
    expect((await a.store.getCommittedState('oci', 'other')).entities).toEqual(
      [],
    );
  });

  it('uses isolated migration tracking and adopts existing compatible tables without losing rows', async () => {
    const { client, store } = await database.open();
    await store.commitStateAndClearPending('oci', 'quay-public', state);
    await store.savePendingDelta(delta);
    const migrationTable = 'skills_catalog_provider_migrations';
    expect(await client.schema.hasTable(migrationTable)).toBe(true);
    expect(await client(migrationTable).select('*')).toHaveLength(4);
    await client.schema.dropTable(migrationTable);
    await client.schema.dropTable(`${migrationTable}_lock`);
    // A shared Catalog migration table must not be consulted or changed.
    await client.schema.createTable('knex_migrations', table => {
      table.string('name');
    });
    await client('knex_migrations').insert({ name: 'catalog-migration' });
    await store.initialize();
    expect(await store.getCommittedState('oci', 'quay-public')).toEqual(state);
    expect(await store.getPendingDelta('oci', 'quay-public')).toEqual(delta);
    expect(await client('knex_migrations').select('*')).toEqual([
      { name: 'catalog-migration' },
    ]);
    await store.initialize();
    expect(await client(migrationTable).select('*')).toHaveLength(4);
  });

  it('refuses incompatible pre-migration tables without deleting their rows', async () => {
    const { client, store } = await database.open();
    await store.commitStateAndClearPending('oci', 'quay-public', state);
    await client.schema.dropTable('skills_catalog_provider_migrations');
    await client.schema.dropTable('skills_catalog_provider_migrations_lock');
    await client.schema.alterTable('skills_provider_committed_state', table => {
      table.dropColumn('observed_at');
    });
    await expect(store.initialize()).rejects.toThrow(
      'missing columns observed_at',
    );
    const rows = await client('skills_provider_committed_state').select('*');
    expect(rows).toHaveLength(1);
    expect(JSON.parse(rows[0].entities_json)).toEqual(state.entities);
  });

  it('atomically commits next state and clears pending work', async () => {
    const { store } = await database.open();
    await store.savePendingDelta(delta);
    await store.commitStateAndClearPending('oci', 'quay-public', state);
    expect(await store.getCommittedState('oci', 'quay-public')).toEqual(state);
    expect(await store.getPendingDelta('oci', 'quay-public')).toBeUndefined();
    // Retrying commit is idempotent.
    await store.commitStateAndClearPending('oci', 'quay-public', state);
    expect(await store.getAllCommittedStates()).toEqual([state]);
  });

  it('rolls back ownership changes when clearing pending work fails', async () => {
    const { client, store } = await database.open();
    const previous = { ...state, observedAt: null, entities: [] };
    await store.commitStateAndClearPending('oci', 'quay-public', previous);
    await store.savePendingDelta(delta);
    await client.raw(
      `CREATE TRIGGER fail_clear BEFORE DELETE ON skills_provider_pending_delta BEGIN SELECT RAISE(ABORT, 'injected clear failure'); END`,
    );
    await expect(
      store.commitStateAndClearPending('oci', 'quay-public', state),
    ).rejects.toMatchObject({
      message: expect.stringContaining('injected clear failure'),
    });
    expect(await store.getCommittedState('oci', 'quay-public')).toEqual(
      previous,
    );
    expect(await store.getPendingDelta('oci', 'quay-public')).toEqual(delta);
    await client.raw('DROP TRIGGER fail_clear');
    await store.commitStateAndClearPending('oci', 'quay-public', state);
    expect(await store.getCommittedState('oci', 'quay-public')).toEqual(state);
  });
});
