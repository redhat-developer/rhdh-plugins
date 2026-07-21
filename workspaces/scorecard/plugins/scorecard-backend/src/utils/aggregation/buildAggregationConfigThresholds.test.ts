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

import { mockServices } from '@backstage/backend-test-utils';
import {
  aggregationTypes,
  ScorecardThresholdRuleColors,
} from '@red-hat-developer-hub/backstage-plugin-scorecard-common';
import { AGGREGATION_KPIS_CONFIG_PATH } from '../../constants';
import { buildAggregationConfigThresholds } from './buildAggregationConfigThresholds';

describe('buildAggregationConfigThresholds', () => {
  it('should return undefined when options.thresholds is absent', () => {
    const rootConfig = mockServices.rootConfig({
      data: {
        scorecard: {
          aggregationKPIs: {
            totalOpenPrsKpi: {
              title: 'Total Open PRs',
              description: 'Sum of open PRs',
              type: aggregationTypes.sum,
              metricId: 'github.open_prs',
            },
          },
        },
      },
    });
    const config = rootConfig.getConfig(
      `${AGGREGATION_KPIS_CONFIG_PATH}.totalOpenPrsKpi`,
    );

    expect(buildAggregationConfigThresholds(config)).toBeUndefined();
  });

  it('should map thresholds rules from KPI config', () => {
    const rootConfig = mockServices.rootConfig({
      data: {
        scorecard: {
          aggregationKPIs: {
            totalOpenPrsKpi: {
              title: 'Total Open PRs',
              description: 'Sum of open PRs',
              type: aggregationTypes.sum,
              metricId: 'github.open_prs',
              options: {
                thresholds: {
                  rules: [
                    {
                      key: 'success',
                      expression: '>=75',
                      color: ScorecardThresholdRuleColors.SUCCESS,
                    },
                    {
                      key: 'warning',
                      expression: '10-75',
                      color: ScorecardThresholdRuleColors.WARNING,
                    },
                    {
                      key: 'error',
                      expression: '<10',
                      color: ScorecardThresholdRuleColors.ERROR,
                    },
                  ],
                },
              },
            },
          },
        },
      },
    });
    const config = rootConfig.getConfig(
      `${AGGREGATION_KPIS_CONFIG_PATH}.totalOpenPrsKpi`,
    );

    expect(buildAggregationConfigThresholds(config)).toEqual({
      rules: [
        {
          key: 'success',
          expression: '>=75',
          color: ScorecardThresholdRuleColors.SUCCESS,
        },
        {
          key: 'warning',
          expression: '10-75',
          color: ScorecardThresholdRuleColors.WARNING,
        },
        {
          key: 'error',
          expression: '<10',
          color: ScorecardThresholdRuleColors.ERROR,
        },
      ],
    });
  });

  it('should map a single threshold rule', () => {
    const rootConfig = mockServices.rootConfig({
      data: {
        scorecard: {
          aggregationKPIs: {
            weightedKpi: {
              title: 'Weighted health',
              description: 'Weighted health score',
              type: aggregationTypes.weightedStatusScore,
              metricId: 'github.open_prs',
              options: {
                statusScores: { success: 100 },
                thresholds: {
                  rules: [
                    {
                      key: 'success',
                      expression: '>=80',
                      color: ScorecardThresholdRuleColors.SUCCESS,
                    },
                  ],
                },
              },
            },
          },
        },
      },
    });
    const config = rootConfig.getConfig(
      `${AGGREGATION_KPIS_CONFIG_PATH}.weightedKpi`,
    );

    expect(buildAggregationConfigThresholds(config)).toEqual({
      rules: [
        {
          key: 'success',
          expression: '>=80',
          color: ScorecardThresholdRuleColors.SUCCESS,
        },
      ],
    });
  });
});
