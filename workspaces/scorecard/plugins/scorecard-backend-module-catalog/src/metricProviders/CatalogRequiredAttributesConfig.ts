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
 * A single metric configuration parsed from app-config.yaml.
 */
export type MetricConfig = {
  id: string;
  title: string;
  description: string;
  field: string;
  statusMapping: StatusMapping;
};

/**
 * Parsed options for the catalog required attributes metric provider.
 */
export type CatalogRequiredAttributesOptions = {
  filter: object;
  metrics: MetricConfig[];
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
 * Parses the catalog required attributes configuration from the root Backstage config.
 * Returns undefined if no metrics are configured.
 */
export function parseCatalogRequiredAttributesConfig(
  config: Config,
): CatalogRequiredAttributesOptions | undefined {
  const optionsConfig = config.getOptionalConfig(
    'scorecard.metricProviders.catalog.requiredAttributes.options',
  );

  if (!optionsConfig) {
    return undefined;
  }

  // Read the required filter from options level
  const filter = optionsConfig.get('filter') as object;

  const metricsConfig = optionsConfig.getOptionalConfig('metrics');
  if (!metricsConfig) {
    return undefined;
  }

  const metricKeys = metricsConfig.keys();
  if (metricKeys.length === 0) {
    return undefined;
  }

  // Read options-level status mapping
  const optionsStatusMappingConfig =
    optionsConfig.getOptionalConfig('statusMapping');
  const optionsStatusMapping = optionsStatusMappingConfig
    ? readStatusMapping(optionsStatusMappingConfig)
    : undefined;

  const metrics: MetricConfig[] = metricKeys.map(metricId => {
    const metricConfig = metricsConfig.getConfig(metricId);

    if (!metricId) {
      throw new Error(`Metric has an empty id (object key)`);
    }

    const title = metricConfig.getString('title');
    const description = metricConfig.getString('description');

    // Read field
    const field = metricConfig.getString('field');
    if (!field) {
      throw new Error(`Metric '${metricId}' has an empty field path`);
    }

    // Read metric-level status mapping
    const metricStatusMappingConfig =
      metricConfig.getOptionalConfig('statusMapping');
    const metricStatusMapping = metricStatusMappingConfig
      ? readStatusMapping(metricStatusMappingConfig)
      : undefined;

    // Merge status mappings: metric > options > defaults
    const statusMapping = mergeStatusMappings(
      metricStatusMapping,
      optionsStatusMapping,
    );

    return { id: metricId, title, description, field, statusMapping };
  });

  return { filter, metrics };
}
