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
import { aggregationTypes } from '@red-hat-developer-hub/backstage-plugin-scorecard-common';
import { buildAggregationConfig } from './buildAggregationConfig';

describe('buildAggregationConfig', () => {
  it('maps nested config and aggregation id into AggregationConfig', () => {
    const config = new ConfigReader({
      title: 'GitHub PRs',
      description: 'Open pull requests',
      type: aggregationTypes.statusGrouped,
      metricId: 'github.open_prs',
    });

    const result = buildAggregationConfig('openPrsKpi', { config });

    expect(result).toEqual({
      id: 'openPrsKpi',
      title: 'GitHub PRs',
      description: 'Open pull requests',
      type: aggregationTypes.statusGrouped,
      metricId: 'github.open_prs',
    });
  });

  it('maps weightedStatusScore KPI config including statusScores', () => {
    const config = new ConfigReader({
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
    });

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

  it('maps optional thresholds for weightedStatusScore KPIs', () => {
    const config = new ConfigReader({
      title: 'Weighted health',
      description: 'Weighted health score across statuses',
      type: aggregationTypes.weightedStatusScore,
      metricId: 'github.open_prs',
      options: {
        statusScores: { success: 100, warning: 50, error: 0 },
        thresholds: {
          rules: [
            { key: 'success', expression: '>=75', color: 'success.main' },
            { key: 'warning', expression: '10-75', color: 'warning.main' },
            { key: 'error', expression: '<10', color: 'error.main' },
          ],
        },
      },
    });

    const result = buildAggregationConfig('weightedKpi', { config });

    expect(result.options?.thresholds?.rules).toEqual([
      { key: 'success', expression: '>=75', color: 'success.main' },
      { key: 'warning', expression: '10-75', color: 'warning.main' },
      { key: 'error', expression: '<10', color: 'error.main' },
    ]);
  });

  it('should map optional thresholds for scalar KPIs', () => {
    const config = new ConfigReader({
      title: 'Total Open PRs',
      description: 'Sum of open PRs',
      type: aggregationTypes.sum,
      metricId: 'github.open_prs',
      options: {
        thresholds: {
          rules: [
            { key: 'success', expression: '>=80', color: 'success.main' },
          ],
        },
      },
    });

    const result = buildAggregationConfig('totalOpenPrsKpi', { config });

    expect(result.options?.thresholds?.rules).toEqual([
      { key: 'success', expression: '>=80', color: 'success.main' },
    ]);
  });

  it('should not map options for statusGrouped KPIs even when thresholds are configured', () => {
    const config = new ConfigReader({
      title: 'Status breakdown',
      description: 'Counts by status',
      type: aggregationTypes.statusGrouped,
      metricId: 'github.open_prs',
      options: {
        thresholds: {
          rules: [
            { key: 'success', expression: '>=80', color: 'success.main' },
          ],
        },
      },
    });

    const result = buildAggregationConfig('statusKpi', { config });

    expect(result).toEqual({
      id: 'statusKpi',
      title: 'Status breakdown',
      description: 'Counts by status',
      type: aggregationTypes.statusGrouped,
      metricId: 'github.open_prs',
    });
    expect(result.options).toBeUndefined();
  });

  it('should map scalar KPI config without options', () => {
    const config = new ConfigReader({
      title: 'Total Open PRs',
      description: 'Sum of open PRs',
      type: aggregationTypes.sum,
      metricId: 'github.open_prs',
    });

    const result = buildAggregationConfig('totalOpenPrsKpi', { config });

    expect(result).toEqual({
      id: 'totalOpenPrsKpi',
      title: 'Total Open PRs',
      description: 'Sum of open PRs',
      type: aggregationTypes.sum,
      metricId: 'github.open_prs',
    });
    expect(result.options).toBeUndefined();
  });
});
