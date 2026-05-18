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

import type { JsonValue } from '@backstage/types';
import type {
  MetricType,
  ThresholdConfig,
  ThresholdRule,
} from '@red-hat-developer-hub/backstage-plugin-scorecard-common';
import { SCORECARD_THRESHOLD_RULE_COLOR_VALUES } from '@red-hat-developer-hub/backstage-plugin-scorecard-common';
import { ThresholdConfigFormatError } from '../../errors';
import { parseThresholdExpression } from './parseThresholdExpression';
import { validateThresholdNumberIntervals } from './intervals/validateThresholdNumberIntervals';

const THRESHOLD_RULE_KEYS = ['success', 'warning', 'error'];

/**
 * Validates the thresholds for a metric
 * @public
 */
export function validateThresholdsForMetric(
  thresholds: JsonValue,
  expectedMetricType: MetricType,
): asserts thresholds is ThresholdConfig {
  validateConfigType(thresholds);

  const seenKeys = new Set<string>();
  for (const rule of thresholds.rules) {
    validateThresholdRule(rule);
    validateDuplicateKey(rule, seenKeys);
    validateColorAndIconExists(rule);
    validateRuleColor(rule);
    validateRuleIcon(rule);

    seenKeys.add(rule.key);

    parseThresholdExpression(rule.expression, expectedMetricType);
  }

  validateThresholdNumberIntervals(thresholds.rules, expectedMetricType);
}

/**
 * Validates the thresholds for aggregation
 * @public
 */
export function validateThresholdsForAggregation(
  thresholds: JsonValue,
  expectedMetricType: MetricType,
): asserts thresholds is ThresholdConfig {
  validateConfigType(thresholds);

  const seenKeys = new Set<string>();
  for (const rule of thresholds.rules) {
    validateThresholdRule(rule);
    validateDuplicateKey(rule, seenKeys);
    validateColorExists(rule);
    validateRuleColor(rule);

    seenKeys.add(rule.key);

    parseThresholdExpression(rule.expression, expectedMetricType);
  }

  validateThresholdNumberIntervals(thresholds.rules, expectedMetricType);
}

/**
 * Validates if a color string is valid
 * - Predefined constants: {@link ScorecardThresholdRuleColors}
 * - Hex colors: #RGB, #RRGGBB, #RRGGBBAA
 * - RGB/RGBA colors: rgb(r, g, b), rgba(r, g, b, a)
 */
function isValidColor(color: string): boolean {
  if (
    (SCORECARD_THRESHOLD_RULE_COLOR_VALUES as readonly string[]).includes(color)
  ) {
    return true;
  }

  // Check for hex color format: #RGB, #RRGGBB, #RRGGBBAA
  const hexColorRegex = /^#([0-9A-Fa-f]{3}|[0-9A-Fa-f]{6}|[0-9A-Fa-f]{8})$/;
  if (hexColorRegex.test(color)) {
    return true;
  }

  // Check for RGB color format: rgb(r, g, b)
  const rgbRegex = /^rgb\(\s*\d{1,3}\s*,\s*\d{1,3}\s*,\s*\d{1,3}\s*\)$/;
  if (rgbRegex.test(color)) {
    return true;
  }

  // Check for RGBA color format: rgba(r, g, b, a)
  const rgbaRegex =
    /^rgba\(\s*\d{1,3}\s*,\s*\d{1,3}\s*,\s*\d{1,3}\s*,\s*\d+(?:\.\d+)?\s*\)$/;
  return rgbaRegex.test(color);
}

/**
 * Validates the color format if present in a rule
 */
function validateRuleColor(rule: ThresholdRule): void {
  if (!('color' in rule)) {
    return;
  }

  if (typeof rule.color !== 'string' || rule.color.trim() === '') {
    throw new ThresholdConfigFormatError(
      `Invalid color format for rule "${rule.key}": color must be a non-empty string`,
    );
  }

  if (!isValidColor(rule.color)) {
    throw new ThresholdConfigFormatError(
      `Invalid color format for rule "${rule.key}": "${
        rule.color
      }" must be either a predefined constant (${SCORECARD_THRESHOLD_RULE_COLOR_VALUES.map(
        v => `'${v}'`,
      ).join(
        ', ',
      )}), a hex color (e.g., "#ADD8E6"), or an RGB/RGBA color (e.g., "rgb(255, 255, 0)")`,
    );
  }
}

/**
 * Validates the icon format if present in a rule.
 */
function validateRuleIcon(rule: ThresholdRule): void {
  if (!('icon' in rule)) {
    return;
  }

  if (typeof rule.icon !== 'string' || rule.icon.trim() === '') {
    throw new ThresholdConfigFormatError(
      `Invalid icon format for rule "${rule.key}": icon must be a non-empty string`,
    );
  }
}

/**
 * Validates the threshold rule format
 */
function validateThresholdRule(rule: unknown): asserts rule is ThresholdRule {
  if (
    typeof rule !== 'object' ||
    rule === null ||
    !('key' in rule) ||
    !('expression' in rule) ||
    typeof rule.key !== 'string' ||
    typeof rule.expression !== 'string' ||
    rule.key.trim() === '' ||
    rule.expression.trim() === ''
  ) {
    throw new ThresholdConfigFormatError(
      `Invalid threshold rule format "${JSON.stringify(
        rule,
      )}": must be an object with "key" and "expression" non-empty string properties`,
    );
  }
}

/**
 * Validates the config type
 */
function validateConfigType(
  thresholds: unknown,
): asserts thresholds is ThresholdConfig {
  if (
    typeof thresholds !== 'object' ||
    thresholds === null ||
    !('rules' in thresholds) ||
    !Array.isArray(thresholds.rules)
  ) {
    throw new ThresholdConfigFormatError(
      'Invalid type for ThresholdConfig, must have a rules property that is an array',
    );
  }
}

/**
 * Validates if a rule is a standard threshold rule
 */
function isStandardThresholdRule(rule: ThresholdRule): boolean {
  return THRESHOLD_RULE_KEYS.includes(rule.key);
}

/**
 * Validates the color and icon exists
 */
function validateColorAndIconExists(rule: ThresholdRule): void {
  if (
    !isStandardThresholdRule(rule) &&
    (!('color' in rule) || !('icon' in rule))
  ) {
    throw new ThresholdConfigFormatError(
      `Custom threshold key "${
        rule.key
      }" must specify a color and icon property. Only standard keys (${THRESHOLD_RULE_KEYS.map(
        k => `'${k}'`,
      ).join(', ')}) have default colors and icons.`,
    );
  }
}

function validateColorExists(rule: ThresholdRule): void {
  if (!isStandardThresholdRule(rule) && !('color' in rule)) {
    throw new ThresholdConfigFormatError(
      `Custom threshold key "${
        rule.key
      }" must specify a color property. Only standard keys (${THRESHOLD_RULE_KEYS.map(
        k => `'${k}'`,
      ).join(', ')}) have default colors.`,
    );
  }
}

/**
 * Validates the duplicate key
 */
function validateDuplicateKey(
  rule: ThresholdRule,
  seenKeys: Set<string>,
): void {
  if (seenKeys.has(rule.key)) {
    throw new ThresholdConfigFormatError(
      `Duplicate key detected for "${rule.key}" with expression "${rule.expression}"`,
    );
  }
}
