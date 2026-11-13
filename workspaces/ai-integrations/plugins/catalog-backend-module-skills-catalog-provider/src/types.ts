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
import type { SchedulerServiceTaskScheduleDefinition } from '@backstage/backend-plugin-api';
import type {
  IdentityTuple,
  SkillSourceType,
  SnapshotStatus,
} from '@red-hat-developer-hub/backstage-plugin-ai-skills-common';

// ─── Provider configuration ──────────────────────────────────────────

/**
 * Configuration for one connector source within a provider instance.
 *
 * @public
 */
export interface SourceConsumerConfig {
  /** Backstage plugin ID of the connector. */
  connectorPluginId: string;
  /** Source identifier passed to `GET /skills/:sourceId`. */
  sourceId: string;
  /** Expected source type (`oci` or `npx`). */
  sourceType: SkillSourceType;
}

/**
 * Full configuration for one provider instance.
 *
 * @public
 */
export interface SkillsCatalogProviderConfig {
  /** Provider instance identifier (the config key). */
  id: string;
  /** Configured connector sources. */
  sources: SourceConsumerConfig[];
  /** Catalog namespace for produced entities. */
  namespace: string;
  /** Default catalog owner. */
  defaultOwner: string;
  /** Default catalog lifecycle. */
  defaultLifecycle: string;
  /** Optional Backstage scheduler task schedule. */
  schedule?: SchedulerServiceTaskScheduleDefinition;
}

// ─── Mapper handoff (RHIDP-17329) ─────────────────────────────────────

/**
 * A mapped skill entity ready for catalog reconciliation.
 *
 * This is the output of the mapper: a source-scoped identity tuple,
 * a computed entity reference (catalog name), and the full entity
 * with `AiResource` annotations and the content digest.
 *
 * @public
 */
export interface MappedSkillEntity {
  /** Source identity tuple `[type, id, key]`. */
  tuple: IdentityTuple;
  /** Computed deterministic catalog entity name. */
  catalogName: string;
  /** Content digest from the skill record. */
  digest: string;
  /** The fully constructed catalog entity. */
  entity: Entity;
}

// ─── Reconciliation planner types ────────────────────────────────────

/**
 * A committed ownership record for a single entity owned by a source.
 *
 * Persisted by the durable reconciliation layer (task 4.3).
 * The planner reads these records to determine which entities
 * a source previously owned.
 *
 * @public
 */
export interface OwnedEntity {
  /** Source identity tuple `[type, id, key]`. */
  tuple: IdentityTuple;
  /** Deterministic catalog entity name. */
  catalogName: string;
  /** Content digest at last commit. */
  digest: string;
  /** The full entity at last commit. */
  entity: Entity;
}

/**
 * Previously committed ownership state for a single source.
 *
 * This is the "before" state that the planner compares against
 * the new snapshot to produce a delta.
 *
 * @public
 */
export interface CommittedSourceState {
  /** Source type. */
  sourceType: SkillSourceType;
  /** Source identifier. */
  sourceId: string;
  /** Last committed observation time (ISO 8601 UTC), or null if never committed. */
  observedAt: string | null;
  /** Entities owned by this source at last commit. */
  entities: OwnedEntity[];
}

/**
 * Read-only ownership record from another source, used solely for
 * cross-source identity collision detection.
 *
 * @public
 */
export interface ExternalOwnership {
  /** Full catalog identity; absent legacy callers are treated as name-only ownership. */
  entityRef?: string;
  /** Catalog entity name owned by the external source. */
  catalogName: string;
  /** Identity tuple from the external source. */
  tuple: IdentityTuple;
}

/**
 * Input to the reconciliation planner.
 *
 * @public
 */
export interface ReconciliationPlanInput {
  /** Previous committed state for this source. */
  previousState: CommittedSourceState;
  /** The validated snapshot from the connector. */
  snapshotStatus: SnapshotStatus;
  /** Observation timestamp from the snapshot. */
  snapshotObservedAt: string | null;
  /** Mapped entities from the current snapshot (empty for loading/failed). */
  mappedEntities: MappedSkillEntity[];
  /** Entity names owned by other sources, for collision detection. */
  externalOwnership: ExternalOwnership[];
}

/**
 * An entity upsert planned by the reconciliation planner.
 *
 * @public
 */
export interface PlannedUpsert {
  /** Source identity tuple. */
  tuple: IdentityTuple;
  /** Deterministic catalog entity name. */
  catalogName: string;
  /** Content digest. */
  digest: string;
  /** The full catalog entity. */
  entity: Entity;
}

/**
 * An entity removal planned by the reconciliation planner.
 *
 * @public
 */
export interface PlannedRemoval {
  /** Original catalog entity reference; optional only for pre-upgrade pending plans. */
  entityRef?: string;
  /** Source identity tuple that was previously committed. */
  tuple: IdentityTuple;
  /** Deterministic catalog entity name to remove. */
  catalogName: string;
}

/**
 * A diagnosed identity collision.
 *
 * @public
 */
export interface IdentityCollision {
  /** The colliding catalog entity name. */
  catalogName: string;
  /** The new tuple that collides. */
  incomingTuple: IdentityTuple;
  /** The existing tuple that owns the name. */
  existingTuple: IdentityTuple;
  /** Whether the collision is with the same source or an external source. */
  scope: 'internal' | 'external';
}

/**
 * Output of the reconciliation planner.
 *
 * A pure, deterministic plan describing what mutations to apply
 * and the intended next ownership state. The planner does not
 * read a database or call the Catalog — the caller applies
 * the plan.
 *
 * Discriminated on `noOp`: when `true`, `reason` indicates why
 * no caller-visible changes were produced; when `false`, the plan
 * contains changes requiring caller attention (upserts, removals,
 * or collision diagnostics). Callers must always persist `nextState`
 * regardless of `noOp`, because `nextState.observedAt` may advance
 * even when no catalog mutations occur.
 *
 * @public
 */
export type ReconciliationPlan = {
  /** Entities to add or update. */
  upserts: PlannedUpsert[];
  /** Entities to remove (only for ready snapshots). */
  removals: PlannedRemoval[];
  /** Diagnosed identity collisions (skipped entities). */
  collisions: IdentityCollision[];
  /** Intended next ownership state after this plan is applied. */
  nextState: CommittedSourceState;
} & (
  | {
      /**
       * `true` when the plan contains no catalog mutations.
       *
       * Callers must always persist `nextState` regardless of this flag,
       * because `nextState.observedAt` may advance even on a no-op.
       */
      noOp: true;
      /**
       * Reason for a no-op plan.
       *
       * Short-circuit reasons (`loading`, `failed`, `stale-observation`,
       * `repeated-observation`) indicate the snapshot was not processed.
       * `no-changes` indicates a fully computed plan with no actionable
       * deltas.
       */
      reason:
        | 'loading'
        | 'failed'
        | 'stale-observation'
        | 'repeated-observation'
        | 'no-changes';
    }
  | {
      /**
       * `false` when the plan contains changes requiring caller
       * attention (upserts, removals, or collision diagnostics).
       */
      noOp: false;
    }
);
