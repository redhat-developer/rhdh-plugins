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
import {
  validateAllowedOrigin,
  validateRequestUrl,
} from './SafeSourceTransport';
import type { NpxSourceConfig } from './types';
import {
  DEFAULT_REFRESH_INTERVAL_MINUTES,
  SOURCE_OPERATION_DEADLINE_MS,
} from './types';

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
 * Validates that a URL is a valid HTTPS index URL.
 * Rejects non-HTTPS, embedded credentials, localhost, IP addresses,
 * and fragment identifiers.
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
  if (parsed.hash) {
    throw new InputError(
      `${context}.indexUrl must not contain a fragment identifier`,
    );
  }
  return parsed.toString();
}

/**
 * Reads a standard Backstage schedule, scoped to this backend's
 * snapshot cache.
 */
export function readSourceSchedule(
  source?: Config,
  context = 'npxSkillConnector',
): SchedulerServiceTaskScheduleDefinition {
  if (!source?.has('schedule')) {
    return {
      frequency: { minutes: DEFAULT_REFRESH_INTERVAL_MINUTES },
      timeout: { milliseconds: 2 * SOURCE_OPERATION_DEADLINE_MS },
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
    const id = entry.getOptionalString('id')?.trim();
    if (!id) {
      throw new InputError(`${context}.id is required`);
    }
    if (id === '.' || id === '..') {
      throw new InputError(`${context}.id must not be '.' or '..'`);
    }
    if (seenIds.has(id)) {
      throw new InputError(
        `Duplicate source ID '${id}' in npxSkillConnector.sources`,
      );
    }
    seenIds.add(id);

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
