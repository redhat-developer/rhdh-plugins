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

import type { Knex } from 'knex';

import type {
  CommittedSourceState,
  OwnedEntity,
  PlannedRemoval,
  PlannedUpsert,
} from './types';

// ─── Database table and column names ────────────────────────────────

const COMMITTED_STATE_TABLE = 'skills_provider_committed_state';
const PENDING_DELTA_TABLE = 'skills_provider_pending_delta';

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
  sourceType: string;
  /** Source identifier. */
  sourceId: string;
  /** Planned upserts from the reconciliation plan. */
  upserts: PlannedUpsert[];
  /** Planned removals from the reconciliation plan. */
  removals: PlannedRemoval[];
  /** The intended next committed state after this delta is applied. */
  nextState: CommittedSourceState;
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
    sourceType: string,
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
    sourceType: string,
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
    sourceType: string,
    sourceId: string,
    nextState: CommittedSourceState,
  ): Promise<void>;
}

// ─── Database-backed implementation ─────────────────────────────────

/**
 * Database-backed reconciliation store using Backstage's Knex database
 * service.
 *
 * Uses two tables:
 * - `skills_provider_committed_state`: committed ownership state per source
 * - `skills_provider_pending_delta`: pending deltas before catalog mutation
 *
 * @public
 */
export class DatabaseReconciliationStore implements ReconciliationStore {
  constructor(private readonly knex: Knex) {}

  async initialize(): Promise<void> {
    const hasCommitted = await this.knex.schema.hasTable(COMMITTED_STATE_TABLE);
    if (!hasCommitted) {
      await this.knex.schema.createTable(COMMITTED_STATE_TABLE, table => {
        table.string('source_type').notNullable();
        table.string('source_id').notNullable();
        table.string('observed_at').nullable();
        table.text('entities_json').notNullable().defaultTo('[]');
        table.primary(['source_type', 'source_id']);
      });
    }

    const hasPending = await this.knex.schema.hasTable(PENDING_DELTA_TABLE);
    if (!hasPending) {
      await this.knex.schema.createTable(PENDING_DELTA_TABLE, table => {
        table.string('source_type').notNullable();
        table.string('source_id').notNullable();
        table.text('upserts_json').notNullable().defaultTo('[]');
        table.text('removals_json').notNullable().defaultTo('[]');
        table.text('next_state_json').notNullable();
        table.primary(['source_type', 'source_id']);
      });
    }
  }

  async getCommittedState(
    sourceType: string,
    sourceId: string,
  ): Promise<CommittedSourceState> {
    const row = await this.knex(COMMITTED_STATE_TABLE)
      .where({ source_type: sourceType, source_id: sourceId })
      .first();

    if (!row) {
      return {
        sourceType: sourceType as CommittedSourceState['sourceType'],
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
    const rows = await this.knex(COMMITTED_STATE_TABLE).select('*');
    return rows.map(row => ({
      sourceType: row.source_type,
      sourceId: row.source_id,
      observedAt: row.observed_at ?? null,
      entities: JSON.parse(row.entities_json) as OwnedEntity[],
    }));
  }

  async getPendingDelta(
    sourceType: string,
    sourceId: string,
  ): Promise<PendingDelta | undefined> {
    const row = await this.knex(PENDING_DELTA_TABLE)
      .where({ source_type: sourceType, source_id: sourceId })
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
    };
  }

  async getAllPendingDeltas(): Promise<PendingDelta[]> {
    const rows = await this.knex(PENDING_DELTA_TABLE).select('*');
    return rows.map(row => ({
      sourceType: row.source_type,
      sourceId: row.source_id,
      upserts: JSON.parse(row.upserts_json) as PlannedUpsert[],
      removals: JSON.parse(row.removals_json) as PlannedRemoval[],
      nextState: JSON.parse(row.next_state_json) as CommittedSourceState,
    }));
  }

  async savePendingDelta(delta: PendingDelta): Promise<void> {
    const data = {
      source_type: delta.sourceType,
      source_id: delta.sourceId,
      upserts_json: JSON.stringify(delta.upserts),
      removals_json: JSON.stringify(delta.removals),
      next_state_json: JSON.stringify(delta.nextState),
    };

    // Upsert: insert or replace the pending delta for this source
    const existing = await this.knex(PENDING_DELTA_TABLE)
      .where({
        source_type: delta.sourceType,
        source_id: delta.sourceId,
      })
      .first();

    if (existing) {
      await this.knex(PENDING_DELTA_TABLE)
        .where({
          source_type: delta.sourceType,
          source_id: delta.sourceId,
        })
        .update(data);
    } else {
      await this.knex(PENDING_DELTA_TABLE).insert(data);
    }
  }

  async commitStateAndClearPending(
    sourceType: string,
    sourceId: string,
    nextState: CommittedSourceState,
  ): Promise<void> {
    await this.knex.transaction(async trx => {
      // Upsert committed state
      const existing = await trx(COMMITTED_STATE_TABLE)
        .where({ source_type: sourceType, source_id: sourceId })
        .first();

      const stateData = {
        source_type: sourceType,
        source_id: sourceId,
        observed_at: nextState.observedAt,
        entities_json: JSON.stringify(nextState.entities),
      };

      if (existing) {
        await trx(COMMITTED_STATE_TABLE)
          .where({ source_type: sourceType, source_id: sourceId })
          .update(stateData);
      } else {
        await trx(COMMITTED_STATE_TABLE).insert(stateData);
      }

      // Clear pending delta
      await trx(PENDING_DELTA_TABLE)
        .where({ source_type: sourceType, source_id: sourceId })
        .delete();
    });
  }
}
