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
  CacheService,
  LoggerService,
  RootConfigService,
} from '@backstage/backend-plugin-api';
import type { JsonValue } from '@backstage/types';
import { AdminConfigService } from './AdminConfigService';
import {
  boostConfigFields,
  BOOST_CONNECTOR_SCHEMA_VERSION,
  CONNECTOR_IDS,
  getFieldDefault,
  isSensitiveField,
  type BoostConfigKey,
  type ConnectorId,
} from './schemas';

/**
 * A migration function that transforms stored DB overrides for a
 * connector from one schema version to the next. Receives the
 * connector ID and the admin config service for reading/writing
 * individual leaf values. Returns when the migration is complete.
 *
 * @public
 */
export type ConnectorMigrationFn = (
  connectorId: ConnectorId,
  adminConfigService: AdminConfigService,
) => Promise<void>;

/**
 * Registry of connector schema migrations keyed by the **source**
 * version they upgrade from. For example, a migration registered
 * under key `1` upgrades v1 → v2.
 *
 * Migrations are applied sequentially: v1 → v2 → v3 etc. Each
 * migration must leave the data valid under the next version's
 * schema.
 *
 * @public
 */
export type ConnectorMigrationRegistry = Map<number, ConnectorMigrationFn>;

/**
 * Cache key for the merged effective config.
 *
 * @internal
 */
const EFFECTIVE_CONFIG_CACHE_KEY = 'effective-config';

/**
 * Default cache TTL in milliseconds (30 seconds).
 *
 * @internal
 */
const DEFAULT_CACHE_TTL_MS = 30_000;

/**
 * Options for creating a {@link RuntimeConfigResolver}.
 *
 * @public
 */
export interface RuntimeConfigResolverOptions {
  /** The Backstage cache service. */
  cache: CacheService;
  /** The Backstage root config service. */
  config: RootConfigService;
  /** The admin config service for DB-backed overrides. */
  adminConfigService: AdminConfigService;
  /** The Backstage logger service. */
  logger: LoggerService;
}

/**
 * Two-layer configuration resolver: checks DB overrides (via
 * {@link AdminConfigService}) first, then falls back to YAML baseline
 * (via Backstage `rootConfig`). Resolved values are cached with a
 * 30-second TTL via Backstage `cacheService`, with immediate
 * invalidation on write.
 *
 * Field defaults from `ConfigFieldMeta.defaultValue` are applied at
 * read time on a per-call copy and are never written to the cache.
 *
 * This is the single cache layer for config resolution — no duplicate
 * wrapper caches.
 *
 * @public
 */
export class RuntimeConfigResolver {
  private readonly cache: CacheService;
  private readonly config: RootConfigService;
  private readonly adminConfigService: AdminConfigService;
  private readonly logger: LoggerService;

  constructor(options: RuntimeConfigResolverOptions) {
    this.cache = options.cache;
    this.config = options.config;
    this.adminConfigService = options.adminConfigService;
    this.logger = options.logger.child({ service: 'RuntimeConfigResolver' });
  }

  /**
   * Resolve a single config value. Precedence:
   * 1. DB override (highest)
   * 2. YAML baseline
   * 3. Field default from schema metadata (lowest)
   *
   * @param key - The config field key.
   * @returns The resolved value, or `undefined` if not set anywhere
   *   and no field default is defined.
   */
  async resolve(key: BoostConfigKey): Promise<unknown | undefined> {
    const effectiveConfig = await this.getEffectiveConfig();
    // Match resolveAll(): the effective map omits unset keys and never
    // stores `undefined`, so `has(key)` is the presence check.
    if (effectiveConfig.has(key)) {
      return effectiveConfig.get(key);
    }
    return getFieldDefault(key);
  }

  /**
   * Resolve all config values. Returns a map of key → resolved value
   * with precedence: DB override → YAML baseline → field default.
   *
   * The returned Map is a fresh snapshot for this call only (defaults
   * are layered on top of a copy of the effective config and are never
   * written back to the cache) — safe for callers to mutate or retain
   * without affecting subsequent resolver calls.
   *
   * Note: the returned map does not indicate *which* layer a value
   * came from — synthesized field defaults are indistinguishable from
   * real DB overrides or YAML baseline values. Consumers that need to
   * make that distinction (e.g. an admin UI showing "using default"
   * vs. "explicitly set", see issue #4066) will need a separate
   * mechanism (e.g. a per-key `source` tag) — not implemented here.
   *
   * @returns Map of all resolved config values.
   */
  async resolveAll(): Promise<Map<string, unknown>> {
    const effective = await this.getEffectiveConfig();
    // Layer 3: apply field defaults for keys not already set. `effective`
    // is a fresh Map from getEffectiveConfig() (see method docs above),
    // so mutating it here is safe and never leaks into the cache.
    for (const key of Object.keys(boostConfigFields) as BoostConfigKey[]) {
      if (!effective.has(key)) {
        const fieldDefault = getFieldDefault(key);
        if (fieldDefault !== undefined) {
          effective.set(key, fieldDefault);
        }
      }
    }
    return effective;
  }

  /**
   * Invalidate the cached effective config. Call this after any
   * config write to ensure immediate consistency.
   */
  async invalidate(): Promise<void> {
    await this.cache.delete(EFFECTIVE_CONFIG_CACHE_KEY);
    this.logger.debug('Effective config cache invalidated');
  }

  /**
   * Write a config value via the admin service and immediately
   * invalidate the cache so the new value takes effect.
   *
   * @param key - The config field key.
   * @param value - The value to store.
   * @internal
   */
  async set(key: BoostConfigKey, value: unknown): Promise<void> {
    await this.adminConfigService.setOverride(key, value);
    await this.invalidate();
  }

  /**
   * Remove a config override and invalidate the cache. The next
   * {@link RuntimeConfigResolver.resolve} returns the YAML baseline if
   * set, otherwise the field default (or `undefined` if the field has
   * none).
   *
   * @param key - The config field key.
   * @internal
   */
  async remove(key: BoostConfigKey): Promise<void> {
    await this.adminConfigService.removeOverride(key);
    await this.invalidate();
  }

  /**
   * Run connector schema migrations on startup.
   *
   * For each known connector, reads the stored `__schemaVersion`
   * leaf from the DB. If missing, writes v1 explicitly (pre-versioning
   * data is treated as v1) and then applies any registered migrations
   * up to `BOOST_CONNECTOR_SCHEMA_VERSION`. The stored version is
   * stamped after each successful step so a later failure can resume.
   *
   * Migration functions must be idempotent: a function that throws
   * after partial leaf writes will re-run on the next startup.
   *
   * A failure for one connector is logged and does not skip the
   * remaining connectors; the first error is rethrown after all
   * connectors have been attempted.
   *
   * @param migrations - Optional registry of version-keyed migration
   *   functions. When omitted (or empty), only the version stamp is
   *   written/bumped — no data transforms are applied.
   */
  async migrateConnectorSchemas(
    migrations?: ConnectorMigrationRegistry,
  ): Promise<void> {
    let firstError: unknown;

    for (const connectorId of CONNECTOR_IDS) {
      try {
        await this.migrateOneConnector(connectorId, migrations);
      } catch (error) {
        this.logger.error(
          `Connector "${connectorId}" schema migration failed`,
          error as Error,
        );
        firstError ??= error;
      }
    }

    // Invalidate cache after migrations may have changed DB values.
    // Preserve a connector migration error if invalidation also fails.
    try {
      await this.invalidate();
    } catch (invalidateError) {
      this.logger.error(
        'Failed to invalidate config cache after connector schema migration',
        invalidateError as Error,
      );
      firstError ??= invalidateError;
    }

    if (firstError) {
      throw firstError;
    }
  }

  /**
   * Migrate a single connector's stored schema version.
   *
   * @internal
   */
  private async migrateOneConnector(
    connectorId: ConnectorId,
    migrations?: ConnectorMigrationRegistry,
  ): Promise<void> {
    const versionKey =
      `boost.connectors.${connectorId}.__schemaVersion` as BoostConfigKey;

    const stored = await this.adminConfigService.getOverride(versionKey);
    let storedVersion = typeof stored === 'number' ? stored : undefined;

    if (storedVersion === undefined) {
      this.logger.info(
        `Connector "${connectorId}" has no stored schema version — ` +
          `treating as v1, writing v1`,
      );
      await this.adminConfigService.setOverride(versionKey, 1);
      storedVersion = 1;
    }

    if (storedVersion > BOOST_CONNECTOR_SCHEMA_VERSION) {
      this.logger.warn(
        `Connector "${connectorId}" schema v${storedVersion} is ahead of ` +
          `current v${BOOST_CONNECTOR_SCHEMA_VERSION} (possible downgrade) — ` +
          `skipping migration`,
      );
      return;
    }

    if (storedVersion === BOOST_CONNECTOR_SCHEMA_VERSION) {
      this.logger.debug(
        `Connector "${connectorId}" schema v${storedVersion} is current`,
      );
      return;
    }

    this.logger.info(
      `Connector "${connectorId}" schema v${storedVersion} → ` +
        `v${BOOST_CONNECTOR_SCHEMA_VERSION}: running migrations`,
    );

    for (
      let fromVersion = storedVersion;
      fromVersion < BOOST_CONNECTOR_SCHEMA_VERSION;
      fromVersion++
    ) {
      const migrationFn = migrations?.get(fromVersion);
      if (migrationFn) {
        await migrationFn(connectorId, this.adminConfigService);
        this.logger.info(
          `Connector "${connectorId}": migrated v${fromVersion} → ` +
            `v${fromVersion + 1}`,
        );
      } else {
        this.logger.debug(
          `Connector "${connectorId}": no migration registered for ` +
            `v${fromVersion} → v${fromVersion + 1} (no-op)`,
        );
      }
      await this.adminConfigService.setOverride(versionKey, fromVersion + 1);
    }

    this.logger.info(
      `Connector "${connectorId}" schema version bumped to ` +
        `v${BOOST_CONNECTOR_SCHEMA_VERSION}`,
    );
  }

  /**
   * Get the merged effective config, using cache when available.
   * This is the single cache layer — no wrapper.
   */
  private async getEffectiveConfig(): Promise<Map<string, unknown>> {
    // Check cache first (sensitive fields are excluded from cache)
    const cached = await this.cache.get<JsonValue>(EFFECTIVE_CONFIG_CACHE_KEY);
    if (cached && typeof cached === 'object' && !Array.isArray(cached)) {
      const result = new Map(Object.entries(cached as Record<string, unknown>));
      // Sensitive fields are never cached — fetch fresh from DB
      const dbOverrides = await this.adminConfigService.getAllOverrides();
      for (const [key, value] of dbOverrides) {
        if (isSensitiveField(key as BoostConfigKey)) {
          result.set(key, value);
        }
      }
      return result;
    }

    // Build effective config: YAML baseline + DB overrides
    const effective = new Map<string, unknown>();

    // Layer 1: YAML baseline
    for (const key of Object.keys(boostConfigFields) as BoostConfigKey[]) {
      const yamlValue = this.readYamlValue(key);
      if (yamlValue !== undefined) {
        effective.set(key, yamlValue);
      }
    }

    // Layer 2: DB overrides (takes precedence)
    const dbOverrides = await this.adminConfigService.getAllOverrides();
    for (const [key, value] of dbOverrides) {
      effective.set(key, value);
    }

    // Exclude sensitive fields before caching
    const cacheSafe = new Map(effective);
    for (const key of cacheSafe.keys()) {
      if (isSensitiveField(key as BoostConfigKey)) {
        cacheSafe.delete(key);
      }
    }
    const cacheObj = Object.fromEntries(cacheSafe) as unknown as JsonValue;
    await this.cache.set(EFFECTIVE_CONFIG_CACHE_KEY, cacheObj, {
      ttl: DEFAULT_CACHE_TTL_MS,
    });

    this.logger.debug(
      `Effective config resolved: ${effective.size} fields (${dbOverrides.size} DB overrides)`,
    );

    return effective;
  }

  /**
   * Read a value from the YAML config, mapping dotted keys to
   * Backstage config paths.
   *
   * @param key - Dotted config key (e.g., 'boost.model.baseUrl').
   * @returns The value from YAML config, or undefined.
   */
  private readYamlValue(key: string): unknown | undefined {
    // Split 'boost.model.baseUrl' → navigate config tree
    const parts = key.split('.');
    try {
      let current: RootConfigService | undefined = this.config;

      // Navigate to the parent, reading nested config objects
      for (let i = 0; i < parts.length - 1; i++) {
        current = current?.getOptionalConfig(parts[i]) as
          | RootConfigService
          | undefined;
        if (!current) {
          return undefined;
        }
      }

      const lastPart = parts[parts.length - 1];
      // Try to read as various types
      const optString = current?.getOptionalString(lastPart);
      if (optString !== undefined) return optString;

      const optNumber = current?.getOptionalNumber(lastPart);
      if (optNumber !== undefined) return optNumber;

      // For boolean, we need to handle false specifically
      try {
        const optBool = current?.getOptional(lastPart);
        if (typeof optBool === 'boolean') return optBool;
      } catch {
        // ignore
      }

      return current?.getOptional(lastPart);
    } catch {
      return undefined;
    }
  }
}
