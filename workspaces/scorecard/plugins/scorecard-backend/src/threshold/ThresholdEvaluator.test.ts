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

import { ThresholdEvaluator } from './ThresholdEvaluator';
import { ThresholdConfig } from '@red-hat-developer-hub/backstage-plugin-scorecard-common';
import { ThresholdConfigFormatError } from '@red-hat-developer-hub/backstage-plugin-scorecard-node';

describe('ThresholdEvaluator', () => {
  let evaluator: ThresholdEvaluator;

  beforeEach(() => {
    evaluator = new ThresholdEvaluator();
  });

  describe('getFirstMatchingThreshold', () => {
    it('should return undefined for empty threshold rules', () => {
      const thresholds: ThresholdConfig = {
        rules: [],
      };

      const result = evaluator.getFirstMatchingThreshold(
        50,
        'number',
        thresholds,
      );
      expect(result).toBeUndefined();
    });

    it('should propagate parsing errors from invalid expressions', () => {
      const thresholds: ThresholdConfig = {
        rules: [{ key: 'error', expression: 'invalid-expression' }],
      };

      expect(() =>
        evaluator.getFirstMatchingThreshold(50, 'number', thresholds),
      ).toThrow(ThresholdConfigFormatError);
    });
  });

  describe('getFirstMatchingThreshold - number metrics with comparison operators', () => {
    it.each([
      {
        value: 41,
        expectedEvaluation: 'error',
      },
      {
        value: 30,
        expectedEvaluation: 'warning',
      },
      {
        value: 20,
        expectedEvaluation: 'success',
      },
    ])(
      'should return $expectedEvaluation as first matching threshold for $value',
      ({ value, expectedEvaluation }) => {
        const numberThresholds: ThresholdConfig = {
          rules: [
            { key: 'error', expression: '>40' },
            { key: 'warning', expression: '>20' },
            { key: 'success', expression: '<=20' },
          ],
        };
        const result = evaluator.getFirstMatchingThreshold(
          value,
          'number',
          numberThresholds,
        );
        expect(result).toBe(expectedEvaluation);
      },
    );

    it.each([
      {
        operator: '>=',
        expression: '>=20',
        matchingValues: [20, 21, 100],
        nonMatchingValues: [19, 0],
      },
      {
        operator: '<=',
        expression: '<=20',
        matchingValues: [20, 19, 0],
        nonMatchingValues: [21, 100],
      },
      {
        operator: '<',
        expression: '<20',
        matchingValues: [19, 0],
        nonMatchingValues: [20, 21],
      },
      {
        operator: '>',
        expression: '>20',
        matchingValues: [21, 100],
        nonMatchingValues: [20, 19, 0],
      },
      {
        operator: '==',
        expression: '==20',
        matchingValues: [20],
        nonMatchingValues: [19, 21, 0],
      },
      {
        operator: '!=',
        expression: '!=20',
        matchingValues: [19, 21, 0, 100],
        nonMatchingValues: [20],
      },
    ])(
      'should handle $operator operator',
      ({ expression, matchingValues, nonMatchingValues }) => {
        const thresholds: ThresholdConfig = {
          rules: [{ key: 'success', expression }],
        };

        matchingValues.forEach(value => {
          expect(
            evaluator.getFirstMatchingThreshold(value, 'number', thresholds),
          ).toBe('success');
        });

        nonMatchingValues.forEach(value => {
          expect(
            evaluator.getFirstMatchingThreshold(value, 'number', thresholds),
          ).toBeUndefined();
        });
      },
    );

    it('should return undefined when no thresholds match', () => {
      const thresholds: ThresholdConfig = {
        rules: [
          { key: 'success', expression: '>100' },
          { key: 'error', expression: '<10' },
        ],
      };

      const result = evaluator.getFirstMatchingThreshold(
        50,
        'number',
        thresholds,
      );
      expect(result).toBeUndefined();
    });
  });

  describe('getFirstMatchingThreshold - number metrics with range operator', () => {
    const rangeThresholds: ThresholdConfig = {
      rules: [
        { key: 'error', expression: '60-100' },
        { key: 'warning', expression: '30-59' },
        { key: 'success', expression: '0-29' },
      ],
    };

    it.each([
      { expectedEvaluation: 'error', matchingValues: [60, 100, 70] },
      { expectedEvaluation: 'warning', matchingValues: [30, 59, 45] },
      { expectedEvaluation: 'success', matchingValues: [0, 29, 15] },
    ])(
      'should return $expectedEvaluation as first matching threshold for values in range',
      ({ expectedEvaluation, matchingValues: values }) => {
        values.forEach(value => {
          expect(
            evaluator.getFirstMatchingThreshold(
              value,
              'number',
              rangeThresholds,
            ),
          ).toBe(expectedEvaluation);
        });
      },
    );

    it('should return undefined for values outside all ranges', () => {
      const noGapThresholds: ThresholdConfig = {
        rules: [
          { key: 'error', expression: '50-100' },
          { key: 'success', expression: '0-30' },
        ],
      };

      expect(
        evaluator.getFirstMatchingThreshold(40, 'number', noGapThresholds),
      ).toBeUndefined();
    });

    it('should throw error for range operator with non-number metric', () => {
      const invalidRangeThresholds: ThresholdConfig = {
        rules: [{ key: 'error', expression: '10-20' }],
      };

      expect(() =>
        evaluator.getFirstMatchingThreshold(
          true,
          'boolean',
          invalidRangeThresholds,
        ),
      ).toThrow(
        new ThresholdConfigFormatError(
          `Range expressions are only supported for number metrics, got: "boolean" metric for expression "10-20"`,
        ),
      );
    });
  });

  describe('getFirstMatchingThreshold - boolean metrics', () => {
    const booleanThresholds: ThresholdConfig = {
      rules: [
        { key: 'success', expression: '==true' },
        { key: 'error', expression: '==false' },
      ],
    };

    it.each([
      { value: true, expectedEvaluation: 'success' },
      { value: false, expectedEvaluation: 'error' },
    ])(
      'should return $expectedEvaluation threshold for $value values',
      ({ value, expectedEvaluation }) => {
        const result = evaluator.getFirstMatchingThreshold(
          value,
          'boolean',
          booleanThresholds,
        );
        expect(result).toBe(expectedEvaluation);
      },
    );

    it.each([
      { expression: '!=true', matchingValue: false, nonMatchingValue: true },
      { expression: '!=false', matchingValue: true, nonMatchingValue: false },
    ])(
      'should handle $expression operator for boolean',
      ({ expression, matchingValue, nonMatchingValue }) => {
        const thresholds: ThresholdConfig = {
          rules: [{ key: 'success', expression }],
        };

        expect(
          evaluator.getFirstMatchingThreshold(
            matchingValue,
            'boolean',
            thresholds,
          ),
        ).toBe('success');
        expect(
          evaluator.getFirstMatchingThreshold(
            nonMatchingValue,
            'boolean',
            thresholds,
          ),
        ).toBeUndefined();
      },
    );
  });
});
