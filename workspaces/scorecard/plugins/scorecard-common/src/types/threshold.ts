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

/**
 * Threshold rule definition
 * @public
 */
export type ThresholdRule = {
  /**
   * Threshold category key that a metric value is assigned to when this rule
   * matches (for example `success`, `warning`, `error`, or a custom key).
   */
  key: string;
  /**
   * Threshold expression that determines whether a metric value matches this
   * rule. Supports:`>=`, `<=`, `>`, `<`, `==`, `!=`, `-` (range).
   *
   * @example `<= 10` - Metric value must be less than or equal to 10.
   * @example `10-60` - Metric value must be between 10 and 60 (inclusive).
   */
  expression: string;
  /**
   * Color configuration - supports multiple formats:
   * - theme palette reference (`success.main` / `warning.main` / `error.main`)
   * - HEX code (e.g. '#FFA500')
   * - RGB/RGBA (e.g. 'rgb(255, 0, 0)')
   *
   * Threshold rules 'success', 'warning' and 'error' have default colors.
   */
  color?: string;
  /**
   * Icon configuration - supports multiple formats:
   * - Backstage system icons: 'kind:component', 'kind:api', etc.
   * - Material Design icons: 'settings', 'home', 'build', etc.
   * - SVG strings: '<svg xmlns="http://www.w3.org/2000/svg">...</svg>'
   * - URLs: 'https://example.com/icon.png', '/assets/icon.svg'
   * - Data URIs: 'data:image/svg+xml;base64,...'
   *
   * Threshold rules 'success', 'warning' and 'error' have default icons.
   */
  icon?: string;
};

/**
 * Threshold configuration
 * @public
 */
export type ThresholdConfig = {
  /**
   * Rules describe how metric values are categorized and how that category is presented in the UI.
   * They are evaluated in order and the first matching rule is applied.
   */
  rules: ThresholdRule[];
};

/**
 * @public
 */
export type ThresholdResult = {
  status: 'success' | 'error';
  definition: ThresholdConfig | undefined;
  evaluation: string | null; // threshold key the expression evaluated to
  error?: string;
};

/**
 * Default threshold configuration for number metrics where high count indicates problems
 * @public
 */
export const DEFAULT_NUMBER_THRESHOLDS: ThresholdConfig = {
  rules: [
    { key: 'success', expression: '<10' },
    { key: 'warning', expression: '10-50' },
    { key: 'error', expression: '>50' },
  ],
};

/**
 * Predefined scorecard threshold rule color constants.
 * Use in threshold rule color configurations instead of hex/RGB values.
 * Map to theme.palette colors.
 *
 * @public
 */
export const ScorecardThresholdRuleColors = {
  SUCCESS: 'success.main',
  WARNING: 'warning.main',
  ERROR: 'error.main',
} as const;

/**
 * All valid scorecard threshold color values (for validation in threshold configs)
 * @public
 */
export const SCORECARD_THRESHOLD_RULE_COLOR_VALUES = Object.values(
  ScorecardThresholdRuleColors,
);
