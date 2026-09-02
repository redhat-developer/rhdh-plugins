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
  scalarAggregationTypes,
  type AggregationResultByType,
  type ScalarAggregationResult,
  type StatusGroupedAggregationResult,
  type WeightedStatusScoreAggregationResult,
} from '@red-hat-developer-hub/backstage-plugin-scorecard-common';

export function isScalarAggregationType(
  type: string,
): type is (typeof scalarAggregationTypes)[number] {
  return (scalarAggregationTypes as readonly string[]).includes(type);
}

/**
 * Scalar result shape: a single numeric `value` and no status `values` array.
 * Used for rendering regardless of aggregation type name.
 */
export function isScalarAggregationResult(
  result: AggregationResultByType | Record<string, unknown>,
): result is ScalarAggregationResult {
  return (
    typeof (result as ScalarAggregationResult).value === 'number' &&
    !('values' in result)
  );
}

/**
 * Weighted distribution shape: status `values` plus a numeric weighted score.
 */
export function isWeightedStatusScoreResult(
  result: AggregationResultByType | Record<string, unknown>,
): result is WeightedStatusScoreAggregationResult {
  return (
    isDistributionAggregationResult(result) &&
    typeof (result as WeightedStatusScoreAggregationResult)
      .weightedStatusScore === 'number'
  );
}

/**
 * Distribution result shape: a `values` array of named counts (pie/donut).
 */
export function isDistributionAggregationResult(
  result: AggregationResultByType | Record<string, unknown>,
): result is StatusGroupedAggregationResult {
  return Array.isArray((result as StatusGroupedAggregationResult).values);
}
