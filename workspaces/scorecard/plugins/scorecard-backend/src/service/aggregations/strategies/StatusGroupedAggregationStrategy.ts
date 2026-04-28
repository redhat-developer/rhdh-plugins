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

import type {
  AggregatedMetricResult,
  StatusGroupedAggregationResult,
} from '@red-hat-developer-hub/backstage-plugin-scorecard-common';
import { AggregatedMetricMapper } from '../../mappers';
import type { AggregatedMetricLoader } from '../AggregatedMetricLoader';
import type { AggregationOptions } from '../types';
import type { AggregationStrategy } from './types';

export class StatusGroupedAggregationStrategy implements AggregationStrategy {
  constructor(private readonly loader: AggregatedMetricLoader) {}

  async aggregate(
    options: AggregationOptions,
  ): Promise<AggregatedMetricResult> {
    const { entityRefs, metric, thresholds, aggregationConfig } = options;

    const aggregatedMetric =
      await this.loader.loadStatusGroupedMetricByEntityRefs(
        entityRefs,
        metric.id,
      );

    const result = {
      total: aggregatedMetric.total,
      timestamp: aggregatedMetric.timestamp,
      entitiesConsidered: aggregatedMetric.entitiesConsidered,
      calculationErrorCount: aggregatedMetric.calculationErrorCount,
      values: thresholds.rules.map(rule => ({
        name: rule.key,
        count: aggregatedMetric.values[rule.key] ?? 0,
      })),
      thresholds,
    } as StatusGroupedAggregationResult;

    return AggregatedMetricMapper.toAggregatedMetricResult(
      metric,
      result,
      aggregationConfig,
    );
  }
}
