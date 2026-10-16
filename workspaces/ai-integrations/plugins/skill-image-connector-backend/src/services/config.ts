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
import { InputError } from '@backstage/errors';
import { validateAllowedOrigin } from './HttpClient';
import type { SkillImageOptions, SourceConfig } from './types';
import {
  DEFAULT_REFRESH_INTERVAL_MINUTES,
  DEFAULT_SKILL_IMAGE_OPTIONS,
  MAX_REFRESH_INTERVAL_MINUTES,
  MAX_TIMER_DELAY_MS,
  MIN_REFRESH_INTERVAL_MINUTES,
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
  const allowedOrigins = readAllowedOrigins(source, 'skillImageConnector');
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

/**
 * Reads and validates a refresh interval from config, returning the
 * D6 default (ten minutes) when absent.
 */
export function readRefreshInterval(
  source?: Config,
  context = 'skillImageConnector',
): number {
  const value =
    source?.getOptionalNumber('refreshIntervalMinutes') ??
    DEFAULT_REFRESH_INTERVAL_MINUTES;
  if (
    !Number.isSafeInteger(value) ||
    value < MIN_REFRESH_INTERVAL_MINUTES ||
    value > MAX_REFRESH_INTERVAL_MINUTES
  ) {
    throw new InputError(
      `${context}.refreshIntervalMinutes must be an integer between ` +
        `${MIN_REFRESH_INTERVAL_MINUTES} and ${MAX_REFRESH_INTERVAL_MINUTES}`,
    );
  }
  return value;
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
 * This function returns the raw structural config for each source.
 */
export function readSourceConfigs(config: Config): SourceConfig[] {
  const pluginConfig = config.getOptionalConfig('skillImageConnector');
  if (!pluginConfig) return [];

  const sourcesConfig = pluginConfig.getOptionalConfigArray('sources');
  if (sourcesConfig) {
    const seenIds = new Set<string>();
    return sourcesConfig.map((entry, index) => {
      const id = entry.getOptionalString('id')?.trim();
      if (!id) {
        throw new InputError(
          `skillImageConnector.sources[${index}].id is required`,
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

      const refreshIntervalMinutes = readRefreshInterval(
        entry,
        `skillImageConnector.sources[${index}]`,
      );

      return {
        id,
        images: [], // Populated by caller via readSkillImageConfigs
        allowedRegistries,
        allowedOrigins,
        refreshIntervalMinutes,
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
  const refreshIntervalMinutes = readRefreshInterval(pluginConfig);

  return [
    {
      id: 'default',
      images: [], // Populated by caller
      allowedRegistries,
      allowedOrigins,
      refreshIntervalMinutes,
    },
  ];
}
