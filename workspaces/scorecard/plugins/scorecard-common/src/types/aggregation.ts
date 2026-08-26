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

import { aggregationTypes } from '../constants/aggregations';
import { MetricType } from './Metric';
import { ScorecardVisualizationType } from './scorecard';
import { ThresholdConfig } from './threshold';

/**
 * @public
 */
export type AggregationType =
  (typeof aggregationTypes)[keyof typeof aggregationTypes];

/**
 * @public
 */
export type AggregatedMetricValue = {
  count: number;
  name: string;
  /** Present when the API includes per-status weights (e.g. weightedStatusScore aggregation). */
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
  /**
   * Entities in aggregation scope that have at least one latest stored `metric_values` row for this metric
   * (aligned with the drill-down list total when the same ownership filters apply).
   */
  entitiesConsidered: number;
  /**
   * How many of those entities have a latest stored row that is a metric **calculation** failure
   * (`error_message` set and `value` null), distinct from threshold status counts in `values` / `total`.
   */
  calculationErrorCount: number;
};

/**
 * @public
 */
export type ScalarAggregatedMetric = Omit<AggregatedMetric, 'values'> & {
  value: number;
};

/**
 * Optional filter applied to scalar aggregation KPIs.
 * @public
 */
export type AggregationConfigFilter = {
  status?: string;
};

/**
 * @public
 */
export type AggregationMetadata = {
  title: string;
  description: string;
  type: MetricType;
  unit?: string;
  history?: boolean;
  visualization?: ScorecardVisualizationType;
  aggregationType: AggregationType;
  filter?: AggregationConfigFilter;
};

/**
 * @public
 */
export type StatusGroupedAggregationResult = Omit<
  AggregatedMetric,
  'values'
> & { values: AggregatedMetricValue[]; thresholds: ThresholdConfig };

/**
 * @public
 */
export type WeightedStatusScoreAggregationResult =
  StatusGroupedAggregationResult & {
    weightedStatusScore: number;
    weightedStatusSum: number;
    weightedStatusMaxPossible: number;
    aggregationChartDisplayColor: string;
  };

/**
 * @public
 */
export type ScalarAggregationResult = ScalarAggregatedMetric & {
  thresholds: ThresholdConfig;
};

/**
 * @public
 */
export type AggregationResultByType =
  | StatusGroupedAggregationResult
  | WeightedStatusScoreAggregationResult
  | ScalarAggregationResult;

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
export type StatusScoreAggregationOption = Record<string, number>;

/**
 * @public
 */
export type AggregationConfigOptions = {
  statusScores?: StatusScoreAggregationOption;
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
  filter?: AggregationConfigFilter;
  options?: AggregationConfigOptions;
};

/**
 * Unique calculation-error message for a UTC day, with how many entities reported it.
 * @public
 */
export type TimeSeriesPointError = {
  message: string;
  count: number;
};

/**
 * One UTC-day scalar aggregate across entities.
 * @public
 */
export type ScalarAggregatedTimeSeriesPoint = {
  /** Aggregate of latest successful values that day; `null` when `successCount` is 0. */
  value: number | null;
  /** Entities whose latest row that day has a real value. */
  successCount: number;
  /** Entities whose latest row that day is a calculation failure. */
  errorCount: number;
  /** `successCount + errorCount` (entities that reported that day). */
  total: number;
  /**
   * `success` when `successCount > 0`, `error` when only calculation failures.
   */
  status: 'success' | 'error';
  /**
   * Unique error messages for that day. Omitted when there are none.
   */
  errors?: TimeSeriesPointError[];
  /** Start of the UTC calendar day (ISO-8601). */
  timestamp: string;
};

/**
 * Scalar aggregation over a specified time period, grouped by UTC day.
 * The `points` array contains the aggregated values for each day where data was reported.
 * @public
 */
export type ScalarAggregatedMetricTimeSeriesResponse = {
  id: string;
  metricId: string;
  metadata: AggregationMetadata;
  points: ScalarAggregatedTimeSeriesPoint[];
  /**
   * KPI `options.thresholds`, or `DEFAULT_NUMBER_THRESHOLDS` when omitted.
   */
  thresholds: ThresholdConfig;
  /**
   * Chart color from classifying the last **successful** point's `value` against
   * `thresholds`. `null` when no day has a value or the matching rule has no color.
   */
  aggregationChartDisplayColor: string | null;
};

/**
 * Daily portfolio aggregation time series.
 * Currently only scalar aggregation types; other members may be added to as union later.
 * @public
 */
export type AggregatedMetricTimeSeriesResponse =
  ScalarAggregatedMetricTimeSeriesResponse;
