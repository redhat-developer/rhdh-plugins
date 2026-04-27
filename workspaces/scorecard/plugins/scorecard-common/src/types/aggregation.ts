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

import { aggregationKinds } from '../constants/aggregations';
import { MetricType } from './Metric';
import { ThresholdConfig } from './threshold';

/**
 * @public
 */
export type AggregationType =
  (typeof aggregationKinds)[keyof typeof aggregationKinds];

/**
 * @public
 */
export type AggregatedMetricValue = {
  count: number;
  name: string;
  /** Present when the API includes per-status weights (e.g. average aggregation). */
  score?: number;
};

/**
 * @public
 */
export type AggregatedMetric = {
  /** Counts by status name */
  values: Record<string, number>;
  total: number;
  timestamp: string;
};

/**
 * @public
 */
export type AggregationMetadata = {
  title: string;
  description: string;
  type: MetricType;
  history?: boolean;
  aggregationType: AggregationType;
};

export type StatusGroupedAggregationResult = Omit<
  AggregatedMetric,
  'values'
> & { values: AggregatedMetricValue[]; thresholds: ThresholdConfig };

export type AggregatedMetricAverageResult = StatusGroupedAggregationResult & {
  averageScore: number;
  averageWeightedSum: number;
  averageMaxPossible: number;
  aggregationChartDisplayColor: string;
};

/**
 * @public
 */
export type AggregationResultByType =
  | StatusGroupedAggregationResult
  | AggregatedMetricAverageResult;

/**
 * @public
 */
export type AggregatedMetricResult = {
  id: string;
  status: 'success' | 'error';
  metadata: AggregationMetadata;
  result: AggregationResultByType;
};

/**
 * @public
 */
export type AggregationConfigOptions = {
  statusScores: Record<string, number>;
  thresholds?: ThresholdConfig;
};

/**
 * @public
 */
export type AggregationConfig = {
  id: string;
  title: string;
  description: string;
  type: AggregationType;
  metricId: string;
  options?: AggregationConfigOptions;
};
