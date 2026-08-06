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
  ScalarAggregationResult,
  StatusGroupedAggregationResult,
  WeightedStatusScoreAggregationResult,
} from '@red-hat-developer-hub/backstage-plugin-scorecard-common';

export const mockStatusGroupedAggregationResult: StatusGroupedAggregationResult =
  {
    values: [
      { count: 3, name: 'error' },
      { count: 4, name: 'warning' },
      { count: 5, name: 'success' },
    ],
    thresholds: {
      rules: [
        { key: 'error', expression: '>40' },
        { key: 'warning', expression: '>20' },
        { key: 'success', expression: '<=20' },
      ],
    },
    total: 12,
    timestamp: '2025-01-01T10:30:00.000Z',
    entitiesConsidered: 2,
    calculationErrorCount: 0,
  };

export const mockScalarAggregationResult: ScalarAggregationResult = {
  value: 12,
  thresholds: {
    rules: [
      { key: 'error', expression: '>40' },
      { key: 'warning', expression: '>20' },
      { key: 'success', expression: '<=20' },
    ],
  },
  total: 12,
  timestamp: '2025-01-01T10:30:00.000Z',
  entitiesConsidered: 2,
  calculationErrorCount: 0,
};

export const mockWeightedStatusScoreAggregationResult: WeightedStatusScoreAggregationResult =
  {
    thresholds: {
      rules: [
        { key: 'error', expression: '>40' },
        { key: 'warning', expression: '>20' },
        { key: 'success', expression: '<=20' },
      ],
    },
    total: 12,
    timestamp: '2025-01-01T10:30:00.000Z',
    entitiesConsidered: 2,
    calculationErrorCount: 0,
    values: [
      { count: 3, name: 'error', score: 0 },
      { count: 4, name: 'warning', score: 50 },
      { count: 5, name: 'success', score: 100 },
    ],
    weightedStatusScore: 100,
    weightedStatusSum: 200,
    weightedStatusMaxPossible: 200,
    aggregationChartDisplayColor: 'success.main',
  };
