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

import { getStatusConfig } from '../utils';

describe('getStatusConfig', () => {
  describe('error handling', () => {
    it('should return rhdh.general.disabled color when thresholdStatus is error', () => {
      const result = getStatusConfig({
        evaluation: 'success',
        thresholdStatus: 'error',
        metricStatus: 'success',
      });

      expect(result).toEqual({
        color: 'rhdh.general.disabled',
      });
    });

    it('should return rhdh.general.disabled color when metricStatus is error', () => {
      const result = getStatusConfig({
        evaluation: 'success',
        thresholdStatus: 'success',
        metricStatus: 'error',
      });

      expect(result).toEqual({
        color: 'rhdh.general.disabled',
      });
    });

    it('should return rhdh.general.disabled color when both thresholdStatus and metricStatus are error', () => {
      const result = getStatusConfig({
        evaluation: 'success',
        thresholdStatus: 'error',
        metricStatus: 'error',
      });

      expect(result).toEqual({
        color: 'rhdh.general.disabled',
      });
    });

    it('should return rhdh.general.disabled color when thresholdStatus is error regardless of evaluation', () => {
      const result = getStatusConfig({
        evaluation: 'error',
        thresholdStatus: 'error',
        metricStatus: 'success',
      });

      expect(result).toEqual({
        color: 'rhdh.general.disabled',
      });
    });

    it('should return rhdh.general.disabled color when metricStatus is error regardless of evaluation', () => {
      const result = getStatusConfig({
        evaluation: 'warning',
        thresholdStatus: 'success',
        metricStatus: 'error',
      });

      expect(result).toEqual({
        color: 'rhdh.general.disabled',
      });
    });
  });

  describe('evaluation status handling', () => {
    it('should return error status config when evaluation is error and no error status', () => {
      const result = getStatusConfig({
        evaluation: 'error',
        thresholdStatus: 'success',
        metricStatus: 'success',
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
      });

      expect(result).toEqual({
        color: 'warning.main',
        icon: WarningAmberIcon,
      });
    });

    it('should work when both thresholdStatus and metricStatus are undefined', () => {
      const result = getStatusConfig({
        evaluation: 'success',
      });

      expect(result).toEqual({
        color: 'success.main',
        icon: CheckCircleOutlineIcon,
      });
    });
  });
});
