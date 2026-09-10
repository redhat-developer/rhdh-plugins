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

import { InputError } from '@backstage/errors';
import type { ThresholdConfig } from '@red-hat-developer-hub/backstage-plugin-scorecard-common';
import { ThresholdEvaluator } from '../../threshold/ThresholdEvaluator';
import { classifyNumberAgainstThresholds } from './classifyNumberAgainstThresholds';

/**
 * Get the required aggregation chart display color for a given value and thresholds.
 * @param value - The value to get the color for.
 * @param thresholds - The thresholds to use.
 * @param evaluator - Threshold evaluator instance.
 * @param errorMessage - The error message to throw if the color is not found.
 * @returns The required aggregation chart display color.
 */
export function getRequiredAggregationChartDisplayColor(
  value: number,
  thresholds: ThresholdConfig,
  evaluator: ThresholdEvaluator,
  errorMessage: string,
): string {
  const color = classifyNumberAgainstThresholds(
    value,
    thresholds,
    evaluator,
  )?.color;

  if (!color) {
    throw new InputError(errorMessage);
  }

  return color;
}
