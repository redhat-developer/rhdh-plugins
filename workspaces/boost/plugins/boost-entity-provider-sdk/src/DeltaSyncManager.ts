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

/**
 * Persisted state for a sync cursor.
 *
 * @public
 */
export interface CursorState {
  /** The opaque cursor value (e.g. ETag, page token). */
  cursor: string;
  /** ISO-8601 timestamp of the last successful sync. */
  lastSyncTimestamp: string;
}

/**
 * Abstraction for persisting sync cursors.
 *
 * Implementations may use the catalog database, a cache service, or
 * any other durable storage. The SDK ships this interface so that
 * consuming backend plugins can provide a concrete implementation
 * backed by their own database connection.
 *
 * @public
 */
export interface CursorStore {
  /**
   * Retrieve the cursor state for a provider.
   *
   * @param providerId - The unique provider identifier
   *   (e.g. `"kagenti/default"`).
   * @returns The persisted cursor state, or `undefined` if no cursor
   *   has been stored (first sync or after a clear).
   */
  get(providerId: string): Promise<CursorState | undefined>;

  /**
   * Persist a cursor state for a provider.
   *
   * Called after a successful delta sync to record the cursor for
   * the next polling cycle.
   *
   * @param providerId - The unique provider identifier.
   * @param state - The cursor state to persist.
   */
  set(providerId: string, state: CursorState): Promise<void>;

  /**
   * Delete the cursor for a provider, forcing a full refresh on the
   * next polling cycle.
   *
   * @param providerId - The unique provider identifier.
   */
  delete(providerId: string): Promise<void>;
}

/**
 * Input to {@link DeltaSyncManager.applyDelta}.
 *
 * Represents the changes reported by a connector since the last
 * sync cursor.
 *
 * @public
 */
export interface ApplyDeltaOptions {
  /** Entities that were added since the last cursor. */
  added: Entity[];
  /** Entities that were updated since the last cursor. */
  updated: Entity[];
  /** Entity references that were removed since the last cursor. */
  removed: Array<{ entityRef: string }>;
  /**
   * Cursor to persist for the next polling cycle.
   * When omitted, the existing cursor is left unchanged.
   */
  nextCursor?: string;
}

/**
 * Options for constructing a {@link DeltaSyncManager}.
 *
 * @public
 */
export interface DeltaSyncManagerOptions {
  /** The catalog entity provider connection. */
  connection: EntityProviderConnection;
  /** Storage backend for sync cursors. */
  cursorStore: CursorStore;
  /**
   * Location key identifying this provider's entities in the catalog.
   * Used in `applyMutation` calls so the catalog knows which
   * entities belong to this provider.
   */
  locationKey: string;
}

/**
 * Delta sync framework wrapping Backstage's
 * `applyMutation({ type: 'delta' })` API.
 *
 * Translates connector-reported additions, updates, and deletions
 * into catalog delta mutations, and manages cursor persistence so
 * providers can resume incremental sync across polling cycles.
 *
 * When no cursor is available (first run or after
 * {@link DeltaSyncManager.clearCursor}), the provider should fall
 * back to a full refresh.
 *
 * @example
 * ```ts
 * const manager = new DeltaSyncManager({
 *   connection,
 *   cursorStore: myCursorStore,
 *   locationKey: 'my-provider',
 * });
 *
 * const cursor = await manager.getCursor('my-provider');
 * if (!cursor) {
 *   // First run — perform full refresh
 *   await connection.applyMutation({ type: 'full', entities: [...] });
 * } else {
 *   // Incremental sync
 *   const delta = await connector.fetchDelta(cursor);
 *   await manager.applyDelta({
 *     added: delta.added,
 *     updated: delta.updated,
 *     removed: delta.removed,
 *     nextCursor: delta.nextCursor,
 *   });
 * }
 * ```
 *
 * @public
 */
export class DeltaSyncManager {
  private readonly connection: EntityProviderConnection;
  private readonly cursorStore: CursorStore;
  private readonly locationKey: string;

  constructor(options: DeltaSyncManagerOptions) {
    this.connection = options.connection;
    this.cursorStore = options.cursorStore;
    this.locationKey = options.locationKey;
  }

  /**
   * Apply a delta (incremental) mutation to the catalog.
   *
   * Merges `added` and `updated` entities into the `added` array
   * of Backstage's delta mutation (Backstage treats updates as
   * upserts). Passes `removed` entity refs to the `removed` array.
   *
   * After a successful mutation, persists the `nextCursor` (if
   * provided) for the next polling cycle.
   *
   * @param options - The delta to apply.
   */
  async applyDelta(options: ApplyDeltaOptions): Promise<void> {
    const { added, updated, removed, nextCursor } = options;

    // Backstage's delta API treats updates as additions (upserts)
    const allAdded = [...added, ...updated].map(entity => ({
      entity,
      locationKey: this.locationKey,
    }));

    const allRemoved = removed.map(r => ({
      entityRef: r.entityRef,
      locationKey: this.locationKey,
    }));

    await this.connection.applyMutation({
      type: 'delta',
      added: allAdded,
      removed: allRemoved,
    });

    // Persist cursor after successful mutation
    if (nextCursor) {
      await this.cursorStore.set(this.locationKey, {
        cursor: nextCursor,
        lastSyncTimestamp: new Date().toISOString(),
      });
    }
  }

  /**
   * Retrieve the last persisted sync cursor for a provider.
   *
   * Returns `undefined` when no cursor has been stored (first sync
   * or after {@link DeltaSyncManager.clearCursor}). Providers should
   * treat a missing cursor as a signal to perform a full refresh.
   *
   * @param providerId - The unique provider identifier.
   * @returns The cursor string, or `undefined` if none exists.
   */
  async getCursor(providerId: string): Promise<string | undefined> {
    const state = await this.cursorStore.get(providerId);
    return state?.cursor;
  }

  /**
   * Clear the persisted cursor for a provider, forcing a full
   * refresh on the next polling cycle.
   *
   * Call this when the connector rejects the cursor (e.g. HTTP 412
   * Precondition Failed) to trigger fallback to full refresh.
   *
   * @param providerId - The unique provider identifier.
   */
  async clearCursor(providerId: string): Promise<void> {
    await this.cursorStore.delete(providerId);
  }
}

/**
 * Simple in-memory {@link CursorStore} implementation.
 *
 * Suitable for development and testing. Cursors are lost on process
 * restart. For production use, implement {@link CursorStore} with a
 * durable backend (e.g. the catalog database).
 *
 * @public
 */
export class InMemoryCursorStore implements CursorStore {
  private readonly store = new Map<string, CursorState>();

  async get(providerId: string): Promise<CursorState | undefined> {
    return this.store.get(providerId);
  }

  async set(providerId: string, state: CursorState): Promise<void> {
    this.store.set(providerId, state);
  }

  async delete(providerId: string): Promise<void> {
    this.store.delete(providerId);
  }
}
