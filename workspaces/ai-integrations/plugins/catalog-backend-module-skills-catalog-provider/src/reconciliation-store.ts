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
 * Durable reconciliation state store for source-scoped skill entity
 * ownership per design D6 tasks 4.3–4.4.
 *
 * Persists per-source committed ownership state (identity tuples,
 * last-known-good entities, digests, observation times) and pending
 * deltas (the exact mutation to apply and intended next state) using
 * Backstage's database service. Supports transactional pending-delta
 * writes before catalog mutation and atomic commit-and-clear after
 * successful mutation. Recovers pending mutations on startup/restart
 * before consuming newer snapshots.
 */

import { resolvePackagePath } from '@backstage/backend-plugin-api';
import type { Knex } from 'knex';

import type { SkillSourceType } from '@red-hat-developer-hub/backstage-plugin-ai-skills-common';

import type {
  CommittedSourceState,
  OwnedEntity,
  PlannedRemoval,
  PlannedUpsert,
} from './types';

// ─── Database table and column names ────────────────────────────────

const COMMITTED_STATE_TABLE = 'skills_provider_committed_state';
const PENDING_DELTA_TABLE = 'skills_provider_pending_delta';
const PENDING_ACK_TABLE = 'skills_provider_pending_ack';

// ─── Pending delta record ───────────────────────────────────────────

/**
 * A pending delta record persisted before applying a catalog mutation.
 *
 * Contains the exact planned upserts and removals, along with the
 * intended next committed state. If the process crashes after
 * persisting this but before committing, the pending delta is replayed
 * on recovery.
 *
 * @public
 */
export interface PendingDelta {
  /** Source type. */
  sourceType: SkillSourceType;
  /** Source identifier. */
  sourceId: string;
  /** Planned upserts from the reconciliation plan. */
  upserts: PlannedUpsert[];
  /** Planned removals from the reconciliation plan. */
  removals: PlannedRemoval[];
  /** The intended next committed state after this delta is applied. */
  nextState: CommittedSourceState;
  /**
   * Skilldocs revision from the connector's `X-Skilldocs-Revision`
   * header. When present, `replayPendingDeltas` creates a pending
   * acknowledgment after replaying the delta so the revision is not
   * irrecoverably lost on crash between `savePendingDelta` and
   * `commitStateAndSaveAcknowledgment`.
   */
  revision?: string;
  /** Complete ready-OCI release context persisted before catalog mutation. */
  acknowledgment?: PendingAcknowledgment;
}

// ─── Pending acknowledgment record ─────────────────────────────────

/**
 * A pending documentation reconciliation acknowledgment.
 *
 * Persisted after a successful `ready` ownership commit. The provider
 * verifies catalog processing visibility before sending the
 * acknowledgment to the connector's `POST /skilldocs/:sourceId/reconcile`
 * endpoint.
 *
 * @public
 */
export interface PendingAcknowledgment {
  /** Source type (only `oci` sources produce acknowledgments). */
  sourceType: SkillSourceType;
  /** Source identifier. */
  sourceId: string;
  /** Connector plugin ID for discovery and token targeting. */
  connectorPluginId: string;
  /**
   * Skilldocs revision from the connector's `X-Skilldocs-Revision`
   * response header, to be sent back in the reconcile request.
   */
  revision: string;
  /**
   * All unique manifest digests referenced by the source's committed
   * last-known-good entities. Sent as `retainedDigests` in the
   * reconcile request.
   */
  retainedDigests: string[];
  /**
   * Expected entity references and their committed TechDocs URLs.
   * Used to verify catalog processing visibility before sending
   * the acknowledgment.
   */
  expectedEntityUrls: Record<string, string>;
  /**
   * Entity references expected to be absent (removed) from the
   * catalog. The acknowledgment is not sent until all removals are
   * confirmed absent.
   */
  expectedRemovals: string[];
}

// ─── ReconciliationStore interface ──────────────────────────────────

/**
 * Interface for durable reconciliation state storage.
 *
 * @public
 */
export interface ReconciliationStore {
  /**
   * Ensures the database schema is created. Must be called once
   * before any other operations.
   */
  initialize(): Promise<void>;

  /**
   * Retrieves the committed ownership state for a source.
   *
   * Returns an empty state if no committed state exists for this source.
   */
  getCommittedState(
    sourceType: SkillSourceType,
    sourceId: string,
  ): Promise<CommittedSourceState>;

  /**
   * Retrieves all committed states for cross-source collision detection.
   */
  getAllCommittedStates(): Promise<CommittedSourceState[]>;

  /**
   * Retrieves a pending delta for a source, if one exists.
   *
   * A pending delta indicates that a catalog mutation was persisted
   * but the process may have crashed before committing the result.
   */
  getPendingDelta(
    sourceType: SkillSourceType,
    sourceId: string,
  ): Promise<PendingDelta | undefined>;

  /**
   * Retrieves all pending deltas for recovery on startup.
   */
  getAllPendingDeltas(): Promise<PendingDelta[]>;

  /**
   * Transactionally persists a pending delta before applying a catalog
   * mutation. This is the crash-safe write that enables replay on
   * recovery.
   */
  savePendingDelta(delta: PendingDelta): Promise<void>;

  /**
   * Atomically commits the next state and clears the pending delta
   * after a successful catalog mutation.
   */
  commitStateAndClearPending(
    sourceType: SkillSourceType,
    sourceId: string,
    nextState: CommittedSourceState,
  ): Promise<void>;

  /**
   * Atomically commits ownership state, clears the pending delta,
   * and persists a pending acknowledgment after a successful `ready`
   * catalog mutation per design D8.
   */
  commitStateAndSaveAcknowledgment(
    sourceType: SkillSourceType,
    sourceId: string,
    nextState: CommittedSourceState,
    ack: PendingAcknowledgment,
  ): Promise<void>;

  /**
   * Retrieves a pending acknowledgment for a source, if one exists.
   */
  getPendingAcknowledgment(
    sourceType: SkillSourceType,
    sourceId: string,
  ): Promise<PendingAcknowledgment | undefined>;

  /**
   * Retrieves all pending acknowledgments for retry on startup.
   */
  getAllPendingAcknowledgments(): Promise<PendingAcknowledgment[]>;

  /**
   * Clears a pending acknowledgment after successful delivery.
   */
  clearPendingAcknowledgment(
    sourceType: SkillSourceType,
    sourceId: string,
  ): Promise<void>;
}

// ─── Database-backed implementation ─────────────────────────────────

/**
 * Database-backed reconciliation store using Backstage's Knex database
 * service.
 *
 * Uses three tables:
 * - `skills_provider_committed_state`: committed ownership state per source
 * - `skills_provider_pending_delta`: pending deltas before catalog mutation
 * - `skills_provider_pending_ack`: pending acknowledgments for D8 reconciliation
 *
 * Each instance is scoped to a single provider config ID. The provider
 * ID is included in all tables' composite primary keys to ensure data
 * isolation when multiple provider configs coexist.
 *
 * @internal
 */
export class DatabaseReconciliationStore implements ReconciliationStore {
  constructor(
    private readonly knex: Knex,
    private readonly providerId: string,
    private readonly skipMigrations = false,
  ) {}

  async initialize(): Promise<void> {
    if (this.skipMigrations) return;
    await this.knex.migrate.latest({
      directory: resolvePackagePath(
        '@red-hat-developer-hub/backstage-plugin-catalog-backend-module-skills-catalog-provider',
        'migrations',
      ),
      tableName: 'skills_catalog_provider_migrations',
    });
  }

  async getCommittedState(
    sourceType: SkillSourceType,
    sourceId: string,
  ): Promise<CommittedSourceState> {
    const row = await this.knex(COMMITTED_STATE_TABLE)
      .where({
        provider_id: this.providerId,
        source_type: sourceType,
        source_id: sourceId,
      })
      .first();

    if (!row) {
      return {
        sourceType,
        sourceId,
        observedAt: null,
        entities: [],
      };
    }

    return {
      sourceType: row.source_type,
      sourceId: row.source_id,
      observedAt: row.observed_at ?? null,
      entities: JSON.parse(row.entities_json) as OwnedEntity[],
    };
  }

  async getAllCommittedStates(): Promise<CommittedSourceState[]> {
    const rows = await this.knex(COMMITTED_STATE_TABLE)
      .where({ provider_id: this.providerId })
      .select('*');
    return rows.map(row => ({
      sourceType: row.source_type,
      sourceId: row.source_id,
      observedAt: row.observed_at ?? null,
      entities: JSON.parse(row.entities_json) as OwnedEntity[],
    }));
  }

  async getPendingDelta(
    sourceType: SkillSourceType,
    sourceId: string,
  ): Promise<PendingDelta | undefined> {
    const row = await this.knex(PENDING_DELTA_TABLE)
      .where({
        provider_id: this.providerId,
        source_type: sourceType,
        source_id: sourceId,
      })
      .first();

    if (!row) {
      return undefined;
    }

    return {
      sourceType: row.source_type,
      sourceId: row.source_id,
      upserts: JSON.parse(row.upserts_json) as PlannedUpsert[],
      removals: JSON.parse(row.removals_json) as PlannedRemoval[],
      nextState: JSON.parse(row.next_state_json) as CommittedSourceState,
      revision: row.revision ?? undefined,
      acknowledgment: row.acknowledgment_json
        ? (JSON.parse(row.acknowledgment_json) as PendingAcknowledgment)
        : undefined,
    };
  }

  async getAllPendingDeltas(): Promise<PendingDelta[]> {
    const rows = await this.knex(PENDING_DELTA_TABLE)
      .where({ provider_id: this.providerId })
      .select('*');
    return rows.map(row => ({
      sourceType: row.source_type,
      sourceId: row.source_id,
      upserts: JSON.parse(row.upserts_json) as PlannedUpsert[],
      removals: JSON.parse(row.removals_json) as PlannedRemoval[],
      nextState: JSON.parse(row.next_state_json) as CommittedSourceState,
      revision: row.revision ?? undefined,
      acknowledgment: row.acknowledgment_json
        ? (JSON.parse(row.acknowledgment_json) as PendingAcknowledgment)
        : undefined,
    }));
  }

  async savePendingDelta(delta: PendingDelta): Promise<void> {
    const data: Record<string, unknown> = {
      provider_id: this.providerId,
      source_type: delta.sourceType,
      source_id: delta.sourceId,
      upserts_json: JSON.stringify(delta.upserts),
      removals_json: JSON.stringify(delta.removals),
      next_state_json: JSON.stringify(delta.nextState),
      revision: delta.revision ?? null,
      acknowledgment_json: delta.acknowledgment
        ? JSON.stringify(delta.acknowledgment)
        : null,
    };

    // Upsert in a transaction to prevent race conditions
    await this.knex.transaction(async trx => {
      const existing = await trx(PENDING_DELTA_TABLE)
        .where({
          provider_id: this.providerId,
          source_type: delta.sourceType,
          source_id: delta.sourceId,
        })
        .first();

      if (existing) {
        await trx(PENDING_DELTA_TABLE)
          .where({
            provider_id: this.providerId,
            source_type: delta.sourceType,
            source_id: delta.sourceId,
          })
          .update(data);
      } else {
        await trx(PENDING_DELTA_TABLE).insert(data);
      }
    });
  }

  async commitStateAndClearPending(
    sourceType: SkillSourceType,
    sourceId: string,
    nextState: CommittedSourceState,
  ): Promise<void> {
    await this.knex.transaction(async trx => {
      await this.upsertCommittedState(trx, sourceType, sourceId, nextState);

      // Clear pending delta
      await trx(PENDING_DELTA_TABLE)
        .where({
          provider_id: this.providerId,
          source_type: sourceType,
          source_id: sourceId,
        })
        .delete();
    });
  }

  async commitStateAndSaveAcknowledgment(
    sourceType: SkillSourceType,
    sourceId: string,
    nextState: CommittedSourceState,
    ack: PendingAcknowledgment,
  ): Promise<void> {
    await this.knex.transaction(async trx => {
      await this.upsertCommittedState(trx, sourceType, sourceId, nextState);

      // Clear pending delta
      await trx(PENDING_DELTA_TABLE)
        .where({
          provider_id: this.providerId,
          source_type: sourceType,
          source_id: sourceId,
        })
        .delete();

      // Upsert pending acknowledgment
      const ackData = {
        provider_id: this.providerId,
        source_type: ack.sourceType,
        source_id: ack.sourceId,
        connector_plugin_id: ack.connectorPluginId,
        revision: ack.revision,
        retained_digests_json: JSON.stringify(ack.retainedDigests),
        expected_entity_urls_json: JSON.stringify(ack.expectedEntityUrls),
        expected_removals_json: JSON.stringify(ack.expectedRemovals),
      };
      const existingAck = await trx(PENDING_ACK_TABLE)
        .where({
          provider_id: this.providerId,
          source_type: ack.sourceType,
          source_id: ack.sourceId,
        })
        .first();
      if (existingAck) {
        await trx(PENDING_ACK_TABLE)
          .where({
            provider_id: this.providerId,
            source_type: ack.sourceType,
            source_id: ack.sourceId,
          })
          .update(ackData);
      } else {
        await trx(PENDING_ACK_TABLE).insert(ackData);
      }
    });
  }

  async getPendingAcknowledgment(
    sourceType: SkillSourceType,
    sourceId: string,
  ): Promise<PendingAcknowledgment | undefined> {
    const row = await this.knex(PENDING_ACK_TABLE)
      .where({
        provider_id: this.providerId,
        source_type: sourceType,
        source_id: sourceId,
      })
      .first();

    if (!row) return undefined;
    return this.rowToAcknowledgment(row);
  }

  async getAllPendingAcknowledgments(): Promise<PendingAcknowledgment[]> {
    const rows = await this.knex(PENDING_ACK_TABLE)
      .where({ provider_id: this.providerId })
      .select('*');
    return rows.map(row => this.rowToAcknowledgment(row));
  }

  async clearPendingAcknowledgment(
    sourceType: SkillSourceType,
    sourceId: string,
  ): Promise<void> {
    await this.knex(PENDING_ACK_TABLE)
      .where({
        provider_id: this.providerId,
        source_type: sourceType,
        source_id: sourceId,
      })
      .delete();
  }

  // ─── Private helpers ──────────────────────────────────────────────

  private async upsertCommittedState(
    trx: Knex.Transaction,
    sourceType: SkillSourceType,
    sourceId: string,
    nextState: CommittedSourceState,
  ): Promise<void> {
    const existing = await trx(COMMITTED_STATE_TABLE)
      .where({
        provider_id: this.providerId,
        source_type: sourceType,
        source_id: sourceId,
      })
      .first();

    const stateData = {
      provider_id: this.providerId,
      source_type: sourceType,
      source_id: sourceId,
      observed_at: nextState.observedAt,
      entities_json: JSON.stringify(nextState.entities),
    };

    if (existing) {
      await trx(COMMITTED_STATE_TABLE)
        .where({
          provider_id: this.providerId,
          source_type: sourceType,
          source_id: sourceId,
        })
        .update(stateData);
    } else {
      await trx(COMMITTED_STATE_TABLE).insert(stateData);
    }
  }

  private rowToAcknowledgment(
    row: Record<string, unknown>,
  ): PendingAcknowledgment {
    return {
      sourceType: row.source_type as SkillSourceType,
      sourceId: row.source_id as string,
      connectorPluginId: row.connector_plugin_id as string,
      revision: row.revision as string,
      retainedDigests: JSON.parse(
        row.retained_digests_json as string,
      ) as string[],
      expectedEntityUrls: JSON.parse(
        row.expected_entity_urls_json as string,
      ) as Record<string, string>,
      expectedRemovals: JSON.parse(
        row.expected_removals_json as string,
      ) as string[],
    };
  }
}
