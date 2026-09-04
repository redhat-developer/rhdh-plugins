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

import type { ThresholdConfig } from '@red-hat-developer-hub/backstage-plugin-scorecard-common';
import { ThresholdEvaluator } from '../../threshold/ThresholdEvaluator';

/**
 * Get the aggregation chart display color for a given value and thresholds.
 * @param value - The value to get the color for.
 * @param thresholds - The thresholds to use.
 * @returns The aggregation chart display color.
 */
export function getAggregationChartDisplayColor(
  value: number,
  thresholds: ThresholdConfig,
): string | undefined {
  const thresholdEvaluator = new ThresholdEvaluator();

  const matchedThresholdKey = thresholdEvaluator.getFirstMatchingThreshold(
    value,
    'number',
    thresholds,
  );

  return thresholds.rules.find(r => r.key === matchedThresholdKey)?.color;
}

export function getRequiredAggregationChartDisplayColor(
  value: number,
  thresholds: ThresholdConfig,
  errorMessage: string,
): string {
  const color = getAggregationChartDisplayColor(value, thresholds);

  if (!color) {
    throw new Error(errorMessage);
  }

  return color;
}
