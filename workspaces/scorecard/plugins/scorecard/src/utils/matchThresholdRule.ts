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

/**
 * Returns true when a numeric value matches a threshold expression.
 * Mirrors backend number-metric evaluation (`>=`, `<=`, `>`, `<`, `==`, `!=`, `min-max`).
 * Invalid expressions return false so the card can still render.
 */
export function matchesThresholdExpression(
  value: number,
  expression: string,
): boolean {
  if (!Number.isFinite(value)) {
    return false;
  }

  const trimmed = expression.trim();
  const rangeMatch = /^(\d+(?:\.\d+)?)-(\d+(?:\.\d+)?)$/.exec(trimmed);
  if (rangeMatch) {
    const min = Number(rangeMatch[1]);
    const max = Number(rangeMatch[2]);
    return value >= min && value <= max;
  }

  const comparisonMatch = /^(>=|<=|>|<|==|!=)(.+)$/.exec(trimmed);
  if (!comparisonMatch) {
    return false;
  }

  const operator = comparisonMatch[1];
  const rhs = Number(comparisonMatch[2].trim());
  if (Number.isNaN(rhs)) {
    return false;
  }

  switch (operator) {
    case '>=':
      return value >= rhs;
    case '<=':
      return value <= rhs;
    case '>':
      return value > rhs;
    case '<':
      return value < rhs;
    case '==':
      return value === rhs;
    case '!=':
      return value !== rhs;
    default:
      return false;
  }
}

/**
 * Returns the first matching threshold rule key, or undefined when none match.
 */
export function getMatchingThresholdKey(
  value: number,
  thresholds?: ThresholdConfig,
): string | undefined {
  if (!Number.isFinite(value) || !thresholds?.rules?.length) {
    return undefined;
  }

  for (const rule of thresholds.rules) {
    if (matchesThresholdExpression(value, rule.expression)) {
      return rule.key;
    }
  }

  return undefined;
}
