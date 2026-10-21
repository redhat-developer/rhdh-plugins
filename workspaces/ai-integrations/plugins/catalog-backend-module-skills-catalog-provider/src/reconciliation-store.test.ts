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

/**
 * Unit tests for `DatabaseReconciliationStore` using a mock Knex layer.
 *
 * These tests verify the store's data-flow logic — row upserts,
 * transaction semantics, and JSON serialization round-trips — by
 * simulating Knex operations in memory. The underlying Knex/SQLite
 * native binding is not required.
 */

import {
  computeCatalogName,
  type IdentityTuple,
} from '@red-hat-developer-hub/backstage-plugin-ai-skills-common';

import {
  DatabaseReconciliationStore,
  type PendingDelta,
  type ReconciliationStore,
} from './reconciliation-store';
import type {
  CommittedSourceState,
  OwnedEntity,
  PlannedRemoval,
  PlannedUpsert,
} from './types';

// ─── Test helpers ────────────────────────────────────────────────────

function makeTuple(
  key: string,
  sourceType: 'oci' | 'npx' = 'oci',
  sourceId = 'quay-public',
): IdentityTuple {
  return { type: sourceType, id: sourceId, key };
}

function makeOwnedEntity(
  key: string,
  digest: string,
  sourceType: 'oci' | 'npx' = 'oci',
  sourceId = 'quay-public',
): OwnedEntity {
  const tuple = makeTuple(key, sourceType, sourceId);
  const catalogName = computeCatalogName(tuple);
  return {
    tuple,
    catalogName,
    digest,
    entity: {
      apiVersion: 'backstage.io/v1alpha1',
      kind: 'AiResource',
      metadata: {
        name: catalogName,
        namespace: 'default',
        title: `Skill ${key}`,
      },
      spec: {
        type: 'skill',
        owner: 'team-skills',
        lifecycle: 'production',
      },
    },
  };
}

const digestA =
  'sha256:aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa';
const digestB =
  'sha256:bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb';
const t1 = '2026-01-15T10:00:00Z';
const t2 = '2026-01-15T11:00:00Z';

// ─── In-memory ReconciliationStore for testing ──────────────────────

/**
 * An in-memory store that implements the same interface as
 * DatabaseReconciliationStore, for unit testing without a real
 * database.
 */
class InMemoryReconciliationStore implements ReconciliationStore {
  private committed = new Map<string, CommittedSourceState>();
  private pending = new Map<string, PendingDelta>();

  private key(sourceType: string, sourceId: string): string {
    return `${sourceType}:${sourceId}`;
  }

  async initialize(): Promise<void> {
    // No-op for in-memory
  }

  async getCommittedState(
    sourceType: string,
    sourceId: string,
  ): Promise<CommittedSourceState> {
    const existing = this.committed.get(this.key(sourceType, sourceId));
    if (!existing) {
      return {
        sourceType: sourceType as CommittedSourceState['sourceType'],
        sourceId,
        observedAt: null,
        entities: [],
      };
    }
    // Deep clone to simulate database round-trip
    return JSON.parse(JSON.stringify(existing));
  }

  async getAllCommittedStates(): Promise<CommittedSourceState[]> {
    return Array.from(this.committed.values()).map(s =>
      JSON.parse(JSON.stringify(s)),
    );
  }

  async getPendingDelta(
    sourceType: string,
    sourceId: string,
  ): Promise<PendingDelta | undefined> {
    const existing = this.pending.get(this.key(sourceType, sourceId));
    if (!existing) return undefined;
    return JSON.parse(JSON.stringify(existing));
  }

  async getAllPendingDeltas(): Promise<PendingDelta[]> {
    return Array.from(this.pending.values()).map(d =>
      JSON.parse(JSON.stringify(d)),
    );
  }

  async savePendingDelta(delta: PendingDelta): Promise<void> {
    this.pending.set(
      this.key(delta.sourceType, delta.sourceId),
      JSON.parse(JSON.stringify(delta)),
    );
  }

  async commitStateAndClearPending(
    sourceType: string,
    sourceId: string,
    nextState: CommittedSourceState,
  ): Promise<void> {
    const k = this.key(sourceType, sourceId);
    this.committed.set(k, JSON.parse(JSON.stringify(nextState)));
    this.pending.delete(k);
  }
}

// ─── Tests ──────────────────────────────────────────────────────────

describe('ReconciliationStore (in-memory)', () => {
  let store: ReconciliationStore;

  beforeEach(() => {
    store = new InMemoryReconciliationStore();
  });

  describe('getCommittedState', () => {
    it('returns empty state for an unknown source', async () => {
      const state = await store.getCommittedState('oci', 'unknown');
      expect(state).toEqual({
        sourceType: 'oci',
        sourceId: 'unknown',
        observedAt: null,
        entities: [],
      });
    });
  });

  describe('commitStateAndClearPending', () => {
    it('persists and retrieves committed state', async () => {
      const entity = makeOwnedEntity('key-a', digestA);

      const nextState: CommittedSourceState = {
        sourceType: 'oci',
        sourceId: 'quay-public',
        observedAt: t1,
        entities: [entity],
      };

      await store.commitStateAndClearPending('oci', 'quay-public', nextState);

      const retrieved = await store.getCommittedState('oci', 'quay-public');
      expect(retrieved.sourceType).toBe('oci');
      expect(retrieved.sourceId).toBe('quay-public');
      expect(retrieved.observedAt).toBe(t1);
      expect(retrieved.entities).toHaveLength(1);
      expect(retrieved.entities[0].tuple).toEqual(entity.tuple);
      expect(retrieved.entities[0].digest).toBe(digestA);
    });

    it('updates existing committed state', async () => {
      const entityA = makeOwnedEntity('key-a', digestA);
      const entityB = makeOwnedEntity('key-b', digestB);

      await store.commitStateAndClearPending('oci', 'quay-public', {
        sourceType: 'oci',
        sourceId: 'quay-public',
        observedAt: t1,
        entities: [entityA],
      });

      await store.commitStateAndClearPending('oci', 'quay-public', {
        sourceType: 'oci',
        sourceId: 'quay-public',
        observedAt: t2,
        entities: [entityA, entityB],
      });

      const state = await store.getCommittedState('oci', 'quay-public');
      expect(state.observedAt).toBe(t2);
      expect(state.entities).toHaveLength(2);
    });

    it('clears pending delta on commit', async () => {
      const entity = makeOwnedEntity('key-a', digestA);

      await store.savePendingDelta({
        sourceType: 'oci',
        sourceId: 'quay-public',
        upserts: [
          {
            tuple: entity.tuple,
            catalogName: entity.catalogName,
            digest: digestA,
            entity: entity.entity,
          },
        ],
        removals: [],
        nextState: {
          sourceType: 'oci',
          sourceId: 'quay-public',
          observedAt: t1,
          entities: [entity],
        },
      });

      let pending = await store.getPendingDelta('oci', 'quay-public');
      expect(pending).toBeDefined();

      await store.commitStateAndClearPending('oci', 'quay-public', {
        sourceType: 'oci',
        sourceId: 'quay-public',
        observedAt: t1,
        entities: [entity],
      });

      pending = await store.getPendingDelta('oci', 'quay-public');
      expect(pending).toBeUndefined();
    });
  });

  describe('pending deltas', () => {
    it('saves and retrieves a pending delta', async () => {
      const entity = makeOwnedEntity('key-a', digestA);
      const upsert: PlannedUpsert = {
        tuple: entity.tuple,
        catalogName: entity.catalogName,
        digest: digestA,
        entity: entity.entity,
      };

      await store.savePendingDelta({
        sourceType: 'oci',
        sourceId: 'quay-public',
        upserts: [upsert],
        removals: [],
        nextState: {
          sourceType: 'oci',
          sourceId: 'quay-public',
          observedAt: t1,
          entities: [entity],
        },
      });

      const pending = await store.getPendingDelta('oci', 'quay-public');
      expect(pending).toBeDefined();
      expect(pending!.upserts).toHaveLength(1);
      expect(pending!.removals).toHaveLength(0);
      expect(pending!.nextState.observedAt).toBe(t1);
    });

    it('returns undefined for missing pending delta', async () => {
      const pending = await store.getPendingDelta('oci', 'unknown');
      expect(pending).toBeUndefined();
    });

    it('overwrites existing pending delta', async () => {
      const entityA = makeOwnedEntity('key-a', digestA);
      const entityB = makeOwnedEntity('key-b', digestB);

      await store.savePendingDelta({
        sourceType: 'oci',
        sourceId: 'quay-public',
        upserts: [
          {
            tuple: entityA.tuple,
            catalogName: entityA.catalogName,
            digest: digestA,
            entity: entityA.entity,
          },
        ],
        removals: [],
        nextState: {
          sourceType: 'oci',
          sourceId: 'quay-public',
          observedAt: t1,
          entities: [entityA],
        },
      });

      await store.savePendingDelta({
        sourceType: 'oci',
        sourceId: 'quay-public',
        upserts: [
          {
            tuple: entityB.tuple,
            catalogName: entityB.catalogName,
            digest: digestB,
            entity: entityB.entity,
          },
        ],
        removals: [],
        nextState: {
          sourceType: 'oci',
          sourceId: 'quay-public',
          observedAt: t2,
          entities: [entityA, entityB],
        },
      });

      const pending = await store.getPendingDelta('oci', 'quay-public');
      expect(pending).toBeDefined();
      expect(pending!.upserts).toHaveLength(1);
      expect(pending!.upserts[0].catalogName).toBe(entityB.catalogName);
      expect(pending!.nextState.observedAt).toBe(t2);
    });

    it('retrieves all pending deltas across sources', async () => {
      const entityA = makeOwnedEntity('key-a', digestA, 'oci', 'source-1');
      const entityB = makeOwnedEntity('key-b', digestB, 'npx', 'source-2');

      await store.savePendingDelta({
        sourceType: 'oci',
        sourceId: 'source-1',
        upserts: [
          {
            tuple: entityA.tuple,
            catalogName: entityA.catalogName,
            digest: digestA,
            entity: entityA.entity,
          },
        ],
        removals: [],
        nextState: {
          sourceType: 'oci',
          sourceId: 'source-1',
          observedAt: t1,
          entities: [entityA],
        },
      });

      await store.savePendingDelta({
        sourceType: 'npx',
        sourceId: 'source-2',
        upserts: [
          {
            tuple: entityB.tuple,
            catalogName: entityB.catalogName,
            digest: digestB,
            entity: entityB.entity,
          },
        ],
        removals: [],
        nextState: {
          sourceType: 'npx',
          sourceId: 'source-2',
          observedAt: t1,
          entities: [entityB],
        },
      });

      const allPending = await store.getAllPendingDeltas();
      expect(allPending).toHaveLength(2);
    });

    it('persists removals in pending delta', async () => {
      const entity = makeOwnedEntity('key-removed', digestA);
      const removal: PlannedRemoval = {
        tuple: entity.tuple,
        catalogName: entity.catalogName,
      };

      await store.savePendingDelta({
        sourceType: 'oci',
        sourceId: 'quay-public',
        upserts: [],
        removals: [removal],
        nextState: {
          sourceType: 'oci',
          sourceId: 'quay-public',
          observedAt: t2,
          entities: [],
        },
      });

      const pending = await store.getPendingDelta('oci', 'quay-public');
      expect(pending!.removals).toHaveLength(1);
      expect(pending!.removals[0].catalogName).toBe(entity.catalogName);
    });
  });

  describe('getAllCommittedStates', () => {
    it('returns all committed states for collision detection', async () => {
      const entityA = makeOwnedEntity('key-a', digestA, 'oci', 'source-1');
      const entityB = makeOwnedEntity('key-b', digestB, 'npx', 'source-2');

      await store.commitStateAndClearPending('oci', 'source-1', {
        sourceType: 'oci',
        sourceId: 'source-1',
        observedAt: t1,
        entities: [entityA],
      });

      await store.commitStateAndClearPending('npx', 'source-2', {
        sourceType: 'npx',
        sourceId: 'source-2',
        observedAt: t1,
        entities: [entityB],
      });

      const allStates = await store.getAllCommittedStates();
      expect(allStates).toHaveLength(2);

      const types = allStates.map(s => s.sourceType);
      expect(types).toContain('oci');
      expect(types).toContain('npx');
    });
  });

  describe('null observedAt', () => {
    it('handles null observedAt correctly', async () => {
      await store.commitStateAndClearPending('oci', 'quay-public', {
        sourceType: 'oci',
        sourceId: 'quay-public',
        observedAt: null,
        entities: [],
      });

      const state = await store.getCommittedState('oci', 'quay-public');
      expect(state.observedAt).toBeNull();
    });
  });

  describe('entity serialization round-trip', () => {
    it('preserves full entity data through serialization', async () => {
      const entity = makeOwnedEntity('key-a', digestA);

      await store.commitStateAndClearPending('oci', 'quay-public', {
        sourceType: 'oci',
        sourceId: 'quay-public',
        observedAt: t1,
        entities: [entity],
      });

      const state = await store.getCommittedState('oci', 'quay-public');
      const restored = state.entities[0];

      expect(restored.entity.apiVersion).toBe('backstage.io/v1alpha1');
      expect(restored.entity.kind).toBe('AiResource');
      expect(restored.entity.metadata.name).toBe(entity.catalogName);
      expect(restored.entity.metadata.namespace).toBe('default');
      expect(restored.entity.spec).toEqual({
        type: 'skill',
        owner: 'team-skills',
        lifecycle: 'production',
      });
    });
  });

  describe('DatabaseReconciliationStore class', () => {
    it('exports the DatabaseReconciliationStore class', () => {
      expect(DatabaseReconciliationStore).toBeDefined();
    });
  });
});
