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
} from '@red-hat-developer-hub/backstage-plugin-scorecard-common';
import { ThresholdConfigFormatError } from '../errors';
import type { JsonValue } from '@backstage/types';
import { ComparisonOperator, RangeOperator } from './types';
import type { Config } from '@backstage/config';

function parseRangeOperator(
  expression: string,
  targetType: MetricType,
): RangeOperator | undefined {
  const rangeMatch = /^(\d+(?:\.\d+)?)-(\d+(?:\.\d+)?)$/.exec(expression);
  if (!rangeMatch) {
    return undefined;
  }

  if (targetType !== 'number') {
    throw new ThresholdConfigFormatError(
      `Range expressions are only supported for number metrics, got: "${targetType}" metric for expression "${expression}"`,
    );
  }
  const minValue = Number(rangeMatch[1]);
  const maxValue = Number(rangeMatch[2]);

  if (isNaN(minValue) || isNaN(maxValue)) {
    throw new ThresholdConfigFormatError(
      `Cannot parse range values ${minValue} and ${maxValue} from expression: "${expression}"`,
    );
  }

  if (minValue >= maxValue) {
    throw new ThresholdConfigFormatError(
      `Invalid range: minimum value (${minValue}) must be less than maximum value (${maxValue})`,
    );
  }

  return { operator: '-', values: [minValue, maxValue] };
}

function parseComparisonOperator(
  expression: string,
  targetType: MetricType,
): ComparisonOperator | undefined {
  const match = /^(>=|<=|>|<|==|!=)(.+)$/.exec(expression);
  if (!match) {
    return undefined;
  }

  const operator = match[1] as '>=' | '<=' | '>' | '<' | '==' | '!=';
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

  return undefined;
}

/**
 * Parse a threshold expression and extract operator and value/values
 * @public
 */
export function parseThresholdExpression(
  expression: string,
  targetType: MetricType,
): ComparisonOperator | RangeOperator {
  const trimmedExpression = expression.trim();

  const rangeParsed = parseRangeOperator(trimmedExpression, targetType);
  if (rangeParsed !== undefined) {
    return rangeParsed;
  }
  const operatorParsed = parseComparisonOperator(trimmedExpression, targetType);
  if (operatorParsed !== undefined) {
    return operatorParsed;
  }

  // unable to parse threshold expression
  throw new ThresholdConfigFormatError(
    `Invalid threshold expression: "${expression}".`,
  );
}

/**
 * Validate thresholds conform to the expected schema and expressions match the expected metric type
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

/**
 * Read and validate threshold configuration from config or return undefined
 * @public
 */
export function getThresholdsFromConfig(
  config: Config,
  thresholdsPath: string,
  expectedMetricType: MetricType,
): ThresholdConfig | undefined {
  try {
    const thresholdsConfig = config.getOptional(thresholdsPath);
    if (thresholdsConfig) {
      validateThresholds(thresholdsConfig, expectedMetricType);
      return thresholdsConfig;
    }
  } catch (error) {
    throw new Error(
      `Invalid thresholds configuration at ${thresholdsPath}: ${error}`,
    );
  }
  return undefined;
}
