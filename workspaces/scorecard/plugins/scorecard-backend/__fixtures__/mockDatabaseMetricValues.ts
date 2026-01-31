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

import { DatabaseMetricValues } from '../src/database/DatabaseMetricValues';
import { DbMetricValue, DbAggregatedMetric } from '../src/database/types';

type BuildMockDatabaseMetricValuesParams = {
  metricValues?: DbMetricValue[];
  latestEntityMetric?: DbMetricValue[];
  countOfExpiredMetrics?: number;
  aggregatedMetric?: DbAggregatedMetric;
};

export const mockDatabaseMetricValues = {
  createMetricValues: jest.fn(),
  readLatestEntityMetricValues: jest.fn(),
  cleanupExpiredMetrics: jest.fn(),
  readAggregatedMetricByEntityRefs: jest.fn(),
} as unknown as jest.Mocked<DatabaseMetricValues>;

export const buildMockDatabaseMetricValues = ({
  metricValues,
  latestEntityMetric,
  countOfExpiredMetrics,
  aggregatedMetric,
}: BuildMockDatabaseMetricValuesParams) => {
  const createMetricValues = metricValues
    ? jest.fn().mockResolvedValue(metricValues)
    : mockDatabaseMetricValues.createMetricValues;

  const readLatestEntityMetricValues = latestEntityMetric
    ? jest.fn().mockResolvedValue(latestEntityMetric)
    : mockDatabaseMetricValues.readLatestEntityMetricValues;

  const cleanupExpiredMetrics = countOfExpiredMetrics
    ? jest.fn().mockResolvedValue(countOfExpiredMetrics)
    : mockDatabaseMetricValues.cleanupExpiredMetrics;

  const readAggregatedMetricByEntityRefs = aggregatedMetric
    ? jest.fn().mockResolvedValue(aggregatedMetric)
    : mockDatabaseMetricValues.readAggregatedMetricByEntityRefs;

  return {
    createMetricValues,
    readLatestEntityMetricValues,
    cleanupExpiredMetrics,
    readAggregatedMetricByEntityRefs,
  } as unknown as jest.Mocked<DatabaseMetricValues>;
};
