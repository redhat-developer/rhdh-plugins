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
  AggregatedMetricTimeSeriesResponse,
  AggregationMetadata,
  Metric,
  AggregationResultByType,
  ScalarAggregatedMetric,
  ScalarAggregatedTimeSeriesPoint,
  ThresholdConfig,
} from '@red-hat-developer-hub/backstage-plugin-scorecard-common';
import { DbAggregatedMetric } from '../database/types';
import type {
  DbScalarAggregatedMetric,
  DbScalarTimeSeriesPoint,
} from '../database/types';
import { ValidatedAggregationConfig } from '../validation/schemas/aggregationConfigSchemas';
import { formatUtcDateAsStartOfDayIso } from '../utils/formatUtcDate';
import { normalizeTimestamp } from '../utils/normalizeTimestamp';

export class AggregatedMetricMapper {
  static toAggregatedMetric(
    aggregatedMetric?: DbAggregatedMetric,
  ): AggregatedMetric {
    const total = aggregatedMetric?.total ?? 0;
    const timestamp = normalizeTimestamp(
      aggregatedMetric?.maxTimestamp,
    ).toISOString();

    return {
      values: aggregatedMetric?.statusCounts ?? {},
      total,
      timestamp,
      entitiesConsidered: aggregatedMetric?.latestEntityCount ?? 0,
      calculationErrorCount: aggregatedMetric?.calculationErrorCount ?? 0,
    };
  }

  static toScalarAggregatedMetric(
    scalarMetric?: DbScalarAggregatedMetric,
  ): ScalarAggregatedMetric {
    const timestamp = normalizeTimestamp(
      scalarMetric?.maxTimestamp,
    ).toISOString();

    return {
      value: scalarMetric?.value ?? 0,
      total: scalarMetric?.total ?? 0,
      entitiesConsidered: scalarMetric?.latestEntityCount ?? 0,
      calculationErrorCount: scalarMetric?.calculationErrorCount ?? 0,
      timestamp,
    };
  }

  static toAggregationMetadata(
    metric: Metric,
    aggregationConfig: ValidatedAggregationConfig,
  ): AggregationMetadata {
    const metadata: AggregationMetadata = {
      type: metric.type,
      unit: metric.unit,
      history: metric.history,
      title: aggregationConfig.title,
      description: aggregationConfig.description,
      aggregationType: aggregationConfig.type,
    };

    if ('filter' in aggregationConfig && aggregationConfig.filter) {
      metadata.filter = aggregationConfig.filter;
    }

    return metadata;
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

  static toScalarTimeSeriesPoint(
    row: DbScalarTimeSeriesPoint,
  ): ScalarAggregatedTimeSeriesPoint {
    return {
      value: row.value,
      total: row.total,
      timestamp: formatUtcDateAsStartOfDayIso(row.utcDay),
    };
  }

  static toScalarAggregatedMetricTimeSeriesResponse(
    metric: Metric,
    aggregationConfig: ValidatedAggregationConfig,
    points: ScalarAggregatedTimeSeriesPoint[],
    thresholds: ThresholdConfig,
    aggregationChartDisplayColor: string | null,
  ): AggregatedMetricTimeSeriesResponse {
    return {
      id: aggregationConfig.id,
      metricId: metric.id,
      points,
      metadata: this.toAggregationMetadata(metric, aggregationConfig),
      thresholds,
      aggregationChartDisplayColor,
    };
  }
}
