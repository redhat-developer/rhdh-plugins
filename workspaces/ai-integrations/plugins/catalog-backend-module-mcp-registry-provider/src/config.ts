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

/** Supported single-registry config keys under `catalog.providers.mcpRegistry`. */
const KNOWN_MCP_REGISTRY_KEYS = new Set([
  'baseUrl',
  'baseName',
  'apiVersion',
  'defaultOwner',
  'pageLimit',
  'pageSize',
  'maxEntries',
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
 * Reject keyed multi-registry maps under `mcpRegistry`.
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
      throw new Error(
        `Invalid catalog.providers.mcpRegistry configuration: found ` +
          `keyed instance "${key}". Configure a single registry object ` +
          `with baseUrl, baseName, apiVersion, schedule, pageLimit, ` +
          `pageSize, and defaultOwner.`,
      );
    }
  }
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
      `Invalid catalog.providers.mcpRegistry configuration: missing ` +
        `required "baseUrl" field. Set baseUrl to the MCP Registry base URL ` +
        `(e.g., "https://registry.example.com").`,
    );
  }

  let parsedUrl: URL;
  try {
    parsedUrl = new URL(baseUrl);
  } catch {
    throw new Error(
      `Invalid catalog.providers.mcpRegistry configuration: "baseUrl" ` +
        `is not a valid URL: "${baseUrl}". Set baseUrl to an absolute ` +
        `HTTP(S) URL (e.g., "https://registry.example.com").`,
    );
  }

  if (parsedUrl.protocol !== 'http:' && parsedUrl.protocol !== 'https:') {
    throw new Error(
      `Invalid catalog.providers.mcpRegistry configuration: "baseUrl" ` +
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
      `Invalid catalog.providers.mcpRegistry configuration: "pageLimit" ` +
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
      `Invalid catalog.providers.mcpRegistry configuration: "maxEntries" ` +
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
      `Invalid catalog.providers.mcpRegistry configuration: "pageSize" ` +
        `must be at least 1, got ${pageSize}.`,
    );
  }
  return pageSize;
}

/**
 * Read optional `hostAllowList`, normalizing entries to lowercase.
 *
 * @internal
 */
export function readOptionalHostAllowList(
  registryConfig: Config,
): string[] | undefined {
  const list = registryConfig.getOptionalStringArray('hostAllowList');
  if (!list || list.length === 0) {
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
export function validateHostAgainstAllowList(
  url: string,
  hostAllowList: string[],
): void {
  const parsed = new URL(url);
  const hostname = parsed.hostname.toLowerCase();
  if (!hostAllowList.includes(hostname)) {
    throw new Error(
      `Invalid catalog.providers.mcpRegistry configuration: the hostname ` +
        `"${hostname}" from baseUrl "${url}" is not in the configured ` +
        `hostAllowList [${hostAllowList.join(', ')}].`,
    );
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
 * Parsed provider configuration.
 *
 * @public
 */
export interface McpRegistryProviderConfig {
  /** Base URL of the MCP Registry (required). */
  baseUrl: string;
  /** Optional identity prefix override passed to the mapping transform. */
  baseName?: string;
  /** Registry API version slug used in the endpoint path (default `v1`). */
  apiVersion: string;
  /** Default entity owner ref when the mapping does not supply one. */
  defaultOwner?: string;
  /** Maximum pages fetched per sync (default `10`); excess pages resume next sync. */
  pageLimit: number;
  /** Registry `?limit=` page-size query; omitted from the request when unset. */
  pageSize?: number;
  /**
   * Maximum total entries buffered for one complete registry traversal
   * before a full mutation (default `5000`). Spans resume syncs when
   * `pageLimit` pauses mid-traversal. When exceeded, the provider
   * commits the buffer, saves an end cursor, and later traversals stop
   * at that cursor until `maxEntries` is patched.
   */
  maxEntries: number;
  /** Optional allowlist of permitted hostnames for defense-in-depth SSRF protection. */
  hostAllowList?: string[];
  /** Schedule for the sync task. */
  schedule: SchedulerServiceTaskScheduleDefinition;
}

/**
 * Read and validate the MCP Registry provider configuration from
 * `catalog.providers.mcpRegistry`. Returns `undefined` when the
 * config key is absent (inert module).
 *
 * @throws When the config is a keyed map of instances, or when
 *   `baseUrl` is missing.
 */
export function readMcpRegistryProviderConfig(
  rootConfig: Config,
): McpRegistryProviderConfig | undefined {
  const providersConfig = rootConfig.getOptionalConfig('catalog.providers');
  if (!providersConfig) {
    return undefined;
  }

  const registryConfig = providersConfig.getOptionalConfig('mcpRegistry');
  if (!registryConfig) {
    return undefined;
  }

  assertSingleRegistryConfig(registryConfig);

  const baseUrl = readRequiredHttpBaseUrl(registryConfig);
  const hostAllowList = readOptionalHostAllowList(registryConfig);

  if (hostAllowList) {
    validateHostAgainstAllowList(baseUrl, hostAllowList);
  }

  return {
    baseUrl,
    baseName: safeGetOptionalString(registryConfig, 'baseName'),
    apiVersion:
      safeGetOptionalString(registryConfig, 'apiVersion') ??
      DEFAULT_API_VERSION,
    defaultOwner: safeGetOptionalString(registryConfig, 'defaultOwner'),
    pageLimit: readPageLimit(registryConfig),
    pageSize: readOptionalPageSize(registryConfig),
    maxEntries: readMaxEntries(registryConfig),
    hostAllowList,
    schedule: readProviderSchedule(registryConfig),
  };
}
