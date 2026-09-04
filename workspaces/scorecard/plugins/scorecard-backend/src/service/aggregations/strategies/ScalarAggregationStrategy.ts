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
import { getRequiredAggregationChartDisplayColor } from '../../../utils/aggregation/getAggregationChartDisplayColor';
import { DEFAULT_SCALAR_AGGREGATION_KPI_RESULT_THRESHOLDS } from '../../../constants';

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

    const { thresholds: headlineThresholds } = aggregationConfig.options ?? {};

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

    const aggregationChartDisplayColor =
      total > 0
        ? getRequiredAggregationChartDisplayColor(
            value,
            headlineThresholds ??
              DEFAULT_SCALAR_AGGREGATION_KPI_RESULT_THRESHOLDS,
            `The color for value '${value}' metric '${metric.id}' is not configured. Check the 'scorecard.aggregationKPIs.${aggregationConfig.id}.options.thresholds' configuration.`,
          )
        : null;

    const result = {
      value,
      total,
      entitiesConsidered,
      calculationErrorCount,
      timestamp,
      aggregationChartDisplayColor,
      thresholds: headlineThresholds ?? DEFAULT_NUMBER_THRESHOLDS,
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

    const lastSuccessValue = [...points]
      .reverse()
      .find(point => point.status === 'success' && point.value !== null)?.value;
    const aggregationChartDisplayColor =
      lastSuccessValue === undefined || lastSuccessValue === null
        ? null
        : classifyNumberAgainstThresholds(
            lastSuccessValue,
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
