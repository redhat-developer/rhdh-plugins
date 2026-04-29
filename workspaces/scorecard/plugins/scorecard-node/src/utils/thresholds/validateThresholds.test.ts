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
  validateThresholdsForMetric,
  validateThresholdsForAggregation,
} from './validateThresholds';
import { ThresholdConfigFormatError } from '../../errors';
import {
  ScorecardThresholdRuleColors,
  type ThresholdConfig,
} from '@red-hat-developer-hub/backstage-plugin-scorecard-common';

describe('validateThresholds', () => {
  describe('validateThresholds - valid configs', () => {
    it('should validate valid threshold config with number metric', () => {
      const validConfig = {
        rules: [
          { key: 'error', expression: '>40' },
          { key: 'warning', expression: '>20' },
          { key: 'success', expression: '<=20' },
        ],
      };

      expect(() =>
        validateThresholdsForMetric(validConfig, 'number'),
      ).not.toThrow();
    });

    it('should validate valid threshold config with boolean metric', () => {
      const validConfig = {
        rules: [
          { key: 'success', expression: '==true' },
          { key: 'error', expression: '==false' },
        ],
      };

      expect(() =>
        validateThresholdsForMetric(validConfig, 'boolean'),
      ).not.toThrow();
    });

    it('should validate config with range expressions', () => {
      const validConfig = {
        rules: [
          { key: 'error', expression: '80-100' },
          { key: 'warning', expression: '50-79' },
          { key: 'success', expression: '0-49' },
        ],
      };

      expect(() =>
        validateThresholdsForMetric(validConfig, 'number'),
      ).not.toThrow();
    });

    it('should validate config with empty rules array', () => {
      const validConfig = { rules: [] };

      expect(() =>
        validateThresholdsForMetric(validConfig, 'number'),
      ).not.toThrow();
    });

    it('should validate config with custom threshold keys, colors and icons', () => {
      const validConfig = {
        rules: [
          {
            key: 'critical',
            expression: '>80',
            color: '#d32f2f',
            icon: 'scorecardErrorStatusIcon',
          },
          {
            key: 'high',
            expression: '60-79',
            color: '#ff9800',
            icon: '<svg xmlns="http://www.w3.org/2000/svg" width="320" height="130"><rect width="300" height="100"x="10" y="10" /></svg>',
          },
          {
            key: 'medium',
            expression: '40-59',
            color: '#ffc107',
            icon: 'kind:component',
          },
          {
            key: 'low',
            expression: '20-39',
            color: '#4caf50',
            icon: 'https://raw.githubusercontent.com/redhat-developer/example/main/icons/scorecard-icon.svg',
          },
          { key: 'success', expression: '<20' },
        ],
      };

      expect(() =>
        validateThresholdsForMetric(validConfig, 'number'),
      ).not.toThrow();
    });

    it('should validate standard keys without colors', () => {
      const config = {
        rules: [
          { key: 'success', expression: '<20' },
          { key: 'warning', expression: '20-50' },
          { key: 'error', expression: '>50' },
        ],
      };

      expect(() => validateThresholdsForMetric(config, 'number')).not.toThrow();
    });

    it('should validate config with predefined color constants', () => {
      const validConfig = {
        rules: [
          {
            key: 'success',
            expression: '<=20',
            color: ScorecardThresholdRuleColors.SUCCESS,
          },
          {
            key: 'warning',
            expression: '>20',
            color: ScorecardThresholdRuleColors.WARNING,
          },
          {
            key: 'error',
            expression: '>40',
            color: ScorecardThresholdRuleColors.ERROR,
          },
        ],
      };

      expect(() =>
        validateThresholdsForMetric(validConfig, 'number'),
      ).not.toThrow();
    });

    it('should validate config with hex color', () => {
      const validConfig = {
        rules: [
          { key: 'success', expression: '<5', color: '#dc5a33' },
          { key: 'warning', expression: '<=10', color: '#AB3' },
          { key: 'error', expression: '>10', color: '#FF5733AA' },
        ],
      };

      expect(() =>
        validateThresholdsForMetric(validConfig, 'number'),
      ).not.toThrow();
    });

    it('should validate config with RGB color', () => {
      const validConfig = {
        rules: [
          { key: 'warning', expression: '<5', color: 'rgb(255, 87, 51)' },
          { key: 'error', expression: '<5', color: 'rgba(255, 87, 51, 0.5)' },
        ],
      };

      expect(() =>
        validateThresholdsForMetric(validConfig, 'number'),
      ).not.toThrow();
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
          'Invalid threshold rule format "null": must be an object with "key" and "expression" non-empty string properties',
      },
      {
        config: { rules: [5] },
        expectedError:
          'Invalid threshold rule format "5": must be an object with "key" and "expression" non-empty string properties',
      },
      {
        config: { rules: [{ key: 'success' }] } as any,
        expectedError:
          'Invalid threshold rule format "{"key":"success"}": must be an object with "key" and "expression" non-empty string properties',
      },
      {
        config: { rules: [{ expression: '>20' }] } as any,
        expectedError:
          'Invalid threshold rule format "{"expression":">20"}": must be an object with "key" and "expression" non-empty string properties',
      },
      {
        config: { rules: [{ key: 123, expression: '>20' }] } as any,
        expectedError:
          'Invalid threshold rule format "{"key":123,"expression":">20"}": must be an object with "key" and "expression" non-empty string properties',
      },
      {
        config: { rules: [{ key: 'success', expression: 123 }] } as any,
        expectedError:
          'Invalid threshold rule format "{"key":"success","expression":123}": must be an object with "key" and "expression" non-empty string properties',
      },
      {
        config: { rules: [{ key: '', expression: '>20' }] },
        expectedError:
          'Invalid threshold rule format "{"key":"","expression":">20"}": must be an object with "key" and "expression" non-empty string properties',
      },
      {
        config: { rules: [{ key: 'success', expression: '' }] },
        expectedError:
          'Invalid threshold rule format "{"key":"success","expression":""}": must be an object with "key" and "expression" non-empty string properties',
      },
      {
        config: { rules: [{ key: 'success', expression: 'invalid' }] },
        metricType: 'number' as const,
        expectedError: 'Invalid threshold expression: "invalid".',
      },
    ])(
      'should throw error for invalid config format: $config',
      ({ config, expectedError }) => {
        expect(() => validateThresholdsForMetric(config, 'number')).toThrow(
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

      expect(() => validateThresholdsForMetric(config, 'number')).toThrow(
        new ThresholdConfigFormatError(
          'Duplicate key detected for "error" with expression ">50"',
        ),
      );
    });

    const customKeyRequiresColorAndIcon =
      "Custom threshold key \"critical\" must specify a color and icon property. Only standard keys ('success', 'warning', 'error') have default colors and icons.";

    it('should throw error for custom threshold key without color', () => {
      const config = {
        rules: [
          { key: 'success', expression: '<20' },
          {
            key: 'critical',
            expression: '>=20',
            icon: 'scorecardErrorStatusIcon',
          },
        ],
      };

      expect(() => validateThresholdsForMetric(config, 'number')).toThrow(
        new ThresholdConfigFormatError(customKeyRequiresColorAndIcon),
      );
    });

    it('should throw error for custom threshold key without icon', () => {
      const config = {
        rules: [
          { key: 'success', expression: '<20' },
          {
            key: 'critical',
            expression: '>=20',
            color: '#FF0000',
          },
        ],
      };

      expect(() => validateThresholdsForMetric(config, 'number')).toThrow(
        new ThresholdConfigFormatError(customKeyRequiresColorAndIcon),
      );
    });

    it('should throw error for invalid icon type', () => {
      const config = {
        rules: [
          { key: 'critical', expression: '>=20', color: '#FF0000', icon: 123 },
        ],
      };

      expect(() =>
        validateThresholdsForMetric(
          config as unknown as ThresholdConfig,
          'number',
        ),
      ).toThrow(
        new ThresholdConfigFormatError(
          'Invalid icon format for rule "critical": icon must be a non-empty string',
        ),
      );
    });

    it('should throw error for empty icon string', () => {
      const config = {
        rules: [
          { key: 'critical', expression: '>=20', color: '#FF0000', icon: '' },
        ],
      };

      expect(() => validateThresholdsForMetric(config, 'number')).toThrow(
        new ThresholdConfigFormatError(
          'Invalid icon format for rule "critical": icon must be a non-empty string',
        ),
      );
    });

    it.each([
      {
        description: 'missing # in hex color',
        config: {
          rules: [{ key: 'success', expression: '<5', color: 'FF5733' }],
        },
        expectedError:
          'Invalid color format for rule "success": "FF5733" must be either a predefined constant (\'success.main\', \'warning.main\', \'error.main\'), a hex color (e.g., "#ADD8E6"), or an RGB/RGBA color (e.g., "rgb(255, 255, 0)")',
      },
      {
        description: 'invalid hex characters',
        config: {
          rules: [{ key: 'success', expression: '<5', color: '#GGGGGG' }],
        },
        expectedError:
          'Invalid color format for rule "success": "#GGGGGG" must be either a predefined constant (\'success.main\', \'warning.main\', \'error.main\'), a hex color (e.g., "#ADD8E6"), or an RGB/RGBA color (e.g., "rgb(255, 255, 0)")',
      },
      {
        description: 'invalid predefined constant',
        config: {
          rules: [{ key: 'success', expression: '<5', color: 'invalid.color' }],
        },
        expectedError:
          'Invalid color format for rule "success": "invalid.color" must be either a predefined constant (\'success.main\', \'warning.main\', \'error.main\'), a hex color (e.g., "#ADD8E6"), or an RGB/RGBA color (e.g., "rgb(255, 255, 0)")',
      },
      {
        description: 'empty color string',
        config: {
          rules: [{ key: 'success', expression: '<5', color: '' }],
        },
        expectedError:
          'Invalid color format for rule "success": color must be a non-empty string',
      },
      {
        description: 'non-string color',
        config: {
          rules: [{ key: 'success', expression: '<5', color: 123 }],
        },
        expectedError:
          'Invalid color format for rule "success": color must be a non-empty string',
      },
      {
        description: 'RGB with missing comma',
        config: {
          rules: [
            { key: 'success', expression: '<5', color: 'rgb(50, 87 37)' },
          ],
        },
        expectedError:
          'Invalid color format for rule "success": "rgb(50, 87 37)" must be either a predefined constant (\'success.main\', \'warning.main\', \'error.main\'), a hex color (e.g., "#ADD8E6"), or an RGB/RGBA color (e.g., "rgb(255, 255, 0)")',
      },
    ])(
      'should throw error for invalid color: $description',
      ({ config, expectedError }) => {
        expect(() =>
          validateThresholdsForMetric(
            config as unknown as ThresholdConfig,
            'number',
          ),
        ).toThrow(new ThresholdConfigFormatError(expectedError));
      },
    );
  });

  describe('validateThresholdsForAggregation', () => {
    it('should accept aggregation KPI style rules with MUI palette colors on number metric', () => {
      const aggregationStyleConfig = {
        rules: [
          { key: 'success', expression: '>=75', color: 'success.main' },
          { key: 'warning', expression: '10-74', color: 'warning.main' },
          { key: 'error', expression: '<10', color: 'error.main' },
        ],
      };

      expect(() =>
        validateThresholdsForAggregation(aggregationStyleConfig, 'number'),
      ).not.toThrow();
    });

    it('should throw on invalid expression for number metric', () => {
      const config = {
        rules: [
          {
            key: 'success',
            expression: '%%%invalid%%%',
            color: 'success.main',
          },
        ],
      };

      expect(() => validateThresholdsForAggregation(config, 'number')).toThrow(
        new ThresholdConfigFormatError(
          'Invalid threshold expression: "%%%invalid%%%".',
        ),
      );
    });

    it('should throw an error for custom threshold key without color on aggregation', () => {
      const config = {
        rules: [
          { key: 'success', expression: '<20' },
          { key: 'critical', expression: '>=20' },
        ],
      };

      expect(() => validateThresholdsForAggregation(config, 'number')).toThrow(
        new ThresholdConfigFormatError(
          "Custom threshold key \"critical\" must specify a color property. Only standard keys ('success', 'warning', 'error') have default colors.",
        ),
      );
    });
  });
});
