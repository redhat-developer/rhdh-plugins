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

import { ThresholdResult } from './threshold';

/**
 * @public
 */
export type MetricType = 'number' | 'boolean';

/**
 * @public
 */
export type MetricValue<T extends MetricType = MetricType> = T extends 'number'
  ? number
  : T extends 'boolean'
  ? boolean
  : never;

/**
 * @public
 */
export type AggregatedMetricValue = {
  count: number;
  name: 'success' | 'warning' | 'error';
};

/**
 * @public
 */
export type Metric<T extends MetricType = MetricType> = {
  id: string;
  title: string;
  description: string;
  type: T;
  history?: boolean;
};

/**
 * @public
 */
export type MetricResult = {
  id: string;
  status: 'success' | 'error';
  metadata: {
    title: string;
    description: string;
    type: MetricType;
    history?: boolean;
  };
  result: {
    value: MetricValue | null;
    timestamp: string;
    thresholdResult: ThresholdResult;
  };
  error?: string;
};

/**
 * @public
 */
export type AggregatedMetric = {
  values: AggregatedMetricValue[];
  total: number;
  timestamp: string;
};

/**
 * @public
 */
export type AggregatedMetricResult = {
  id: string;
  status: 'success' | 'error';
  metadata: {
    title: string;
    description: string;
    type: MetricType;
    history?: boolean;
  };
  result: AggregatedMetric;
};
