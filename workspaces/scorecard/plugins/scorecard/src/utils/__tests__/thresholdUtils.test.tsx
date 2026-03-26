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
  DEFAULT_NUMBER_THRESHOLDS,
  ThresholdRule,
} from '@red-hat-developer-hub/backstage-plugin-scorecard-common';
import { getThresholdRuleColor, getThresholdRuleIcon } from '..';

describe('thresholdUtils', () => {
  const mockRules: ThresholdRule[] = [
    { key: 'custom', expression: '<5', color: '#FF5733', icon: 'customIcon' },
    {
      key: 'success',
      expression: '<10',
      color: '#4caf50',
      icon: 'https://example.com/icon.png',
    },
    { key: 'warning', expression: '10-50' },
    {
      key: 'critical',
      expression: '>50',
      color: 'error.main',
      icon: 'scorecardErrorStatusIcon',
    },
  ];

  describe('getThresholdRuleColor', () => {
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

  describe('getThresholdRuleIcon', () => {
    it('should return icon for matching threshold key', () => {
      expect(getThresholdRuleIcon(mockRules, 'custom')).toEqual('customIcon');
      expect(getThresholdRuleIcon(mockRules, 'success')).toEqual(
        'https://example.com/icon.png',
      );
      expect(getThresholdRuleIcon(mockRules, 'critical')).toEqual(
        'scorecardErrorStatusIcon',
      );
    });

    it('should return undefined for non-matching key', () => {
      expect(getThresholdRuleIcon(mockRules, 'low')).toBeUndefined();
    });

    it('should return default color for default rule keys', () => {
      expect(
        getThresholdRuleIcon(DEFAULT_NUMBER_THRESHOLDS.rules, 'success'),
      ).toEqual('scorecardSuccessStatusIcon');
      expect(
        getThresholdRuleIcon(DEFAULT_NUMBER_THRESHOLDS.rules, 'warning'),
      ).toEqual('scorecardWarningStatusIcon');
      expect(
        getThresholdRuleIcon(DEFAULT_NUMBER_THRESHOLDS.rules, 'error'),
      ).toEqual('scorecardErrorStatusIcon');
    });

    it('should handle empty rules array', () => {
      expect(getThresholdRuleIcon([], 'medium')).toBeUndefined();
    });
  });
});
