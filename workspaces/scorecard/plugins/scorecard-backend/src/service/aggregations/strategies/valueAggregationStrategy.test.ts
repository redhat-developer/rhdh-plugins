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
  Metric,
  ThresholdConfig,
} from '@red-hat-developer-hub/backstage-plugin-scorecard-common';
import {
  mockScalarAggregationConfig,
  mockStatusGroupedAggregationConfig,
} from '../../../../__fixtures__/mockAggregationConfig';
import { AggregatedMetricLoader } from '../AggregatedMetricLoader';
import { ValueAggregationStrategy } from './ValueAggregationStrategy';
import type { ScalarAggregationFn } from '../../../database/types';

describe('ValueAggregationStrategy', () => {
  const metric = {
    id: 'github.open_prs',
    title: 'Open PRs',
    description: 'desc',
    type: 'number',
  } as Metric;

  const providerThresholds: ThresholdConfig = {
    rules: [
      { key: 'error', expression: '>40' },
      { key: 'warning', expression: '>20' },
      { key: 'success', expression: '<=20' },
    ],
  };

  it('should load scalar aggregate and maps to API result', async () => {
    const loadScalarMetricByEntityRefs = jest.fn().mockResolvedValue({
      value: 847,
      total: 42,
      entitiesConsidered: 45,
      calculationErrorCount: 3,
      timestamp: '2025-01-01T10:30:00.000Z',
    });

    const loader = {
      loadScalarMetricByEntityRefs,
    } as unknown as AggregatedMetricLoader;

    const strategy = new ValueAggregationStrategy(loader, 'sum');
    const aggregationConfig = mockScalarAggregationConfig(
      aggregationTypes.sum,
      {
        id: 'totalOpenPrs',
        metricId: metric.id,
        options: undefined,
      },
    );

    const result = await strategy.aggregate({
      metric,
      entityRefs: ['component:default/a'],
      thresholds: providerThresholds,
      aggregationConfig,
    });

    expect(loadScalarMetricByEntityRefs).toHaveBeenCalledWith(
      ['component:default/a'],
      metric.id,
      'sum',
    );
    expect(result.metadata.aggregationType).toBe(aggregationTypes.sum);
    expect(result.result).toEqual({
      value: 847,
      total: 42,
      entitiesConsidered: 45,
      calculationErrorCount: 3,
      timestamp: '2025-01-01T10:30:00.000Z',
      thresholds: DEFAULT_NUMBER_THRESHOLDS,
    });
  });

  it('should return zero scalar result for empty entityRefs', async () => {
    const loadScalarMetricByEntityRefs = jest.fn().mockResolvedValue({
      value: 0,
      total: 0,
      entitiesConsidered: 0,
      calculationErrorCount: 0,
      timestamp: '2025-01-01T00:00:00.000Z',
    });

    const loader = {
      loadScalarMetricByEntityRefs,
    } as unknown as AggregatedMetricLoader;

    const strategy = new ValueAggregationStrategy(loader, 'average');

    const result = await strategy.aggregate({
      metric,
      entityRefs: [],
      thresholds: providerThresholds,
      aggregationConfig: mockScalarAggregationConfig(aggregationTypes.average, {
        id: metric.id,
        metricId: metric.id,
        options: undefined,
      }),
    });

    expect(loadScalarMetricByEntityRefs).toHaveBeenCalledWith(
      [],
      metric.id,
      'average',
    );
    expect(result.result).toEqual({
      value: 0,
      total: 0,
      entitiesConsidered: 0,
      calculationErrorCount: 0,
      timestamp: '2025-01-01T00:00:00.000Z',
      thresholds: DEFAULT_NUMBER_THRESHOLDS,
    });
  });

  it('should use options.thresholds from aggregationConfig when provided', async () => {
    const kpiThresholds = {
      rules: [
        { key: 'success', expression: '>=80', color: 'success.main' },
        { key: 'warning', expression: '10-79', color: 'warning.main' },
        { key: 'error', expression: '<10', color: 'error.main' },
      ],
    };

    const loadScalarMetricByEntityRefs = jest.fn().mockResolvedValue({
      value: 50,
      total: 10,
      entitiesConsidered: 10,
      calculationErrorCount: 0,
      timestamp: '2025-01-01T10:30:00.000Z',
    });

    const loader = {
      loadScalarMetricByEntityRefs,
    } as unknown as AggregatedMetricLoader;

    const strategy = new ValueAggregationStrategy(loader, 'sum');

    const result = await strategy.aggregate({
      metric,
      entityRefs: ['component:default/a'],
      thresholds: providerThresholds,
      aggregationConfig: mockScalarAggregationConfig(aggregationTypes.sum, {
        id: 'totalOpenPrs',
        metricId: metric.id,
        options: { thresholds: kpiThresholds },
      }),
    });

    expect(result.result).toMatchObject({
      thresholds: kpiThresholds,
    });
  });

  it('should throw when aggregationConfig is not a scalar type', async () => {
    const loader = {
      loadScalarMetricByEntityRefs: jest.fn(),
    } as unknown as AggregatedMetricLoader;

    const strategy = new ValueAggregationStrategy(loader, 'sum');

    await expect(
      strategy.aggregate({
        metric,
        entityRefs: ['component:default/a'],
        thresholds: providerThresholds,
        aggregationConfig: mockStatusGroupedAggregationConfig(),
      }),
    ).rejects.toThrow(/Expected a validated scalar aggregation config/);
    expect(loader.loadScalarMetricByEntityRefs).not.toHaveBeenCalled();
  });

  it.each([
    ['sum', aggregationTypes.sum],
    ['average', aggregationTypes.average],
    ['max', aggregationTypes.max],
    ['min', aggregationTypes.min],
    ['count', aggregationTypes.count],
  ] as const)(
    'should pass aggregationFn %s to loader',
    async (aggregationFn, aggregationType) => {
      const loadScalarMetricByEntityRefs = jest.fn().mockResolvedValue({
        value: 1,
        total: 1,
        entitiesConsidered: 1,
        calculationErrorCount: 0,
        timestamp: '2025-01-01T10:30:00.000Z',
      });

      const loader = {
        loadScalarMetricByEntityRefs,
      } as unknown as AggregatedMetricLoader;

      const strategy = new ValueAggregationStrategy(
        loader,
        aggregationFn as ScalarAggregationFn,
      );

      await strategy.aggregate({
        metric,
        entityRefs: ['component:default/a'],
        thresholds: providerThresholds,
        aggregationConfig: mockScalarAggregationConfig(aggregationType, {
          id: 'kpi',
          metricId: metric.id,
          options: undefined,
        }),
      });

      expect(loadScalarMetricByEntityRefs).toHaveBeenCalledWith(
        ['component:default/a'],
        metric.id,
        aggregationFn,
      );
    },
  );
});
