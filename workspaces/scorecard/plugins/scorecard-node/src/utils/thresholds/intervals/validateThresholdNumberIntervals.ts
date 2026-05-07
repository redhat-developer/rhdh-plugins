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
  MetricType,
  ThresholdRule,
} from '@red-hat-developer-hub/backstage-plugin-scorecard-common';
import { areAllRulesDiscreteNumberEquals } from './areAllRulesDiscreteNumberEquals';
import { NumberInterval } from './types';
import { parseThresholdExpression } from '../parseThresholdExpression';
import { normalizeRangeInterval } from './normalizeRangeInterval';
import { normalizeNumberInterval } from './normalizeNumberInterval';
import { ThresholdConfigFormatError } from '../../../errors';
import { mergeNumberIntervals } from './mergeNumberIntervals';
import { describeFirstGap } from './describeFirstGap';

/**
 * Ensures **number** threshold rules jointly cover the entire real line (union of intervals).
 *
 * @public
 */
export function validateThresholdNumberIntervals(
  rules: ThresholdRule[],
  expectedMetricType: MetricType,
): void {
  const isNumberMetric = expectedMetricType === 'number';

  if (
    !isNumberMetric ||
    rules.length <= 1 ||
    areAllRulesDiscreteNumberEquals(rules)
  ) {
    return;
  }

  const intervals: NumberInterval[] = [];
  for (const rule of rules) {
    const parsed = parseThresholdExpression(
      rule.expression,
      expectedMetricType,
    );

    if (parsed.operator === '-') {
      intervals.push(...normalizeRangeInterval(parsed.values));
    } else if (
      parsed.value !== undefined &&
      typeof parsed.value === expectedMetricType
    ) {
      intervals.push(
        ...normalizeNumberInterval(parsed.value as number, parsed.operator),
      );
    } else {
      throw new ThresholdConfigFormatError(
        `Invalid parsed threshold expression: ${JSON.stringify(parsed)}`,
      );
    }
  }

  const merged = mergeNumberIntervals(intervals);

  if (coversFullRealLine(merged)) {
    return;
  }

  const gap = describeFirstGap(merged);

  throw new ThresholdConfigFormatError(
    `Number threshold rules do not cover the entire real line. First uncovered region (approximately): ${gap}. Adjust expressions so every real value matches at least one rule (union across rules; order only affects which key wins when overlaps exist).`,
  );
}

function coversFullRealLine(merged: NumberInterval[]): boolean {
  return (
    merged.length === 1 &&
    merged[0]!.min === -Infinity &&
    merged[0]!.max === Infinity &&
    merged[0]!.minClosed &&
    merged[0]!.maxClosed
  );
}
