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

import {
  isDistributionAggregationResult,
  isScalarAggregationResult,
  isScalarAggregationType,
  isWeightedStatusScoreResult,
} from '../isScalarAggregation';

const scalarResult = {
  value: 12,
  total: 4,
  timestamp: '2024-01-01T00:00:00Z',
  entitiesConsidered: 4,
  calculationErrorCount: 0,
  thresholds: DEFAULT_NUMBER_THRESHOLDS,
};

const statusGroupedResult = {
  values: [{ name: 'success', count: 4 }],
  total: 4,
  timestamp: '2024-01-01T00:00:00Z',
  entitiesConsidered: 4,
  calculationErrorCount: 0,
  thresholds: DEFAULT_NUMBER_THRESHOLDS,
};

const weightedResult = {
  ...statusGroupedResult,
  weightedStatusScore: 75,
  weightedStatusSum: 18,
  weightedStatusMaxPossible: 24,
  aggregationChartDisplayColor: 'warning.main',
};

const unrecognizedResult = {
  total: 4,
  timestamp: '2024-01-01T00:00:00Z',
  entitiesConsidered: 4,
  calculationErrorCount: 0,
  thresholds: DEFAULT_NUMBER_THRESHOLDS,
};

describe('isScalarAggregationType', () => {
  it.each([
    aggregationTypes.sum,
    aggregationTypes.average,
    aggregationTypes.min,
    aggregationTypes.max,
    aggregationTypes.count,
  ])('returns true for %s', type => {
    expect(isScalarAggregationType(type)).toBe(true);
  });

  it.each([
    aggregationTypes.statusGrouped,
    aggregationTypes.weightedStatusScore,
    'futureStrategy',
  ])('returns false for %s', type => {
    expect(isScalarAggregationType(type)).toBe(false);
  });
});

describe('isScalarAggregationResult', () => {
  it('returns true when result has a numeric value and no values array', () => {
    expect(isScalarAggregationResult(scalarResult)).toBe(true);
  });

  it('returns false for status-grouped results', () => {
    expect(isScalarAggregationResult(statusGroupedResult)).toBe(false);
  });

  it('returns false for unrecognized shapes', () => {
    expect(isScalarAggregationResult(unrecognizedResult)).toBe(false);
  });
});

describe('isDistributionAggregationResult', () => {
  it('returns true for status-grouped values arrays', () => {
    expect(isDistributionAggregationResult(statusGroupedResult)).toBe(true);
  });

  it('returns true for weighted results that include a values array', () => {
    expect(isDistributionAggregationResult(weightedResult)).toBe(true);
  });

  it('returns false for scalar results', () => {
    expect(isDistributionAggregationResult(scalarResult)).toBe(false);
  });
});

describe('isWeightedStatusScoreResult', () => {
  it('returns true when values and weightedStatusScore are present', () => {
    expect(isWeightedStatusScoreResult(weightedResult)).toBe(true);
  });

  it('returns false for status-grouped results without a weighted score', () => {
    expect(isWeightedStatusScoreResult(statusGroupedResult)).toBe(false);
  });

  it('returns false for scalar results', () => {
    expect(isWeightedStatusScoreResult(scalarResult)).toBe(false);
  });
});
