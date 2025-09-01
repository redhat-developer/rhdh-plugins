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
  MetricValue,
  ThresholdConfig,
} from '@red-hat-developer-hub/backstage-plugin-scorecard-common';
import {
  parseThresholdExpression,
  ThresholdConfigFormatError,
} from '@red-hat-developer-hub/backstage-plugin-scorecard-node';

/**
 * Service for evaluating metric values against threshold expressions
 */
export class ThresholdEvaluator {
  private readonly operations = {
    '>=': (a: MetricValue, b: MetricValue) => a >= b,
    '>': (a: MetricValue, b: MetricValue) => a > b,
    '<=': (a: MetricValue, b: MetricValue) => a <= b,
    '<': (a: MetricValue, b: MetricValue) => a < b,
    '==': (a: MetricValue, b: MetricValue) => a === b,
    '!=': (a: MetricValue, b: MetricValue) => a !== b,
    '-': (a: number, [min, max]: [number, number]) => {
      return a >= min && a <= max;
    },
  } as const;

  /**
   * Evaluate a metric value against a threshold expression
   * @param metricValue - The value to evaluate
   * @param metricType - The type of metric
   * @param expression - The threshold expression (e.g., ">40", "==true")
   * @returns true if the metric value matches the threshold expression
   */
  private evaluateThreshold(
    metricValue: MetricValue,
    metricType: MetricType,
    expression: string,
  ): boolean {
    const result = parseThresholdExpression(expression, metricType);

    if (result.operator === '-') {
      if (typeof metricValue !== 'number') {
        throw new ThresholdConfigFormatError(
          `Range expressions are only supported for number metrics, got: "${metricValue}" value for expression "${expression}"`,
        );
      }
      return this.operations['-'](metricValue, result.values);
    }

    const operatorFn = this.operations[result.operator];
    return operatorFn(metricValue, result.value);
  }

  /**
   * Evaluate thresholds for a metric value and return first matching
   * @param metricValue - The value to evaluate
   * @param thresholds - The threshold configuration
   * @returns threshold key that first matches the threshold expression for metricValue or undefined
   */
  getFirstMatchingThreshold(
    metricValue: MetricValue,
    metricType: MetricType,
    thresholds: ThresholdConfig,
  ): string | undefined {
    for (const rule of thresholds.rules) {
      if (this.evaluateThreshold(metricValue, metricType, rule.expression)) {
        return rule.key;
      }
    }

    return undefined;
  }
}
