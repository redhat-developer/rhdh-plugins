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
import { DEFAULT_AVERAGE_KPI_RESULT_THRESHOLDS } from '../../../constants/aggregationKPIs';
import { AggregatedMetricLoader } from '../AggregatedMetricLoader';
import { AverageAggregationStrategy } from './AverageAggregationStrategy';

describe('AverageAggregationStrategy', () => {
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

  it('computes weighted average fields from loader output', async () => {
    const loadStatusGroupedMetricByEntityRefs = jest.fn().mockResolvedValue({
      values: { error: 1, warning: 1, success: 1 },
      total: 3,
      timestamp: '2025-01-01T10:30:00.000Z',
    });

    const loader = {
      loadStatusGroupedMetricByEntityRefs,
    } as unknown as AggregatedMetricLoader;

    const logger = mockServices.logger.mock();
    const strategy = new AverageAggregationStrategy(loader, logger);
    const aggregationConfig = {
      id: 'avgKpi',
      metricId: metric.id,
      type: aggregationTypes.average,
      options: {
        statusScores: { error: 0, warning: 50, success: 100 },
        thresholds: DEFAULT_AVERAGE_KPI_RESULT_THRESHOLDS,
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
        averageWeightedSum: 150,
        averageMaxPossible: 300,
        averageScore: 0.5,
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
    });

    const loader = {
      loadStatusGroupedMetricByEntityRefs,
    } as unknown as AggregatedMetricLoader;

    const logger = mockServices.logger.mock();
    const strategy = new AverageAggregationStrategy(loader, logger);

    const out = await strategy.aggregate({
      metric,
      entityRefs: ['component:default/a'],
      thresholds,
      aggregationConfig: {
        id: 'avgKpi',
        metricId: metric.id,
        type: aggregationTypes.average,
        options: {
          statusScores: { error: 0, warning: 50, success: 100 },
        },
      } as any,
    });

    expect(logger.info).toHaveBeenCalledWith(
      expect.stringContaining(
        'options.thresholds" is not configured for average aggregation',
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
      }),
    } as unknown as AggregatedMetricLoader;

    const logger = mockServices.logger.mock();
    const strategy = new AverageAggregationStrategy(loader, logger);

    await expect(
      strategy.aggregate({
        metric,
        entityRefs: ['component:default/a'],
        thresholds,
        aggregationConfig: {
          id: 'avgKpi',
          metricId: metric.id,
          type: aggregationTypes.average,
        } as any,
      }),
    ).rejects.toThrow(/statusScores.*required for average aggregation/);
  });

  it('warns and ignores when loader returns a status not in the metric threshold rules', async () => {
    const loadStatusGroupedMetricByEntityRefs = jest.fn().mockResolvedValue({
      values: { error: 0, warning: 0, success: 1, orphan: 2 },
      total: 3,
      timestamp: '2025-01-01T10:30:00.000Z',
    });

    const loader = {
      loadStatusGroupedMetricByEntityRefs,
    } as unknown as AggregatedMetricLoader;

    const logger = mockServices.logger.mock();
    const strategy = new AverageAggregationStrategy(loader, logger);

    const aggregationConfig = {
      id: 'avgKpi',
      metricId: metric.id,
      type: aggregationTypes.average,
      options: {
        statusScores: { error: 0, warning: 50, success: 100 },
        thresholds: DEFAULT_AVERAGE_KPI_RESULT_THRESHOLDS,
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
        averageWeightedSum: 100,
        averageMaxPossible: 300,
        averageScore: 0.333,
      }),
    );
  });
});
