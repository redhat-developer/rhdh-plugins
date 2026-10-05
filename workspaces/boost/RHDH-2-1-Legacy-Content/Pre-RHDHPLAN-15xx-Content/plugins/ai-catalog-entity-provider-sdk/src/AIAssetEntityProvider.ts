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

/**
 * Represents the result of a delta (incremental) sync operation.
 *
 * @public
 */
export interface DeltaResult {
  /** Entities that were added or updated since the last cursor. */
  added: Entity[];
  /** Entities that were removed since the last cursor. */
  removed: Array<{ entityRef: string }>;
  /** Cursor to pass to the next `delta()` call. */
  nextCursor?: string;
}

/**
 * Contract for AI asset entity providers.
 *
 * Providers implement this interface to emit AI asset catalog entities
 * (agents, skills, MCP servers, models, etc.) from an external registry.
 *
 * The interface supports two sync patterns:
 * - **Full refresh** — implement only `entities()`. The provider yields
 *   all known entities on each poll cycle.
 * - **Incremental (delta) sync** — additionally implement `delta()`.
 *   The provider yields only additions, updates, and deletions since
 *   the last cursor position.
 *
 * @public
 */
export interface AIAssetEntityProvider {
  /**
   * Establish a connection to the external registry.
   *
   * Called once when the provider is registered with the catalog.
   * Use this to set up HTTP clients, authenticate, or verify
   * connectivity.
   */
  connect(): Promise<void>;

  /**
   * Async generator that yields all known entities.
   *
   * Used for full-refresh sync. On each poll cycle, the catalog
   * replaces the entire set of entities from this provider with
   * the entities yielded here.
   *
   * Every yielded entity MUST carry the three required AI asset
   * annotations: `rhdh.io/ai-asset-category`,
   * `rhdh.io/ai-asset-version`, and `rhdh.io/ai-asset-source`.
   */
  entities(): AsyncGenerator<Entity>;

  /**
   * Return the human-readable provider name.
   *
   * Used for logging and UI display (e.g. `"Kagenti"`, `"LlamaStack"`).
   */
  getProviderName(): string;

  /**
   * Return the unique provider instance identifier.
   *
   * Scoped to the app-config instance ID (e.g. `"prod-kagenti"`,
   * `"default"`). Used for entity deduplication and provenance
   * tracking via the `rhdh.io/ai-asset-source` annotation.
   */
  getProviderId(): string;

  /**
   * Optional incremental sync method.
   *
   * When implemented, the catalog can poll for changes since the
   * last known cursor instead of performing a full refresh.
   *
   * @param cursor - The cursor from the previous `delta()` call,
   *   or `undefined` for the initial sync.
   * @returns A delta result containing added/removed entities and
   *   the next cursor position.
   */
  delta?(cursor?: string): Promise<DeltaResult>;
}
