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
} from '@red-hat-developer-hub/backstage-plugin-mcp-registry-server-mapping-common';
import type { McpServerMappingDefaults } from '@red-hat-developer-hub/backstage-plugin-mcp-registry-server-mapping-common';
import type { McpRegistryProviderConfig } from './config';
import { fetchRegistryServers, McpRegistryClientError } from './client';
import type { McpRegistryServerEntry } from './client';
import { stripTrailingSlashes } from './util';

/** Provider name and locationKey constant. */
const PROVIDER_NAME = 'mcp-registry-provider';

/** Sync status annotation key. */
const SYNC_STATUS_ANNOTATION = 'redhat.com/rhdh-mcp-registry-sync-status';

/**
 * Build a last-good lookup key from name and version.
 *
 * @internal
 */
export function buildLastGoodKey(name: string, version: string): string {
  return `${name}::${version}`;
}

/**
 * Read optional name/version from a registry list entry.
 *
 * @internal
 */
export function readServerIdentity(
  entry: McpRegistryServerEntry | null | undefined,
): {
  name?: string;
  version?: string;
} {
  const serverDoc = entry?.server;
  return {
    name: typeof serverDoc?.name === 'string' ? serverDoc.name : undefined,
    version:
      typeof serverDoc?.version === 'string' ? serverDoc.version : undefined,
  };
}

/**
 * Format the per-entry mapping failure warning.
 *
 * @internal
 */
export function formatMappingFailureMessage(
  name: string | undefined,
  version: string | undefined,
  err: unknown,
): string {
  let message = 'Failed to map MCP Registry server entry';
  if (name) {
    message += ` "${name}"`;
  }
  if (version) {
    message += ` version "${version}"`;
  }
  return `${message}: ${err}`;
}

/**
 * Entity provider that ingests MCP servers from one configured
 * MCP Registry into the Backstage catalog.
 *
 * @public
 */
export class McpRegistryEntityProvider implements EntityProvider {
  private connection?: EntityProviderConnection;
  private readonly config: McpRegistryProviderConfig;
  private readonly logger: LoggerService;
  private readonly fetchApi?: typeof fetch;
  private readonly taskRunner?: SchedulerServiceTaskRunner;

  /**
   * Internal last-good index: keyed by `name::version`, stores the
   * last successfully committed DeferredEntity so that a subsequent
   * sync can retain it when mapping fails (D6).
   */
  private readonly lastGoodIndex = new Map<string, DeferredEntity>();

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
    this.config = config;
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
   * Fetch registry servers. Returns `undefined` when a client error
   * aborts the sync without emitting a mutation.
   */
  private async fetchRegistryEntries(): Promise<
    McpRegistryServerEntry[] | undefined
  > {
    const { baseUrl, apiVersion, pageLimit, pageSize, maxEntries } =
      this.config;
    try {
      return await fetchRegistryServers({
        baseUrl,
        apiVersion,
        pageLimit,
        pageSize,
        maxEntries,
        fetchApi: this.fetchApi,
      });
    } catch (err) {
      if (err instanceof McpRegistryClientError) {
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
   */
  private mapRegistryEntries(
    entries: McpRegistryServerEntry[],
    managedByLocation: string,
  ): { entities: DeferredEntity[]; hasDegradedEntries: boolean } {
    const entities: DeferredEntity[] = [];
    let hasDegradedEntries = false;

    for (const entry of entries) {
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
   */
  private buildMappingDefaults(): McpServerMappingDefaults {
    const mappingDefaults: McpServerMappingDefaults = {};
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
   * mcp-registry-server-mapping-common and correspond to the raw
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
