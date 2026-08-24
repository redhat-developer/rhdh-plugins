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
  DEFAULT_NUMBER_THRESHOLDS,
  type AggregatedMetricResult,
  type AggregatedMetricTimeSeriesResponse,
  type ScalarAggregationResult,
} from '@red-hat-developer-hub/backstage-plugin-scorecard-common';
import type { ScalarAggregationFn } from '../../../database/types';
import { AggregatedMetricMapper } from '../../mappers';
import type { AggregatedMetricLoader } from '../AggregatedMetricLoader';
import type {
  AggregationOptions,
  AggregationTimeSeriesOptions,
} from '../types';
import type { AggregationStrategy } from './types';
import { isScalarAggregationConfig } from '../../../utils/aggregation/isScalarAggregationConfig';
import { classifyNumberAgainstThresholds } from '../../../utils/aggregation/classifyNumberAgainstThresholds';
import { ThresholdEvaluator } from '../../../threshold/ThresholdEvaluator';

export class ScalarAggregationStrategy implements AggregationStrategy {
  constructor(
    private readonly loader: AggregatedMetricLoader,
    private readonly aggregationFn: ScalarAggregationFn,
    private readonly thresholdEvaluator: ThresholdEvaluator = new ThresholdEvaluator(),
  ) {}

  async aggregate(
    options: AggregationOptions,
  ): Promise<AggregatedMetricResult> {
    const { entityRefs, metric, aggregationConfig } = options;

    if (!isScalarAggregationConfig(aggregationConfig)) {
      throw new Error(
        `Expected a scalar aggregation config but received type "${aggregationConfig.type}"`,
      );
    }

    const { thresholds: headlineThresholds = DEFAULT_NUMBER_THRESHOLDS } =
      aggregationConfig.options ?? {};

    const {
      value,
      total,
      entitiesConsidered,
      calculationErrorCount,
      timestamp,
    } = await this.loader.loadScalarMetricByEntityRefs(
      entityRefs,
      metric.id,
      this.aggregationFn,
      aggregationConfig.filter,
    );

    const result = {
      value,
      total,
      entitiesConsidered,
      calculationErrorCount,
      timestamp,
      thresholds: headlineThresholds,
    } satisfies ScalarAggregationResult;

    return AggregatedMetricMapper.toAggregatedMetricResult(
      metric,
      result,
      aggregationConfig,
    );
  }

  async aggregateTimeSeries(
    options: AggregationTimeSeriesOptions,
  ): Promise<AggregatedMetricTimeSeriesResponse> {
    const { entityRefs, metric, aggregationConfig, from, to } = options;

    if (!isScalarAggregationConfig(aggregationConfig)) {
      throw new Error(
        `Expected a scalar aggregation config but received type "${aggregationConfig.type}"`,
      );
    }

    const headlineThresholds =
      aggregationConfig.options?.thresholds ?? DEFAULT_NUMBER_THRESHOLDS;

    const points = await this.loader.loadScalarMetricTimeSeriesByEntityRefs(
      entityRefs,
      metric.id,
      this.aggregationFn,
      from,
      to,
      aggregationConfig.filter,
    );

    const lastPoint = points.at(-1);
    const aggregationChartDisplayColor =
      lastPoint === undefined
        ? null
        : classifyNumberAgainstThresholds(
            lastPoint.value,
            headlineThresholds,
            this.thresholdEvaluator,
          )?.color ?? null;

    return AggregatedMetricMapper.toScalarAggregatedMetricTimeSeriesResponse(
      metric,
      aggregationConfig,
      points,
      headlineThresholds,
      aggregationChartDisplayColor,
    );
  }
}
