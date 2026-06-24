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

import type { AggregationRuntimeConfig } from './aggregations/types';
import {
  AggregatedMetric,
  AggregatedMetricResult,
  AggregationMetadata,
  Metric,
  aggregationTypes,
  AggregationResultByType,
  ScalarAggregatedMetric,
} from '@red-hat-developer-hub/backstage-plugin-scorecard-common';
import { DbAggregatedMetric } from '../database/types';
import type { DbScalarAggregatedMetric } from '../database/types';

function normalizeTimestamp(timestamp?: Date): string {
  return timestamp
    ? new Date(timestamp).toISOString()
    : new Date().toISOString();
}

export class AggregatedMetricMapper {
  static toAggregatedMetric(
    aggregatedMetric?: DbAggregatedMetric,
  ): AggregatedMetric {
    const total = aggregatedMetric?.total ?? 0;
    const timestamp = normalizeTimestamp(aggregatedMetric?.max_timestamp);

    return {
      values: aggregatedMetric?.statusCounts ?? {},
      total,
      timestamp,
      entitiesConsidered: aggregatedMetric?.latest_entity_count ?? 0,
      calculationErrorCount: aggregatedMetric?.calculation_error_count ?? 0,
    };
  }

  static toScalarAggregatedMetric(
    scalarMetric?: DbScalarAggregatedMetric,
  ): ScalarAggregatedMetric {
    const timestamp = normalizeTimestamp(scalarMetric?.max_timestamp);

    return {
      value: scalarMetric?.value ?? 0,
      total: scalarMetric?.total ?? 0,
      entitiesConsidered: scalarMetric?.latest_entity_count ?? 0,
      calculationErrorCount: scalarMetric?.calculation_error_count ?? 0,
      timestamp,
    };
  }

  static toAggregationMetadata(
    metric: Metric,
    aggregationConfig?: AggregationRuntimeConfig,
  ): AggregationMetadata {
    const title =
      aggregationConfig && 'title' in aggregationConfig
        ? aggregationConfig.title
        : metric.title;
    const description =
      aggregationConfig && 'description' in aggregationConfig
        ? aggregationConfig.description
        : metric.description;

    return {
      title,
      description,
      type: metric.type,
      history: metric.history,
      aggregationType:
        aggregationConfig?.type ?? aggregationTypes.statusGrouped,
    };
  }

  static toAggregatedMetricResult(
    metric: Metric,
    result: AggregationResultByType,
    aggregationConfig?: AggregationRuntimeConfig,
  ): AggregatedMetricResult {
    return {
      id: metric.id,
      status: 'success',
      metadata: this.toAggregationMetadata(metric, aggregationConfig),
      result,
    };
  }
}
