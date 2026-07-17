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
  AggregatedMetric,
  AggregatedMetricResult,
  AggregationMetadata,
  Metric,
  AggregationResultByType,
  ScalarAggregatedMetric,
} from '@red-hat-developer-hub/backstage-plugin-scorecard-common';
import { DbAggregatedMetric } from '../database/types';
import type { DbScalarAggregatedMetric } from '../database/types';
import { toIsoTimestamp } from '../utils/toIsoTimestamp';
import { ValidatedAggregationConfig } from '../validation/schemas/aggregationConfigSchemas';

export class AggregatedMetricMapper {
  static toAggregatedMetric(
    aggregatedMetric?: DbAggregatedMetric,
  ): AggregatedMetric {
    const total = aggregatedMetric?.total ?? 0;
    const timestamp = toIsoTimestamp(aggregatedMetric?.max_timestamp);

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
    const timestamp = toIsoTimestamp(scalarMetric?.max_timestamp);

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
    aggregationConfig: ValidatedAggregationConfig,
  ): AggregationMetadata {
    return {
      type: metric.type,
      history: metric.history,
      title: aggregationConfig.title,
      description: aggregationConfig.description,
      aggregationType: aggregationConfig.type,
    };
  }

  static toAggregatedMetricResult(
    metric: Metric,
    result: AggregationResultByType,
    aggregationConfig: ValidatedAggregationConfig,
  ): AggregatedMetricResult {
    return {
      id: metric.id,
      status: 'success',
      metadata: this.toAggregationMetadata(metric, aggregationConfig),
      result,
    };
  }
}
