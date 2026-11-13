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

import {
  resolvePackagePath,
  type DatabaseService,
  type LoggerService,
} from '@backstage/backend-plugin-api';
import { InputError } from '@backstage/errors';
import type { Knex } from 'knex';
import {
  DEFAULT_MAX_RETAINED_MARKDOWN_SIZE,
  MAX_RETAINED_DIGESTS,
} from './types';

/** Admission check result. */
export interface AdmissionResult {
  admitted: boolean;
  reason?: string;
}

/** Last successful acknowledgment state for a source. */
export interface AcknowledgmentState {
  revision: string;
  retainedDigests: string[];
  acknowledgedAt: string;
}

/** Stored content entry. */
interface ContentEntry {
  content: string;
  sizeBytes: number;
  storedAt: string;
}

/**
 * Bounded Markdown content store with revision tracking and reconciliation.
 *
 * Stores verified OCI skill Markdown keyed by source and manifest digest.
 * Supports bounded retention, monotonic revision tracking, and
 * provider-authorized reconciliation per the D8 specification.
 *
 * Uses an in-memory store. When a DatabaseService is available, content
 * and state are persisted durably and recovered after restarts.
 * Callers must serialize mutations for each source, including admission,
 * storage, revision allocation, acknowledgment, and cleanup. The connector
 * owns that lock; this store does not provide internal concurrency control.
 */
export class ContentStore {
  // In-memory content indexed by `${sourceId}\0${digest}`
  private content = new Map<string, ContentEntry>();

  // Per-source revision counters
  private revisions = new Map<string, bigint>();

  // Per-source last successful acknowledgment
  private acknowledgments = new Map<string, AcknowledgmentState>();

  // Optional database-backed persistence
  private knex?: import('knex').Knex;
  private durable = false;

  constructor(
    private readonly logger: LoggerService,
    private readonly maxRetainedBytes: number = DEFAULT_MAX_RETAINED_MARKDOWN_SIZE,
  ) {}

  private contentKey(sourceId: string, digest: string): string {
    return `${sourceId}\0${digest}`;
  }

  /**
   * Initialize with optional database persistence.
   * When database is provided, content and state survive restarts.
   */
  async initialize(database?: DatabaseService): Promise<void> {
    if (database) {
      try {
        const migrationsDir = resolvePackagePath(
          '@red-hat-developer-hub/backstage-plugin-skill-image-connector-backend',
          'migrations',
        );
        this.knex = await database.getClient();
        if (!database.migrations?.skip) {
          await this.knex.migrate.latest({ directory: migrationsDir });
        }
        this.durable = true;
        await this.recoverFromDatabase();
        this.logger.info('ContentStore initialized with durable storage');
      } catch (error) {
        this.logger.error(
          'ContentStore: durable storage initialization failed; refusing startup.',
          error as Error,
        );
        throw error;
      }
    } else {
      this.logger.info(
        'ContentStore initialized with in-memory storage (no database provided)',
      );
    }
  }

  /** Recover persisted state from the database into memory. */
  private async recoverFromDatabase(): Promise<void> {
    if (!this.knex) return;

    // Recover content
    const rows = await this.knex('retained_markdown').select('*');
    for (const row of rows) {
      this.content.set(this.contentKey(row.source_id, row.digest), {
        content: row.content,
        sizeBytes: row.size_bytes,
        storedAt: row.stored_at,
      });
    }

    // Recover revisions
    const revRows = await this.knex('source_revision').select('*');
    for (const row of revRows) {
      this.revisions.set(row.source_id, BigInt(row.current_revision));
    }

    // Recover acknowledgments
    const ackRows = await this.knex('reconcile_state').select('*');
    for (const row of ackRows) {
      let parsed: unknown;
      try {
        parsed = JSON.parse(row.ack_retained_digests);
      } catch {
        this.logger.warn(
          `ContentStore: malformed ack_retained_digests JSON for source ${row.source_id}, skipping`,
        );
        continue;
      }
      if (
        !Array.isArray(parsed) ||
        !parsed.every((d: unknown) => typeof d === 'string')
      ) {
        this.logger.warn(
          `ContentStore: invalid ack_retained_digests for source ${row.source_id}, skipping`,
        );
        continue;
      }
      this.acknowledgments.set(row.source_id, {
        revision: row.ack_revision,
        retainedDigests: parsed as string[],
        acknowledgedAt: row.ack_at,
      });
    }

    this.logger.info(
      `ContentStore recovered: ${rows.length} content entries, ` +
        `${revRows.length} revision counters, ${ackRows.length} acknowledgments`,
    );
  }

  // ── Content storage ────────────────────────────────────────────────

  /**
   * Check whether a new Markdown document can be admitted for a source.
   * Does not mutate state.
   */
  async checkAdmission(
    sourceId: string,
    sizeBytes: number,
  ): Promise<AdmissionResult> {
    const stats = await this.getSourceStats(sourceId);
    if (stats.digestCount >= MAX_RETAINED_DIGESTS) {
      return {
        admitted: false,
        reason: `Retained digest count would exceed ${MAX_RETAINED_DIGESTS}`,
      };
    }
    if (stats.totalBytes + sizeBytes > this.maxRetainedBytes) {
      return {
        admitted: false,
        reason:
          `Retained bytes would exceed ${this.maxRetainedBytes} ` +
          `(current: ${stats.totalBytes}, new: ${sizeBytes})`,
      };
    }
    return { admitted: true };
  }

  /**
   * Store Markdown content for a source and digest.
   * Idempotent: if content for this source+digest already exists, it is
   * not replaced (same digest = same content).
   *
   * Returns true if newly stored, false if already existed.
   */
  async store(
    sourceId: string,
    digest: string,
    content: string,
  ): Promise<boolean> {
    const key = this.contentKey(sourceId, digest);
    if (this.content.has(key)) {
      return false;
    }

    const sizeBytes = Buffer.byteLength(content, 'utf-8');
    const storedAt = new Date().toISOString();

    // Persist to database first when durable — failure prevents
    // in-memory update so unpersisted content is never published.
    if (this.durable && this.knex) {
      const existing = await this.knex('retained_markdown')
        .where({ source_id: sourceId, digest })
        .first();
      if (!existing) {
        await this.knex('retained_markdown').insert({
          source_id: sourceId,
          digest,
          content,
          size_bytes: sizeBytes,
          stored_at: storedAt,
        });
      }
    }

    this.content.set(key, { content, sizeBytes, storedAt });
    return true;
  }

  /**
   * Retrieve stored Markdown content for a source and digest.
   */
  async get(sourceId: string, digest: string): Promise<string | undefined> {
    const entry = this.content.get(this.contentKey(sourceId, digest));
    return entry?.content;
  }

  /**
   * Get all retained digests for a source.
   */
  async getRetainedDigests(sourceId: string): Promise<string[]> {
    const prefix = `${sourceId}\0`;
    const digests: string[] = [];
    for (const key of this.content.keys()) {
      if (key.startsWith(prefix)) {
        digests.push(key.slice(prefix.length));
      }
    }
    return digests;
  }

  /**
   * Get source statistics: total retained bytes and digest count.
   */
  async getSourceStats(
    sourceId: string,
  ): Promise<{ totalBytes: number; digestCount: number }> {
    const prefix = `${sourceId}\0`;
    let totalBytes = 0;
    let digestCount = 0;
    for (const [key, entry] of this.content) {
      if (key.startsWith(prefix)) {
        totalBytes += entry.sizeBytes;
        digestCount++;
      }
    }
    return { totalBytes, digestCount };
  }

  /**
   * Delete content for specific digests within a source.
   */
  private async deleteDigests(
    sourceId: string,
    digests: string[],
  ): Promise<number> {
    if (digests.length === 0) return 0;

    // Persist deletion to database first when durable — failure
    // prevents in-memory update, matching store/allocateRevision/
    // saveAcknowledgment's DB-first pattern.
    if (this.durable && this.knex) {
      await this.knex('retained_markdown')
        .where({ source_id: sourceId })
        .whereIn('digest', digests)
        .delete();
    }

    let deleted = 0;
    for (const digest of digests) {
      const key = this.contentKey(sourceId, digest);
      if (this.content.delete(key)) {
        deleted++;
      }
    }

    return deleted;
  }

  // ── Revision tracking ──────────────────────────────────────────────

  /**
   * Allocate a new monotonically increasing revision for a source.
   * Returns the new revision as a decimal string.
   * Never reused on restart when durable storage is available.
   */
  async allocateRevision(sourceId: string): Promise<string> {
    const prev = this.revisions.get(sourceId) ?? BigInt(0);
    const next = prev + BigInt(1);
    const nextStr = next.toString();

    // Persist to database first when durable — failure prevents
    // in-memory update so unpersisted revisions are never published.
    if (this.durable && this.knex) {
      const existing = await this.knex('source_revision')
        .where({ source_id: sourceId })
        .first();
      if (existing) {
        await this.knex('source_revision')
          .where({ source_id: sourceId })
          .update({ current_revision: nextStr });
      } else {
        await this.knex('source_revision').insert({
          source_id: sourceId,
          current_revision: nextStr,
        });
      }
    }

    this.revisions.set(sourceId, next);
    return nextStr;
  }

  /**
   * Get the current revision for a source.
   * Returns undefined if no revision has been allocated yet.
   */
  async getCurrentRevision(sourceId: string): Promise<string | undefined> {
    const rev = this.revisions.get(sourceId);
    return rev !== undefined ? rev.toString() : undefined;
  }

  // ── Reconciliation acknowledgment ──────────────────────────────────

  /**
   * Record a successful reconciliation acknowledgment.
   */
  async saveAcknowledgment(
    sourceId: string,
    revision: string,
    retainedDigests: string[],
  ): Promise<void> {
    const now = new Date().toISOString();
    const sorted = [...retainedDigests].sort();

    if (this.durable && this.knex) {
      await this.persistAcknowledgment(
        this.knex,
        sourceId,
        revision,
        sorted,
        now,
      );
    }

    const state: AcknowledgmentState = {
      revision,
      retainedDigests: sorted,
      acknowledgedAt: now,
    };
    this.acknowledgments.set(sourceId, state);
  }

  /**
   * Atomically acknowledge retention and delete only content absent from both
   * the acknowledged retain set and the current snapshot. A crash rolls back
   * both writes or preserves both, so startup must never infer new deletions
   * from a historical acknowledgment. Call under the source publication lock.
   */
  async acknowledgeAndCleanup(
    sourceId: string,
    revision: string,
    retainedDigests: string[],
    currentSnapshotDigests: ReadonlySet<string>,
  ): Promise<number> {
    const retained = [...retainedDigests].sort();
    const protectedDigests = new Set([...retained, ...currentSnapshotDigests]);
    const toDelete = (await this.getRetainedDigests(sourceId)).filter(
      digest => !protectedDigests.has(digest),
    );
    const acknowledgedAt = new Date().toISOString();

    if (this.durable && this.knex) {
      await this.knex.transaction(async transaction => {
        await this.persistAcknowledgment(
          transaction,
          sourceId,
          revision,
          retained,
          acknowledgedAt,
        );
        if (toDelete.length > 0) {
          await transaction('retained_markdown')
            .where({ source_id: sourceId })
            .whereIn('digest', toDelete)
            .delete();
        }
      });
    }

    // No awaits between updating the cache entries after the durable commit.
    this.acknowledgments.set(sourceId, {
      revision,
      retainedDigests: retained,
      acknowledgedAt,
    });
    for (const digest of toDelete) {
      this.content.delete(this.contentKey(sourceId, digest));
    }
    return toDelete.length;
  }

  private async persistAcknowledgment(
    client: Knex,
    sourceId: string,
    revision: string,
    retainedDigests: string[],
    acknowledgedAt: string,
  ): Promise<void> {
    const values = {
      ack_revision: revision,
      ack_retained_digests: JSON.stringify(retainedDigests),
      ack_at: acknowledgedAt,
    };
    const existing = await client('reconcile_state')
      .where({ source_id: sourceId })
      .first();
    if (existing) {
      await client('reconcile_state')
        .where({ source_id: sourceId })
        .update(values);
    } else {
      await client('reconcile_state').insert({
        source_id: sourceId,
        ...values,
      });
    }
  }

  /**
   * Get the last successful acknowledgment for a source.
   */
  async getLastAcknowledgment(
    sourceId: string,
  ): Promise<AcknowledgmentState | undefined> {
    return this.acknowledgments.get(sourceId);
  }

  /**
   * Perform cleanup: delete digests not in the protected set.
   * When `protectedDigests` is empty, all retained digests are eligible
   * for deletion — nothing is protected.
   */
  async cleanup(
    sourceId: string,
    protectedDigests: Set<string>,
  ): Promise<number> {
    const allDigests = await this.getRetainedDigests(sourceId);
    const toDelete = allDigests.filter(d => !protectedDigests.has(d));
    if (toDelete.length === 0) return 0;
    this.logger.info(
      `Cleaning up ${toDelete.length} unreferenced digest(s) for source ${sourceId}`,
    );
    return this.deleteDigests(sourceId, toDelete);
  }

  /**
   * Validate that a configured retention limit is not below already-retained bytes.
   */
  async validateRetentionLimit(sourceId: string): Promise<void> {
    const stats = await this.getSourceStats(sourceId);
    if (stats.totalBytes > this.maxRetainedBytes) {
      throw new InputError(
        `skillImageConnector.maxRetainedMarkdownSizeBytes (${this.maxRetainedBytes}) ` +
          `is below already-retained bytes for source '${sourceId}' (${stats.totalBytes}). ` +
          `Raise the limit or use a controlled inventory drain to reduce retained content.`,
      );
    }
  }
}
