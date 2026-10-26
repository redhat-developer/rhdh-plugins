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
import { stringifyEntityRef, type Entity } from '@backstage/catalog-model';
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
const source = {
  connectorPluginId: 'skill-image-connector',
  sourceId: ociSource.id,
  sourceType: 'oci' as const,
};
const npx = {
  connectorPluginId: 'npx-skills-connector',
  sourceId: npxSource.id,
  sourceType: 'npx' as const,
};
const originalFetch = global.fetch;

describe('D8 provider acknowledgment safety with real SQLite', () => {
  let database: Awaited<ReturnType<typeof createDurableTestDatabase>>;
  let current: SkillSnapshot;
  let revision: string;
  let autoProcess: boolean;
  let submitted: Map<string, Entity>;
  let processed: Map<string, Entity>;
  let fetchMock: jest.Mock;
  let responseStatus: number;
  let logger: ReturnType<typeof mockServices.logger.mock>;
  let connection: EntityProviderConnection;
  let catalogApi: { getEntitiesByRefs: jest.Mock };

  beforeEach(async () => {
    database = await createDurableTestDatabase();
    logger = mockServices.logger.mock();
    logger.child.mockReturnValue(logger);
    current = {
      schemaVersion: '1',
      source: ociSource,
      status: 'ready',
      observedAt: t1,
      skills: [validOciRecordFull],
      failedSkillKeys: [],
    };
    revision = '7';
    autoProcess = true;
    responseStatus = 204;
    submitted = new Map();
    processed = new Map();
    fetchMock = jest.fn(async (url: string, options?: RequestInit) => {
      if (options?.method === 'POST')
        return {
          status: responseStatus,
          text: async (): Promise<string> => '',
        };
      const value = url.includes(npxSource.id)
        ? { ...current, source: npxSource, skills: [validNpxRecordFull] }
        : current;
      return {
        ok: true,
        status: 200,
        headers: new Headers({ 'X-Skilldocs-Revision': revision }),
        text: async () => JSON.stringify(value),
      };
    });
    global.fetch = fetchMock;
    catalogApi = {
      getEntitiesByRefs: jest.fn(
        async ({ entityRefs }: { entityRefs: string[] }) => ({
          items: entityRefs.map(ref => processed.get(ref)),
        }),
      ),
    };
    connection = {
      applyMutation: jest.fn(async mutation => {
        if (mutation.type !== 'delta') throw new Error('Expected delta');
        for (const entry of mutation.added)
          submitted.set(stringifyEntityRef(entry.entity), entry.entity);
        for (const entry of mutation.removed)
          submitted.delete(
            'entityRef' in entry
              ? entry.entityRef
              : stringifyEntityRef(entry.entity),
          );
        if (autoProcess) processed = new Map(submitted);
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
    sources: SkillsCatalogProviderConfig['sources'] = [source],
    base = 'https://rhdh.example/prefix/api',
  ) {
    let run: (() => Promise<void>) | undefined;
    const provider = new SkillsCatalogProvider(
      {
        id: 'test',
        sources,
        namespace: 'default',
        defaultOwner: 'team-skills',
        defaultLifecycle: 'production',
      },
      mockServices.discovery.mock({ getBaseUrl: async id => `${base}/${id}` }),
      mockServices.auth.mock({
        getOwnServiceCredentials: jest
          .fn()
          .mockResolvedValue({ principal: { subject: 'plugin:catalog' } }),
        getPluginRequestToken: jest
          .fn()
          .mockResolvedValue({ token: 'test-service-token' }),
      }),
      logger,
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
    return { provider, run: () => run!() };
  }
  const posts = (mock: jest.Mock) =>
    mock.mock.calls.filter(([, options]) => options?.method === 'POST');
  const polls = (mock: jest.Mock) =>
    mock.mock.calls.filter(([, options]) => options?.method !== 'POST');

  it('never releases before catalog visibility and does not replace pending work as the connector advances', async () => {
    const { store } = await database.open();
    autoProcess = false;
    const provider = await start(store);
    await provider.run();
    const pending = await store.getPendingAcknowledgment('oci', ociSource.id);
    expect(pending?.revision).toBe('7');
    expect(posts(fetchMock)).toHaveLength(0);
    revision = '8';
    current = { ...current, observedAt: t2 };
    fetchMock.mockClear();
    await provider.run();
    expect(polls(fetchMock)).toHaveLength(0);
    expect(await store.getPendingAcknowledgment('oci', ociSource.id)).toEqual(
      pending,
    );
    processed = new Map(submitted);
    await provider.run();
    expect(
      posts(fetchMock).map(([, options]) => JSON.parse(options.body).revision),
    ).toEqual(['7', '8']);
    expect(
      await store.getPendingAcknowledgment('oci', ociSource.id),
    ).toBeUndefined();
  });

  it('queries stale URLs and removals before release, while an independent npx source continues', async () => {
    const { store } = await database.open();
    const provider = await start(store, [source, npx]);
    await provider.run();
    autoProcess = false;
    current = { ...current, observedAt: t2, skills: [] };
    revision = '8';
    await provider.run();
    const pending = await store.getPendingAcknowledgment('oci', ociSource.id);
    expect(pending?.expectedRemovals).toHaveLength(1);
    fetchMock.mockClear();
    await provider.run();
    expect(polls(fetchMock).map(([url]) => url)).toEqual([
      expect.stringContaining(npxSource.id),
    ]);
    expect(posts(fetchMock)).toHaveLength(0);
    processed = new Map(submitted);
    await provider.run();
    expect(posts(fetchMock).length).toBeGreaterThan(0);
  });

  it('persists full acknowledgment context before mutation and delivers recovered work before a newer poll', async () => {
    const first = await database.open();
    jest
      .spyOn(first.store, 'commitStateAndSaveAcknowledgment')
      .mockRejectedValueOnce(new Error('crash after apply'));
    await (await start(first.store)).run();
    const pending = await first.store.getPendingDelta('oci', ociSource.id);
    expect(pending?.acknowledgment?.revision).toBe('7');
    expect(pending?.acknowledgment?.expectedEntityUrls).toEqual(
      Object.fromEntries(
        [...submitted].map(([ref, entity]) => [
          ref,
          entity.metadata.annotations!['backstage.io/techdocs-ref'],
        ]),
      ),
    );
    await first.client.destroy();
    const second = await database.open();
    fetchMock.mockClear();
    current = { ...current, observedAt: t2 };
    revision = '8';
    await (await start(second.store)).run();
    expect(fetchMock.mock.calls[0][1]?.method).toBe('POST');
    expect(JSON.parse(fetchMock.mock.calls[0][1].body).revision).toBe('7');
    expect(
      await second.store.getPendingDelta('oci', ociSource.id),
    ).toBeUndefined();
  });

  it('never creates a release acknowledgment by replaying a partial snapshot', async () => {
    const first = await database.open();
    current = { ...current, status: 'partial' };
    jest
      .spyOn(first.store, 'commitStateAndClearPending')
      .mockRejectedValueOnce(new Error('crash after partial mutation'));
    await (await start(first.store)).run();
    const pending = await first.store.getPendingDelta('oci', ociSource.id);
    expect(pending?.revision).toBeUndefined();
    await first.client.destroy();
    const second = await database.open();
    fetchMock.mockClear();
    await (await start(second.store)).run();
    expect(posts(fetchMock)).toHaveLength(0);
    expect(
      await second.store.getPendingAcknowledgment('oci', ociSource.id),
    ).toBeUndefined();
  });

  it('keeps stale processed documentation URLs pending and never requests artifact/Markdown content', async () => {
    const { store } = await database.open();
    const provider = await start(store, [source, npx]);
    await provider.run();
    const initial = [...processed.values()].find(
      entity => entity.metadata.annotations?.['backstage.io/techdocs-ref'],
    )!;
    expect(
      [...processed.values()].find(
        entity => !entity.metadata.annotations?.['backstage.io/techdocs-ref'],
      ),
    ).toBeDefined();
    autoProcess = false;
    const digest = `sha256:${'b'.repeat(64)}`;
    current = {
      ...current,
      observedAt: t2,
      skills: [
        {
          ...validOciRecordFull,
          digest,
          sourceUri: `oci://quay.io/octo/hello-world-skill@${digest}`,
        },
      ],
    };
    revision = '8';
    fetchMock.mockClear();
    await provider.run();
    const pending = await store.getPendingAcknowledgment('oci', ociSource.id);
    expect(Object.values(pending!.expectedEntityUrls)).not.toContain(
      initial.metadata.annotations!['backstage.io/techdocs-ref'],
    );
    expect(posts(fetchMock)).toHaveLength(0);
    await provider.run();
    expect(posts(fetchMock)).toHaveLength(0);
    for (const [url, options] of fetchMock.mock.calls) {
      expect(options?.method === 'POST' || url.includes('/skills/')).toBe(true);
      expect(url.startsWith('https://rhdh.example/prefix/api/')).toBe(true);
    }
    processed = new Map(submitted);
    await provider.run();
    expect(
      posts(fetchMock).map(
        ([, options]) => JSON.parse(options.body).retainedDigests,
      ),
    ).toContainEqual([digest]);
  });

  it('does not release legacy revision-only work whose snapshot completeness cannot be established', async () => {
    const { store } = await database.open();
    const provider = await start(store);
    await provider.run();
    const state = await store.getCommittedState('oci', ociSource.id);
    await store.savePendingDelta({
      sourceType: 'oci',
      sourceId: ociSource.id,
      revision: '6',
      upserts: state.entities,
      removals: [],
      nextState: state,
    });
    current = { ...current, status: 'loading', observedAt: null, skills: [] };
    fetchMock.mockClear();
    await provider.run();
    expect(posts(fetchMock)).toHaveLength(0);
    expect(await store.getPendingDelta('oci', ociSource.id)).toBeDefined();
    expect(polls(fetchMock)).toHaveLength(0);
  });

  it('does not accept truncated catalog visibility responses as proof of removal', async () => {
    const { store } = await database.open();
    const provider = await start(store);
    await provider.run();
    current = { ...current, observedAt: t2, skills: [] };
    revision = '8';
    catalogApi.getEntitiesByRefs.mockResolvedValue({ items: [] });
    fetchMock.mockClear();
    await provider.run();
    expect(posts(fetchMock)).toHaveLength(0);
    expect(
      (await store.getPendingAcknowledgment('oci', ociSource.id))
        ?.expectedRemovals,
    ).toHaveLength(1);
  });

  it('uses the discovered base path and encodes source/digest segments once without fetching Markdown', async () => {
    const { store } = await database.open();
    const configured = { ...source, sourceId: 'team/skills%25' };
    current = { ...current, source: { id: configured.sourceId, type: 'oci' } };
    await (await start(store, [configured])).run();
    const base = 'https://rhdh.example/prefix/api/skill-image-connector';
    const encoded = encodeURIComponent(configured.sourceId);
    const entity = [...processed.values()][0];
    expect(entity.metadata.annotations!['backstage.io/techdocs-ref']).toBe(
      `url:${base}/skilldocs/${encoded}/${encodeURIComponent(
        validOciRecordFull.digest,
      )}`,
    );
    expect(fetchMock.mock.calls.map(([url]) => url)).toEqual([
      `${base}/skills/${encoded}`,
      `${base}/skilldocs/${encoded}/reconcile`,
    ]);
  });

  it('does not acknowledge an ignored stale ready observation', async () => {
    const { store } = await database.open();
    current = { ...current, observedAt: t2 };
    const provider = await start(store);
    await provider.run();
    current = { ...current, observedAt: t1 };
    revision = '8';
    fetchMock.mockClear();
    await provider.run();
    expect(posts(fetchMock)).toHaveLength(0);
    expect(
      (await store.getCommittedState('oci', ociSource.id)).observedAt,
    ).toBe(t2);
  });

  it('upserts a missing TechDocs annotation without changing digest or observation timestamp', async () => {
    const { store } = await database.open();
    const provider = await start(store);
    await provider.run();
    const old = await store.getCommittedState('oci', ociSource.id);
    for (const entity of old.entities)
      delete entity.entity.metadata.annotations!['backstage.io/techdocs-ref'];
    await store.commitStateAndClearPending('oci', ociSource.id, old);
    submitted = new Map(
      old.entities.map(entity => [
        stringifyEntityRef(entity.entity),
        entity.entity,
      ]),
    );
    processed = new Map(submitted);
    (connection.applyMutation as jest.Mock).mockClear();
    await provider.run();
    expect(connection.applyMutation).toHaveBeenCalledTimes(1);
    expect(
      [...processed.values()][0].metadata.annotations![
        'backstage.io/techdocs-ref'
      ],
    ).toContain('/prefix/api/skill-image-connector/skilldocs/');
  });

  it.each([204, 409])(
    'preserves pending acknowledgment and blocks polling when %s cleanup fails',
    async status => {
      const { store } = await database.open();
      autoProcess = false;
      const provider = await start(store);
      await provider.run();
      const pending = await store.getPendingAcknowledgment('oci', ociSource.id);
      processed = new Map(submitted);
      responseStatus = status;
      jest
        .spyOn(store, 'clearPendingAcknowledgment')
        .mockRejectedValueOnce(new Error('database unavailable'));
      fetchMock.mockClear();
      await provider.run();
      expect(polls(fetchMock)).toHaveLength(0);
      expect(await store.getPendingAcknowledgment('oci', ociSource.id)).toEqual(
        pending,
      );
      await provider.run();
      expect(
        await store.getPendingAcknowledgment('oci', ociSource.id),
      ).toBeUndefined();
    },
  );

  it.each(['initial', 'retry'])(
    'logs %s delivery failures once and preserves pending work',
    async phase => {
      const { store } = await database.open();
      autoProcess = phase === 'initial';
      const provider = await start(store);
      if (phase === 'retry') {
        await provider.run();
        processed = new Map(submitted);
      }
      const respond = fetchMock.getMockImplementation()!;
      fetchMock.mockImplementation(async (url, options) => {
        if (options?.method === 'POST') throw new Error('connector offline');
        return respond(url, options);
      });
      fetchMock.mockClear();
      logger.error.mockClear();
      await provider.run();
      expect(logger.error).toHaveBeenCalledTimes(1);
      expect(logger.error).toHaveBeenCalledWith(
        expect.stringContaining('connector offline'),
      );
      expect(
        await store.getPendingAcknowledgment('oci', ociSource.id),
      ).toBeDefined();
      expect(polls(fetchMock)).toHaveLength(phase === 'retry' ? 0 : 1);
    },
  );

  it('keeps catalog-query failures pending without polling and propagates pending-list failure', async () => {
    const { store } = await database.open();
    autoProcess = false;
    const provider = await start(store);
    await provider.run();
    catalogApi.getEntitiesByRefs.mockRejectedValue(
      new Error('catalog offline'),
    );
    fetchMock.mockClear();
    await provider.run();
    expect(fetchMock).not.toHaveBeenCalled();
    jest
      .spyOn(store, 'getAllPendingAcknowledgments')
      .mockRejectedValueOnce(new Error('cannot load acknowledgments'));
    await expect(provider.run()).rejects.toThrow('cannot load acknowledgments');
    expect(fetchMock).not.toHaveBeenCalled();
  });
});
