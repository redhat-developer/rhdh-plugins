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
  ThresholdConfig,
  MetricType,
  MetricValue,
} from '@red-hat-developer-hub/backstage-plugin-scorecard-common';
import { ThresholdConfigFormatError } from '../errors';

/**
 * Parse a threshold expression and extract operator and value
 * @public
 */
export function parseThresholdExpression(
  expression: string,
  targetType: MetricValue,
): {
  operator: string;
  value: MetricValue;
} {
  const match = expression.trim().match(/^(>=|<=|>|<|==|!=)(.+)$/);
  if (!match) {
    throw new ThresholdConfigFormatError(
      `Invalid threshold expression: "${expression}"`,
    );
  }

  const operator = match[1];
  const valueStr = match[2].trim();

  if (targetType === 'number') {
    const value = Number(valueStr);
    if (isNaN(value)) {
      throw new ThresholdConfigFormatError(
        `Cannot parse "${valueStr}" as number from expression: "${expression}"`,
      );
    }
    return { operator, value };
  }

  if (targetType === 'boolean') {
    if (valueStr === 'true') {
      return { operator, value: true };
    }
    if (valueStr === 'false') {
      return { operator, value: false };
    }
    throw new ThresholdConfigFormatError(
      `Cannot parse "${valueStr}" as boolean from expression: "${expression}". Use "true" or "false"`,
    );
  }

  return { operator, value: valueStr };
}

/**
 * Validate that threshold expressions match the expected metric type
 * @public
 */
export function validateThresholds(
  thresholds: ThresholdConfig | undefined,
  expectedMetricType: MetricType,
): void {
  if (!thresholds) {
    return;
  }

  for (const [name, expression] of Object.entries(thresholds.rules)) {
    if (typeof name !== 'string') {
      throw new ThresholdConfigFormatError(
        `Invalid type for threshold name: ${typeof name}, should be string`,
      );
    }
    parseThresholdExpression(expression, expectedMetricType);
  }
}
