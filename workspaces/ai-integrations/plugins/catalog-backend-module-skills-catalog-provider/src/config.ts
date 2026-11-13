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
import type { Config } from '@backstage/config';
import { InputError } from '@backstage/errors';
import type { SkillSourceType } from '@red-hat-developer-hub/backstage-plugin-ai-skills-common';

import type {
  SkillsCatalogProviderConfig,
  SourceConsumerConfig,
} from './types';

const VALID_SOURCE_TYPES: ReadonlySet<string> = new Set<SkillSourceType>([
  'oci',
  'npx',
]);

/**
 * Safely read an optional string from a Backstage Config object.
 *
 * ConfigReader throws TypeError for empty-string values from env var
 * substitution like `${VAR:-}`, so we catch and return undefined.
 */
function safeGetOptionalString(
  config: Config,
  key: string,
): string | undefined {
  try {
    return config.getOptionalString(key);
  } catch {
    return undefined;
  }
}

/**
 * Reads all skills catalog provider configurations from the root config.
 *
 * Expected config shape:
 * ```yaml
 * catalog:
 *   providers:
 *     skillsCatalogProvider:
 *       production:
 *         sources:
 *           - connectorPluginId: skill-image-connector
 *             sourceId: quay-public
 *             sourceType: oci
 *         defaultOwner: team-skills
 *         defaultLifecycle: production
 *         schedule:
 *           frequency: { minutes: 10 }
 *           timeout: { minutes: 10 }
 * ```
 *
 * @public
 */
export function readSkillsCatalogProviderConfigs(
  config: Config,
): SkillsCatalogProviderConfig[] {
  const providerConfigs = config.getOptionalConfig(
    'catalog.providers.skillsCatalogProvider',
  );
  if (!providerConfigs) {
    return [];
  }

  return providerConfigs
    .keys()
    .map(id =>
      readSkillsCatalogProviderConfig(id, providerConfigs.getConfig(id)),
    );
}

function readSkillsCatalogProviderConfig(
  id: string,
  config: Config,
): SkillsCatalogProviderConfig {
  const sourcesConfig = config.getConfigArray('sources');
  if (sourcesConfig.length === 0) {
    throw new InputError(
      `skillsCatalogProvider.${id}: at least one source is required`,
    );
  }

  const sources = sourcesConfig.map((sourceConfig, index) =>
    readSourceConsumerConfig(id, sourceConfig, index),
  );

  // Validate no duplicate (connectorPluginId, sourceId) tuples
  validateNoDuplicateConsumers(id, sources);

  // Validate no duplicate (sourceType, sourceId) assignments
  validateNoDuplicateSourceAssignments(id, sources);

  const defaultOwner = config.getString('defaultOwner').trim();
  if (!defaultOwner) {
    throw new InputError(
      `skillsCatalogProvider.${id}: defaultOwner must be a non-empty string`,
    );
  }

  const defaultLifecycle = config.getString('defaultLifecycle').trim();
  if (!defaultLifecycle) {
    throw new InputError(
      `skillsCatalogProvider.${id}: defaultLifecycle must be a non-empty string`,
    );
  }

  const namespace =
    safeGetOptionalString(config, 'namespace')?.trim() || 'default';

  const schedule = config.has('schedule')
    ? readSchedulerServiceTaskScheduleDefinitionFromConfig(
        config.getConfig('schedule'),
      )
    : undefined;

  return {
    id,
    sources,
    namespace,
    defaultOwner,
    defaultLifecycle,
    schedule,
  };
}

function readSourceConsumerConfig(
  providerId: string,
  config: Config,
  index: number,
): SourceConsumerConfig {
  const connectorPluginId = config.getString('connectorPluginId').trim();
  if (!connectorPluginId) {
    throw new InputError(
      `skillsCatalogProvider.${providerId}.sources[${index}]: ` +
        'connectorPluginId must be a non-empty string',
    );
  }

  const sourceId = config.getString('sourceId').trim();
  if (!sourceId || sourceId === '.' || sourceId === '..') {
    throw new InputError(
      `skillsCatalogProvider.${providerId}.sources[${index}]: ` +
        'sourceId must be nonblank and must not be . or ..',
    );
  }

  const sourceType = config.getString('sourceType').trim();
  if (!VALID_SOURCE_TYPES.has(sourceType)) {
    throw new InputError(
      `skillsCatalogProvider.${providerId}.sources[${index}]: ` +
        `sourceType must be 'oci' or 'npx', got '${sourceType}'`,
    );
  }

  return {
    connectorPluginId,
    sourceId,
    sourceType: sourceType as SkillSourceType,
  };
}

/**
 * Validates no duplicate `(connectorPluginId, sourceId)` consumers
 * within a single provider instance per design D5.
 */
function validateNoDuplicateConsumers(
  providerId: string,
  sources: SourceConsumerConfig[],
): void {
  const seen = new Set<string>();
  for (const source of sources) {
    const key = `${source.connectorPluginId}:${source.sourceId}`;
    if (seen.has(key)) {
      throw new InputError(
        `skillsCatalogProvider.${providerId}: duplicate consumer ` +
          `(connectorPluginId=${source.connectorPluginId}, ` +
          `sourceId=${source.sourceId})`,
      );
    }
    seen.add(key);
  }
}

/**
 * Validates no duplicate `(source.type, source.id)` assignments
 * within a single provider instance per design D5.
 */
function validateNoDuplicateSourceAssignments(
  providerId: string,
  sources: SourceConsumerConfig[],
): void {
  const seen = new Set<string>();
  for (const source of sources) {
    const key = `${source.sourceType}:${source.sourceId}`;
    if (seen.has(key)) {
      throw new InputError(
        `skillsCatalogProvider.${providerId}: duplicate source assignment ` +
          `(sourceType=${source.sourceType}, sourceId=${source.sourceId})`,
      );
    }
    seen.add(key);
  }
}
