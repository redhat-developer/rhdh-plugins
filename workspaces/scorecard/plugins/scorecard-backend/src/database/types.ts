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

import { MetricValue } from '@red-hat-developer-hub/backstage-plugin-scorecard-common';

export type DbMetricValueCreate = {
  catalogEntityRef: string;
  metricId: string;
  value?: MetricValue;
  timestamp: Date;
  errorMessage?: string;
  status?: string | null;
  entityKind?: string;
  entityOwner?: string;
  entityNamespace?: string;
};

export type DbMetricValue = {
  id: number;
  catalogEntityRef: string;
  metricId: string;
  value: MetricValue | null;
  timestamp: Date;
  errorMessage: string | null;
  status: string | null;
  entityKind: string | null;
  entityOwner: string | null;
  entityNamespace: string | null;
};

export type DbAggregatedMetric = {
  metricId: string;
  total: number;
  maxTimestamp: Date;
  statusCounts: Record<string, number>;
  /** Latest row per entity is a metric calculation failure (errorMessage set, value null). */
  calculationErrorCount: number;
  /**
   * How many of the requested catalog entity refs have at least one latest `metric_values` row
   * for this metric (same cardinality the drill-down table is built from, modulo caps/filters).
   */
  latestEntityCount: number;
};

export type ScalarAggregationFn = 'sum' | 'average' | 'max' | 'min' | 'count';

export type DbScalarAggregatedMetric = {
  metricId: string;
  total: number;
  maxTimestamp: Date;
  value: number;
  calculationErrorCount: number;
  latestEntityCount: number;
};

export type DbScalarTimeSeriesPoint = {
  utcDay: string;
  value: number;
  total: number;
};
