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

import { mockServices } from '@backstage/backend-test-utils';
import type { Entity } from '@backstage/catalog-model';
import { stringifyEntityRef } from '@backstage/catalog-model';
import type { EntityProviderConnection } from '@backstage/plugin-catalog-node';
import {
  validOciRecordFull,
  validNpxRecordFull,
  ociSource,
  npxSource,
} from '@red-hat-developer-hub/backstage-plugin-ai-skills-common';
import type { SkillSnapshot } from '@red-hat-developer-hub/backstage-plugin-ai-skills-common';
import { SkillsCatalogProvider } from './SkillsCatalogProvider';
import { createDurableTestDatabase } from './testUtils';
import type { ReconciliationStore } from './reconciliation-store';
import type { SkillsCatalogProviderConfig } from './types';

const t1 = '2026-01-15T10:00:00Z';
const t2 = '2026-01-15T11:00:00Z';
const t3 = '2026-01-15T12:00:00Z';
function snapshot(overrides: Partial<SkillSnapshot> = {}): SkillSnapshot {
  return {
    schemaVersion: '1',
    source: ociSource,
    status: 'ready',
    observedAt: t1,
    skills: [validOciRecordFull],
    failedSkillKeys: [],
    ...overrides,
  };
}
const ociConfig = {
  connectorPluginId: 'skill-image-connector',
  sourceId: ociSource.id,
  sourceType: 'oci' as const,
};
const npxConfig = {
  connectorPluginId: 'npx-skills-connector',
  sourceId: npxSource.id,
  sourceType: 'npx' as const,
};

describe('SkillsCatalogProvider durable lifecycle', () => {
  let database: Awaited<ReturnType<typeof createDurableTestDatabase>>;
  let current: SkillSnapshot;
  let npxCurrent: SkillSnapshot;
  let fetchMock: jest.Mock;
  let catalog: Map<string, Entity>;
  let connection: EntityProviderConnection;
  const originalFetch = global.fetch;

  beforeEach(async () => {
    database = await createDurableTestDatabase();
    current = snapshot();
    npxCurrent = snapshot({ source: npxSource, skills: [validNpxRecordFull] });
    fetchMock = jest.fn(async (url: string) => {
      const value = url.includes(npxSource.id) ? npxCurrent : current;
      return {
        ok: true,
        status: 200,
        headers: new Headers(),
        text: async () => JSON.stringify(value),
      };
    });
    global.fetch = fetchMock;
    catalog = new Map();
    connection = {
      applyMutation: jest.fn(async mutation => {
        if (mutation.type !== 'delta') throw new Error('Expected delta');
        for (const entry of mutation.added)
          catalog.set(stringifyEntityRef(entry.entity), entry.entity);
        for (const entry of mutation.removed) {
          catalog.delete(
            'entityRef' in entry
              ? entry.entityRef
              : stringifyEntityRef(entry.entity),
          );
        }
      }),
      refresh: jest.fn(),
    };
  });
  afterEach(async () => {
    global.fetch = originalFetch;
    jest.restoreAllMocks();
    await database.close();
  });

  async function start(
    store: ReconciliationStore,
    sources = [ociConfig] as SkillsCatalogProviderConfig['sources'],
    namespace = 'default',
  ) {
    let run: (() => Promise<void>) | undefined;
    const auth = mockServices.auth.mock({
      getOwnServiceCredentials: jest
        .fn()
        .mockResolvedValue({ principal: { subject: 'plugin:catalog' } }),
      getPluginRequestToken: jest
        .fn()
        .mockResolvedValue({ token: 'test-token' }),
    });
    const testLogger = mockServices.logger.mock();
    const catalogApi = {
      getEntitiesByRefs: jest.fn(
        async ({ entityRefs }: { entityRefs: string[] }) => ({
          items: entityRefs.map(ref => catalog.get(ref)),
        }),
      ),
    };
    const provider = new SkillsCatalogProvider(
      {
        id: 'test',
        sources,
        namespace,
        defaultOwner: 'team-skills',
        defaultLifecycle: 'production',
      },
      mockServices.discovery.mock({
        getBaseUrl: async id => `http://localhost/api/${id}`,
      }),
      auth,
      testLogger,
      {
        run: async options => {
          run = async () => {
            await options.fn(new AbortController().signal);
          };
        },
      },
      store,
      catalogApi,
    );
    await provider.connect(connection);
    return { run: () => run!(), auth };
  }

  it.each(['loading', 'failed', 'unavailable'] as const)(
    'preserves recovered ownership during %s after a real database reopen',
    async status => {
      const first = await database.open();
      await (await start(first.store)).run();
      const before = await first.store.getCommittedState('oci', ociSource.id);
      await first.client.destroy();
      const second = await database.open();
      if (status === 'unavailable')
        fetchMock.mockRejectedValue(new Error('offline'));
      else
        current = snapshot({
          status,
          skills: [],
          observedAt: status === 'loading' ? null : t2,
        });
      (connection.applyMutation as jest.Mock).mockClear();
      await (await start(second.store)).run();
      expect(await second.store.getCommittedState('oci', ociSource.id)).toEqual(
        before,
      );
      expect(connection.applyMutation).not.toHaveBeenCalled();
      expect(catalog.size).toBe(1);
    },
  );

  it('recovers an applied addition before consuming newer empty discovery and removes it without an orphan', async () => {
    const first = await database.open();
    jest
      .spyOn(first.store, 'commitStateAndClearPending')
      .mockRejectedValueOnce(new Error('crash after catalog apply'));
    await (await start(first.store)).run();
    expect(catalog.size).toBe(1);
    expect(
      (await first.store.getCommittedState('oci', ociSource.id)).observedAt,
    ).toBeNull();
    const pending = await first.store.getPendingDelta('oci', ociSource.id);
    expect(pending).toBeDefined();
    await first.client.destroy();
    const second = await database.open();
    current = snapshot({ observedAt: t2, skills: [] });
    fetchMock.mockClear();
    const apply = connection.applyMutation as jest.Mock;
    apply.mockClear();
    const restarted = await start(second.store);
    await restarted.run();
    expect(apply).toHaveBeenCalledTimes(2);
    expect(apply.mock.invocationCallOrder[0]).toBeLessThan(
      fetchMock.mock.invocationCallOrder[0],
    );
    expect(catalog.size).toBe(0);
    expect(
      await second.store.getPendingDelta('oci', ociSource.id),
    ).toBeUndefined();
    expect(
      (await second.store.getCommittedState('oci', ociSource.id)).entities,
    ).toEqual([]);
    await restarted.run();
    expect(apply).toHaveBeenCalledTimes(2);
  });

  it.each(['loading', 'empty-ready', 'new-ready'] as const)(
    'keeps failed replay pending and does not consume %s for that source while another source progresses',
    async next => {
      const { store } = await database.open();
      jest
        .spyOn(store, 'commitStateAndClearPending')
        .mockRejectedValueOnce(new Error('interrupted ownership commit'));
      await (await start(store)).run();
      const pending = await store.getPendingDelta('oci', ociSource.id);
      const before = await store.getCommittedState('oci', ociSource.id);
      expect(pending).toBeDefined();
      current =
        next === 'loading'
          ? snapshot({ status: 'loading', skills: [], observedAt: null })
          : snapshot({
              observedAt: t2,
              skills:
                next === 'empty-ready'
                  ? []
                  : [
                      {
                        ...validOciRecordFull,
                        key: 'quay.io/octo/hello-world-skill:v2',
                      },
                    ],
            });
      (connection.applyMutation as jest.Mock).mockRejectedValueOnce(
        new Error('replay unavailable'),
      );
      fetchMock.mockClear();
      await (await start(store, [ociConfig, npxConfig])).run();
      expect(fetchMock.mock.calls.map(([url]) => url)).toEqual([
        expect.stringContaining(npxSource.id),
      ]);
      expect(await store.getPendingDelta('oci', ociSource.id)).toEqual(pending);
      expect(await store.getCommittedState('oci', ociSource.id)).toEqual(
        before,
      );
      expect(
        (await store.getCommittedState('npx', npxSource.id)).entities,
      ).toHaveLength(1);
    },
  );

  it('blocks polling through repeated ownership-commit failures and replays idempotently on recovery', async () => {
    const { store } = await database.open();
    const commit = jest
      .spyOn(store, 'commitStateAndClearPending')
      .mockRejectedValue(new Error('database unavailable'));
    const provider = await start(store);
    await provider.run();
    const pending = await store.getPendingDelta('oci', ociSource.id);
    fetchMock.mockClear();
    await provider.run();
    expect(fetchMock).not.toHaveBeenCalled();
    expect(await store.getPendingDelta('oci', ociSource.id)).toEqual(pending);
    expect(
      (await store.getCommittedState('oci', ociSource.id)).observedAt,
    ).toBeNull();
    expect(catalog.size).toBe(1);
    commit.mockRestore();
    await provider.run();
    expect(await store.getPendingDelta('oci', ociSource.id)).toBeUndefined();
    expect(catalog.size).toBe(1);
    expect(
      (await store.getCommittedState('oci', ociSource.id)).entities,
    ).toHaveLength(1);
  });

  it('polls both connector contracts with tokens targeted to their receiving plugins', async () => {
    const { store } = await database.open();
    const provider = await start(store, [ociConfig, npxConfig]);
    await provider.run();
    expect(provider.auth.getPluginRequestToken).toHaveBeenCalledWith(
      expect.objectContaining({ targetPluginId: ociConfig.connectorPluginId }),
    );
    expect(provider.auth.getPluginRequestToken).toHaveBeenCalledWith(
      expect.objectContaining({ targetPluginId: npxConfig.connectorPluginId }),
    );
    expect(fetchMock.mock.calls.map(([url]) => url)).toEqual([
      expect.stringContaining(
        `/api/${ociConfig.connectorPluginId}/skills/${ociSource.id}`,
      ),
      expect.stringContaining(
        `/api/${npxConfig.connectorPluginId}/skills/${npxSource.id}`,
      ),
    ]);
    for (const [, options] of fetchMock.mock.calls)
      expect(options.headers.Authorization).toBe('Bearer test-token');
    expect(catalog.size).toBe(2);
  });

  it('retains a failed mutation and retries it without advancing committed observation', async () => {
    const { store } = await database.open();
    (connection.applyMutation as jest.Mock).mockRejectedValueOnce(
      new Error('catalog offline'),
    );
    const provider = await start(store);
    await provider.run();
    const pending = await store.getPendingDelta('oci', ociSource.id);
    expect(pending).toBeDefined();
    expect(
      (await store.getCommittedState('oci', ociSource.id)).observedAt,
    ).toBeNull();
    await provider.run();
    expect(await store.getPendingDelta('oci', ociSource.id)).toBeUndefined();
    expect(
      (await store.getCommittedState('oci', ociSource.id)).observedAt,
    ).toBe(t1);
    expect(catalog.size).toBe(1);
    await provider.run();
    expect(connection.applyMutation).toHaveBeenCalledTimes(2);
  });

  it('keeps same-digest tag aliases distinct, retains partial omissions, and updates a moving tag in place', async () => {
    const { store } = await database.open();
    const alias = {
      ...validOciRecordFull,
      key: 'quay.io/octo/hello-world-skill:alias',
    };
    current = snapshot({ skills: [validOciRecordFull, alias] });
    const provider = await start(store);
    await provider.run();
    const initial = await store.getCommittedState('oci', ociSource.id);
    expect(initial.entities).toHaveLength(2);
    expect(new Set(initial.entities.map(e => e.catalogName)).size).toBe(2);
    const changedDigest = `sha256:${'b'.repeat(64)}`;
    const moved = {
      ...validOciRecordFull,
      digest: changedDigest,
      sourceUri: `oci://quay.io/octo/hello-world-skill@${changedDigest}`,
    };
    current = snapshot({
      status: 'partial',
      observedAt: t2,
      skills: [moved],
      failedSkillKeys: [alias.key],
    });
    await provider.run();
    const partial = await store.getCommittedState('oci', ociSource.id);
    expect(partial.entities.map(e => e.catalogName).sort()).toEqual(
      initial.entities.map(e => e.catalogName).sort(),
    );
    expect(partial.entities.find(e => e.tuple.key === moved.key)?.digest).toBe(
      changedDigest,
    );
    expect(partial.entities.find(e => e.tuple.key === alias.key)?.digest).toBe(
      alias.digest,
    );
    expect(catalog.size).toBe(2);
    current = snapshot({ observedAt: t3, skills: [moved] });
    await provider.run();
    expect(catalog.size).toBe(1);
    expect(
      (await store.getCommittedState('oci', ociSource.id)).entities[0]
        .catalogName,
    ).toBe(initial.entities.find(e => e.tuple.key === moved.key)?.catalogName);
  });

  it('removes a disappeared entity from its persisted namespace after a restart with new configuration', async () => {
    const first = await database.open();
    await (await start(first.store)).run();
    await first.client.destroy();
    const second = await database.open();
    current = snapshot({ observedAt: t2, skills: [] });
    await (await start(second.store, [ociConfig], 'new-namespace')).run();
    expect(catalog.size).toBe(0);
    expect(
      (await second.store.getCommittedState('oci', ociSource.id)).entities,
    ).toEqual([]);
  });

  it('moves an unchanged skill to a new namespace even when the connector observation repeats', async () => {
    const { store } = await database.open();
    await (await start(store)).run();
    const oldRef = [...catalog.keys()][0];
    await (await start(store, [ociConfig], 'new-namespace')).run();
    expect(catalog.size).toBe(1);
    expect(catalog.has(oldRef)).toBe(false);
    expect([...catalog.keys()][0]).toContain('airesource:new-namespace/');
    expect(
      (await store.getCommittedState('oci', ociSource.id)).entities[0].entity
        .metadata.namespace,
    ).toBe('new-namespace');
  });

  it('retains both namespace identities on partial migration until a ready observation authorizes cleanup', async () => {
    const { store } = await database.open();
    await (await start(store)).run();
    current = snapshot({ status: 'partial', observedAt: t2 });
    const provider = await start(store, [ociConfig], 'new-namespace');
    await provider.run();
    expect(catalog.size).toBe(2);
    expect(
      (await store.getCommittedState('oci', ociSource.id)).entities,
    ).toHaveLength(2);
    current = snapshot({ observedAt: t2 });
    await provider.run();
    expect(catalog.size).toBe(1);
    expect([...catalog.keys()][0]).toContain('airesource:new-namespace/');
  });

  it.each([false, true])(
    'replays pending removals against their original namespace (legacy=%s)',
    async legacy => {
      const first = await database.open();
      const provider = await start(first.store);
      await provider.run();
      current = snapshot({ observedAt: t2, skills: [] });
      (connection.applyMutation as jest.Mock).mockRejectedValueOnce(
        new Error('catalog unavailable'),
      );
      await provider.run();
      const pending = (await first.store.getPendingDelta('oci', ociSource.id))!;
      expect(pending.removals).toHaveLength(1);
      if (legacy) {
        // Pre-upgrade pending rows did not carry the namespace/ref.
        await first.store.savePendingDelta({
          ...pending,
          removals: pending.removals.map(({ tuple, catalogName }) => ({
            tuple,
            catalogName,
          })),
        });
      }
      await first.client.destroy();
      const second = await database.open();
      await (await start(second.store, [ociConfig], 'new-namespace')).run();
      expect(catalog.size).toBe(0);
      expect(
        await second.store.getPendingDelta('oci', ociSource.id),
      ).toBeUndefined();
    },
  );

  it('preserves an unresolved legacy removal when its original committed identity cannot be recovered', async () => {
    const { store } = await database.open();
    const tuple = {
      type: 'oci' as const,
      id: ociSource.id,
      key: validOciRecordFull.key,
    };
    const pending = {
      sourceType: 'oci' as const,
      sourceId: ociSource.id,
      upserts: [],
      removals: [{ tuple, catalogName: 'missing-original-entity' }],
      nextState: {
        sourceType: 'oci' as const,
        sourceId: ociSource.id,
        observedAt: t1,
        entities: [],
      },
    };
    await store.savePendingDelta(pending);
    await (await start(store, [ociConfig], 'new-namespace')).run();
    expect(connection.applyMutation).not.toHaveBeenCalled();
    expect(fetchMock).not.toHaveBeenCalled();
    expect(await store.getPendingDelta('oci', ociSource.id)).toEqual(pending);
  });

  it('retains durable state on invalid connector responses', async () => {
    const { store } = await database.open();
    const provider = await start(store);
    await provider.run();
    const before = await store.getCommittedState('oci', ociSource.id);
    current = snapshot({
      observedAt: t2,
      skills: [{ ...validOciRecordFull, sourceUri: 'https://invalid.example' }],
    });
    await provider.run();
    expect(await store.getCommittedState('oci', ociSource.id)).toEqual(before);
    expect(connection.applyMutation).toHaveBeenCalledTimes(1);
  });
});
