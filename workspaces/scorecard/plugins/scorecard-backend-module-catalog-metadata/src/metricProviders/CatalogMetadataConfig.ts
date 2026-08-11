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

/**
 * Status mapping that maps field states to status strings (threshold keys).
 */
export type StatusMapping = {
  /** Status when field exists with a non-empty value not matched by values */
  exists: string;
  /** Status when field resolves to null or undefined */
  empty: string;
  /** Status when field resolves to an empty string */
  emptyString: string;
  /** Status when field resolves to an empty array */
  emptyArray: string;
  /** Status when the field path does not resolve */
  missed: string;
  /** Status per specific field value */
  values: Record<string, string>;
};

/**
 * A single check configuration parsed from app-config.yaml.
 */
export type CheckConfig = {
  metric: {
    id: string;
    title: string;
    description: string;
  };
  filter: Record<string, string>;
  field: string;
  statusMapping: StatusMapping;
};

/**
 * Parsed configuration for the catalog-metadata metric provider.
 */
export type CatalogMetadataConfig = {
  checks: CheckConfig[];
};

/** Hardcoded default status mapping as described in the issue. */
export const DEFAULT_STATUS_MAPPING: StatusMapping = {
  exists: 'found',
  empty: 'missed',
  emptyString: 'missed',
  emptyArray: 'missed',
  missed: 'missed',
  values: {},
};

/**
 * Merges status mappings with priority: check-level > options-level > defaults.
 * Each field is individually resolved by priority.
 */
export function mergeStatusMappings(
  checkMapping: Partial<StatusMapping> | undefined,
  optionsMapping: Partial<StatusMapping> | undefined,
): StatusMapping {
  return {
    exists:
      checkMapping?.exists ??
      optionsMapping?.exists ??
      DEFAULT_STATUS_MAPPING.exists,
    empty:
      checkMapping?.empty ??
      optionsMapping?.empty ??
      DEFAULT_STATUS_MAPPING.empty,
    emptyString:
      checkMapping?.emptyString ??
      optionsMapping?.emptyString ??
      DEFAULT_STATUS_MAPPING.emptyString,
    emptyArray:
      checkMapping?.emptyArray ??
      optionsMapping?.emptyArray ??
      DEFAULT_STATUS_MAPPING.emptyArray,
    missed:
      checkMapping?.missed ??
      optionsMapping?.missed ??
      DEFAULT_STATUS_MAPPING.missed,
    values: {
      ...DEFAULT_STATUS_MAPPING.values,
      ...(optionsMapping?.values ?? {}),
      ...(checkMapping?.values ?? {}),
    },
  };
}

/**
 * Reads a partial StatusMapping from a Backstage Config node.
 */
function readStatusMapping(config: Config): Partial<StatusMapping> | undefined {
  const result: Partial<StatusMapping> = {};
  let hasAny = false;

  const exists = config.getOptionalString('exists');
  if (exists !== undefined) {
    result.exists = exists;
    hasAny = true;
  }

  const empty = config.getOptionalString('empty');
  if (empty !== undefined) {
    result.empty = empty;
    hasAny = true;
  }

  const emptyString = config.getOptionalString('emptyString');
  if (emptyString !== undefined) {
    result.emptyString = emptyString;
    hasAny = true;
  }

  const emptyArray = config.getOptionalString('emptyArray');
  if (emptyArray !== undefined) {
    result.emptyArray = emptyArray;
    hasAny = true;
  }

  const missed = config.getOptionalString('missed');
  if (missed !== undefined) {
    result.missed = missed;
    hasAny = true;
  }

  const valuesConfig = config.getOptionalConfig('values');
  if (valuesConfig) {
    const values: Record<string, string> = {};
    for (const key of valuesConfig.keys()) {
      values[key] = valuesConfig.getString(key);
    }
    if (Object.keys(values).length > 0) {
      result.values = values;
      hasAny = true;
    }
  }

  return hasAny ? result : undefined;
}

/**
 * Parses the catalog-metadata configuration from the root Backstage config.
 * Returns undefined if no checks are configured.
 */
export function parseCatalogMetadataConfig(
  config: Config,
): CatalogMetadataConfig | undefined {
  const optionsConfig = config.getOptionalConfig(
    'scorecard.metricProviders.catalogMetadata.requiredAttributes.options',
  );

  if (!optionsConfig) {
    return undefined;
  }

  const checksConfigArray =
    optionsConfig.getOptionalConfigArray('checks') ?? [];
  if (checksConfigArray.length === 0) {
    return undefined;
  }

  // Read options-level status mapping
  const optionsStatusMappingConfig =
    optionsConfig.getOptionalConfig('statusMapping');
  const optionsStatusMapping = optionsStatusMappingConfig
    ? readStatusMapping(optionsStatusMappingConfig)
    : undefined;

  const checks: CheckConfig[] = checksConfigArray.map((checkConfig, index) => {
    // Read metric
    const metricConfig = checkConfig.getConfig('metric');
    const metric = {
      id: metricConfig.getString('id'),
      title: metricConfig.getString('title'),
      description: metricConfig.getString('description'),
    };

    if (!metric.id) {
      throw new Error(`Check at index ${index} has an empty metric id`);
    }

    // Read filter
    const filterConfig = checkConfig.getConfig('filter');
    const filter: Record<string, string> = {};
    for (const key of filterConfig.keys()) {
      filter[key] = filterConfig.getString(key);
    }

    // Read field
    const field = checkConfig.getString('field');
    if (!field) {
      throw new Error(`Check '${metric.id}' has an empty field path`);
    }

    // Read check-level status mapping
    const checkStatusMappingConfig =
      checkConfig.getOptionalConfig('statusMapping');
    const checkStatusMapping = checkStatusMappingConfig
      ? readStatusMapping(checkStatusMappingConfig)
      : undefined;

    // Merge status mappings: check > options > defaults
    const statusMapping = mergeStatusMappings(
      checkStatusMapping,
      optionsStatusMapping,
    );

    return { metric, filter, field, statusMapping };
  });

  return { checks };
}
