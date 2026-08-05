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
import {
  mockStatusGroupedAggregationConfig,
  mockWeightedStatusScoreAggregationConfig,
} from '../../../../__fixtures__/mockAggregationConfig';
import { mockWeightedStatusScoreAggregationResult } from '../../../../__fixtures__/mockAggregatedMetricResult';
import { mockFirstThresholds } from '../../../../__fixtures__/mockThresholds';
import { AggregatedMetricMapper } from '../../mappers';
import { AggregatedMetricLoader } from '../AggregatedMetricLoader';
import { WeightedStatusScoreAggregationStrategy } from './WeightedStatusScoreAggregationStrategy';
import { mockGithubOpenPrsMetric } from '../../../../__fixtures__/mockMetric';

describe('WeightedStatusScoreAggregationStrategy', () => {
  const metric = mockGithubOpenPrsMetric();

  const aggregationConfig = mockWeightedStatusScoreAggregationConfig({
    id: 'weightedOpenPrs',
    metricId: metric.id,
  });

  const loadedStatusGroupedMetric = {
    values: { success: 2 },
    total: 2,
    timestamp: '2025-01-01T10:30:00.000Z',
    entitiesConsidered: 9,
    calculationErrorCount: 2,
  };

  const mappedWeightedResult = {
    total: loadedStatusGroupedMetric.total,
    timestamp: loadedStatusGroupedMetric.timestamp,
    entitiesConsidered: loadedStatusGroupedMetric.entitiesConsidered,
    calculationErrorCount: loadedStatusGroupedMetric.calculationErrorCount,
    values: [
      { name: 'success', count: 2, score: 100 },
      { name: 'error', count: 0, score: 0 },
    ],
    thresholds: mockFirstThresholds,
    weightedStatusScore: 100,
    weightedStatusSum: 200,
    weightedStatusMaxPossible: 200,
    aggregationChartDisplayColor: 'success.main',
  };

  const entityRefs = ['component:default/a'];
  const logger = mockServices.logger.mock();

  const loader = {
    loadStatusGroupedMetricByEntityRefs: jest
      .fn()
      .mockResolvedValue(loadedStatusGroupedMetric),
  } as unknown as AggregatedMetricLoader;

  const strategy = new WeightedStatusScoreAggregationStrategy(loader, logger);

  let spyMethods: {
    toAggregatedMetricResultSpy: jest.SpyInstance;
  };

  beforeEach(() => {
    jest.clearAllMocks();
    spyMethods = {
      toAggregatedMetricResultSpy: jest
        .spyOn(AggregatedMetricMapper, 'toAggregatedMetricResult')
        .mockReturnValue({
          id: 'weightedOpenPrs',
          status: 'success',
          metadata: {
            title: 'Open PRs',
            description: 'desc',
            type: 'number',
            history: undefined,
            aggregationType: aggregationTypes.weightedStatusScore,
          },
          result: mockWeightedStatusScoreAggregationResult,
        }),
    };
  });

  it('should throw when aggregation type is not weightedStatusScore', async () => {
    const invalidAggregationConfig = mockStatusGroupedAggregationConfig({
      id: 'openPrsByStatus',
      metricId: metric.id,
    });

    await expect(() =>
      strategy.aggregate({
        metric,
        entityRefs,
        thresholds: mockFirstThresholds,
        aggregationConfig: invalidAggregationConfig,
      }),
    ).rejects.toThrow(
      /Expected aggregation type "weightedStatusScore" but received "statusGrouped"/,
    );
  });

  it('should throw when aggregation chart display color is not configured', async () => {
    const aggregationConfigWithoutColors =
      mockWeightedStatusScoreAggregationConfig({
        id: 'weightedOpenPrs',
        metricId: metric.id,
        options: {
          statusScores: { error: 0, warning: 50, success: 100 },
          thresholds: {
            rules: [
              { key: 'success', expression: '>=80' },
              { key: 'error', expression: '<80' },
            ],
          },
        },
      });

    await expect(() =>
      strategy.aggregate({
        metric,
        entityRefs,
        thresholds: mockFirstThresholds,
        aggregationConfig: aggregationConfigWithoutColors,
      }),
    ).rejects.toThrow(
      `The color for percentage '100' metric '${metric.id}' is not configured. Check the 'scorecard.aggregationKPIs.weightedOpenPrs.options.thresholds' configuration.`,
    );
  });

  it('should use default thresholds when no provided', async () => {
    const defaultAggregationConfig = mockWeightedStatusScoreAggregationConfig({
      id: 'weightedOpenPrs',
      metricId: metric.id,
      options: {
        statusScores: { error: 0, warning: 50, success: 100 },
        thresholds: undefined,
      },
    });

    await strategy.aggregate({
      metric,
      entityRefs,
      thresholds: mockFirstThresholds,
      aggregationConfig: defaultAggregationConfig,
    });

    expect(spyMethods.toAggregatedMetricResultSpy).toHaveBeenCalledWith(
      metric,
      mappedWeightedResult,
      defaultAggregationConfig,
    );
  });

  it('should load status-grouped aggregate', async () => {
    await strategy.aggregate({
      metric,
      entityRefs,
      thresholds: mockFirstThresholds,
      aggregationConfig,
    });

    expect(loader.loadStatusGroupedMetricByEntityRefs).toHaveBeenCalledWith(
      entityRefs,
      metric.id,
    );
  });

  it('should map to aggregated metric result', async () => {
    await strategy.aggregate({
      metric,
      entityRefs,
      thresholds: mockFirstThresholds,
      aggregationConfig,
    });

    expect(spyMethods.toAggregatedMetricResultSpy).toHaveBeenCalledWith(
      metric,
      mappedWeightedResult,
      aggregationConfig,
    );
  });

  it('should get aggregation result', async () => {
    const result = await strategy.aggregate({
      metric,
      entityRefs,
      thresholds: mockFirstThresholds,
      aggregationConfig,
    });

    expect(result).toEqual({
      id: 'weightedOpenPrs',
      status: 'success',
      metadata: {
        title: 'Open PRs',
        description: 'desc',
        type: 'number',
        history: undefined,
        aggregationType: aggregationTypes.weightedStatusScore,
      },
      result: mockWeightedStatusScoreAggregationResult,
    });
  });
});
