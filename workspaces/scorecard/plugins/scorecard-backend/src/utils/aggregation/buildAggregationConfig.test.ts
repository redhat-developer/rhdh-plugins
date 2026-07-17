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
import { aggregationTypes } from '@red-hat-developer-hub/backstage-plugin-scorecard-common';
import { AGGREGATION_KPIS_CONFIG_PATH } from '../../constants';
import { buildAggregationConfig } from './buildAggregationConfig';
import {
  mockFirstThresholds,
  mockSecondThresholds,
} from '../../../__fixtures__/mockThresholds';

describe('buildAggregationConfig', () => {
  it('should map nested config and aggregation id into AggregationConfig', () => {
    const rootConfig = mockServices.rootConfig({
      data: {
        scorecard: {
          aggregationKPIs: {
            openPrsKpi: {
              title: 'GitHub PRs',
              description: 'Open pull requests',
              type: aggregationTypes.statusGrouped,
              metricId: 'github.open_prs',
            },
          },
        },
      },
    });
    const config = rootConfig.getConfig(
      `${AGGREGATION_KPIS_CONFIG_PATH}.openPrsKpi`,
    );

    const result = buildAggregationConfig('openPrsKpi', { config });

    expect(result).toEqual({
      id: 'openPrsKpi',
      title: 'GitHub PRs',
      description: 'Open pull requests',
      type: aggregationTypes.statusGrouped,
      metricId: 'github.open_prs',
      options: {},
    });
  });

  it('should map weightedStatusScore KPI config including statusScores', () => {
    const rootConfig = mockServices.rootConfig({
      data: {
        scorecard: {
          aggregationKPIs: {
            weightedKpi: {
              title: 'Weighted health',
              description: 'Weighted health score across statuses',
              type: aggregationTypes.weightedStatusScore,
              metricId: 'github.open_prs',
              options: {
                statusScores: {
                  error: 0,
                  warning: 50,
                  success: 100,
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

    const result = buildAggregationConfig('weightedKpi', { config });

    expect(result).toEqual({
      id: 'weightedKpi',
      title: 'Weighted health',
      description: 'Weighted health score across statuses',
      type: aggregationTypes.weightedStatusScore,
      metricId: 'github.open_prs',
      options: {
        statusScores: { error: 0, warning: 50, success: 100 },
      },
    });
    expect(result.options?.thresholds).toBeUndefined();
  });

  it('should map optional thresholds for weightedStatusScore KPIs', () => {
    const rootConfig = mockServices.rootConfig({
      data: {
        scorecard: {
          aggregationKPIs: {
            weightedKpi: {
              title: 'Weighted health',
              description: 'Weighted health score across statuses',
              type: aggregationTypes.weightedStatusScore,
              metricId: 'github.open_prs',
              options: {
                statusScores: { success: 100, warning: 50, error: 0 },
                thresholds: mockFirstThresholds,
              },
            },
          },
        },
      },
    });
    const config = rootConfig.getConfig(
      `${AGGREGATION_KPIS_CONFIG_PATH}.weightedKpi`,
    );

    const result = buildAggregationConfig('weightedKpi', { config });

    expect(result.options?.thresholds).toEqual(mockFirstThresholds);
  });

  it('should map optional thresholds for scalar KPIs', () => {
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
                thresholds: mockSecondThresholds,
              },
            },
          },
        },
      },
    });
    const config = rootConfig.getConfig(
      `${AGGREGATION_KPIS_CONFIG_PATH}.totalOpenPrsKpi`,
    );

    const result = buildAggregationConfig('totalOpenPrsKpi', { config });

    expect(result.options?.thresholds).toEqual(mockSecondThresholds);
  });

  it('should not map thresholds for statusGrouped KPIs even when configured', () => {
    const rootConfig = mockServices.rootConfig({
      data: {
        scorecard: {
          aggregationKPIs: {
            statusKpi: {
              title: 'Status breakdown',
              description: 'Counts by status',
              type: aggregationTypes.statusGrouped,
              metricId: 'github.open_prs',
              options: {
                thresholds: mockFirstThresholds,
              },
            },
          },
        },
      },
    });
    const config = rootConfig.getConfig(
      `${AGGREGATION_KPIS_CONFIG_PATH}.statusKpi`,
    );

    const result = buildAggregationConfig('statusKpi', { config });

    expect(result).toEqual({
      id: 'statusKpi',
      title: 'Status breakdown',
      description: 'Counts by status',
      type: aggregationTypes.statusGrouped,
      metricId: 'github.open_prs',
      options: {},
    });
    expect(result.options?.thresholds).toBeUndefined();
  });

  it('should map scalar KPI config without thresholds', () => {
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

    const result = buildAggregationConfig('totalOpenPrsKpi', { config });

    expect(result).toEqual({
      id: 'totalOpenPrsKpi',
      title: 'Total Open PRs',
      description: 'Sum of open PRs',
      type: aggregationTypes.sum,
      metricId: 'github.open_prs',
      options: {
        thresholds: undefined,
      },
    });
  });
});
