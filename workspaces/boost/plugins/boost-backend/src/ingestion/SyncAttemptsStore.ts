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

import type {
  DatabaseService,
  LoggerService,
} from '@backstage/backend-plugin-api';
import type { Knex } from 'knex';
import type { SyncAttemptRecord } from '@red-hat-developer-hub/backstage-plugin-boost-common';

// ---------------------------------------------------------------------------
// Table and row types
// ---------------------------------------------------------------------------

const TABLE_NAME = 'boost_sync_attempts';

/** @internal */
interface SyncAttemptRow {
  id: string;
  connector_id: string;
  timestamp: string;
  outcome: 'success' | 'failure';
  error_type: string | null;
  error_message: string | null;
  assets_added: number;
  assets_updated: number;
  assets_removed: number;
  duration_ms: number;
}

// ---------------------------------------------------------------------------
// Options
// ---------------------------------------------------------------------------

/**
 * Options for creating a {@link SyncAttemptsStore}.
 *
 * @public
 */
export interface SyncAttemptsStoreOptions {
  /** The Backstage database service. */
  database: DatabaseService;
  /** The Backstage logger service. */
  logger: LoggerService;
}

// ---------------------------------------------------------------------------
// Repository
// ---------------------------------------------------------------------------

/**
 * Database-backed store for sync attempt records.
 *
 * Manages the `boost_sync_attempts` table following the established
 * store pattern used by {@link ConversationStore} and
 * {@link AdminConfigService}.
 *
 * @public
 */
export class SyncAttemptsStore {
  private readonly logger: LoggerService;
  private knexPromise: Promise<Knex> | undefined;
  private readonly database: DatabaseService;

  constructor(options: SyncAttemptsStoreOptions) {
    this.logger = options.logger.child({ service: 'SyncAttemptsStore' });
    this.database = options.database;
  }

  /**
   * Get the Knex instance, creating tables on first access.
   */
  private async getDb(): Promise<Knex> {
    this.knexPromise ??= (async () => {
      const knex = await this.database.getClient();
      await this.ensureTable(knex);
      return knex;
    })().catch(err => {
      this.knexPromise = undefined;
      throw err;
    });
    return this.knexPromise;
  }

  /**
   * Ensure the sync attempts table and indexes exist.
   */
  private async ensureTable(knex: Knex): Promise<void> {
    if (!(await knex.schema.hasTable(TABLE_NAME))) {
      await knex.schema.createTable(TABLE_NAME, table => {
        table.string('id').primary().notNullable();
        table.string('connector_id').notNullable();
        table
          .timestamp('timestamp', { useTz: true })
          .defaultTo(knex.fn.now())
          .notNullable();
        table.string('outcome').notNullable();
        table.string('error_type').nullable();
        table.text('error_message').nullable();
        table.integer('assets_added').notNullable().defaultTo(0);
        table.integer('assets_updated').notNullable().defaultTo(0);
        table.integer('assets_removed').notNullable().defaultTo(0);
        table.integer('duration_ms').notNullable().defaultTo(0);

        // Indexes for efficient health status queries (tasks 1.2, 1.6)
        table.index(['connector_id', 'timestamp'], 'idx_sync_connector_ts');
      });
      this.logger.info(`Created ${TABLE_NAME} table`);
    }
  }

  // -------------------------------------------------------------------------
  // Row → Record conversion
  // -------------------------------------------------------------------------

  private rowToRecord(row: SyncAttemptRow): SyncAttemptRecord {
    return {
      id: row.id,
      connectorId: row.connector_id,
      timestamp: row.timestamp,
      outcome: row.outcome,
      errorType: row.error_type,
      errorMessage: row.error_message,
      assetsAdded: row.assets_added,
      assetsUpdated: row.assets_updated,
      assetsRemoved: row.assets_removed,
      durationMs: row.duration_ms,
    };
  }

  // -------------------------------------------------------------------------
  // Operations
  // -------------------------------------------------------------------------

  /**
   * Insert a new sync attempt record.
   *
   * @param attempt - The sync attempt data to insert.
   * @returns The inserted record.
   */
  async insertSyncAttempt(attempt: {
    id: string;
    connectorId: string;
    outcome: 'success' | 'failure';
    errorType?: string | null;
    errorMessage?: string | null;
    assetsAdded?: number;
    assetsUpdated?: number;
    assetsRemoved?: number;
    durationMs?: number;
  }): Promise<SyncAttemptRecord> {
    const knex = await this.getDb();
    const now = knex.fn.now() as unknown as string;

    await knex<SyncAttemptRow>(TABLE_NAME).insert({
      id: attempt.id,
      connector_id: attempt.connectorId,
      timestamp: now,
      outcome: attempt.outcome,
      error_type: attempt.errorType ?? null,
      error_message: attempt.errorMessage ?? null,
      assets_added: attempt.assetsAdded ?? 0,
      assets_updated: attempt.assetsUpdated ?? 0,
      assets_removed: attempt.assetsRemoved ?? 0,
      duration_ms: attempt.durationMs ?? 0,
    });

    this.logger.debug(
      `Sync attempt recorded: ${attempt.connectorId} → ${attempt.outcome}`,
    );

    const created = await knex<SyncAttemptRow>(TABLE_NAME)
      .where({ id: attempt.id })
      .first();
    if (!created) {
      throw new Error(
        `Failed to read back inserted sync attempt: ${attempt.id}`,
      );
    }
    return this.rowToRecord(created);
  }

  /**
   * Get the latest sync attempts for a connector, ordered by
   * timestamp descending.
   *
   * @param connectorId - The connector to query.
   * @param limit - Maximum number of attempts to return (default 3).
   * @returns The most recent attempts, newest first.
   */
  async getLatestAttempts(
    connectorId: string,
    limit: number = 3,
  ): Promise<SyncAttemptRecord[]> {
    const knex = await this.getDb();
    const rows = await knex<SyncAttemptRow>(TABLE_NAME)
      .where({ connector_id: connectorId })
      .orderBy('timestamp', 'desc')
      .limit(limit)
      .select();
    return rows.map(row => this.rowToRecord(row));
  }

  /**
   * Get the latest sync attempts for all connectors at once.
   *
   * Uses per-connector queries so a busy connector cannot starve
   * quieter ones via a global ORDER BY + LIMIT window.
   *
   * @param connectorIds - The connector IDs to query.
   * @param limit - Maximum number of attempts per connector (default 3).
   * @returns Map of connector ID → attempts (newest first).
   */
  async getLatestAttemptsForAll(
    connectorIds: string[],
    limit: number = 3,
  ): Promise<Map<string, SyncAttemptRecord[]>> {
    if (connectorIds.length === 0) {
      return new Map();
    }

    const entries = await Promise.all(
      connectorIds.map(async id => {
        const attempts = await this.getLatestAttempts(id, limit);
        return [id, attempts] as const;
      }),
    );

    return new Map(entries);
  }

  /**
   * Get the most recent successful sync attempt for a connector.
   *
   * @param connectorId - The connector to query.
   * @returns The latest successful attempt, or null if none exist.
   */
  async getLastSuccessfulAttempt(
    connectorId: string,
  ): Promise<SyncAttemptRecord | null> {
    const knex = await this.getDb();
    const row = await knex<SyncAttemptRow>(TABLE_NAME)
      .where({ connector_id: connectorId, outcome: 'success' })
      .orderBy('timestamp', 'desc')
      .first();
    return row ? this.rowToRecord(row) : null;
  }

  /**
   * Delete old sync attempts beyond the retention limit for a
   * specific connector.
   *
   * @param connectorId - The connector to clean up.
   * @param retentionLimit - Maximum number of attempts to keep.
   * @returns The number of records deleted.
   */
  async cleanupOldAttempts(
    connectorId: string,
    retentionLimit: number,
  ): Promise<number> {
    const knex = await this.getDb();

    // Find the ID of the Nth newest record (the cutoff).
    const keepRows = await knex<SyncAttemptRow>(TABLE_NAME)
      .where({ connector_id: connectorId })
      .orderBy('timestamp', 'desc')
      .limit(retentionLimit)
      .select('id');

    if (keepRows.length < retentionLimit) {
      // Not enough records to require cleanup
      return 0;
    }

    const keepIds = keepRows.map(r => r.id);
    const deleted = await knex<SyncAttemptRow>(TABLE_NAME)
      .where({ connector_id: connectorId })
      .whereNotIn('id', keepIds)
      .delete();

    if (deleted > 0) {
      this.logger.info(
        `Cleaned up ${deleted} old sync attempts for connector ${connectorId}`,
      );
    }
    return deleted;
  }

  /**
   * Get all distinct connector IDs that have sync attempts.
   *
   * @returns Array of connector IDs.
   */
  async getDistinctConnectorIds(): Promise<string[]> {
    const knex = await this.getDb();
    const rows = await knex<SyncAttemptRow>(TABLE_NAME)
      .distinct('connector_id')
      .select();
    return rows.map(r => r.connector_id);
  }
}
