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

import { ConfigReader } from '@backstage/config';
import { aggregationKinds } from '@red-hat-developer-hub/backstage-plugin-scorecard-common';
import { DEFAULT_AVERAGE_KPI_RESULT_THRESHOLDS } from '../constants/aggregationKPIs';
import { buildAggregationConfig } from './buildAggregationConfig';

describe('buildAggregationConfig', () => {
  it('maps nested config and aggregation id into AggregationConfig', () => {
    const config = new ConfigReader({
      title: 'GitHub PRs',
      description: 'Open pull requests',
      type: aggregationKinds.statusGrouped,
      metricId: 'github.open_prs',
    });

    const result = buildAggregationConfig('openPrsKpi', { config });

    expect(result).toEqual({
      id: 'openPrsKpi',
      title: 'GitHub PRs',
      description: 'Open pull requests',
      type: aggregationKinds.statusGrouped,
      metricId: 'github.open_prs',
    });
  });

  it('maps average KPI config including statusScores', () => {
    const config = new ConfigReader({
      title: 'Weighted health',
      description: 'Average across statuses',
      type: aggregationKinds.average,
      metricId: 'github.open_prs',
      options: {
        statusScores: {
          error: 0,
          warning: 50,
          success: 100,
        },
      },
    });

    const result = buildAggregationConfig('avgKpi', { config });

    expect(result).toEqual({
      id: 'avgKpi',
      title: 'Weighted health',
      description: 'Average across statuses',
      type: aggregationKinds.average,
      metricId: 'github.open_prs',
      options: {
        statusScores: { error: 0, warning: 50, success: 100 },
        aggregationResultThresholds: DEFAULT_AVERAGE_KPI_RESULT_THRESHOLDS,
      },
    });
  });

  it('maps optional aggregationResultThresholds for average KPIs', () => {
    const config = new ConfigReader({
      title: 'Weighted health',
      description: 'Average across statuses',
      type: aggregationKinds.average,
      metricId: 'github.open_prs',
      options: {
        statusScores: { success: 100, warning: 50, error: 0 },
        aggregationResultThresholds: {
          rules: [
            { key: 'success', expression: '>=75', color: 'success.main' },
            { key: 'warning', expression: '10-74', color: 'warning.main' },
            { key: 'error', expression: '<10', color: 'error.main' },
          ],
        },
      },
    });

    const result = buildAggregationConfig('avgKpi', { config });

    expect(result.options?.aggregationResultThresholds?.rules).toEqual([
      { key: 'success', expression: '>=75', color: 'success.main' },
      { key: 'warning', expression: '10-74', color: 'warning.main' },
      { key: 'error', expression: '<10', color: 'error.main' },
    ]);
  });
});
