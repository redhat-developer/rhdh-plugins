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

/**
 * Parsed provider configuration.
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

  // Detect keyed multi-registry maps: if the config has keys that look
  // like instance objects (i.e., nested config objects with their own
  // baseUrl), reject with an actionable error.
  const keys = registryConfig.keys();
  const knownKeys = new Set([
    'baseUrl',
    'baseName',
    'apiVersion',
    'defaultOwner',
    'pageLimit',
    'pageSize',
    'schedule',
  ]);
  const unknownKeys = keys.filter(k => !knownKeys.has(k));
  if (unknownKeys.length > 0) {
    // Check if the unknown keys look like instance identifiers (they
    // would have nested config objects with their own properties)
    for (const key of unknownKeys) {
      const nested = registryConfig.getOptionalConfig(key);
      if (nested && nested.keys().length > 0) {
        throw new Error(
          `Invalid catalog.providers.mcpRegistry configuration: found ` +
            `keyed instance "${key}". Multiple registries are out of scope ` +
            `for this implementation. Configure a single registry object ` +
            `with baseUrl, baseName, apiVersion, schedule, pageLimit, ` +
            `pageSize, and defaultOwner.`,
        );
      }
    }
  }

  // baseUrl is required
  const baseUrl = registryConfig.getOptionalString('baseUrl');
  if (!baseUrl) {
    throw new Error(
      `Invalid catalog.providers.mcpRegistry configuration: missing ` +
        `required "baseUrl" field. Set baseUrl to the MCP Registry base URL ` +
        `(e.g., "https://registry.example.com").`,
    );
  }

  const baseName = registryConfig.getOptionalString('baseName');
  const apiVersion =
    registryConfig.getOptionalString('apiVersion') ?? DEFAULT_API_VERSION;
  const defaultOwner = registryConfig.getOptionalString('defaultOwner');
  const pageLimit =
    registryConfig.getOptionalNumber('pageLimit') ?? DEFAULT_PAGE_LIMIT;
  const pageSize = registryConfig.getOptionalNumber('pageSize');

  // Schedule: read from config or use default
  let schedule: SchedulerServiceTaskScheduleDefinition;
  const scheduleConfig = registryConfig.getOptionalConfig('schedule');
  if (scheduleConfig) {
    schedule =
      readSchedulerServiceTaskScheduleDefinitionFromConfig(scheduleConfig);
  } else {
    schedule = DEFAULT_SCHEDULE;
  }

  return {
    baseUrl,
    baseName,
    apiVersion,
    defaultOwner,
    pageLimit,
    pageSize,
    schedule,
  };
}
