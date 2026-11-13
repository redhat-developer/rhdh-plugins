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

import { readSchedulerServiceTaskScheduleDefinitionFromConfig } from '@backstage/backend-plugin-api';
import type {
  LoggerService,
  SchedulerServiceTaskScheduleDefinition,
} from '@backstage/backend-plugin-api';
import type { Config } from '@backstage/config';
import { InputError } from '@backstage/errors';
import { validateAllowedOrigin, validateRequestUrl } from './fetchSource';
import type { NpxSourceConfig } from './types';
import { DEFAULT_REFRESH_INTERVAL_MINUTES } from './types';

function readAllowedOrigins(
  source: Config | undefined,
  context: string,
): readonly string[] | undefined {
  const origins = source?.getOptionalStringArray('allowedOrigins');
  if (!origins) return undefined;
  try {
    return origins.map(validateAllowedOrigin);
  } catch (error) {
    const detail = error instanceof Error ? error.message : 'Invalid origin';
    throw new InputError(`${context}.allowedOrigins: ${detail}`);
  }
}

/**
 * Validates that a URL is a valid HTTPS index URL.
 * Rejects non-HTTPS URLs, embedded credentials, and fragments.
 */
function validateIndexUrl(url: string, context: string): string {
  let parsed: URL;
  try {
    parsed = new URL(url);
  } catch {
    throw new InputError(`${context}.indexUrl must be a valid URL`);
  }
  try {
    validateRequestUrl(parsed);
  } catch (error) {
    const detail = error instanceof Error ? error.message : 'Invalid index URL';
    throw new InputError(`${context}.indexUrl: ${detail}`);
  }
  return parsed.toString();
}

/**
 * Validates and returns a trimmed source identifier.
 * Rejects empty, path-traversal, slash-containing, and duplicate IDs.
 */
function validateSourceId(
  entry: Config,
  context: string,
  seenIds: Set<string>,
): string {
  const id = entry.getOptionalString('id')?.trim();
  if (!id) throw new InputError(`${context}.id is required`);
  if (id === '.' || id === '..') {
    throw new InputError(`${context}.id must not be '.' or '..'`);
  }
  if (id.includes('/')) {
    throw new InputError(`${context}.id must not contain '/'`);
  }
  if (seenIds.has(id)) {
    throw new InputError(
      `Duplicate source ID '${id}' in npxSkillConnector.sources`,
    );
  }
  seenIds.add(id);
  return id;
}

const NPX_DEFAULT_SCHEDULE: SchedulerServiceTaskScheduleDefinition = {
  frequency: { minutes: DEFAULT_REFRESH_INTERVAL_MINUTES },
  timeout: { minutes: 10 },
  initialDelay: { seconds: 0 },
  scope: 'local',
};

/**
 * Reads a standard Backstage schedule, scoped to this backend's
 * snapshot cache.
 */
export function readSourceSchedule(
  source?: Config,
  context = 'npxSkillConnector',
): SchedulerServiceTaskScheduleDefinition {
  if (!source?.has('schedule')) return NPX_DEFAULT_SCHEDULE;

  const raw = source.getConfig('schedule');
  let parsed: SchedulerServiceTaskScheduleDefinition;
  try {
    parsed = readSchedulerServiceTaskScheduleDefinitionFromConfig(raw);
  } catch {
    throw new InputError(
      `${context}.schedule must be a valid Backstage schedule with frequency, timeout, and optional initialDelay`,
    );
  }
  if (parsed.scope === 'global') {
    throw new InputError(
      `${context}.schedule.scope must be local; snapshots are stored per backend instance`,
    );
  }
  return {
    ...parsed,
    initialDelay: parsed.initialDelay ?? NPX_DEFAULT_SCHEDULE.initialDelay,
    scope: 'local',
  };
}

/**
 * Reads source configurations from the npxSkillConnector config block.
 *
 * Each source entry defines an independent source with its own ID,
 * index URL, allowed origins, and scheduling.
 */
export function readSourceConfigs(
  config: Config,
  logger?: LoggerService,
): NpxSourceConfig[] {
  const pluginConfig = config.getOptionalConfig('npxSkillConnector');
  if (!pluginConfig) return [];

  const sourcesConfig = pluginConfig.getOptionalConfigArray('sources');
  if (!sourcesConfig || sourcesConfig.length === 0) {
    logger?.warn(
      'npxSkillConnector.sources is empty or missing; no sources configured',
    );
    return [];
  }

  const seenIds = new Set<string>();
  return sourcesConfig.map((entry, index) => {
    const context = `npxSkillConnector.sources[${index}]`;
    const id = validateSourceId(entry, context, seenIds);

    const rawIndexUrl = entry.getOptionalString('indexUrl')?.trim();
    if (!rawIndexUrl) {
      throw new InputError(`${context}.indexUrl is required`);
    }
    const indexUrl = validateIndexUrl(rawIndexUrl, context);

    const allowedOrigins = readAllowedOrigins(entry, context);

    const schedule = readSourceSchedule(entry, context);

    return {
      id,
      indexUrl,
      allowedOrigins,
      schedule,
    };
  });
}
