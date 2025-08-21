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

import { parseThresholdExpression, validateThresholds } from './thresholdUtils';
import { ThresholdConfigFormatError } from '../errors';

describe('thresholdUtils', () => {
  describe('parseThresholdExpression - number metrics', () => {
    it.each([
      {
        operator: '>=',
        expression: '>=20',
        expectedResult: { operator: '>=', value: 20 },
      },
      {
        operator: '<=',
        expression: '<=20',
        expectedResult: { operator: '<=', value: 20 },
      },
      {
        operator: '>',
        expression: '>20',
        expectedResult: { operator: '>', value: 20 },
      },
      {
        operator: '<',
        expression: '<20',
        expectedResult: { operator: '<', value: 20 },
      },
      {
        operator: '==',
        expression: '==20',
        expectedResult: { operator: '==', value: 20 },
      },
      {
        operator: '!=',
        expression: '!=20',
        expectedResult: { operator: '!=', value: 20 },
      },
      {
        operator: '-',
        expression: '10-20',
        expectedResult: { operator: '-', values: [10, 20] },
      },
      {
        operator: '-',
        expression: '0-100',
        expectedResult: { operator: '-', values: [0, 100] },
      },
    ])(
      'should parse $operator operator correctly for expression $expression',
      ({ expression, expectedResult }) => {
        const result = parseThresholdExpression(expression, 'number');
        expect(result).toEqual(expectedResult);
      },
    );

    it('should handle whitespace in expressions', () => {
      const result = parseThresholdExpression('  >=  20  ', 'number');
      expect(result).toEqual({ operator: '>=', value: 20 });
    });
  });

  describe('parseThresholdExpression - boolean metrics', () => {
    it.each([
      {
        expression: '==true',
        expectedResult: { operator: '==', value: true },
      },
      {
        expression: '==false',
        expectedResult: { operator: '==', value: false },
      },
      {
        expression: '!=true',
        expectedResult: { operator: '!=', value: true },
      },
      {
        expression: '!=false',
        expectedResult: { operator: '!=', value: false },
      },
    ])(
      'should parse boolean expression $expression correctly',
      ({ expression, expectedResult }) => {
        const result = parseThresholdExpression(expression, 'boolean');
        expect(result).toEqual(expectedResult);
      },
    );

    it('should handle whitespace in boolean expressions', () => {
      const result = parseThresholdExpression('  ==  true  ', 'boolean');
      expect(result).toEqual({ operator: '==', value: true });
    });
  });

  describe('parseThresholdExpression - error handling', () => {
    it.each([
      {
        expression: 'invalid',
        metricType: 'number' as const,
        expectedError: 'Invalid threshold expression: "invalid".',
      },
      {
        expression: '>>20',
        metricType: 'number' as const,
        expectedError: 'Cannot parse ">20" as number from expression: ">>20"',
      },
      {
        expression: '=20',
        metricType: 'number' as const,
        expectedError: 'Invalid threshold expression: "=20".',
      },
      {
        expression: '>',
        metricType: 'number' as const,
        expectedError: 'Invalid threshold expression: ">".',
      },
      {
        expression: '',
        metricType: 'number' as const,
        expectedError: 'Invalid threshold expression: "".',
      },
      {
        expression: '>=abc',
        metricType: 'number' as const,
        expectedError: 'Cannot parse "abc" as number from expression: ">=abc"',
      },
      {
        expression: '==NaN',
        metricType: 'number' as const,
        expectedError: 'Cannot parse "NaN" as number from expression: "==NaN"',
      },
    ])(
      'should throw error for invalid number values: $expression',
      ({ expression, metricType, expectedError }) => {
        expect(() => parseThresholdExpression(expression, metricType)).toThrow(
          new ThresholdConfigFormatError(expectedError),
        );
      },
    );

    it.each([
      {
        expression: 'abc-def',
        expectedError: 'Invalid threshold expression: "abc-def".',
      },
      {
        expression: '10-abc',
        expectedError: 'Invalid threshold expression: "10-abc".',
      },
      {
        expression: 'abc-5',
        expectedError: 'Invalid threshold expression: "abc-5".',
      },
      {
        expression: '20-10',
        expectedError:
          'Invalid range: minimum value (20) must be less than maximum value (10)',
      },
      {
        expression: '5-5',
        expectedError:
          'Invalid range: minimum value (5) must be less than maximum value (5)',
      },
      {
        expression: '10.5-10.4',
        expectedError:
          'Invalid range: minimum value (10.5) must be less than maximum value (10.4)',
      },
    ])(
      'should throw error for invalid range number values: $expression',
      ({ expression, expectedError }) => {
        expect(() => parseThresholdExpression(expression, 'number')).toThrow(
          new ThresholdConfigFormatError(expectedError),
        );
      },
    );

    it.each([
      {
        expression: '==yes',
        expectedError:
          'Cannot parse "yes" as boolean from expression: "==yes". Use "true" or "false"',
      },
      {
        expression: '!=1',
        expectedError:
          'Cannot parse "1" as boolean from expression: "!=1". Use "true" or "false"',
      },
      {
        expression: '==TRUE',
        expectedError:
          'Cannot parse "TRUE" as boolean from expression: "==TRUE". Use "true" or "false"',
      },
    ])(
      'should throw error for invalid boolean values: $expression',
      ({ expression, expectedError }) => {
        expect(() => parseThresholdExpression(expression, 'boolean')).toThrow(
          new ThresholdConfigFormatError(expectedError),
        );
      },
    );
  });

  describe('validateThresholds - valid configs', () => {
    it('should validate valid threshold config with number metric', () => {
      const validConfig = {
        rules: [
          { key: 'error', expression: '>40' },
          { key: 'warning', expression: '>20' },
          { key: 'success', expression: '<=20' },
        ],
      };

      expect(() => validateThresholds(validConfig, 'number')).not.toThrow();
    });

    it('should validate valid threshold config with boolean metric', () => {
      const validConfig = {
        rules: [
          { key: 'success', expression: '==true' },
          { key: 'error', expression: '==false' },
        ],
      };

      expect(() => validateThresholds(validConfig, 'boolean')).not.toThrow();
    });

    it('should validate config with range expressions', () => {
      const validConfig = {
        rules: [
          { key: 'error', expression: '80-100' },
          { key: 'warning', expression: '50-79' },
          { key: 'success', expression: '0-49' },
        ],
      };

      expect(() => validateThresholds(validConfig, 'number')).not.toThrow();
    });

    it('should validate config with empty rules array', () => {
      const validConfig = { rules: [] };

      expect(() => validateThresholds(validConfig, 'number')).not.toThrow();
    });
  });

  describe('validateThresholds - invalid configs', () => {
    it.each([
      {
        config: null,
        expectedError:
          'Invalid type for ThresholdConfig, must have a rules property that is an array',
      },
      {
        config: 'string',
        expectedError:
          'Invalid type for ThresholdConfig, must have a rules property that is an array',
      },
      {
        config: {},
        expectedError:
          'Invalid type for ThresholdConfig, must have a rules property that is an array',
      },
      {
        config: { rules: 'not-array' },
        expectedError:
          'Invalid type for ThresholdConfig, must have a rules property that is an array',
      },
      {
        config: { rules: null },
        expectedError:
          'Invalid type for ThresholdConfig, must have a rules property that is an array',
      },
      {
        config: { rules: [null] },
        expectedError:
          'Invalid threshold rule format "null": must be an object with "key" and "expression" string properties',
      },
      {
        config: { rules: [5] },
        expectedError:
          'Invalid threshold rule format "5": must be an object with "key" and "expression" string properties',
      },
      {
        config: { rules: [{ key: 'success' }] } as any,
        expectedError:
          'Invalid threshold rule format "{"key":"success"}": must be an object with "key" and "expression" string properties',
      },
      {
        config: { rules: [{ expression: '>20' }] } as any,
        expectedError:
          'Invalid threshold rule format "{"expression":">20"}": must be an object with "key" and "expression" string properties',
      },
      {
        config: { rules: [{ key: 123, expression: '>20' }] } as any,
        expectedError:
          'Invalid threshold rule format "{"key":123,"expression":">20"}": must be an object with "key" and "expression" string properties',
      },
      {
        config: { rules: [{ key: 'success', expression: 123 }] } as any,
        expectedError:
          'Invalid threshold rule format "{"key":"success","expression":123}": must be an object with "key" and "expression" string properties',
      },
      {
        config: { rules: [{ key: 'invalid', expression: '>20' }] },
        expectedError:
          'Invalid threshold rule key "invalid": only supported values are "error", "warning", "success"',
      },
      {
        config: { rules: [{ key: 'ERROR', expression: '>20' }] },
        expectedError:
          'Invalid threshold rule key "ERROR": only supported values are "error", "warning", "success"',
      },
      {
        config: { rules: [{ key: '', expression: '>20' }] },
        expectedError:
          'Invalid threshold rule key "": only supported values are "error", "warning", "success"',
      },
      {
        config: { rules: [{ key: 'critical', expression: '>20' }] },
        expectedError:
          'Invalid threshold rule key "critical": only supported values are "error", "warning", "success"',
      },
      {
        config: { rules: [{ key: 'success', expression: 'invalid' }] },
        metricType: 'number' as const,
        expectedError: 'Invalid threshold expression: "invalid".',
      },
    ])(
      'should throw error for invalid config format: $config',
      ({ config, expectedError }) => {
        expect(() => validateThresholds(config, 'number')).toThrow(
          new ThresholdConfigFormatError(expectedError),
        );
      },
    );

    it('should throw error for duplicate key', () => {
      const config = {
        rules: [
          { key: 'error', expression: '>40' },
          { key: 'warning', expression: '>20' },
          { key: 'error', expression: '>50' },
        ],
      };

      expect(() => validateThresholds(config, 'number')).toThrow(
        new ThresholdConfigFormatError(
          'Duplicate key detected for "error" with expression ">50"',
        ),
      );
    });

    it('should fail for mixed valid and invalid rules', () => {
      const config = {
        rules: [
          { key: 'success', expression: '>20' },
          { key: 'invalid', expression: '>10' },
        ],
      };

      expect(() => validateThresholds(config, 'number')).toThrow(
        new ThresholdConfigFormatError(
          'Invalid threshold rule key "invalid": only supported values are "error", "warning", "success"',
        ),
      );
    });
  });
});
