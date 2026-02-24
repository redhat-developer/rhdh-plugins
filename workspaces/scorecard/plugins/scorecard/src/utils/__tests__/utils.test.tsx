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

import DangerousOutlinedIcon from '@mui/icons-material/DangerousOutlined';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';

import {
  getStatusConfig,
  getThresholdRuleColor,
  resolveStatusColor,
  SCORECARD_ERROR_STATE_COLOR,
} from '../utils';
import {
  DEFAULT_NUMBER_THRESHOLDS,
  ThresholdRule,
} from '@red-hat-developer-hub/backstage-plugin-scorecard-common';
import { Theme } from '@mui/material/styles';

describe('utils', () => {
  describe('getThresholdRuleColor', () => {
    const mockRules: ThresholdRule[] = [
      { key: 'custom', expression: '<5', color: '#FF5733' },
      { key: 'success', expression: '<10', color: '#4caf50' },
      { key: 'warning', expression: '10-50' },
      { key: 'critical', expression: '>50', color: 'error.main' },
    ];

    it('should return color for matching threshold key', () => {
      expect(getThresholdRuleColor(mockRules, 'custom')).toEqual('#FF5733');
      expect(getThresholdRuleColor(mockRules, 'success')).toEqual('#4caf50');
      expect(getThresholdRuleColor(mockRules, 'critical')).toEqual(
        'error.main',
      );
    });

    it('should return undefined for non-matching key', () => {
      expect(getThresholdRuleColor(mockRules, 'low')).toBeUndefined();
    });

    it('should return default color for default rule keys', () => {
      expect(
        getThresholdRuleColor(DEFAULT_NUMBER_THRESHOLDS.rules, 'success'),
      ).toEqual('success.main');
      expect(
        getThresholdRuleColor(DEFAULT_NUMBER_THRESHOLDS.rules, 'warning'),
      ).toEqual('warning.main');
      expect(
        getThresholdRuleColor(DEFAULT_NUMBER_THRESHOLDS.rules, 'error'),
      ).toEqual('error.main');
    });

    it('should handle empty rules array', () => {
      expect(getThresholdRuleColor([], 'medium')).toBeUndefined();
    });
  });

  describe('getStatusConfig', () => {
    describe('error handling', () => {
      it('should return error state color when thresholdStatus is error', () => {
        const result = getStatusConfig({
          evaluation: 'success',
          thresholdStatus: 'error',
          metricStatus: 'success',
        });

        expect(result).toEqual({
          color: SCORECARD_ERROR_STATE_COLOR,
        });
      });

      it('should return error state color when metricStatus is error', () => {
        const result = getStatusConfig({
          evaluation: 'success',
          thresholdStatus: 'success',
          metricStatus: 'error',
        });

        expect(result).toEqual({
          color: SCORECARD_ERROR_STATE_COLOR,
        });
      });

      it('should return error state color when both thresholdStatus and metricStatus are error', () => {
        const result = getStatusConfig({
          evaluation: 'success',
          thresholdStatus: 'error',
          metricStatus: 'error',
        });

        expect(result).toEqual({
          color: SCORECARD_ERROR_STATE_COLOR,
        });
      });

      it('should return error state color when thresholdStatus is error regardless of evaluation', () => {
        const result = getStatusConfig({
          evaluation: 'error',
          thresholdStatus: 'error',
          metricStatus: 'success',
        });

        expect(result).toEqual({
          color: SCORECARD_ERROR_STATE_COLOR,
        });
      });

      it('should return error state color when metricStatus is error regardless of evaluation', () => {
        const result = getStatusConfig({
          evaluation: 'warning',
          thresholdStatus: 'success',
          metricStatus: 'error',
        });

        expect(result).toEqual({
          color: SCORECARD_ERROR_STATE_COLOR,
        });
      });
    });

    describe('evaluation status handling', () => {
      it('should return error status config when evaluation is error and no error status', () => {
        const result = getStatusConfig({
          evaluation: 'error',
          thresholdStatus: 'success',
          metricStatus: 'success',
          thresholdRules: DEFAULT_NUMBER_THRESHOLDS.rules,
        });

        expect(result).toEqual({
          color: 'error.main',
          icon: DangerousOutlinedIcon,
        });
      });

      it('should return warning status config when evaluation is warning and no error status', () => {
        const result = getStatusConfig({
          evaluation: 'warning',
          thresholdStatus: 'success',
          metricStatus: 'success',
          thresholdRules: DEFAULT_NUMBER_THRESHOLDS.rules,
        });

        expect(result).toEqual({
          color: 'warning.main',
          icon: WarningAmberIcon,
        });
      });

      it('should return success status config when evaluation is success and no error status', () => {
        const result = getStatusConfig({
          evaluation: 'success',
          thresholdStatus: 'success',
          metricStatus: 'success',
          thresholdRules: DEFAULT_NUMBER_THRESHOLDS.rules,
        });

        expect(result).toEqual({
          color: 'success.main',
          icon: CheckCircleOutlineIcon,
        });
      });

      it('should return custom color from threshold configuration', () => {
        const mockThresholds = {
          rules: [
            { key: 'critical', expression: '>80', color: '#ff0000' },
            { key: 'warning', expression: '40-79', color: '#ffa500' },
            { key: 'success', expression: '<40', color: '#00ff00' },
          ],
        };

        const result = getStatusConfig({
          evaluation: 'success',
          thresholdRules: mockThresholds.rules,
        });

        expect(result).toEqual({
          color: '#00ff00',
          icon: CheckCircleOutlineIcon,
        });
      });

      it('should return default color for default rule keys', () => {
        const result = getStatusConfig({
          evaluation: 'success',
          thresholdRules: DEFAULT_NUMBER_THRESHOLDS.rules,
        });

        expect(result).toEqual({
          color: 'success.main',
          icon: CheckCircleOutlineIcon,
        });
      });
    });

    describe('optional parameters', () => {
      it('should work when thresholdStatus is undefined', () => {
        const result = getStatusConfig({
          evaluation: 'error',
          metricStatus: 'success',
          thresholdRules: DEFAULT_NUMBER_THRESHOLDS.rules,
        });

        expect(result).toEqual({
          color: 'error.main',
          icon: DangerousOutlinedIcon,
        });
      });

      it('should work when metricStatus is undefined', () => {
        const result = getStatusConfig({
          evaluation: 'warning',
          thresholdStatus: 'success',
          thresholdRules: DEFAULT_NUMBER_THRESHOLDS.rules,
        });

        expect(result).toEqual({
          color: 'warning.main',
          icon: WarningAmberIcon,
        });
      });

      it('should work when both thresholdStatus and metricStatus are undefined', () => {
        const result = getStatusConfig({
          evaluation: 'success',
          thresholdRules: DEFAULT_NUMBER_THRESHOLDS.rules,
        });

        expect(result).toEqual({
          color: 'success.main',
          icon: CheckCircleOutlineIcon,
        });
      });
    });
  });

  describe('resolveStatusColor', () => {
    const mockTheme = {
      palette: {
        primary: { main: '#0066cc' },
        success: { main: '#2e7d32' },
        warning: { main: '#ed6c02' },
        error: { main: '#d32f2f' },
        rhdh: {
          general: {
            cardBorderColor: '#c7c7c7',
          },
        },
      },
    } as any as Theme;

    it('should resolve theme palette reference', () => {
      const color = resolveStatusColor(mockTheme, 'success.main');
      expect(color).toBe('#2e7d32');
    });

    it('should resolve theme reference with nested levels', () => {
      const color = resolveStatusColor(mockTheme, SCORECARD_ERROR_STATE_COLOR);
      expect(color).toBe('#c7c7c7');
    });

    it('should return custom hex color directly', () => {
      const color = resolveStatusColor(mockTheme, '#9933ff');
      expect(color).toBe('#9933ff');
    });

    it('should return custom color name directly', () => {
      const color = resolveStatusColor(mockTheme, 'blue');
      expect(color).toBe('blue');
    });

    it('should return custom rgb color directly', () => {
      const color = resolveStatusColor(mockTheme, 'rgb(255, 0, 0)');
      expect(color).toBe('rgb(255, 0, 0)');
    });

    it('should fallback to cardBorderColor when theme path not found', () => {
      const color = resolveStatusColor(mockTheme, 'nonexistent.path');
      expect(color).toBe('#c7c7c7');
    });

    it('should fallback to error.main when theme path not found and cardBorderColor is undefined', () => {
      const themeWithoutCardBorder = {
        palette: {
          error: { main: '#d32f2f' },
        },
      } as any as Theme;
      const color = resolveStatusColor(
        themeWithoutCardBorder,
        'nonexistent.path',
      );
      expect(color).toBe('#d32f2f');
    });
  });
});
