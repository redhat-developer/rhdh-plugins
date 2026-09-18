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

import type { LoggerService } from '@backstage/backend-plugin-api';
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

/** Provider name and locationKey constant. */
const PROVIDER_NAME = 'mcp-registry-provider';

/** Sync status annotation key. */
const SYNC_STATUS_ANNOTATION = 'redhat.com/rhdh-mcp-registry-sync-status';

/** Managed-by-location annotation key. */
const MANAGED_BY_LOCATION_ANNOTATION = 'backstage.io/managed-by-location';

/**
 * Build a last-good lookup key from name and version.
 */
function buildLastGoodKey(name: string, version: string): string {
  return `${name}::${version}`;
}

/**
 * Normalize baseUrl by stripping trailing slashes for use in
 * backstage.io/managed-by-location.
 */
function normalizeBaseUrl(baseUrl: string): string {
  return baseUrl.replace(/\/+$/, '');
}

/**
 * Entity provider that ingests MCP servers from one configured
 * MCP Registry into the Backstage catalog.
 */
export class McpRegistryEntityProvider implements EntityProvider {
  private connection?: EntityProviderConnection;
  private readonly config: McpRegistryProviderConfig;
  private readonly logger: LoggerService;
  private readonly fetchApi?: typeof fetch;

  /**
   * Internal last-good index: keyed by `name::version`, stores the
   * last successfully committed DeferredEntity so that a subsequent
   * sync can retain it when mapping fails (D6).
   */
  private lastGoodIndex = new Map<string, DeferredEntity>();

  constructor(
    config: McpRegistryProviderConfig,
    logger: LoggerService,
    fetchApi?: typeof fetch,
  ) {
    this.config = config;
    this.logger = logger;
    this.fetchApi = fetchApi;
  }

  getProviderName(): string {
    return PROVIDER_NAME;
  }

  async connect(connection: EntityProviderConnection): Promise<void> {
    this.connection = connection;
  }

  /**
   * Run one sync cycle: fetch servers from the registry, map them,
   * and commit a full mutation.
   */
  async run(): Promise<void> {
    if (!this.connection) {
      throw new Error(
        'McpRegistryEntityProvider not initialized; call connect() first.',
      );
    }

    const { baseUrl, apiVersion, pageLimit, pageSize, baseName, defaultOwner } =
      this.config;
    const normalizedBaseUrl = normalizeBaseUrl(baseUrl);
    const managedByLocation = `url:${normalizedBaseUrl}`;

    // Fetch all servers from the registry
    let entries: McpRegistryServerEntry[];
    try {
      entries = await fetchRegistryServers({
        baseUrl,
        apiVersion,
        pageLimit,
        pageSize,
        fetchApi: this.fetchApi,
      });
    } catch (err) {
      if (err instanceof McpRegistryClientError) {
        this.logger.error(
          `MCP Registry sync failed (no mutation emitted): ${err.message}`,
        );
        return;
      }
      throw err;
    }

    // Map each entry, with per-entry failure isolation
    const entities: DeferredEntity[] = [];
    let hasDegradedEntries = false;

    for (const entry of entries) {
      const serverDoc = entry.server;
      try {
        // Invoke the mapping transform
        const mappingDefaults: McpServerMappingDefaults = {};
        if (defaultOwner) {
          mappingDefaults.owner = defaultOwner;
        }
        if (baseName) {
          mappingDefaults.prefix = baseName;
        }

        const mappingResult = mapServerToEntity(serverDoc, mappingDefaults);
        const entity = mappingResult.entity;

        // Apply annotation projection
        const projectedAnnotations = projectAnnotations(
          serverDoc,
          mappingResult.consumedPaths,
          mappingResult.reservedAnnotationKeys,
        );

        // Merge projected annotations with the entity's existing ones
        entity.metadata.annotations = {
          ...entity.metadata.annotations,
          ...projectedAnnotations,
        };

        // Add provider attribution annotations
        entity.metadata.annotations[MANAGED_BY_LOCATION_ANNOTATION] =
          managedByLocation;
        entity.metadata.annotations[SYNC_STATUS_ANNOTATION] = 'ok';

        const deferred: DeferredEntity = {
          entity,
          locationKey: PROVIDER_NAME,
        };
        entities.push(deferred);
      } catch (err) {
        // Per-entry failure: log and attempt last-good retention
        const serverName =
          typeof serverDoc?.name === 'string' ? serverDoc.name : undefined;
        const serverVersion =
          typeof serverDoc?.version === 'string'
            ? serverDoc.version
            : undefined;

        this.logger.warn(
          `Failed to map MCP Registry server entry` +
            `${serverName ? ` "${serverName}"` : ''}` +
            `${serverVersion ? ` version "${serverVersion}"` : ''}: ${err}`,
        );

        // Last-good retention (D6): retain prior entity if name and
        // version are present and a last-good entity exists
        if (serverName && serverVersion) {
          const lastGoodKey = buildLastGoodKey(serverName, serverVersion);
          const lastGood = this.lastGoodIndex.get(lastGoodKey);
          if (lastGood) {
            // Use the last-good entity with degraded status
            const retainedEntity = JSON.parse(JSON.stringify(lastGood.entity));
            if (!retainedEntity.metadata.annotations) {
              retainedEntity.metadata.annotations = {};
            }
            retainedEntity.metadata.annotations[SYNC_STATUS_ANNOTATION] =
              'degraded';
            // Ensure managed-by-location stays current
            retainedEntity.metadata.annotations[
              MANAGED_BY_LOCATION_ANNOTATION
            ] = managedByLocation;

            entities.push({
              entity: retainedEntity,
              locationKey: PROVIDER_NAME,
            });
            hasDegradedEntries = true;
            this.logger.info(
              `Retained last-good entity for "${serverName}" ` +
                `version "${serverVersion}" with degraded sync status.`,
            );
          } else {
            this.logger.info(
              `No last-good entity found for "${serverName}" ` +
                `version "${serverVersion}"; omitting from mutation.`,
            );
          }
        }
      }
    }

    if (hasDegradedEntries) {
      this.logger.warn(
        `MCP Registry sync completed with degraded entries. ` +
          `Some server entries could not be mapped and are using ` +
          `last-good entities.`,
      );
    }

    // Commit full mutation
    await this.connection.applyMutation({
      type: 'full',
      entities,
    });

    // Update the last-good index with all successfully committed entities.
    // The annotation keys used here ('modelcontextprotocol.io/name' and
    // 'modelcontextprotocol.io/version') are set by mapServerToEntity in
    // mcp-registry-server-mapping-common and correspond to the raw
    // serverDoc.name and serverDoc.version fields used in buildLastGoodKey
    // during failure recovery above. If the mapping library changes these
    // annotation keys, both this rebuild and the failure recovery path
    // must be updated in tandem.
    this.lastGoodIndex.clear();
    for (const deferred of entities) {
      const name =
        deferred.entity.metadata?.annotations?.['modelcontextprotocol.io/name'];
      const version =
        deferred.entity.metadata?.annotations?.[
          'modelcontextprotocol.io/version'
        ];
      if (name && version) {
        this.lastGoodIndex.set(buildLastGoodKey(name, version), deferred);
      }
    }

    this.logger.info(
      `MCP Registry sync completed: ${entities.length} entities committed.`,
    );
  }
}
