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
  LoggerService,
  SchedulerServiceTaskRunner,
} from '@backstage/backend-plugin-api';
import {
  ANNOTATION_LOCATION,
  ANNOTATION_ORIGIN_LOCATION,
  type Entity,
} from '@backstage/catalog-model';
import type {
  DeferredEntity,
  EntityProvider,
  EntityProviderConnection,
} from '@backstage/plugin-catalog-node';
import {
  mapServerToEntity,
  projectAnnotations,
} from '@red-hat-developer-hub/backstage-plugin-catalog-mcp-registry-server-mapping';
import type { McpServerMappingDefaults } from '@red-hat-developer-hub/backstage-plugin-catalog-mcp-registry-server-mapping';
import {
  resolveMcpRegistryProviderConfig,
  type McpRegistryProviderConfig,
  type ResolvedMcpRegistryProviderConfig,
} from './config';
import { fetchRegistryServers, McpRegistryClientError } from './client';
import type { McpRegistryServerEntry } from './client';
import {
  buildLastGoodKey,
  formatMappingFailureMessage,
  hasNativeRemote,
  readServerIdentity,
} from './providerUtils';
import { stripTrailingSlashes } from './util';

/** Provider name and locationKey constant. */
const PROVIDER_NAME = 'mcp-registry-provider';

/** Sync status annotation key. */
const SYNC_STATUS_ANNOTATION = 'redhat.com/rhdh-mcp-registry-sync-status';

/**
 * Entity provider that ingests MCP servers from one configured
 * MCP Registry into the Backstage catalog.
 *
 * @public
 */
export class McpRegistryEntityProvider implements EntityProvider {
  private connection?: EntityProviderConnection;
  private readonly config: ResolvedMcpRegistryProviderConfig;
  private readonly logger: LoggerService;
  private readonly fetchApi?: typeof fetch;
  private readonly taskRunner?: SchedulerServiceTaskRunner;

  /**
   * Internal last-good index: keyed by `name::version`, stores the
   * last successfully committed DeferredEntity so that a subsequent
   * sync can retain it when mapping fails (D6).
   */
  private readonly lastGoodIndex = new Map<string, DeferredEntity>();

  /**
   * Resume state for multi-sync pagination. When a sync hits
   * `pageLimit` with more pages remaining, entries fetched so far and
   * the next cursor are kept here so the following sync continues
   * instead of restarting. Cleared when a traversal reaches the end
   * of the registry (no next cursor) or a `maxEntries` soft-stop and a
   * full mutation is committed.
   */
  private resumeCursor?: string;
  private pendingEntries: McpRegistryServerEntry[] = [];
  private seenCursors: Set<string> = new Set();

  /**
   * After a `maxEntries` soft-stop, later full traversals end at this
   * cursor instead of a missing `nextCursor`. Cleared when
   * `maxEntries` is patched (value differs from when it was saved).
   */
  private endCursor?: string;
  private endCursorMaxEntries?: number;

  constructor(
    config: McpRegistryProviderConfig,
    logger: LoggerService,
    options?: {
      /** @internal Override the global `fetch` implementation (test seam). */
      fetchApi?: typeof fetch;
      /** @internal Scheduler task runner for periodic sync. */
      taskRunner?: SchedulerServiceTaskRunner;
    },
  ) {
    this.config = resolveMcpRegistryProviderConfig(config);
    this.logger = logger;
    this.fetchApi = options?.fetchApi;
    this.taskRunner = options?.taskRunner;
  }

  getProviderName(): string {
    return PROVIDER_NAME;
  }

  async connect(connection: EntityProviderConnection): Promise<void> {
    this.connection = connection;
    // The scheduler's first tick can run immediately. Register it only
    // after the catalog connection exists so that tick can commit.
    if (this.taskRunner) {
      await this.taskRunner.run({
        id: `${PROVIDER_NAME}:refresh`,
        fn: async () => {
          await this.run();
        },
      });
    }
  }

  /**
   * Run one sync cycle: fetch servers from the registry, map them,
   * and commit a full mutation.
   *
   * @internal
   */
  async run(): Promise<void> {
    if (!this.connection) {
      throw new Error(
        'McpRegistryEntityProvider not initialized; call connect() first.',
      );
    }

    const managedByLocation = `url:${stripTrailingSlashes(
      this.config.baseUrl,
    )}`;
    const entries = await this.fetchRegistryEntries();
    if (!entries) {
      return;
    }

    const { entities, hasDegradedEntries } = this.mapRegistryEntries(
      entries,
      managedByLocation,
    );

    if (hasDegradedEntries) {
      this.logger.warn(
        `MCP Registry sync completed with degraded entries. ` +
          `Some server entries could not be mapped and are using ` +
          `last-good entities.`,
      );
    }

    await this.connection.applyMutation({
      type: 'full',
      entities,
    });

    this.rebuildLastGoodIndex(entities);

    this.logger.info(
      `MCP Registry sync completed: ${entities.length} entities committed.`,
    );
  }

  /**
   * Fetch registry servers for this sync tick.
   *
   * Continues from `resumeCursor` when a prior sync stopped at
   * `pageLimit`. Returns `undefined` when a client error aborts the
   * tick without a mutation, or when more pages remain (entries are
   * buffered until the registry is exhausted or `maxEntries` stops the
   * traversal so a full mutation does not prune unfetched servers).
   *
   * Hitting `maxEntries` commits a full mutation of the buffer, saves
   * `endCursor`, and starts the next cycle from the beginning. Later
   * full traversals stop at that `endCursor` until `maxEntries` is
   * patched.
   */
  private async fetchRegistryEntries(): Promise<
    McpRegistryServerEntry[] | undefined
  > {
    const {
      baseUrl,
      apiVersion,
      pageLimit,
      pageSize,
      maxEntries,
      hostAllowList,
    } = this.config;

    if (
      this.endCursor !== undefined &&
      this.endCursorMaxEntries !== maxEntries
    ) {
      this.logger.info(
        `MCP Registry maxEntries changed from ` +
          `${this.endCursorMaxEntries} to ${maxEntries}; ` +
          `clearing saved endCursor.`,
      );
      this.endCursor = undefined;
      this.endCursorMaxEntries = undefined;
    }

    try {
      const result = await fetchRegistryServers({
        baseUrl,
        apiVersion,
        pageLimit,
        pageSize,
        maxEntries,
        priorEntryCount: this.pendingEntries.length,
        startCursor: this.resumeCursor,
        endCursor: this.endCursor,
        seenCursors: this.seenCursors,
        hostAllowList,
        fetchApi: this.fetchApi,
      });

      this.pendingEntries.push(...result.servers);
      this.seenCursors = result.seenCursors;

      if (result.resumeCursor) {
        this.resumeCursor = result.resumeCursor;
        this.logger.info(
          `MCP Registry sync reached pageLimit (${pageLimit} pages); ` +
            `buffered ${this.pendingEntries.length} entries and will ` +
            `resume from the saved cursor on the next sync ` +
            `(no mutation emitted).`,
        );
        return undefined;
      }

      if (result.endCursor) {
        this.endCursor = result.endCursor;
        this.endCursorMaxEntries = maxEntries;
        this.logger.warn(
          `MCP Registry sync reached maxEntries (${maxEntries}); ` +
            `committing ${this.pendingEntries.length} buffered entries ` +
            `and saving endCursor for later traversals.`,
        );
      }

      const entries = this.pendingEntries;
      this.pendingEntries = [];
      this.resumeCursor = undefined;
      this.seenCursors = new Set();
      return entries;
    } catch (err) {
      if (err instanceof McpRegistryClientError) {
        // Input seenCursors is never mutated by the client; leave
        // this.seenCursors unchanged so the next sync can retry.
        this.logger.error(
          `MCP Registry sync failed (no mutation emitted): ${err.message}`,
        );
        return undefined;
      }
      throw err;
    }
  }

  /**
   * Map every registry entry with per-entry failure isolation.
   * When `remotesOnly` is set, entries without a native remote are skipped.
   */
  private mapRegistryEntries(
    entries: McpRegistryServerEntry[],
    managedByLocation: string,
  ): { entities: DeferredEntity[]; hasDegradedEntries: boolean } {
    const entities: DeferredEntity[] = [];
    let hasDegradedEntries = false;
    let skippedNonRemote = 0;

    for (const entry of entries) {
      if (this.config.remotesOnly && !hasNativeRemote(entry.server)) {
        skippedNonRemote += 1;
        continue;
      }
      try {
        entities.push(this.mapRegistryEntry(entry, managedByLocation));
      } catch (err) {
        const retained = this.retainLastGoodOnMappingFailure(
          entry,
          err,
          managedByLocation,
        );
        if (retained) {
          entities.push(retained);
          hasDegradedEntries = true;
        }
      }
    }

    if (skippedNonRemote > 0) {
      this.logger.info(
        `MCP Registry remotesOnly skipped ${skippedNonRemote} ` +
          `non-remote server entr${skippedNonRemote === 1 ? 'y' : 'ies'}.`,
      );
    }

    return { entities, hasDegradedEntries };
  }

  /**
   * Map one registry entry into a deferred entity with sync status `ok`.
   */
  private mapRegistryEntry(
    entry: McpRegistryServerEntry,
    managedByLocation: string,
  ): DeferredEntity {
    const serverDoc = entry.server;
    const mappingResult = mapServerToEntity(
      serverDoc,
      this.buildMappingDefaults(),
    );
    const entity = mappingResult.entity;

    entity.metadata.annotations = {
      ...entity.metadata.annotations,
      ...projectAnnotations(
        serverDoc,
        mappingResult.consumedPaths,
        mappingResult.reservedAnnotationKeys,
      ),
    };

    this.applyProviderAnnotations(entity, managedByLocation, 'ok');

    return {
      entity,
      locationKey: PROVIDER_NAME,
    };
  }

  /**
   * Build mapping caller overrides from provider config.
   *
   * `placeholderRemoteUrl` is the target registry `baseUrl` so a server
   * with no valid remotes still gets a D8 placeholder pointing at that
   * registry, before the mapping falls back to `websiteUrl`.
   */
  private buildMappingDefaults(): McpServerMappingDefaults {
    const mappingDefaults: McpServerMappingDefaults = {
      placeholderRemoteUrl: this.config.baseUrl,
    };
    if (this.config.defaultOwner) {
      mappingDefaults.owner = this.config.defaultOwner;
    }
    if (this.config.baseName) {
      mappingDefaults.prefix = this.config.baseName;
    }
    return mappingDefaults;
  }

  /**
   * Stamp provider-owned location and sync-status annotations.
   *
   * Catalog processing requires both location annotations. Without the
   * origin annotation the entity is rejected and never listed.
   */
  private applyProviderAnnotations(
    entity: Entity,
    managedByLocation: string,
    syncStatus: 'ok' | 'degraded',
  ): void {
    if (!entity.metadata.annotations) {
      entity.metadata.annotations = {};
    }
    entity.metadata.annotations[ANNOTATION_LOCATION] = managedByLocation;
    entity.metadata.annotations[ANNOTATION_ORIGIN_LOCATION] = managedByLocation;
    entity.metadata.annotations[SYNC_STATUS_ANNOTATION] = syncStatus;
  }

  /**
   * Log a mapping failure and retain a last-good entity when available (D6).
   */
  private retainLastGoodOnMappingFailure(
    entry: McpRegistryServerEntry,
    err: unknown,
    managedByLocation: string,
  ): DeferredEntity | undefined {
    const { name, version } = readServerIdentity(entry);
    this.logger.warn(formatMappingFailureMessage(name, version, err));

    if (!name || !version) {
      return undefined;
    }

    const lastGood = this.lastGoodIndex.get(buildLastGoodKey(name, version));
    if (!lastGood) {
      this.logger.info(
        `No last-good entity found for "${name}" ` +
          `version "${version}"; omitting from mutation.`,
      );
      return undefined;
    }

    const retainedEntity = structuredClone(lastGood.entity);
    this.applyProviderAnnotations(
      retainedEntity,
      managedByLocation,
      'degraded',
    );

    this.logger.info(
      `Retained last-good entity for "${name}" ` +
        `version "${version}" with degraded sync status.`,
    );

    return {
      entity: retainedEntity,
      locationKey: PROVIDER_NAME,
    };
  }

  /**
   * Rebuild the last-good index from successfully mapped entities only.
   *
   * Entities that carry sync-status "degraded" are excluded: they are
   * last-good fallbacks from a prior cycle, so storing them back would
   * create perpetual retention of stale data. Only "ok" entities
   * qualify as last-good candidates.
   *
   * The annotation keys used here ('modelcontextprotocol.io/name' and
   * 'modelcontextprotocol.io/version') are set by mapServerToEntity in
   * catalog-mcp-registry-server-mapping and correspond to the raw
   * serverDoc.name and serverDoc.version fields used in buildLastGoodKey
   * during failure recovery. If the mapping library changes these
   * annotation keys, both this rebuild and the failure recovery path
   * must be updated in tandem.
   */
  private rebuildLastGoodIndex(entities: DeferredEntity[]): void {
    this.lastGoodIndex.clear();
    for (const deferred of entities) {
      const annotations = deferred.entity.metadata?.annotations;
      if (annotations?.[SYNC_STATUS_ANNOTATION] !== 'ok') {
        continue;
      }
      const name = annotations?.['modelcontextprotocol.io/name'];
      const version = annotations?.['modelcontextprotocol.io/version'];
      if (name && version) {
        this.lastGoodIndex.set(buildLastGoodKey(name, version), deferred);
      }
    }
  }
}
