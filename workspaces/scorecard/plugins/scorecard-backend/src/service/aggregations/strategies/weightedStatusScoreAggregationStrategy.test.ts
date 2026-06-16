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
  Metric,
  ThresholdConfig,
} from '@red-hat-developer-hub/backstage-plugin-scorecard-common';
import { DEFAULT_WEIGHTED_STATUS_SCORE_KPI_RESULT_THRESHOLDS } from '../../../constants/aggregationKPIs';
import { AggregatedMetricLoader } from '../AggregatedMetricLoader';
import { WeightedStatusScoreAggregationStrategy } from './WeightedStatusScoreAggregationStrategy';

describe('WeightedStatusScoreAggregationStrategy', () => {
  const metric = {
    id: 'github.open_prs',
    title: 'Open PRs',
    description: 'desc',
    type: 'number',
  } as Metric;

  const thresholds: ThresholdConfig = {
    rules: [
      { key: 'error', expression: '>40' },
      { key: 'warning', expression: '>20' },
      { key: 'success', expression: '<=20' },
    ],
  };

  it('computes weighted status score fields from loader output', async () => {
    const loadStatusGroupedMetricByEntityRefs = jest.fn().mockResolvedValue({
      values: { error: 1, warning: 1, success: 1 },
      total: 3,
      timestamp: '2025-01-01T10:30:00.000Z',
      entitiesConsidered: 5,
      calculationErrorCount: 2,
    });

    const loader = {
      loadStatusGroupedMetricByEntityRefs,
    } as unknown as AggregatedMetricLoader;

    const logger = mockServices.logger.mock();
    const strategy = new WeightedStatusScoreAggregationStrategy(loader, logger);
    const aggregationConfig = {
      id: 'avgKpi',
      metricId: metric.id,
      type: aggregationTypes.weightedStatusScore,
      options: {
        statusScores: { error: 0, warning: 50, success: 100 },
        thresholds: DEFAULT_WEIGHTED_STATUS_SCORE_KPI_RESULT_THRESHOLDS,
      },
    } as const;

    const out = await strategy.aggregate({
      metric,
      entityRefs: ['component:default/a'],
      thresholds,
      aggregationConfig: aggregationConfig as any,
    });

    expect(out.result).toEqual(
      expect.objectContaining({
        total: 3,
        entitiesConsidered: 5,
        calculationErrorCount: 2,
        weightedStatusSum: 150,
        weightedStatusMaxPossible: 300,
        weightedStatusScore: 50,
        aggregationChartDisplayColor: 'warning.main',
      }),
    );
    expect(logger.warn).not.toHaveBeenCalled();
    expect(logger.info).not.toHaveBeenCalled();
  });

  it('logs info and uses default result thresholds when thresholds is omitted', async () => {
    const loadStatusGroupedMetricByEntityRefs = jest.fn().mockResolvedValue({
      values: { error: 1, warning: 1, success: 1 },
      total: 3,
      timestamp: '2025-01-01T10:30:00.000Z',
      entitiesConsidered: 3,
      calculationErrorCount: 0,
    });

    const loader = {
      loadStatusGroupedMetricByEntityRefs,
    } as unknown as AggregatedMetricLoader;

    const logger = mockServices.logger.mock();
    const strategy = new WeightedStatusScoreAggregationStrategy(loader, logger);

    const out = await strategy.aggregate({
      metric,
      entityRefs: ['component:default/a'],
      thresholds,
      aggregationConfig: {
        id: 'avgKpi',
        metricId: metric.id,
        type: aggregationTypes.weightedStatusScore,
        options: {
          statusScores: { error: 0, warning: 50, success: 100 },
        },
      } as any,
    });

    expect(logger.info).toHaveBeenCalledWith(
      expect.stringContaining(
        'options.thresholds" is not configured for weightedStatusScore aggregation',
      ),
    );
    expect(out.result).toEqual(
      expect.objectContaining({
        aggregationChartDisplayColor: 'warning.main',
      }),
    );
  });

  it('throws when options.statusScores is missing', async () => {
    const loader = {
      loadStatusGroupedMetricByEntityRefs: jest.fn().mockResolvedValue({
        values: { success: 1 },
        total: 1,
        timestamp: '2025-01-01T10:30:00.000Z',
        entitiesConsidered: 1,
        calculationErrorCount: 0,
      }),
    } as unknown as AggregatedMetricLoader;

    const logger = mockServices.logger.mock();
    const strategy = new WeightedStatusScoreAggregationStrategy(loader, logger);

    await expect(
      strategy.aggregate({
        metric,
        entityRefs: ['component:default/a'],
        thresholds,
        aggregationConfig: {
          id: 'avgKpi',
          metricId: metric.id,
          type: aggregationTypes.weightedStatusScore,
        } as any,
      }),
    ).rejects.toThrow(
      /statusScores.*required for weightedStatusScore aggregation/,
    );
  });

  it('warns and ignores when loader returns a status not in the metric threshold rules', async () => {
    const loadStatusGroupedMetricByEntityRefs = jest.fn().mockResolvedValue({
      values: { error: 0, warning: 0, success: 1, orphan: 2 },
      total: 3,
      timestamp: '2025-01-01T10:30:00.000Z',
      entitiesConsidered: 4,
      calculationErrorCount: 1,
    });

    const loader = {
      loadStatusGroupedMetricByEntityRefs,
    } as unknown as AggregatedMetricLoader;

    const logger = mockServices.logger.mock();
    const strategy = new WeightedStatusScoreAggregationStrategy(loader, logger);

    const aggregationConfig = {
      id: 'avgKpi',
      metricId: metric.id,
      type: aggregationTypes.weightedStatusScore,
      options: {
        statusScores: { error: 0, warning: 50, success: 100 },
        thresholds: DEFAULT_WEIGHTED_STATUS_SCORE_KPI_RESULT_THRESHOLDS,
      },
    } as const;

    const out = await strategy.aggregate({
      metric,
      entityRefs: ['component:default/a'],
      thresholds,
      aggregationConfig: aggregationConfig as any,
    });

    expect(logger.warn).toHaveBeenCalledWith(expect.stringContaining('orphan'));
    expect(out.result).toEqual(
      expect.objectContaining({
        entitiesConsidered: 4,
        calculationErrorCount: 1,
        weightedStatusSum: 100,
        weightedStatusMaxPossible: 300,
        weightedStatusScore: 33.3,
      }),
    );
  });
});
