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

import type { ThresholdConfig } from '@red-hat-developer-hub/backstage-plugin-scorecard-common';

export const DEFAULT_WEIGHTED_STATUS_SCORE_THRESHOLDS = {
  rules: [
    { key: 'success', expression: '>=80', color: 'success.main' },
    { key: 'warning', expression: '30-80', color: 'warning.main' },
    { key: 'error', expression: '<30', color: 'error.main' },
  ],
};

export const CHANGE_FAILURE_RATE_THRESHOLDS: ThresholdConfig = {
  rules: [
    { key: 'elite', expression: '<5', color: 'success.main' },
    { key: 'medium', expression: '5-15', color: 'warning.main' },
    { key: 'low', expression: '>15', color: 'error.main' },
  ],
};

export const DEPLOYMENT_FREQUENCY_THRESHOLDS: ThresholdConfig = {
  rules: [
    { key: 'elite', expression: '>=7', color: 'success.main' },
    { key: 'medium', expression: '1-7', color: 'warning.main' },
    { key: 'low', expression: '<1', color: 'error.main' },
  ],
};

export const LEAD_TIME_THRESHOLDS: ThresholdConfig = {
  rules: [
    { key: 'elite', expression: '<24', color: 'success.main' },
    { key: 'medium', expression: '24-168', color: 'warning.main' },
    { key: 'low', expression: '>168', color: 'error.main' },
  ],
};

export const MTTR_THRESHOLDS: ThresholdConfig = {
  rules: [
    { key: 'elite', expression: '<1', color: 'success.main' },
    { key: 'medium', expression: '1-24', color: 'warning.main' },
    { key: 'low', expression: '>24', color: 'error.main' },
  ],
};

export const FILECHECK_BOOLEAN_THRESHOLDS: ThresholdConfig = {
  rules: [
    { key: 'exist', expression: '==true', color: 'success.main' },
    { key: 'missing', expression: '==false', color: 'error.main' },
  ],
};
