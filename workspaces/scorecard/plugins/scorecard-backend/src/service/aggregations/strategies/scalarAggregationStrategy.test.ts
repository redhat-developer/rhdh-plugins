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
  aggregationTypes,
  DEFAULT_NUMBER_THRESHOLDS,
} from '@red-hat-developer-hub/backstage-plugin-scorecard-common';
import { mockScalarAggregationConfig } from '../../../../__fixtures__/mockAggregationConfig';
import { AggregatedMetricLoader } from '../AggregatedMetricLoader';
import { ScalarAggregationStrategy } from './ScalarAggregationStrategy';
import * as aggregationUtils from '../../../utils/aggregation/isScalarAggregationConfig';
import { AggregatedMetricMapper } from '../../mappers';
import { mockScalarAggregationResult } from '../../../../__fixtures__/mockAggregatedMetricResult';
import {
  mockHigherIsBetterThresholds,
  mockLowerIsBetterThresholds,
} from '../../../../__fixtures__/mockThresholds';
import { mockGithubOpenPrsMetric } from '../../../../__fixtures__/mockMetric';

jest.mock('../../../utils/aggregation/isScalarAggregationConfig');

describe('ScalarAggregationStrategy', () => {
  const metric = mockGithubOpenPrsMetric();

  const aggregationConfig = mockScalarAggregationConfig(aggregationTypes.sum, {
    id: 'totalOpenPrs',
    metricId: metric.id,
    options: {
      thresholds: mockHigherIsBetterThresholds,
    },
  });

  const loadedScalarMetric = {
    value: 847,
    total: 42,
    entitiesConsidered: 45,
    calculationErrorCount: 3,
    timestamp: '2025-01-01T10:30:00.000Z',
  };

  const entityRefs = ['component:default/a'];

  const loader = {
    loadScalarMetricByEntityRefs: jest
      .fn()
      .mockResolvedValue(loadedScalarMetric),
    loadScalarMetricTimeSeriesByEntityRefs: jest.fn(),
  } as unknown as AggregatedMetricLoader;

  const strategy = new ScalarAggregationStrategy(loader, 'sum');

  let spyMethods: {
    isScalarAggregationConfigSpy: jest.SpyInstance;
    toAggregatedMetricResultSpy: jest.SpyInstance;
  };

  beforeEach(() => {
    spyMethods = {
      isScalarAggregationConfigSpy: jest
        .spyOn(aggregationUtils, 'isScalarAggregationConfig')
        .mockReturnValue(true),
      toAggregatedMetricResultSpy: jest
        .spyOn(AggregatedMetricMapper, 'toAggregatedMetricResult')
        .mockReturnValue({
          id: 'totalOpenPrs',
          status: 'success',
          metadata: {
            title: 'Open PRs',
            description: 'desc',
            type: 'number',
            history: undefined,
            aggregationType: aggregationTypes.sum,
          },
          result: mockScalarAggregationResult,
        }),
    };
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should throw when aggregationFn is not a scalar type', async () => {
    spyMethods.isScalarAggregationConfigSpy.mockReturnValue(false);

    await expect(() =>
      strategy.aggregate({
        metric,
        entityRefs,
        thresholds: mockHigherIsBetterThresholds,
        aggregationConfig,
      }),
    ).rejects.toThrow(/Expected a scalar aggregation config/);

    expect(spyMethods.isScalarAggregationConfigSpy).toHaveBeenCalledWith(
      aggregationConfig,
    );
  });

  it('should use default thresholds when custom not provided', async () => {
    const defaultAggregationConfig = mockScalarAggregationConfig(
      aggregationTypes.sum,
      {
        id: 'totalOpenPrs',
        metricId: metric.id,
        options: {},
      },
    );

    await strategy.aggregate({
      metric,
      entityRefs,
      thresholds: mockHigherIsBetterThresholds,
      aggregationConfig: defaultAggregationConfig,
    });

    expect(spyMethods.toAggregatedMetricResultSpy).toHaveBeenCalledWith(
      metric,
      {
        ...loadedScalarMetric,
        thresholds: DEFAULT_NUMBER_THRESHOLDS,
        aggregationChartDisplayColor: 'error.main',
      },
      defaultAggregationConfig,
    );
  });

  it('should use KPI options.thresholds when provided', async () => {
    await strategy.aggregate({
      metric,
      entityRefs,
      thresholds: mockLowerIsBetterThresholds, // thresholds from metric are not used
      aggregationConfig,
    });

    expect(spyMethods.toAggregatedMetricResultSpy).toHaveBeenCalledWith(
      metric,
      {
        ...loadedScalarMetric,
        thresholds: mockHigherIsBetterThresholds,
        aggregationChartDisplayColor: 'green',
      },
      aggregationConfig,
    );
  });

  it('should throw when aggregation chart display color is not configured', async () => {
    const aggregationConfigWithoutColors = mockScalarAggregationConfig(
      aggregationTypes.sum,
      {
        id: 'totalOpenPrs',
        metricId: metric.id,
        options: {
          thresholds: {
            rules: [{ key: 'success', expression: '<10' }],
          },
        },
      },
    );

    await expect(() =>
      strategy.aggregate({
        metric,
        entityRefs,
        thresholds: mockHigherIsBetterThresholds,
        aggregationConfig: aggregationConfigWithoutColors,
      }),
    ).rejects.toThrow(
      `The color for value '${loadedScalarMetric.value}' metric '${metric.id}' is not configured. Check the 'scorecard.aggregationKPIs.totalOpenPrs.options.thresholds' configuration.`,
    );
  });

  it('should set aggregationChartDisplayColor to null when total is 0', async () => {
    (loader.loadScalarMetricByEntityRefs as jest.Mock).mockResolvedValueOnce({
      ...loadedScalarMetric,
      value: 0,
      total: 0,
    });

    await strategy.aggregate({
      metric,
      entityRefs,
      thresholds: mockHigherIsBetterThresholds,
      aggregationConfig,
    });

    expect(spyMethods.toAggregatedMetricResultSpy).toHaveBeenCalledWith(
      metric,
      {
        ...loadedScalarMetric,
        value: 0,
        total: 0,
        thresholds: mockHigherIsBetterThresholds,
        aggregationChartDisplayColor: null,
      },
      aggregationConfig,
    );
  });

  it('should load scalar aggregate and maps to API result', async () => {
    await strategy.aggregate({
      metric,
      entityRefs,
      thresholds: mockHigherIsBetterThresholds,
      aggregationConfig,
    });

    expect(loader.loadScalarMetricByEntityRefs).toHaveBeenCalledWith(
      entityRefs,
      metric.id,
      'sum',
      undefined,
    );
  });

  it('should forward filter.status to the scalar loader', async () => {
    const filteredConfig = mockScalarAggregationConfig(aggregationTypes.sum, {
      id: 'totalCriticalPrs',
      metricId: metric.id,
      filter: { status: 'error' },
      options: {
        thresholds: mockHigherIsBetterThresholds,
      },
    });

    await strategy.aggregate({
      metric,
      entityRefs,
      thresholds: mockHigherIsBetterThresholds,
      aggregationConfig: filteredConfig,
    });

    expect(loader.loadScalarMetricByEntityRefs).toHaveBeenCalledWith(
      entityRefs,
      metric.id,
      'sum',
      { status: 'error' },
    );
  });

  it('should map to aggregated metric result', async () => {
    await strategy.aggregate({
      metric,
      entityRefs,
      thresholds: mockHigherIsBetterThresholds,
      aggregationConfig,
    });

    expect(spyMethods.toAggregatedMetricResultSpy).toHaveBeenCalledWith(
      metric,
      {
        ...loadedScalarMetric,
        thresholds: mockHigherIsBetterThresholds,
        aggregationChartDisplayColor: 'green',
      },
      aggregationConfig,
    );
  });

  it('should get aggregation result', async () => {
    const result = await strategy.aggregate({
      metric,
      entityRefs,
      thresholds: mockHigherIsBetterThresholds,
      aggregationConfig,
    });
    expect(result).toEqual({
      id: 'totalOpenPrs',
      status: 'success',
      metadata: {
        title: 'Open PRs',
        description: 'desc',
        type: 'number',
        history: undefined,
        aggregationType: aggregationTypes.sum,
      },
      result: mockScalarAggregationResult,
    });
  });

  describe('aggregateTimeSeries', () => {
    const from = new Date('2024-01-01T00:00:00Z');
    const to = new Date('2024-01-31T00:00:00Z');
    const loadedPoints = [
      {
        value: 12,
        successCount: 3,
        errorCount: 0,
        total: 3,
        status: 'success' as const,
        timestamp: '2024-01-01T00:00:00.000Z',
      },
    ];

    beforeEach(() => {
      (
        loader.loadScalarMetricTimeSeriesByEntityRefs as jest.Mock
      ).mockResolvedValue(loadedPoints);
    });

    it('should throw when aggregationFn is not a scalar type', async () => {
      spyMethods.isScalarAggregationConfigSpy.mockReturnValue(false);

      await expect(() =>
        strategy.aggregateTimeSeries({
          metric,
          entityRefs,
          thresholds: mockHigherIsBetterThresholds,
          aggregationConfig,
          from,
          to,
        }),
      ).rejects.toThrow(/Expected a scalar aggregation config/);
    });

    it('should use default thresholds when custom not provided', async () => {
      const defaultAggregationConfig = mockScalarAggregationConfig(
        aggregationTypes.sum,
        {
          id: 'totalOpenPrs',
          metricId: metric.id,
          options: {},
        },
      );

      const result = await strategy.aggregateTimeSeries({
        metric,
        entityRefs,
        thresholds: mockLowerIsBetterThresholds,
        aggregationConfig: defaultAggregationConfig,
        from,
        to,
      });

      expect(result.thresholds).toEqual(DEFAULT_NUMBER_THRESHOLDS);
      expect(result.aggregationChartDisplayColor).toBe('warning.main');
    });

    it('should use KPI options.thresholds when provided', async () => {
      const result = await strategy.aggregateTimeSeries({
        metric,
        entityRefs,
        thresholds: mockLowerIsBetterThresholds,
        aggregationConfig,
        from,
        to,
      });

      expect(result.thresholds).toEqual(mockHigherIsBetterThresholds);
      expect(result.thresholds).not.toEqual(mockLowerIsBetterThresholds);
      expect(result.aggregationChartDisplayColor).toBe('red');
    });

    it('should load scalar time series and classify the latest point', async () => {
      const result = await strategy.aggregateTimeSeries({
        metric,
        entityRefs,
        thresholds: mockHigherIsBetterThresholds,
        aggregationConfig,
        from,
        to,
      });

      expect(
        loader.loadScalarMetricTimeSeriesByEntityRefs,
      ).toHaveBeenCalledWith(entityRefs, metric.id, 'sum', from, to, undefined);
      expect(result).toEqual({
        id: aggregationConfig.id,
        metricId: metric.id,
        points: loadedPoints,
        metadata: expect.objectContaining({
          aggregationType: aggregationTypes.sum,
        }),
        thresholds: mockHigherIsBetterThresholds,
        aggregationChartDisplayColor: 'red',
      });
    });

    it('should classify the last successful point when a later day is only errors', async () => {
      (
        loader.loadScalarMetricTimeSeriesByEntityRefs as jest.Mock
      ).mockResolvedValue([
        ...loadedPoints,
        {
          value: null,
          successCount: 0,
          errorCount: 1,
          total: 1,
          status: 'error' as const,
          errors: [{ message: 'boom', count: 1 }],
          timestamp: '2024-01-02T00:00:00.000Z',
        },
      ]);

      const result = await strategy.aggregateTimeSeries({
        metric,
        entityRefs,
        thresholds: mockHigherIsBetterThresholds,
        aggregationConfig,
        from,
        to,
      });

      expect(result.aggregationChartDisplayColor).toBe('red');
    });

    it('should set aggregationChartDisplayColor to null when there are no points', async () => {
      (
        loader.loadScalarMetricTimeSeriesByEntityRefs as jest.Mock
      ).mockResolvedValue([]);

      const result = await strategy.aggregateTimeSeries({
        metric,
        entityRefs,
        thresholds: mockHigherIsBetterThresholds,
        aggregationConfig,
        from,
        to,
      });

      expect(result.points).toEqual([]);
      expect(result.aggregationChartDisplayColor).toBeNull();
      expect(result.thresholds).toEqual(mockHigherIsBetterThresholds);
    });

    it('should forward filter.status to the scalar time-series loader', async () => {
      const filteredConfig = mockScalarAggregationConfig(aggregationTypes.sum, {
        id: 'totalCriticalPrs',
        metricId: metric.id,
        filter: { status: 'error' },
        options: {
          thresholds: mockHigherIsBetterThresholds,
        },
      });

      await strategy.aggregateTimeSeries({
        metric,
        entityRefs,
        thresholds: mockHigherIsBetterThresholds,
        aggregationConfig: filteredConfig,
        from,
        to,
      });

      expect(
        loader.loadScalarMetricTimeSeriesByEntityRefs,
      ).toHaveBeenCalledWith(entityRefs, metric.id, 'sum', from, to, {
        status: 'error',
      });
    });
  });
});
