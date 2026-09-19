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

/** Supported single-registry config keys under `catalog.providers.mcpRegistry`. */
const KNOWN_MCP_REGISTRY_KEYS = new Set([
  'baseUrl',
  'baseName',
  'apiVersion',
  'defaultOwner',
  'pageLimit',
  'pageSize',
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
  baseUrl: string;
  baseName?: string;
  apiVersion: string;
  defaultOwner?: string;
  pageLimit: number;
  pageSize?: number;
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

  return {
    baseUrl: readRequiredHttpBaseUrl(registryConfig),
    baseName: safeGetOptionalString(registryConfig, 'baseName'),
    apiVersion:
      safeGetOptionalString(registryConfig, 'apiVersion') ??
      DEFAULT_API_VERSION,
    defaultOwner: safeGetOptionalString(registryConfig, 'defaultOwner'),
    pageLimit: readPageLimit(registryConfig),
    pageSize: readOptionalPageSize(registryConfig),
    schedule: readProviderSchedule(registryConfig),
  };
}
