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

import {
  readSchedulerServiceTaskScheduleDefinitionFromConfig,
  type SchedulerServiceTaskScheduleDefinition,
  type LoggerService,
} from '@backstage/backend-plugin-api';
import type { Config } from '@backstage/config';
import { InputError } from '@backstage/errors';
import { validateAllowedOrigin } from './HttpClient';
import type { SkillImageOptions, SourceConfig } from './types';
import {
  DEFAULT_MAX_RETAINED_MARKDOWN_SIZE,
  DEFAULT_REFRESH_INTERVAL_MINUTES,
  DEFAULT_SKILL_IMAGE_OPTIONS,
  MAX_TIMER_DELAY_MS,
} from './types';

/**
 * Resolve acquisition settings without mutating shared defaults. Image and discovery config parsing stays in plugin.ts
 * to reuse the OCI reference, tag, and token-realm validators from OciClient.
 */
export function readSkillImageOptions(config: Config): SkillImageOptions {
  const source = config.getOptionalConfig('skillImageConnector');
  const DEFAULT_NUMERIC_OPTIONS: Omit<SkillImageOptions, 'allowedOrigins'> =
    DEFAULT_SKILL_IMAGE_OPTIONS;
  const options = { ...DEFAULT_NUMERIC_OPTIONS };
  for (const key of Object.keys(options) as Array<
    keyof typeof DEFAULT_NUMERIC_OPTIONS
  >) {
    const value = source?.getOptionalNumber(key) ?? options[key];
    const minimum = key === 'maxRetries' ? 0 : 1;
    const maximum =
      key === 'fetchTimeoutMs' ||
      key === 'retryBaseDelayMs' ||
      key === 'sourceOperationDeadlineMs'
        ? MAX_TIMER_DELAY_MS
        : Number.MAX_SAFE_INTEGER;
    if (!Number.isSafeInteger(value) || value < minimum || value > maximum) {
      throw new InputError(
        `skillImageConnector.${key} must be an integer between ${minimum} and ${maximum}`,
      );
    }
    options[key] = value;
  }
  const allowedOrigins = source?.has('sources')
    ? undefined
    : readAllowedOrigins(source, 'skillImageConnector');
  return Object.freeze({
    ...options,
    ...(allowedOrigins ? { allowedOrigins } : {}),
  });
}

function readAllowedOrigins(
  source: Config | undefined,
  context: string,
): readonly string[] | undefined {
  const origins = source?.getOptionalStringArray('allowedOrigins');
  if (!origins) return undefined;
  try {
    return Object.freeze(origins.map(validateAllowedOrigin));
  } catch (error) {
    const detail = error instanceof Error ? error.message : 'Invalid origin';
    throw new InputError(`${context}.allowedOrigins: ${detail}`);
  }
}

/** Reject the unreleased interval setting instead of silently ignoring it. */
function rejectLegacyRefreshInterval(
  source: Config | undefined,
  context: string,
): void {
  if (source?.has('refreshIntervalMinutes')) {
    throw new InputError(
      `${context}.refreshIntervalMinutes is no longer supported; use ${context}.schedule with frequency and timeout`,
    );
  }
}

/** Read the standard Backstage schedule, scoped to this backend's snapshot cache. */
export function readSourceSchedule(
  source?: Config,
  context = 'skillImageConnector',
  sourceOperationDeadlineMs = DEFAULT_SKILL_IMAGE_OPTIONS.sourceOperationDeadlineMs,
): SchedulerServiceTaskScheduleDefinition {
  rejectLegacyRefreshInterval(source, context);
  if (!source?.has('schedule')) {
    return {
      frequency: { minutes: DEFAULT_REFRESH_INTERVAL_MINUTES },
      timeout: { milliseconds: Math.max(2 * sourceOperationDeadlineMs, 60000) },
      initialDelay: { seconds: 0 },
      scope: 'local',
    };
  }

  let schedule: SchedulerServiceTaskScheduleDefinition;
  try {
    schedule = readSchedulerServiceTaskScheduleDefinitionFromConfig(
      source.getConfig('schedule'),
    );
  } catch {
    // Backstage duration errors can echo raw values. Report the configuration
    // path and expected shape without including potentially sensitive input.
    throw new InputError(
      `${context}.schedule must define a valid Backstage frequency and timeout, optional initialDelay, and local scope`,
    );
  }
  if (schedule.scope === 'global') {
    throw new InputError(
      `${context}.schedule.scope must be local because snapshots are stored separately on each backend instance`,
    );
  }
  return {
    ...schedule,
    initialDelay: schedule.initialDelay ?? { seconds: 0 },
    scope: 'local',
  };
}

/**
 * Reads source configurations from app-config.
 *
 * When `skillImageConnector.sources` is present, each entry defines an
 * independent source with its own ID, images, discovery, and scheduling.
 *
 * When absent, the flat `images`/`quayDiscovery`/`allowedRegistries`
 * config is mapped to a single source with the deterministic ID
 * `"default"`. This preserves backward compatibility without deriving
 * identity from array positions.
 *
 * Source parsing and image/discovery validation are handled by the
 * caller (plugin.ts) which has access to OCI reference validators.
 * This function returns only structural settings; the caller attaches parsed
 * images and discovery configuration.
 */
export function readSourceConfigs(
  config: Config,
  logger?: LoggerService,
): Array<Omit<SourceConfig, 'images' | 'quayDiscovery'>> {
  const pluginConfig = config.getOptionalConfig('skillImageConnector');
  if (!pluginConfig) return [];
  rejectLegacyRefreshInterval(pluginConfig, 'skillImageConnector');
  const sourceOperationDeadlineMs =
    pluginConfig.getOptionalNumber('sourceOperationDeadlineMs') ??
    DEFAULT_SKILL_IMAGE_OPTIONS.sourceOperationDeadlineMs;

  const sourcesConfig = pluginConfig.getOptionalConfigArray('sources');
  if (sourcesConfig) {
    const ignoredFields = [
      'images',
      'quayDiscovery',
      'allowedRegistries',
      'allowedOrigins',
      'schedule',
    ].filter(key => pluginConfig.has(key));
    if (ignoredFields.length) {
      logger?.warn(
        `Ignoring flat skillImageConnector settings because sources is configured: ${ignoredFields.join(
          ', ',
        )}`,
      );
    }
    const seenIds = new Set<string>();
    return sourcesConfig.map((entry, index) => {
      const id = entry.getOptionalString('id')?.trim();
      if (!id) {
        throw new InputError(
          `skillImageConnector.sources[${index}].id is required`,
        );
      }
      if (id === '.' || id === '..') {
        throw new InputError(
          `skillImageConnector.sources[${index}].id must not be '.' or '..'`,
        );
      }
      if (seenIds.has(id)) {
        throw new InputError(
          `Duplicate source ID '${id}' in skillImageConnector.sources`,
        );
      }
      seenIds.add(id);

      const allowedRegistries = (
        entry.getOptionalStringArray('allowedRegistries') ?? []
      )
        .map(r => r.trim().toLowerCase())
        .filter(Boolean);

      const allowedOrigins = readAllowedOrigins(
        entry,
        `skillImageConnector.sources[${index}]`,
      );

      const schedule = readSourceSchedule(
        entry,
        `skillImageConnector.sources[${index}]`,
        sourceOperationDeadlineMs,
      );

      return {
        id,
        allowedRegistries,
        allowedOrigins,
        schedule,
      };
    });
  }

  // Backward compatibility: derive a single "default" source from flat config
  const hasImages = pluginConfig.has('images');
  const hasDiscovery = pluginConfig.has('quayDiscovery');
  if (!hasImages && !hasDiscovery) return [];

  const allowedRegistries = (
    pluginConfig.getOptionalStringArray('allowedRegistries') ?? []
  )
    .map(r => r.trim().toLowerCase())
    .filter(Boolean);
  const allowedOrigins = readAllowedOrigins(
    pluginConfig,
    'skillImageConnector',
  );
  const schedule = readSourceSchedule(
    pluginConfig,
    'skillImageConnector',
    sourceOperationDeadlineMs,
  );

  return [
    {
      id: 'default',
      allowedRegistries,
      allowedOrigins,
      schedule,
    },
  ];
}

/**
 * Reads the optional `maxRetainedMarkdownSizeBytes` setting from config.
 * Returns the configured value or the D8 default (50 MiB = 52,428,800 bytes).
 * Rejects invalid values (non-integer, zero, negative, or above MAX_SAFE_INTEGER).
 */
export function readMaxRetainedMarkdownSizeBytes(config: Config): number {
  const source = config.getOptionalConfig('skillImageConnector');
  let value: number;
  try {
    value =
      source?.getOptionalNumber('maxRetainedMarkdownSizeBytes') ??
      DEFAULT_MAX_RETAINED_MARKDOWN_SIZE;
  } catch {
    // ConfigReader throws when the value cannot be converted to a number
    // (e.g. string values like 'abc'). Surface our own validation error.
    throw new InputError(
      'skillImageConnector.maxRetainedMarkdownSizeBytes must be a positive safe integer',
    );
  }
  if (!Number.isSafeInteger(value) || value < 1) {
    throw new InputError(
      'skillImageConnector.maxRetainedMarkdownSizeBytes must be a positive safe integer',
    );
  }
  return value;
}

/**
 * Reads the backend-only `catalogProviderPluginId` setting from config.
 * Defaults to 'catalog' per D8.
 */
export function readCatalogProviderPluginId(config: Config): string {
  const source = config.getOptionalConfig('skillImageConnector');
  let value: unknown;
  try {
    // Read the raw optional value to distinguish empty strings from wrong
    // types without ConfigReader's getOptionalString empty-string TypeError.
    value = source?.getOptional('catalogProviderPluginId');
  } catch {
    throw new InputError(
      'skillImageConnector.catalogProviderPluginId must be a string',
    );
  }
  if (value === undefined) return 'catalog';
  if (typeof value !== 'string') {
    throw new InputError(
      'skillImageConnector.catalogProviderPluginId must be a string',
    );
  }
  return value.trim() || 'catalog';
}
