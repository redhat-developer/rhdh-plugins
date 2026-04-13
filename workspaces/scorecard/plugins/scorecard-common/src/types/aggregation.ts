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

/**
 * @public
 */
export type AggregatedMetricResult = {
  id: string;
  status: 'success' | 'error';
  metadata: AggregationMetadata;
  result: Omit<AggregatedMetric, 'values'> & {
    values: AggregatedMetricValue[];
    thresholds: ThresholdConfig;
  };
};
