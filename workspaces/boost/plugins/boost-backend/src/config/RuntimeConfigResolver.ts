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
  isSensitiveField,
  type BoostConfigKey,
} from './schemas';

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
  cache: CacheService;
  config: RootConfigService;
  adminConfigService: AdminConfigService;
  logger: LoggerService;
}

/**
 * Two-layer configuration resolver: checks DB overrides (via
 * {@link AdminConfigService}) first, then falls back to YAML baseline
 * (via Backstage `rootConfig`). Resolved values are cached with a
 * 30-second TTL via Backstage `cacheService`, with immediate
 * invalidation on write.
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
   * Resolve a single config value. Checks DB override first, then
   * YAML baseline. The merged result is cached for 30 seconds.
   *
   * @param key - The config field key.
   * @returns The resolved value, or `undefined` if not set anywhere.
   */
  async resolve(key: BoostConfigKey): Promise<unknown | undefined> {
    const effectiveConfig = await this.getEffectiveConfig();
    return effectiveConfig.get(key);
  }

  /**
   * Resolve all config values. Returns a map of key → resolved value
   * with DB overrides taking precedence over YAML baseline.
   *
   * @returns Map of all resolved config values.
   */
  async resolveAll(): Promise<Map<string, unknown>> {
    return this.getEffectiveConfig();
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
   * Remove a config override and invalidate the cache so the YAML
   * baseline is restored.
   *
   * @param key - The config field key.
   * @internal
   */
  async remove(key: BoostConfigKey): Promise<void> {
    await this.adminConfigService.removeOverride(key);
    await this.invalidate();
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
