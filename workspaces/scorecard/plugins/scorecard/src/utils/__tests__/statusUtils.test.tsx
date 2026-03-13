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

import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import DangerousOutlinedIcon from '@mui/icons-material/DangerousOutlined';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';

import { DEFAULT_NUMBER_THRESHOLDS } from '@red-hat-developer-hub/backstage-plugin-scorecard-common';
import { getStatusConfig, SCORECARD_ERROR_STATE_COLOR } from '..';

describe('statusUtils', () => {
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
});
