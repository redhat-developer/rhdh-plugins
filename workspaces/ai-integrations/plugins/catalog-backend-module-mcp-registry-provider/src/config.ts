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

import type { Config } from '@backstage/config';
import type { SchedulerServiceTaskScheduleDefinition } from '@backstage/backend-plugin-api';
import { readSchedulerServiceTaskScheduleDefinitionFromConfig } from '@backstage/backend-plugin-api';

/** Default schedule when `schedule` is omitted. */
const DEFAULT_SCHEDULE: SchedulerServiceTaskScheduleDefinition = {
  frequency: { minutes: 30 },
  timeout: { minutes: 3 },
};

/** Default apiVersion when omitted. */
const DEFAULT_API_VERSION = 'v1';

/** Default page limit (max pages per sync). */
const DEFAULT_PAGE_LIMIT = 10;

/** Default max entries per complete registry traversal (full mutation). */
const DEFAULT_MAX_ENTRIES = 5000;

/** Default remotesOnly when omitted. */
const DEFAULT_REMOTES_ONLY = false;

/**
 * Reserved instance id under `catalog.providers.mcpRegistry`.
 * This implementation expects only this key; additional ids are rejected
 * until multi-registry support lands.
 */
export const MCP_REGISTRY_INSTANCE_ID = 'mcpRegistry';

/** Config path for the reserved registry instance. */
const MCP_REGISTRY_INSTANCE_CONFIG_PATH = `catalog.providers.mcpRegistry.${MCP_REGISTRY_INSTANCE_ID}`;

/** Supported single-registry config keys under the reserved instance. */
const KNOWN_MCP_REGISTRY_KEYS = new Set([
  'baseUrl',
  'baseName',
  'apiVersion',
  'defaultOwner',
  'defaultLifecycle',
  'pageLimit',
  'pageSize',
  'maxEntries',
  'remotesOnly',
  'hostAllowList',
  'schedule',
]);

/**
 * Safely read an optional string from config, returning `undefined`
 * when Backstage's ConfigReader throws TypeError for empty-string
 * values from env var substitution like `${VAR:-}`.
 *
 * @internal
 */
export function safeGetOptionalString(
  config: Config,
  key: string,
): string | undefined {
  try {
    return config.getOptionalString(key);
  } catch {
    // ConfigReader throws TypeError for empty-string values
    // from env var substitution like ${VAR:-}
    return undefined;
  }
}

/**
 * Reject unexpected nested objects under a registry instance config.
 *
 * @internal
 */
export function assertSingleRegistryConfig(registryConfig: Config): void {
  const unknownKeys = registryConfig
    .keys()
    .filter(key => !KNOWN_MCP_REGISTRY_KEYS.has(key));

  for (const key of unknownKeys) {
    let nested;
    try {
      nested = registryConfig.getOptionalConfig(key);
    } catch {
      // ConfigReader throws TypeError when the value is a scalar
      // rather than an object — skip this key silently.
      continue;
    }
    if (nested && nested.keys().length > 0) {
      const knownKeys = [...KNOWN_MCP_REGISTRY_KEYS].join(', ');
      throw new Error(
        `Invalid ${MCP_REGISTRY_INSTANCE_CONFIG_PATH} configuration: found ` +
          `keyed instance "${key}". Configure a single registry object ` +
          `with known keys: ${knownKeys}.`,
      );
    }
  }
}

/**
 * Optional warning sink used when configuration is accepted with caveats
 * (e.g. ignored extra registry instance ids, or absent `hostAllowList`).
 *
 * @internal
 */
export type ConfigWarnFn = (message: string) => void;

/**
 * Resolve the reserved registry instance from the providers map.
 *
 * `catalog.providers.mcpRegistry` is a map of instance ids. This
 * implementation only reads the reserved key {@link MCP_REGISTRY_INSTANCE_ID};
 * additional ids are ignored (with an optional warning).
 *
 * @internal
 */
export function readReservedRegistryInstanceConfig(
  providersMap: Config,
  warn?: ConfigWarnFn,
): Config | undefined {
  const keys = providersMap.keys();
  if (keys.length === 0) {
    return undefined;
  }

  const legacyKeys = keys.filter(key => KNOWN_MCP_REGISTRY_KEYS.has(key));
  if (legacyKeys.length > 0) {
    throw new Error(
      `Invalid catalog.providers.mcpRegistry configuration: registry ` +
        `options (${legacyKeys.join(', ')}) must be nested under the ` +
        `reserved instance key "${MCP_REGISTRY_INSTANCE_ID}" ` +
        `(e.g. catalog.providers.mcpRegistry.${MCP_REGISTRY_INSTANCE_ID}.baseUrl).`,
    );
  }

  const unexpectedKeys = keys.filter(key => key !== MCP_REGISTRY_INSTANCE_ID);
  if (unexpectedKeys.length > 0) {
    warn?.(
      `catalog.providers.mcpRegistry has additional instance id(s) ` +
        `[${unexpectedKeys.join(
          ', ',
        )}] which are ignored; multiple MCP Registry providers are not ` +
        `supported yet. Only the reserved "${MCP_REGISTRY_INSTANCE_ID}" ` +
        `instance is used.`,
    );
  }

  const registryConfig = providersMap.getOptionalConfig(
    MCP_REGISTRY_INSTANCE_ID,
  );
  if (!registryConfig) {
    return undefined;
  }

  return registryConfig;
}

/**
 * Read and validate the required HTTP(S) `baseUrl`.
 *
 * @internal
 */
export function readRequiredHttpBaseUrl(registryConfig: Config): string {
  const baseUrl = safeGetOptionalString(registryConfig, 'baseUrl');
  if (!baseUrl) {
    throw new Error(
      `Invalid ${MCP_REGISTRY_INSTANCE_CONFIG_PATH} configuration: missing ` +
        `required "baseUrl" field. Set baseUrl to the MCP Registry base URL ` +
        `(e.g., "https://registry.example.com").`,
    );
  }

  let parsedUrl: URL;
  try {
    parsedUrl = new URL(baseUrl);
  } catch {
    throw new Error(
      `Invalid ${MCP_REGISTRY_INSTANCE_CONFIG_PATH} configuration: "baseUrl" ` +
        `is not a valid URL: "${baseUrl}". Set baseUrl to an absolute ` +
        `HTTP(S) URL (e.g., "https://registry.example.com").`,
    );
  }

  if (parsedUrl.protocol !== 'http:' && parsedUrl.protocol !== 'https:') {
    throw new Error(
      `Invalid ${MCP_REGISTRY_INSTANCE_CONFIG_PATH} configuration: "baseUrl" ` +
        `must use http or https protocol, got "${parsedUrl.protocol}" ` +
        `in "${baseUrl}".`,
    );
  }

  return baseUrl;
}

/**
 * Read `pageLimit`, applying the default and rejecting values below 1.
 *
 * @internal
 */
export function readPageLimit(registryConfig: Config): number {
  const pageLimit =
    registryConfig.getOptionalNumber('pageLimit') ?? DEFAULT_PAGE_LIMIT;
  if (pageLimit < 1) {
    throw new Error(
      `Invalid ${MCP_REGISTRY_INSTANCE_CONFIG_PATH} configuration: "pageLimit" ` +
        `must be at least 1, got ${pageLimit}.`,
    );
  }
  return pageLimit;
}

/**
 * Read `maxEntries`, applying the default and rejecting values below 1.
 * Caps total servers buffered for one complete registry traversal
 * (possibly spanning multiple resume syncs) before a full mutation.
 *
 * @internal
 */
export function readMaxEntries(registryConfig: Config): number {
  const maxEntries =
    registryConfig.getOptionalNumber('maxEntries') ?? DEFAULT_MAX_ENTRIES;
  if (maxEntries < 1) {
    throw new Error(
      `Invalid ${MCP_REGISTRY_INSTANCE_CONFIG_PATH} configuration: "maxEntries" ` +
        `must be at least 1, got ${maxEntries}.`,
    );
  }
  return maxEntries;
}

/**
 * Read optional `pageSize`, rejecting values below 1 when set.
 *
 * @internal
 */
export function readOptionalPageSize(
  registryConfig: Config,
): number | undefined {
  const pageSize = registryConfig.getOptionalNumber('pageSize');
  if (pageSize !== undefined && pageSize < 1) {
    throw new Error(
      `Invalid ${MCP_REGISTRY_INSTANCE_CONFIG_PATH} configuration: "pageSize" ` +
        `must be at least 1, got ${pageSize}.`,
    );
  }
  return pageSize;
}

/**
 * Read optional `hostAllowList`, normalizing entries to lowercase.
 *
 * Returns `undefined` when the key is absent (no filtering).
 * Returns an empty array when configured as `[]` — semantically
 * "deny all" (no hostname can pass validation).
 *
 * @internal
 */
export function readHostAllowList(
  registryConfig: Config,
): string[] | undefined {
  const list = registryConfig.getOptionalStringArray('hostAllowList');
  if (!list) {
    return undefined;
  }
  return list.map(h => h.toLowerCase());
}

/**
 * Validate that a URL's hostname is present in the configured allow list.
 * Throws when the hostname is not in the list.
 *
 * @internal
 */
export function validateHostAllowList(
  url: string,
  hostAllowList: string[],
): void {
  const parsed = new URL(url);
  const hostname = parsed.hostname.toLowerCase();
  if (!hostAllowList.includes(hostname)) {
    throw new Error(
      `Invalid ${MCP_REGISTRY_INSTANCE_CONFIG_PATH} configuration: the hostname ` +
        `"${hostname}" from baseUrl "${url}" is not in the configured ` +
        `hostAllowList [${hostAllowList.join(', ')}].`,
    );
  }
}

/**
 * Read `remotesOnly`, defaulting to `false`.
 *
 * @internal
 */
export function readRemotesOnly(registryConfig: Config): boolean {
  try {
    return (
      registryConfig.getOptionalBoolean('remotesOnly') ?? DEFAULT_REMOTES_ONLY
    );
  } catch {
    // ConfigReader throws TypeError for empty-string env substitution.
    return DEFAULT_REMOTES_ONLY;
  }
}

/**
 * Read the provider schedule, or the documented default when omitted.
 *
 * @internal
 */
export function readProviderSchedule(
  registryConfig: Config,
): SchedulerServiceTaskScheduleDefinition {
  const scheduleConfig = registryConfig.getOptionalConfig('schedule');
  if (!scheduleConfig) {
    return DEFAULT_SCHEDULE;
  }
  return readSchedulerServiceTaskScheduleDefinitionFromConfig(scheduleConfig);
}

/**
 * Provider configuration. Fields with documented defaults may be omitted
 * on direct construction; the entity provider and config reader apply the
 * same defaults as app-config parsing.
 *
 * @public
 */
export interface McpRegistryProviderConfig {
  /** Base URL of the MCP Registry (required). */
  baseUrl: string;
  /** Optional identity prefix override passed to the mapping transform. */
  baseName?: string;
  /** Registry API version slug used in the endpoint path (default `v1`). */
  apiVersion?: string;
  /** Default entity owner ref when the mapping does not supply one. */
  defaultOwner?: string;
  /** Default entity lifecycle when the mapping does not supply one. */
  defaultLifecycle?: string;
  /** Maximum pages fetched per sync (default `10`); excess pages resume next sync. */
  pageLimit?: number;
  /** Registry `?limit=` page-size query; omitted from the request when unset. */
  pageSize?: number;
  /**
   * Maximum total entries buffered for one complete registry traversal
   * before a full mutation (default `5000`). Spans resume syncs when
   * `pageLimit` pauses mid-traversal. When exceeded, the provider
   * commits the buffer, saves an end cursor, and later traversals stop
   * at that cursor until `maxEntries` is patched.
   */
  maxEntries?: number;
  /**
   * When true, only ingest servers with at least one native remote.
   * Package-only / placeholder-remote servers are skipped (default `false`).
   */
  remotesOnly?: boolean;
  /** Optional allowlist of permitted hostnames for defense-in-depth SSRF protection. */
  hostAllowList?: string[];
  /** Schedule for the sync task. */
  schedule: SchedulerServiceTaskScheduleDefinition;
}

/**
 * {@link McpRegistryProviderConfig} with defaults applied for fields
 * that are optional on the public interface.
 *
 * @internal
 */
export type ResolvedMcpRegistryProviderConfig = McpRegistryProviderConfig & {
  apiVersion: string;
  pageLimit: number;
  maxEntries: number;
  remotesOnly: boolean;
};

/**
 * Apply documented defaults for optional provider config fields.
 *
 * @internal
 */
export function resolveMcpRegistryProviderConfig(
  config: McpRegistryProviderConfig,
): ResolvedMcpRegistryProviderConfig {
  return {
    ...config,
    apiVersion: config.apiVersion ?? DEFAULT_API_VERSION,
    pageLimit: config.pageLimit ?? DEFAULT_PAGE_LIMIT,
    maxEntries: config.maxEntries ?? DEFAULT_MAX_ENTRIES,
    remotesOnly: config.remotesOnly ?? DEFAULT_REMOTES_ONLY,
  };
}

/**
 * Read and validate the MCP Registry provider configuration from
 * `catalog.providers.mcpRegistry.mcpRegistry` (reserved instance id).
 * Returns `undefined` when the providers map or reserved instance is
 * absent (inert module).
 *
 * Additional instance ids under `catalog.providers.mcpRegistry` are
 * ignored; pass `warn` to surface that multiple registries are not
 * supported yet. When `hostAllowList` is omitted, `warn` is also used
 * to recommend configuring hostname restrictions.
 *
 * @throws When a legacy flat `catalog.providers.mcpRegistry` object is
 *   used, or when `baseUrl` is missing on the reserved instance.
 */
export function readMcpRegistryProviderConfig(
  rootConfig: Config,
  warn?: ConfigWarnFn,
): ResolvedMcpRegistryProviderConfig | undefined {
  const providersConfig = rootConfig.getOptionalConfig('catalog.providers');
  if (!providersConfig) {
    return undefined;
  }

  const providersMap = providersConfig.getOptionalConfig('mcpRegistry');
  if (!providersMap) {
    return undefined;
  }

  const registryConfig = readReservedRegistryInstanceConfig(providersMap, warn);
  if (!registryConfig) {
    return undefined;
  }

  assertSingleRegistryConfig(registryConfig);

  const baseUrl = readRequiredHttpBaseUrl(registryConfig);
  const hostAllowList = readHostAllowList(registryConfig);

  if (hostAllowList) {
    validateHostAllowList(baseUrl, hostAllowList);
  } else {
    warn?.(
      `${MCP_REGISTRY_INSTANCE_CONFIG_PATH}.hostAllowList is not configured; ` +
        `outbound registry requests are not restricted by hostname. Set ` +
        `hostAllowList to permitted registry hostnames for defense-in-depth ` +
        `against SSRF.`,
    );
  }

  return {
    baseUrl,
    baseName: safeGetOptionalString(registryConfig, 'baseName'),
    apiVersion:
      safeGetOptionalString(registryConfig, 'apiVersion') ??
      DEFAULT_API_VERSION,
    defaultOwner: safeGetOptionalString(registryConfig, 'defaultOwner'),
    defaultLifecycle: safeGetOptionalString(registryConfig, 'defaultLifecycle'),
    pageLimit: readPageLimit(registryConfig),
    pageSize: readOptionalPageSize(registryConfig),
    maxEntries: readMaxEntries(registryConfig),
    remotesOnly: readRemotesOnly(registryConfig),
    hostAllowList,
    schedule: readProviderSchedule(registryConfig),
  };
}
