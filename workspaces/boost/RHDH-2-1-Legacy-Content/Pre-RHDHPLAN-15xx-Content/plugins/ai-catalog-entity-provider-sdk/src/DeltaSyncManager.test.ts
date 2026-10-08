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

import type { Entity } from '@backstage/catalog-model';
import type { EntityProviderConnection } from '@backstage/plugin-catalog-node';
import { DeltaSyncManager, InMemoryCursorStore } from './DeltaSyncManager';

function makeEntity(name: string): Entity {
  return {
    apiVersion: 'backstage.io/v1alpha1',
    kind: 'Component',
    metadata: { name },
  };
}

describe('DeltaSyncManager', () => {
  let mockConnection: EntityProviderConnection;
  let cursorStore: InMemoryCursorStore;

  beforeEach(() => {
    mockConnection = {
      applyMutation: jest.fn(),
      refresh: jest.fn(),
    } as unknown as EntityProviderConnection;
    cursorStore = new InMemoryCursorStore();
  });

  it('should translate added and updated entities into delta mutation', async () => {
    const manager = new DeltaSyncManager({
      connection: mockConnection,
      cursorStore,
      locationKey: 'test-provider',
    });

    const entity1 = makeEntity('entity-1');
    const entity2 = makeEntity('entity-2');
    const entity3 = makeEntity('entity-3');

    await manager.applyDelta({
      added: [entity1, entity2],
      updated: [entity3],
      removed: [],
      nextCursor: 'cursor-1',
    });

    expect(mockConnection.applyMutation).toHaveBeenCalledTimes(1);
    const mutation = (mockConnection.applyMutation as jest.Mock).mock
      .calls[0][0];

    expect(mutation.type).toBe('delta');
    // added + updated are merged into the added array
    expect(mutation.added).toHaveLength(3);
    expect(mutation.added[0].entity).toBe(entity1);
    expect(mutation.added[1].entity).toBe(entity2);
    expect(mutation.added[2].entity).toBe(entity3);
    expect(mutation.added[0].locationKey).toBe('test-provider');
    expect(mutation.removed).toHaveLength(0);
  });

  it('should translate removed entity refs into delta mutation', async () => {
    const manager = new DeltaSyncManager({
      connection: mockConnection,
      cursorStore,
      locationKey: 'test-provider',
    });

    await manager.applyDelta({
      added: [],
      updated: [],
      removed: [{ entityRef: 'component:default/agent-foo' }],
      nextCursor: 'cursor-2',
    });

    const mutation = (mockConnection.applyMutation as jest.Mock).mock
      .calls[0][0];

    expect(mutation.type).toBe('delta');
    expect(mutation.added).toHaveLength(0);
    expect(mutation.removed).toHaveLength(1);
    expect(mutation.removed[0].entityRef).toBe('component:default/agent-foo');
    expect(mutation.removed[0].locationKey).toBe('test-provider');
  });

  it('should persist cursor after successful applyDelta', async () => {
    const manager = new DeltaSyncManager({
      connection: mockConnection,
      cursorStore,
      locationKey: 'test-provider',
    });

    await manager.applyDelta({
      added: [makeEntity('e1')],
      updated: [],
      removed: [],
      nextCursor: 'etag-abc123',
    });

    const cursor = await manager.getCursor();
    expect(cursor).toBe('etag-abc123');
  });

  it('should not overwrite cursor when nextCursor is omitted', async () => {
    const manager = new DeltaSyncManager({
      connection: mockConnection,
      cursorStore,
      locationKey: 'test-provider',
    });

    // Set initial cursor
    await manager.applyDelta({
      added: [makeEntity('e1')],
      updated: [],
      removed: [],
      nextCursor: 'cursor-initial',
    });

    // Apply delta without nextCursor
    await manager.applyDelta({
      added: [makeEntity('e2')],
      updated: [],
      removed: [],
    });

    const cursor = await manager.getCursor();
    expect(cursor).toBe('cursor-initial');
  });

  it('should return undefined when no cursor has been stored', async () => {
    const manager = new DeltaSyncManager({
      connection: mockConnection,
      cursorStore,
      locationKey: 'test-provider',
    });

    const cursor = await manager.getCursor();
    expect(cursor).toBeUndefined();
  });

  it('should clear cursor to trigger full refresh', async () => {
    const manager = new DeltaSyncManager({
      connection: mockConnection,
      cursorStore,
      locationKey: 'test-provider',
    });

    // Persist a cursor
    await manager.applyDelta({
      added: [makeEntity('e1')],
      updated: [],
      removed: [],
      nextCursor: 'etag-xyz',
    });
    expect(await manager.getCursor()).toBe('etag-xyz');

    // Clear it — simulates invalid cursor fallback
    await manager.clearCursor();
    expect(await manager.getCursor()).toBeUndefined();
  });

  it('should handle mixed additions, updates, and removals', async () => {
    const manager = new DeltaSyncManager({
      connection: mockConnection,
      cursorStore,
      locationKey: 'my-provider',
    });

    const added1 = makeEntity('new-agent');
    const updated1 = makeEntity('existing-agent');

    await manager.applyDelta({
      added: [added1],
      updated: [updated1],
      removed: [
        { entityRef: 'component:default/old-agent-1' },
        { entityRef: 'component:default/old-agent-2' },
      ],
      nextCursor: 'page-token-42',
    });

    const mutation = (mockConnection.applyMutation as jest.Mock).mock
      .calls[0][0];

    expect(mutation.type).toBe('delta');
    expect(mutation.added).toHaveLength(2);
    expect(mutation.removed).toHaveLength(2);
    expect(mutation.removed[0].entityRef).toBe('component:default/old-agent-1');
    expect(mutation.removed[1].entityRef).toBe('component:default/old-agent-2');

    expect(await manager.getCursor()).toBe('page-token-42');
  });

  it('should store lastSyncTimestamp alongside cursor', async () => {
    const manager = new DeltaSyncManager({
      connection: mockConnection,
      cursorStore,
      locationKey: 'test-provider',
    });

    const before = new Date().toISOString();

    await manager.applyDelta({
      added: [makeEntity('e1')],
      updated: [],
      removed: [],
      nextCursor: 'cursor-with-ts',
    });

    const state = await cursorStore.get('test-provider');
    expect(state).toBeDefined();
    expect(state!.cursor).toBe('cursor-with-ts');
    expect(state!.lastSyncTimestamp).toBeDefined();
    // Timestamp should be at or after the time we recorded
    expect(new Date(state!.lastSyncTimestamp).getTime()).toBeGreaterThanOrEqual(
      new Date(before).getTime(),
    );
  });
});

describe('InMemoryCursorStore', () => {
  it('should return undefined for unset keys', async () => {
    const store = new InMemoryCursorStore();
    expect(await store.get('nonexistent')).toBeUndefined();
  });

  it('should persist and retrieve cursor state', async () => {
    const store = new InMemoryCursorStore();
    const state = {
      cursor: 'abc',
      lastSyncTimestamp: '2026-07-08T10:00:00Z',
    };

    await store.set('provider-1', state);
    expect(await store.get('provider-1')).toEqual(state);
  });

  it('should delete cursor state', async () => {
    const store = new InMemoryCursorStore();
    await store.set('provider-1', {
      cursor: 'abc',
      lastSyncTimestamp: '2026-07-08T10:00:00Z',
    });

    await store.delete('provider-1');
    expect(await store.get('provider-1')).toBeUndefined();
  });

  it('should isolate cursors by providerId', async () => {
    const store = new InMemoryCursorStore();
    await store.set('provider-a', {
      cursor: 'cursor-a',
      lastSyncTimestamp: '2026-01-01T00:00:00Z',
    });
    await store.set('provider-b', {
      cursor: 'cursor-b',
      lastSyncTimestamp: '2026-01-02T00:00:00Z',
    });

    expect((await store.get('provider-a'))?.cursor).toBe('cursor-a');
    expect((await store.get('provider-b'))?.cursor).toBe('cursor-b');

    await store.delete('provider-a');
    expect(await store.get('provider-a')).toBeUndefined();
    expect((await store.get('provider-b'))?.cursor).toBe('cursor-b');
  });
});
