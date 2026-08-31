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

import type { Entity } from '@backstage/catalog-model';
import type { Config } from '@backstage/config';
import {
  Metric,
  ScorecardThresholdRuleColors,
  ThresholdConfig,
} from '@red-hat-developer-hub/backstage-plugin-scorecard-common';
import { MetricProvider } from '@red-hat-developer-hub/backstage-plugin-scorecard-node';
import {
  type CatalogRequiredAttributesOptions,
  type MetricConfig,
  type StatusMapping,
  parseCatalogRequiredAttributesConfig,
} from './CatalogRequiredAttributesConfig';

/** Sentinel for a field path that does not resolve. */
const NOT_FOUND = Symbol('NOT_FOUND');

/**
 * Resolves a dotted field path on an entity object.
 * Returns the value at the path, or NOT_FOUND if the path does not resolve.
 */
export function resolveFieldPath(
  entity: Entity,
  path: string,
): unknown | typeof NOT_FOUND {
  const parts = path.split('.');
  let current: unknown = entity;
  for (const part of parts) {
    if (
      current === null ||
      current === undefined ||
      typeof current !== 'object'
    ) {
      return NOT_FOUND;
    }
    if (!(part in (current as Record<string, unknown>))) {
      return NOT_FOUND;
    }
    current = (current as Record<string, unknown>)[part];
  }
  return current;
}

/**
 * Determines the status string for a field value using the status mapping.
 */
export function evaluateFieldStatus(
  entity: Entity,
  field: string,
  statusMapping: StatusMapping,
): string {
  const value = resolveFieldPath(entity, field);

  if (value === NOT_FOUND) {
    return statusMapping.missed;
  }

  if (value === null || value === undefined) {
    return statusMapping.empty;
  }

  if (typeof value === 'string' && value === '') {
    return statusMapping.emptyString;
  }

  if (Array.isArray(value) && value.length === 0) {
    return statusMapping.emptyArray;
  }

  // Field exists with a non-empty value — check for specific value matches
  if (
    typeof value === 'string' &&
    Object.keys(statusMapping.values).length > 0 &&
    value in statusMapping.values
  ) {
    return statusMapping.values[value];
  }

  return statusMapping.exists;
}

/**
 * Collects all distinct status strings from a StatusMapping.
 */
function collectDistinctStatuses(statusMapping: StatusMapping): string[] {
  const statuses = new Set<string>();
  statuses.add(statusMapping.exists);
  statuses.add(statusMapping.empty);
  statuses.add(statusMapping.emptyString);
  statuses.add(statusMapping.emptyArray);
  statuses.add(statusMapping.missed);
  for (const value of Object.values(statusMapping.values)) {
    statuses.add(value);
  }
  return [...statuses];
}

/**
 * Builds a mapping from status strings to numeric codes and generates
 * threshold rules that map those codes back to status strings.
 */
function buildStatusCodeMapping(statusMapping: StatusMapping): {
  statusToCode: Map<string, number>;
  thresholds: ThresholdConfig;
} {
  const statuses = collectDistinctStatuses(statusMapping);
  const statusToCode = new Map<string, number>();

  statuses.forEach((status, index) => {
    statusToCode.set(status, index);
  });

  const rules = statuses.map((status, index) => ({
    key: status,
    expression: `==${index}`,
    color: getDefaultColor(status),
    icon: getDefaultIcon(status),
  }));

  return { statusToCode, thresholds: { rules } };
}

/**
 * Returns a default color for well-known status strings.
 */
function getDefaultColor(status: string): string {
  switch (status.toLowerCase()) {
    case 'found':
    case 'ok':
    case 'success':
    case 'valid':
      return ScorecardThresholdRuleColors.SUCCESS;
    case 'missed':
    case 'invalid':
    case 'error':
    case 'failed':
      return ScorecardThresholdRuleColors.ERROR;
    case 'warning':
      return ScorecardThresholdRuleColors.WARNING;
    default:
      return ScorecardThresholdRuleColors.WARNING;
  }
}

/**
 * Returns a default icon for well-known status strings.
 */
function getDefaultIcon(status: string): string {
  switch (status.toLowerCase()) {
    case 'found':
    case 'ok':
    case 'success':
    case 'valid':
      return 'scorecardSuccessStatusIcon';
    case 'missed':
    case 'invalid':
    case 'error':
    case 'failed':
      return 'scorecardErrorStatusIcon';
    default:
      return 'scorecardWarningStatusIcon';
  }
}

export class CatalogRequiredAttributesMetricProvider
  implements MetricProvider<'number'>
{
  private readonly filter: object;
  private readonly metricConfigs: MetricConfig[];
  private readonly statusCodeMappings: Map<
    string,
    { statusToCode: Map<string, number>; thresholds: ThresholdConfig }
  >;

  constructor(options: CatalogRequiredAttributesOptions) {
    this.filter = options.filter;
    this.metricConfigs = options.metrics;
    this.statusCodeMappings = new Map();
    for (const metric of this.metricConfigs) {
      this.statusCodeMappings.set(
        metric.id,
        buildStatusCodeMapping(metric.statusMapping),
      );
    }
  }

  getProviderDatasourceId(): string {
    return 'catalog';
  }

  getProviderId(): string {
    return 'catalog.requiredAttributes';
  }

  getMetrics(): Metric<'number'>[] {
    return this.metricConfigs.map(metric => {
      const mapping = this.statusCodeMappings.get(metric.id)!;
      return {
        id: `catalog.${metric.id}`,
        title: metric.title,
        description: metric.description,
        type: 'number' as const,
        thresholds: mapping.thresholds,
      };
    });
  }

  getCatalogFilter(): Record<string, string | symbol | (string | symbol)[]> {
    return this.filter as Record<string, string | symbol | (string | symbol)[]>;
  }

  async calculateMetrics(entity: Entity): Promise<Map<string, number>> {
    const results = new Map<string, number>();

    for (const metric of this.metricConfigs) {
      const status = evaluateFieldStatus(
        entity,
        metric.field,
        metric.statusMapping,
      );

      const mapping = this.statusCodeMappings.get(metric.id)!;
      const code = mapping.statusToCode.get(status);
      if (code !== undefined) {
        results.set(`catalog.${metric.id}`, code);
      }
    }

    return results;
  }
}

/**
 * Creates a CatalogRequiredAttributesMetricProvider from root Backstage config.
 * Returns undefined if no metrics are configured.
 */
export function createCatalogRequiredAttributesMetricProvider(
  config: Config,
): CatalogRequiredAttributesMetricProvider | undefined {
  const options = parseCatalogRequiredAttributesConfig(config);
  if (!options) {
    return undefined;
  }
  return new CatalogRequiredAttributesMetricProvider(options);
}
