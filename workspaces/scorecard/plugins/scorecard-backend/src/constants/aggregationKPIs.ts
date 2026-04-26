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
  type ThresholdConfig,
  ScorecardThresholdRuleColors,
} from '@red-hat-developer-hub/backstage-plugin-scorecard-common';

export const AGGREGATION_KPIS_CONFIG_PATH =
  'scorecard.aggregationKPIs' as const;

/**
 * Default for `options.aggregationResultThresholds` on average aggregation KPIs when unset:
 * higher headline percentage (0–100) = better. Evaluated in order; first match wins.
 */
export const DEFAULT_AVERAGE_KPI_RESULT_THRESHOLDS: ThresholdConfig = {
  rules: [
    {
      key: 'error',
      expression: '<30',
      color: ScorecardThresholdRuleColors.ERROR,
    },
    {
      key: 'warning',
      expression: '30-79',
      color: ScorecardThresholdRuleColors.WARNING,
    },
    {
      key: 'success',
      expression: '>=80',
      color: ScorecardThresholdRuleColors.SUCCESS,
    },
  ],
};
