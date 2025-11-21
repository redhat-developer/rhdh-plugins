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
} from '@red-hat-developer-hub/backstage-plugin-scorecard-common';
import { ThresholdConfigFormatError } from '../../errors';
import { parseThresholdExpression } from './parseThresholdExpression';

/**
 * Validate thresholds configuration
 * @public
 */
export function validateThresholds(
  thresholds: JsonValue,
  expectedMetricType: MetricType,
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

  const seenKeys = new Set<string>();
  for (const rule of thresholds.rules) {
    if (
      typeof rule !== 'object' ||
      rule === null ||
      !('key' in rule) ||
      !('expression' in rule) ||
      typeof rule.key !== 'string' ||
      typeof rule.expression !== 'string'
    ) {
      throw new ThresholdConfigFormatError(
        `Invalid threshold rule format "${JSON.stringify(
          rule,
        )}": must be an object with "key" and "expression" string properties`,
      );
    }
    if (!['error', 'warning', 'success'].includes(rule.key)) {
      throw new ThresholdConfigFormatError(
        `Invalid threshold rule key "${rule.key}": only supported values are "success", "warning", "error"`,
      );
    }
    if (seenKeys.has(rule.key)) {
      throw new ThresholdConfigFormatError(
        `Duplicate key detected for "${rule.key}" with expression "${rule.expression}"`,
      );
    }
    seenKeys.add(rule.key);
    parseThresholdExpression(rule.expression, expectedMetricType);
  }
}
