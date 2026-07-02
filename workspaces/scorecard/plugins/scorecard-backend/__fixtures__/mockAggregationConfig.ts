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
  aggregationTypes,
  DEFAULT_NUMBER_THRESHOLDS,
} from '@red-hat-developer-hub/backstage-plugin-scorecard-common';
import { DEFAULT_WEIGHTED_STATUS_SCORE_KPI_RESULT_THRESHOLDS } from '../src/constants/aggregationKPIs';
import type {
  ScalarAggregationConfig,
  StatusGroupedAggregationConfig,
  WeightedStatusScoreAggregationConfig,
} from '../src/validation/schemas/aggregationConfigSchemas';
import type { FallbackStatusGroupedAggregationConfig } from '../src/service/aggregations/types';

export function mockStatusGroupedAggregationConfig(
  overrides: Partial<StatusGroupedAggregationConfig> = {},
): StatusGroupedAggregationConfig {
  return {
    id: 'test.metric',
    title: 'Test Metric',
    description: 'Test description',
    metricId: 'test.metric',
    type: aggregationTypes.statusGrouped,
    ...overrides,
  };
}

export function mockFallbackStatusGroupedAggregationConfig(
  overrides: Partial<FallbackStatusGroupedAggregationConfig> = {},
): FallbackStatusGroupedAggregationConfig {
  return {
    id: 'test.metric',
    metricId: 'test.metric',
    type: aggregationTypes.statusGrouped,
    ...overrides,
  };
}

export function mockWeightedStatusScoreAggregationConfig(
  overrides: Partial<Omit<WeightedStatusScoreAggregationConfig, 'options'>> & {
    options?: Partial<WeightedStatusScoreAggregationConfig['options']>;
  } = {},
): WeightedStatusScoreAggregationConfig {
  const { options: optionsOverrides, ...rest } = overrides;
  return {
    id: 'weightedKpi',
    title: 'Weighted health KPI',
    description: 'Weighted health score across statuses',
    metricId: 'test.metric',
    type: aggregationTypes.weightedStatusScore,
    options: {
      statusScores: { error: 0, warning: 50, success: 100 },
      thresholds:
        DEFAULT_WEIGHTED_STATUS_SCORE_KPI_RESULT_THRESHOLDS as WeightedStatusScoreAggregationConfig['options']['thresholds'],
      ...optionsOverrides,
    },
    ...rest,
  };
}

export function mockScalarAggregationConfig(
  type: ScalarAggregationConfig['type'] = aggregationTypes.sum,
  overrides: Partial<ScalarAggregationConfig> = {},
): ScalarAggregationConfig {
  return {
    id: 'scalarKpi',
    title: 'Scalar KPI',
    description: 'Scalar aggregation KPI',
    metricId: 'test.metric',
    type,
    options: {
      thresholds: DEFAULT_NUMBER_THRESHOLDS as NonNullable<
        ScalarAggregationConfig['options']
      >['thresholds'],
    },
    ...overrides,
  };
}
