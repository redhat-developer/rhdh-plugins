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
import {
  computeCatalogName,
  type IdentityTuple,
} from '@red-hat-developer-hub/backstage-plugin-ai-skills-common';

import { calculateReconciliationPlan } from './reconciliation-planner';
import type {
  CommittedSourceState,
  ExternalOwnership,
  MappedSkillEntity,
  OwnedEntity,
  ReconciliationPlan,
} from './types';

// Narrow the discriminated union for type-safe reason access
type NoOpPlan = Extract<ReconciliationPlan, { noOp: true }>;

// ─── Test helpers ────────────────────────────────────────────────────

function makeTuple(
  key: string,
  sourceType: 'oci' | 'npx' = 'oci',
  sourceId = 'quay-public',
): IdentityTuple {
  return { type: sourceType, id: sourceId, key };
}

function makeEntity(name: string): Entity {
  return {
    apiVersion: 'backstage.io/v1alpha1',
    kind: 'AiResource',
    metadata: {
      name,
      namespace: 'default',
      title: `Skill ${name}`,
      annotations: {
        'rhdh.io/ai-asset-category': 'skill',
        'rhdh.io/ai-asset-version': '1.0.0',
      },
    },
    spec: {
      type: 'skill',
      owner: 'team-skills',
      lifecycle: 'production',
    },
  };
}

function makeMapped(
  key: string,
  digest: string,
  sourceType: 'oci' | 'npx' = 'oci',
  sourceId = 'quay-public',
): MappedSkillEntity {
  const tuple = makeTuple(key, sourceType, sourceId);
  const catalogName = computeCatalogName(tuple);
  return {
    tuple,
    catalogName,
    digest,
    entity: makeEntity(catalogName),
  };
}

function makeOwned(
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
    entity: makeEntity(catalogName),
  };
}

function emptyState(
  sourceType: 'oci' | 'npx' = 'oci',
  sourceId = 'quay-public',
): CommittedSourceState {
  return {
    sourceType,
    sourceId,
    observedAt: null,
    entities: [],
  };
}

// ─── Fixture digests ─────────────────────────────────────────────────

const digestA =
  'sha256:aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa';
const digestB =
  'sha256:bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb';
const digestC =
  'sha256:cccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccc';
const t1 = '2026-01-15T10:00:00Z';
const t2 = '2026-01-15T11:00:00Z';

// ─── Tests ───────────────────────────────────────────────────────────

describe('calculateReconciliationPlan', () => {
  describe('loading and failed statuses', () => {
    it('produces no mutation for loading status', () => {
      const plan = calculateReconciliationPlan({
        previousState: {
          ...emptyState(),
          observedAt: t1,
          entities: [makeOwned('key-a', digestA)],
        },
        snapshotStatus: 'loading',
        snapshotObservedAt: null,
        mappedEntities: [],
        externalOwnership: [],
      });

      expect(plan.noOp).toBe(true);
      expect((plan as NoOpPlan).reason).toBe('loading');
      expect(plan.upserts).toHaveLength(0);
      expect(plan.removals).toHaveLength(0);
      // Previous state is preserved unchanged
      expect(plan.nextState.entities).toHaveLength(1);
      expect(plan.nextState.observedAt).toBe(t1);
    });

    it('produces no mutation for failed status', () => {
      const plan = calculateReconciliationPlan({
        previousState: {
          ...emptyState(),
          observedAt: t1,
          entities: [makeOwned('key-a', digestA)],
        },
        snapshotStatus: 'failed',
        snapshotObservedAt: t2,
        mappedEntities: [],
        externalOwnership: [],
      });

      expect(plan.noOp).toBe(true);
      expect((plan as NoOpPlan).reason).toBe('failed');
      expect(plan.upserts).toHaveLength(0);
      expect(plan.removals).toHaveLength(0);
      expect(plan.nextState.entities).toHaveLength(1);
      expect(plan.nextState.observedAt).toBe(t1);
    });
  });

  describe('stale and repeated observations', () => {
    it('ignores a stale observation (older observedAt)', () => {
      const plan = calculateReconciliationPlan({
        previousState: {
          ...emptyState(),
          observedAt: t2,
          entities: [makeOwned('key-a', digestA)],
        },
        snapshotStatus: 'ready',
        snapshotObservedAt: t1, // older than t2
        mappedEntities: [makeMapped('key-a', digestB)],
        externalOwnership: [],
      });

      expect(plan.noOp).toBe(true);
      expect((plan as NoOpPlan).reason).toBe('stale-observation');
      expect(plan.upserts).toHaveLength(0);
      expect(plan.removals).toHaveLength(0);
      // State not advanced
      expect(plan.nextState.observedAt).toBe(t2);
    });

    it('makes a repeated observation idempotent', () => {
      const plan = calculateReconciliationPlan({
        previousState: {
          ...emptyState(),
          observedAt: t1,
          entities: [makeOwned('key-a', digestA)],
        },
        snapshotStatus: 'ready',
        snapshotObservedAt: t1, // same as committed
        mappedEntities: [makeMapped('key-a', digestA)],
        externalOwnership: [],
      });

      expect(plan.noOp).toBe(true);
      expect((plan as NoOpPlan).reason).toBe('repeated-observation');
      expect(plan.upserts).toHaveLength(0);
      expect(plan.removals).toHaveLength(0);
    });

    it('accepts the first observation when no previous state', () => {
      const plan = calculateReconciliationPlan({
        previousState: emptyState(),
        snapshotStatus: 'ready',
        snapshotObservedAt: t1,
        mappedEntities: [makeMapped('key-a', digestA)],
        externalOwnership: [],
      });

      expect(plan.noOp).toBe(false);
      expect(plan.upserts).toHaveLength(1);
      expect(plan.nextState.observedAt).toBe(t1);
    });
  });

  describe('ready snapshot — upserts and removals', () => {
    it('upserts new entities on first ready snapshot', () => {
      const plan = calculateReconciliationPlan({
        previousState: emptyState(),
        snapshotStatus: 'ready',
        snapshotObservedAt: t1,
        mappedEntities: [
          makeMapped('key-a', digestA),
          makeMapped('key-b', digestB),
        ],
        externalOwnership: [],
      });

      expect(plan.noOp).toBe(false);
      expect(plan.upserts).toHaveLength(2);
      expect(plan.removals).toHaveLength(0);
      expect(plan.nextState.entities).toHaveLength(2);
      expect(plan.nextState.observedAt).toBe(t1);
    });

    it('removes previously owned keys absent from ready snapshot', () => {
      const ownedA = makeOwned('key-a', digestA);
      const ownedB = makeOwned('key-b', digestB);

      const plan = calculateReconciliationPlan({
        previousState: {
          ...emptyState(),
          observedAt: t1,
          entities: [ownedA, ownedB],
        },
        snapshotStatus: 'ready',
        snapshotObservedAt: t2,
        mappedEntities: [makeMapped('key-a', digestA)],
        externalOwnership: [],
      });

      // key-a is retained (no change), key-b is removed
      expect(plan.upserts).toHaveLength(0);
      expect(plan.removals).toHaveLength(1);
      expect(plan.removals[0].catalogName).toBe(ownedB.catalogName);
      expect(plan.nextState.entities).toHaveLength(1);
      expect(plan.nextState.entities[0].catalogName).toBe(ownedA.catalogName);
    });

    it('successful empty ready removes all source-owned entities', () => {
      const ownedA = makeOwned('key-a', digestA);
      const ownedB = makeOwned('key-b', digestB);

      const plan = calculateReconciliationPlan({
        previousState: {
          ...emptyState(),
          observedAt: t1,
          entities: [ownedA, ownedB],
        },
        snapshotStatus: 'ready',
        snapshotObservedAt: t2,
        mappedEntities: [],
        externalOwnership: [],
      });

      expect(plan.upserts).toHaveLength(0);
      expect(plan.removals).toHaveLength(2);
      expect(plan.nextState.entities).toHaveLength(0);
    });

    it('plans upsert when digest changes (content update)', () => {
      const ownedA = makeOwned('key-a', digestA);

      const plan = calculateReconciliationPlan({
        previousState: {
          ...emptyState(),
          observedAt: t1,
          entities: [ownedA],
        },
        snapshotStatus: 'ready',
        snapshotObservedAt: t2,
        mappedEntities: [makeMapped('key-a', digestB)],
        externalOwnership: [],
      });

      expect(plan.upserts).toHaveLength(1);
      expect(plan.upserts[0].digest).toBe(digestB);
      expect(plan.removals).toHaveLength(0);
      expect(plan.nextState.entities).toHaveLength(1);
      expect(plan.nextState.entities[0].digest).toBe(digestB);
    });

    it('skips upsert when digest is unchanged', () => {
      const ownedA = makeOwned('key-a', digestA);

      const plan = calculateReconciliationPlan({
        previousState: {
          ...emptyState(),
          observedAt: t1,
          entities: [ownedA],
        },
        snapshotStatus: 'ready',
        snapshotObservedAt: t2,
        mappedEntities: [makeMapped('key-a', digestA)],
        externalOwnership: [],
      });

      // No upsert needed, but the plan still updates observedAt
      expect(plan.upserts).toHaveLength(0);
      expect(plan.removals).toHaveLength(0);
      expect(plan.nextState.observedAt).toBe(t2);
      expect(plan.nextState.entities).toHaveLength(1);
    });

    it('handles ready snapshot with empty previous state', () => {
      const plan = calculateReconciliationPlan({
        previousState: emptyState(),
        snapshotStatus: 'ready',
        snapshotObservedAt: t1,
        mappedEntities: [],
        externalOwnership: [],
      });

      // Empty ready with empty previous — no changes
      expect(plan.upserts).toHaveLength(0);
      expect(plan.removals).toHaveLength(0);
      expect(plan.nextState.entities).toHaveLength(0);
    });
  });

  describe('partial snapshot — retention', () => {
    it('upserts accepted records without removing absent entities', () => {
      const ownedA = makeOwned('key-a', digestA);
      const ownedB = makeOwned('key-b', digestB);

      const plan = calculateReconciliationPlan({
        previousState: {
          ...emptyState(),
          observedAt: t1,
          entities: [ownedA, ownedB],
        },
        snapshotStatus: 'partial',
        snapshotObservedAt: t2,
        // Only key-a in the partial snapshot, key-b is absent
        mappedEntities: [makeMapped('key-a', digestC)],
        externalOwnership: [],
      });

      // key-a is upserted (digest changed), key-b is retained
      expect(plan.upserts).toHaveLength(1);
      expect(plan.upserts[0].catalogName).toBe(ownedA.catalogName);
      expect(plan.removals).toHaveLength(0);
      expect(plan.nextState.entities).toHaveLength(2);
    });

    it('retains all previous entities when partial snapshot has no records', () => {
      const ownedA = makeOwned('key-a', digestA);
      const ownedB = makeOwned('key-b', digestB);

      const plan = calculateReconciliationPlan({
        previousState: {
          ...emptyState(),
          observedAt: t1,
          entities: [ownedA, ownedB],
        },
        snapshotStatus: 'partial',
        snapshotObservedAt: t2,
        mappedEntities: [],
        externalOwnership: [],
      });

      expect(plan.upserts).toHaveLength(0);
      expect(plan.removals).toHaveLength(0);
      expect(plan.nextState.entities).toHaveLength(2);
    });

    it('adds new entities in a partial snapshot', () => {
      const ownedA = makeOwned('key-a', digestA);

      const plan = calculateReconciliationPlan({
        previousState: {
          ...emptyState(),
          observedAt: t1,
          entities: [ownedA],
        },
        snapshotStatus: 'partial',
        snapshotObservedAt: t2,
        mappedEntities: [
          makeMapped('key-a', digestA), // unchanged
          makeMapped('key-c', digestC), // new
        ],
        externalOwnership: [],
      });

      expect(plan.upserts).toHaveLength(1); // only key-c
      expect(plan.upserts[0].tuple.key).toBe('key-c');
      expect(plan.removals).toHaveLength(0);
      expect(plan.nextState.entities).toHaveLength(2);
    });
  });

  describe('identity collision detection', () => {
    it('diagnoses a collision with an external source', () => {
      const collidingKey = 'collision-key';
      const tuple1 = makeTuple(collidingKey, 'oci', 'source-1');
      const catalogName = computeCatalogName(tuple1);

      // A different source already owns this catalogName
      const externalTuple = makeTuple(collidingKey, 'npx', 'source-2');
      const external: ExternalOwnership[] = [
        {
          catalogName,
          tuple: externalTuple,
        },
      ];

      const plan = calculateReconciliationPlan({
        previousState: emptyState('oci', 'source-1'),
        snapshotStatus: 'ready',
        snapshotObservedAt: t1,
        mappedEntities: [makeMapped(collidingKey, digestA, 'oci', 'source-1')],
        externalOwnership: external,
      });

      expect(plan.collisions).toHaveLength(1);
      expect(plan.collisions[0].scope).toBe('external');
      expect(plan.collisions[0].catalogName).toBe(catalogName);
      // The colliding entity is not upserted
      expect(plan.upserts).toHaveLength(0);
    });

    it('diagnoses an internal collision when two snapshot entries share a catalogName', () => {
      // Two different tuples that produce the same catalogName
      const key = 'collision-key';
      const mapped1 = makeMapped(key, digestA, 'oci', 'source-1');
      // Manually create a second mapped entity with a different tuple but same catalogName
      const tuple2 = makeTuple(key, 'npx', 'source-2');
      const mapped2: MappedSkillEntity = {
        tuple: tuple2,
        catalogName: mapped1.catalogName, // same catalogName, different tuple
        digest: digestB,
        entity: makeEntity(mapped1.catalogName),
      };

      const plan = calculateReconciliationPlan({
        previousState: emptyState('oci', 'source-1'),
        snapshotStatus: 'ready',
        snapshotObservedAt: t1,
        mappedEntities: [mapped1, mapped2],
        externalOwnership: [],
      });

      expect(plan.collisions).toHaveLength(1);
      expect(plan.collisions[0].scope).toBe('internal');
      expect(plan.collisions[0].catalogName).toBe(mapped1.catalogName);
      expect(plan.collisions[0].existingTuple).toEqual(mapped1.tuple);
      expect(plan.collisions[0].incomingTuple).toEqual(tuple2);
      // First one wins — only the first entry is upserted
      expect(plan.upserts).toHaveLength(1);
      expect(plan.upserts[0].digest).toBe(digestA);
    });

    it('deduplicates same-tuple entries without flagging a collision', () => {
      const key = 'dup-key';
      const mapped1 = makeMapped(key, digestA);
      // Same tuple, same catalogName — duplicate, not a collision
      const mapped2: MappedSkillEntity = {
        ...mapped1,
        digest: digestB, // different digest, but same tuple
      };

      const plan = calculateReconciliationPlan({
        previousState: emptyState(),
        snapshotStatus: 'ready',
        snapshotObservedAt: t1,
        mappedEntities: [mapped1, mapped2],
        externalOwnership: [],
      });

      // No collision diagnosed — tuples match
      expect(plan.collisions).toHaveLength(0);
      // First one wins — only first entry's digest is used
      expect(plan.upserts).toHaveLength(1);
      expect(plan.upserts[0].digest).toBe(digestA);
      expect(plan.nextState.entities).toHaveLength(1);
    });

    it('diagnoses external collision and removes previously-owned entity in ready snapshot', () => {
      const key = 'contested-key';
      const ownedEntity = makeOwned(key, digestA, 'oci', 'source-1');

      // Another source now owns this catalogName
      const externalTuple = makeTuple(key, 'npx', 'source-2');
      const external: ExternalOwnership[] = [
        {
          catalogName: ownedEntity.catalogName,
          tuple: externalTuple,
        },
      ];

      const plan = calculateReconciliationPlan({
        previousState: {
          sourceType: 'oci',
          sourceId: 'source-1',
          observedAt: t1,
          entities: [ownedEntity],
        },
        snapshotStatus: 'ready',
        snapshotObservedAt: t2,
        mappedEntities: [makeMapped(key, digestB, 'oci', 'source-1')],
        externalOwnership: external,
      });

      // Collision diagnosed
      expect(plan.collisions).toHaveLength(1);
      expect(plan.collisions[0].scope).toBe('external');
      // Colliding entity is not upserted
      expect(plan.upserts).toHaveLength(0);
      // Previously-owned entity is removed since it's not in processedNames
      expect(plan.removals).toHaveLength(1);
      expect(plan.removals[0].catalogName).toBe(ownedEntity.catalogName);
      // Entity is absent from nextState
      expect(plan.nextState.entities).toHaveLength(0);
    });

    it('retains previously-owned entity on partial snapshot with external collision', () => {
      const key = 'contested-key';
      const ownedEntity = makeOwned(key, digestA, 'oci', 'source-1');

      // Another source now owns this catalogName
      const externalTuple = makeTuple(key, 'npx', 'source-2');
      const external: ExternalOwnership[] = [
        {
          catalogName: ownedEntity.catalogName,
          tuple: externalTuple,
        },
      ];

      const plan = calculateReconciliationPlan({
        previousState: {
          sourceType: 'oci',
          sourceId: 'source-1',
          observedAt: t1,
          entities: [ownedEntity],
        },
        snapshotStatus: 'partial',
        snapshotObservedAt: t2,
        mappedEntities: [makeMapped(key, digestB, 'oci', 'source-1')],
        externalOwnership: external,
      });

      // Collision diagnosed
      expect(plan.collisions).toHaveLength(1);
      expect(plan.collisions[0].scope).toBe('external');
      // Colliding entity is not upserted
      expect(plan.upserts).toHaveLength(0);
      // Unlike ready, partial retains the previously-owned entity
      expect(plan.removals).toHaveLength(0);
      expect(plan.nextState.entities).toHaveLength(1);
      expect(plan.nextState.entities[0].catalogName).toBe(
        ownedEntity.catalogName,
      );
    });

    it('does not flag a collision when tuples match', () => {
      const key = 'shared-key';
      const tuple = makeTuple(key);
      const catalogName = computeCatalogName(tuple);

      // Same tuple in external — not a collision
      const external: ExternalOwnership[] = [{ catalogName, tuple }];

      const plan = calculateReconciliationPlan({
        previousState: emptyState(),
        snapshotStatus: 'ready',
        snapshotObservedAt: t1,
        mappedEntities: [makeMapped(key, digestA)],
        externalOwnership: external,
      });

      expect(plan.collisions).toHaveLength(0);
      expect(plan.upserts).toHaveLength(1);
    });
  });

  describe('two independent sources', () => {
    it('source isolation: plans from different sources are independent', () => {
      // Source A has two entities
      const ownedA1 = makeOwned('key-1', digestA, 'oci', 'source-a');
      const ownedA2 = makeOwned('key-2', digestB, 'oci', 'source-a');

      // Source B has one entity
      const ownedB1 = makeOwned('key-3', digestC, 'npx', 'source-b');

      // Source A's ready snapshot removes key-2
      const planA = calculateReconciliationPlan({
        previousState: {
          sourceType: 'oci',
          sourceId: 'source-a',
          observedAt: t1,
          entities: [ownedA1, ownedA2],
        },
        snapshotStatus: 'ready',
        snapshotObservedAt: t2,
        mappedEntities: [makeMapped('key-1', digestA, 'oci', 'source-a')],
        externalOwnership: [
          {
            catalogName: ownedB1.catalogName,
            tuple: ownedB1.tuple,
          },
        ],
      });

      // Source A removes key-2 but does not touch source B
      expect(planA.removals).toHaveLength(1);
      expect(planA.removals[0].tuple.key).toBe('key-2');
      expect(planA.nextState.entities).toHaveLength(1);

      // Source B's loading snapshot preserves its entities
      const planB = calculateReconciliationPlan({
        previousState: {
          sourceType: 'npx',
          sourceId: 'source-b',
          observedAt: t1,
          entities: [ownedB1],
        },
        snapshotStatus: 'loading',
        snapshotObservedAt: null,
        mappedEntities: [],
        externalOwnership: [],
      });

      expect(planB.noOp).toBe(true);
      expect(planB.nextState.entities).toHaveLength(1);
    });
  });

  describe('digest and content changes', () => {
    it('tracks digest change as an upsert without changing identity', () => {
      const key = 'quay.io/repo/skill:v1';
      const owned = makeOwned(key, digestA);

      const plan = calculateReconciliationPlan({
        previousState: {
          ...emptyState(),
          observedAt: t1,
          entities: [owned],
        },
        snapshotStatus: 'ready',
        snapshotObservedAt: t2,
        mappedEntities: [makeMapped(key, digestB)],
        externalOwnership: [],
      });

      expect(plan.upserts).toHaveLength(1);
      expect(plan.upserts[0].catalogName).toBe(owned.catalogName);
      expect(plan.upserts[0].digest).toBe(digestB);
      // Same catalogName — identity unchanged
      expect(plan.nextState.entities[0].catalogName).toBe(owned.catalogName);
    });

    it('treats a new key as a new entity even with the same digest', () => {
      const owned = makeOwned('key-old', digestA);

      const plan = calculateReconciliationPlan({
        previousState: {
          ...emptyState(),
          observedAt: t1,
          entities: [owned],
        },
        snapshotStatus: 'ready',
        snapshotObservedAt: t2,
        mappedEntities: [makeMapped('key-new', digestA)],
        externalOwnership: [],
      });

      // key-old removed, key-new added (even though same digest)
      expect(plan.upserts).toHaveLength(1);
      expect(plan.upserts[0].tuple.key).toBe('key-new');
      expect(plan.removals).toHaveLength(1);
      expect(plan.removals[0].tuple.key).toBe('key-old');
    });
  });

  describe('retention of last-known-good entities', () => {
    it('partial snapshot retains previously known entity when one skill fails', () => {
      const ownedA = makeOwned('skill-ok', digestA);
      const ownedB = makeOwned('skill-failed', digestB);

      const plan = calculateReconciliationPlan({
        previousState: {
          ...emptyState(),
          observedAt: t1,
          entities: [ownedA, ownedB],
        },
        snapshotStatus: 'partial',
        snapshotObservedAt: t2,
        // Only skill-ok in the partial snapshot with updated digest
        mappedEntities: [makeMapped('skill-ok', digestC)],
        externalOwnership: [],
      });

      // skill-ok is upserted (digest changed)
      expect(plan.upserts).toHaveLength(1);
      expect(plan.upserts[0].tuple.key).toBe('skill-ok');
      // No removals — skill-failed is retained
      expect(plan.removals).toHaveLength(0);
      // Both entities in next state
      expect(plan.nextState.entities).toHaveLength(2);
      const keys = plan.nextState.entities.map(e => e.tuple.key);
      expect(keys).toContain('skill-ok');
      expect(keys).toContain('skill-failed');
    });

    it('loading preserves all entities after restart', () => {
      const ownedA = makeOwned('key-a', digestA);
      const ownedB = makeOwned('key-b', digestB);

      const plan = calculateReconciliationPlan({
        previousState: {
          ...emptyState(),
          observedAt: t1,
          entities: [ownedA, ownedB],
        },
        snapshotStatus: 'loading',
        snapshotObservedAt: null,
        mappedEntities: [],
        externalOwnership: [],
      });

      expect(plan.noOp).toBe(true);
      expect(plan.nextState.entities).toHaveLength(2);
      expect(plan.nextState.observedAt).toBe(t1);
    });

    it('failed preserves all entities after restart', () => {
      const ownedA = makeOwned('key-a', digestA);

      const plan = calculateReconciliationPlan({
        previousState: {
          ...emptyState(),
          observedAt: t1,
          entities: [ownedA],
        },
        snapshotStatus: 'failed',
        snapshotObservedAt: t2,
        mappedEntities: [],
        externalOwnership: [],
      });

      expect(plan.noOp).toBe(true);
      expect(plan.nextState.entities).toHaveLength(1);
    });
  });

  describe('edge cases', () => {
    it('handles completely empty input', () => {
      const plan = calculateReconciliationPlan({
        previousState: emptyState(),
        snapshotStatus: 'ready',
        snapshotObservedAt: t1,
        mappedEntities: [],
        externalOwnership: [],
      });

      expect(plan.noOp).toBe(true);
      expect((plan as NoOpPlan).reason).toBe('no-changes');
      expect(plan.upserts).toHaveLength(0);
      expect(plan.removals).toHaveLength(0);
      expect(plan.nextState.entities).toHaveLength(0);
      expect(plan.nextState.observedAt).toBe(t1);
    });

    it('null snapshotObservedAt on a ready snapshot resets observedAt and disables stale detection', () => {
      const owned = makeOwned('key-a', digestA);

      // A ready snapshot with null observedAt — observedAt resets to null
      const plan = calculateReconciliationPlan({
        previousState: {
          ...emptyState(),
          observedAt: t1,
          entities: [owned],
        },
        snapshotStatus: 'ready',
        snapshotObservedAt: null,
        mappedEntities: [makeMapped('key-a', digestA)],
        externalOwnership: [],
      });

      // observedAt resets to null
      expect(plan.nextState.observedAt).toBeNull();

      // A subsequent snapshot is never considered stale when
      // committedAt is null — stale detection is disabled
      const plan2 = calculateReconciliationPlan({
        previousState: plan.nextState,
        snapshotStatus: 'ready',
        snapshotObservedAt: t1,
        mappedEntities: [makeMapped('key-a', digestB)],
        externalOwnership: [],
      });

      // Not treated as stale — the snapshot is processed normally
      expect(plan2.noOp).toBe(false);
      expect(plan2.upserts).toHaveLength(1);
      expect(plan2.nextState.observedAt).toBe(t1);
    });

    it('a ready plan that only updates the observation time is a no-op', () => {
      const owned = makeOwned('key-a', digestA);

      const plan = calculateReconciliationPlan({
        previousState: {
          ...emptyState(),
          observedAt: t1,
          entities: [owned],
        },
        snapshotStatus: 'ready',
        snapshotObservedAt: t2,
        mappedEntities: [makeMapped('key-a', digestA)],
        externalOwnership: [],
      });

      // Same entities, same digests — no actual data changes
      expect(plan.noOp).toBe(true);
      expect((plan as NoOpPlan).reason).toBe('no-changes');
      // But the observation time does advance in the next state
      expect(plan.nextState.observedAt).toBe(t2);
    });
  });
});
