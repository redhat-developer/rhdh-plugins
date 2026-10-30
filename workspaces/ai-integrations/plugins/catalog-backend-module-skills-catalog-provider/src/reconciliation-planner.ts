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
 * Pure reconciliation planner for source-scoped skill entity deltas.
 *
 * Accepts the previous committed ownership state for one source,
 * a validated snapshot, mapped entities, and read-only ownership
 * information from other sources. Produces a deterministic plan
 * containing upserts, removals, diagnosed collisions, and the
 * intended next ownership state.
 *
 * This module has no database, Catalog API, or network side effects.
 * It implements the pure decision portion of OpenSpec task 4.4 per
 * design D6's status table.
 */

import { stringifyEntityRef } from '@backstage/catalog-model';
import type { IdentityTuple } from '@red-hat-developer-hub/backstage-plugin-ai-skills-common';

import type {
  CommittedSourceState,
  ExternalOwnership,
  IdentityCollision,
  OwnedEntity,
  PlannedRemoval,
  PlannedUpsert,
  ReconciliationPlan,
  ReconciliationPlanInput,
} from './types';

/**
 * Calculates a source-scoped reconciliation plan.
 *
 * Per design D6:
 * - `loading` / `failed`: no mutations, preserve all state.
 * - `ready`: upsert accepted records and remove previously owned keys
 *   absent from this snapshot. An empty ready snapshot removes all
 *   keys owned by that source.
 * - `partial`: upsert successful records while retaining every absent
 *   entity. No removals.
 *
 * Stale observations (older `observedAt`) are ignored. Repeated
 * observations (same `observedAt`) are idempotent. An entity-name
 * collision between different source tuples is diagnosed without
 * overwriting the existing tuple.
 *
 * @param input - The reconciliation plan input.
 * @returns A deterministic reconciliation plan.
 *
 * @public
 */
export function calculateReconciliationPlan(
  input: ReconciliationPlanInput,
): ReconciliationPlan {
  const {
    previousState,
    snapshotStatus,
    snapshotObservedAt,
    mappedEntities,
    externalOwnership,
  } = input;

  // ─── loading / failed: no mutations ──────────────────────────────
  if (snapshotStatus === 'loading' || snapshotStatus === 'failed') {
    return noOpPlan(
      previousState,
      snapshotStatus === 'loading' ? 'loading' : 'failed',
    );
  }

  // ─── Stale observation: older observedAt → ignore ────────────────
  if (isStaleObservation(previousState.observedAt, snapshotObservedAt)) {
    return noOpPlan(previousState, 'stale-observation');
  }

  // ─── Repeated observation: same observedAt → idempotent ──────────
  // A configuration namespace change is independent of connector freshness.
  // Do not suppress that identity change just because content/timestamp repeats.
  const configurationChanged = mappedEntities.some(mapped =>
    previousState.entities.some(
      previous =>
        tuplesEqual(previous.tuple, mapped.tuple) &&
        (stringifyEntityRef(previous.entity) !==
          stringifyEntityRef(mapped.entity) ||
          previous.entity.metadata.annotations?.[
            'backstage.io/techdocs-ref'
          ] !==
            mapped.entity.metadata.annotations?.['backstage.io/techdocs-ref']),
    ),
  );
  if (
    !configurationChanged &&
    isRepeatedObservation(previousState.observedAt, snapshotObservedAt)
  ) {
    return noOpPlan(previousState, 'repeated-observation');
  }

  // ─── Build lookup maps ───────────────────────────────────────────
  // Previous entities indexed by full catalog identity for O(1) lookup
  const previousByRef = new Map<string, OwnedEntity>();
  for (const owned of previousState.entities) {
    previousByRef.set(stringifyEntityRef(owned.entity), owned);
  }

  // External ownership indexed by full catalog identity for collision detection
  const externalByRef = new Map<string, ExternalOwnership>();
  for (const ext of externalOwnership) {
    externalByRef.set(ext.entityRef ?? ext.catalogName, ext);
  }

  // ─── Process mapped entities from the snapshot ───────────────────
  const upserts: PlannedUpsert[] = [];
  const collisions: IdentityCollision[] = [];
  const processedRefs = new Set<string>();
  const nextEntities: OwnedEntity[] = [];

  // Track names seen in this snapshot for internal collision detection
  const seenInSnapshot = new Map<string, { tuple: IdentityTuple }>();

  for (const mapped of mappedEntities) {
    const { tuple, catalogName, digest, entity } = mapped;
    const entityRef = stringifyEntityRef(entity);

    // ── Internal collision: two entities in the same snapshot ──
    const alreadySeen = seenInSnapshot.get(entityRef);
    if (alreadySeen) {
      if (!tuplesEqual(alreadySeen.tuple, tuple)) {
        collisions.push({
          catalogName,
          incomingTuple: tuple,
          existingTuple: alreadySeen.tuple,
          scope: 'internal',
        });
      }
      // Skip duplicate — first one wins
      continue;
    }
    seenInSnapshot.set(entityRef, { tuple });

    // ── External collision: another source owns this name ──────
    const external =
      externalByRef.get(entityRef) ?? externalByRef.get(catalogName);
    if (external && !tuplesEqual(external.tuple, tuple)) {
      collisions.push({
        catalogName,
        incomingTuple: tuple,
        existingTuple: external.tuple,
        scope: 'external',
      });
      // Do not overwrite another source's entity
      continue;
    }

    processedRefs.add(entityRef);

    // Determine if this is an actual change (new or updated)
    const previous = previousByRef.get(entityRef);
    if (
      !previous ||
      previous.digest !== digest ||
      previous.entity.metadata.annotations?.['backstage.io/techdocs-ref'] !==
        entity.metadata.annotations?.['backstage.io/techdocs-ref']
    ) {
      // New entity or content changed — plan upsert
      upserts.push({ tuple, catalogName, digest, entity });
    }

    // Record in next ownership state regardless of whether it changed
    nextEntities.push({ tuple, catalogName, digest, entity });
  }

  // ─── Determine removals based on snapshot status ─────────────────
  const removals: PlannedRemoval[] = [];

  if (snapshotStatus === 'ready') {
    // Ready: remove previously owned keys absent from this snapshot
    for (const owned of previousState.entities) {
      if (!processedRefs.has(stringifyEntityRef(owned.entity))) {
        removals.push({
          entityRef: stringifyEntityRef(owned.entity),
          tuple: owned.tuple,
          catalogName: owned.catalogName,
        });
      }
    }
  } else if (snapshotStatus === 'partial') {
    // Partial: retain all absent entities — no removals
    for (const owned of previousState.entities) {
      if (!processedRefs.has(stringifyEntityRef(owned.entity))) {
        nextEntities.push(owned);
      }
    }
  }

  // ─── Build next state ────────────────────────────────────────────
  const nextState: CommittedSourceState = {
    sourceType: previousState.sourceType,
    sourceId: previousState.sourceId,
    observedAt: snapshotObservedAt,
    entities: nextEntities,
  };

  const hasChanges =
    upserts.length > 0 || removals.length > 0 || collisions.length > 0;

  if (hasChanges) {
    return {
      noOp: false,
      upserts,
      removals,
      collisions,
      nextState,
    };
  }

  return {
    noOp: true,
    reason: 'no-changes',
    upserts,
    removals,
    collisions,
    nextState,
  };
}

/**
 * Creates a no-op plan that preserves the previous state unchanged.
 */
function noOpPlan(
  previousState: CommittedSourceState,
  reason: 'loading' | 'failed' | 'stale-observation' | 'repeated-observation',
): ReconciliationPlan {
  return {
    noOp: true,
    reason,
    upserts: [],
    removals: [],
    collisions: [],
    nextState: previousState,
  };
}

/**
 * Determines whether a snapshot observation is stale (older than
 * the committed observation).
 *
 * Both values must be non-null ISO 8601 UTC strings for a meaningful
 * comparison. A null committed observation means no previous commit
 * exists, so nothing is stale.
 *
 * Uses lexicographic string comparison, which is correct for ISO 8601
 * timestamps only when both values use the same sub-second precision
 * and suffix format (e.g., both `Z`-terminated, same decimal places).
 * When the persistence layer (task 4.3) is implemented, either
 * normalize all `observedAt` strings to a canonical format before
 * passing to the planner, or switch to `new Date(str).getTime()`
 * comparison.
 */
function isStaleObservation(
  committedAt: string | null,
  snapshotAt: string | null,
): boolean {
  if (committedAt === null || snapshotAt === null) {
    return false;
  }
  return snapshotAt < committedAt;
}

/**
 * Determines whether a snapshot observation is a repeat of the
 * committed observation.
 *
 * Both values must be non-null and equal for this to be true.
 * A null committed observation means no previous commit exists,
 * so nothing is repeated.
 *
 * Uses strict string equality, so the same instant expressed with
 * different sub-second precision (e.g., `'…T10:00:00Z'` vs
 * `'…T10:00:00.000Z'`) is not detected as a repeat. See the
 * format consistency note on {@link isStaleObservation}.
 */
function isRepeatedObservation(
  committedAt: string | null,
  snapshotAt: string | null,
): boolean {
  if (committedAt === null || snapshotAt === null) {
    return false;
  }
  return snapshotAt === committedAt;
}

/**
 * Compares two identity tuples for equality.
 */
function tuplesEqual(a: IdentityTuple, b: IdentityTuple): boolean {
  return a.type === b.type && a.id === b.id && a.key === b.key;
}
