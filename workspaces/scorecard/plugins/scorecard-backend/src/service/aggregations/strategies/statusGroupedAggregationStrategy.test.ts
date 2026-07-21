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

import { aggregationTypes } from '@red-hat-developer-hub/backstage-plugin-scorecard-common';
import {
  mockScalarAggregationConfig,
  mockStatusGroupedAggregationConfig,
} from '../../../../__fixtures__/mockAggregationConfig';
import { mockStatusGroupedAggregationResult } from '../../../../__fixtures__/mockAggregatedMetricResult';
import { mockFirstThresholds } from '../../../../__fixtures__/mockThresholds';
import { AggregatedMetricMapper } from '../../mappers';
import { AggregatedMetricLoader } from '../AggregatedMetricLoader';
import { StatusGroupedAggregationStrategy } from './StatusGroupedAggregationStrategy';
import { mockGithubOpenPrsMetric } from '../../../../__fixtures__/mockMetric';

describe('StatusGroupedAggregationStrategy', () => {
  const metric = mockGithubOpenPrsMetric();

  const aggregationConfig = mockStatusGroupedAggregationConfig({
    id: 'openPrsByStatus',
    metricId: metric.id,
  });

  const loadedStatusGroupedMetric = {
    values: { success: 2 },
    total: 2,
    timestamp: '2025-01-01T10:30:00.000Z',
    entitiesConsidered: 9,
    calculationErrorCount: 2,
  };

  const mappedStatusGroupedResult = {
    total: loadedStatusGroupedMetric.total,
    timestamp: loadedStatusGroupedMetric.timestamp,
    entitiesConsidered: loadedStatusGroupedMetric.entitiesConsidered,
    calculationErrorCount: loadedStatusGroupedMetric.calculationErrorCount,
    values: [
      { name: 'success', count: 2 },
      { name: 'error', count: 0 },
    ],
    thresholds: mockFirstThresholds,
  };

  const entityRefs = ['component:default/a'];

  const loader = {
    loadStatusGroupedMetricByEntityRefs: jest
      .fn()
      .mockResolvedValue(loadedStatusGroupedMetric),
  } as unknown as AggregatedMetricLoader;

  const strategy = new StatusGroupedAggregationStrategy(loader);

  let spyMethods: {
    toAggregatedMetricResultSpy: jest.SpyInstance;
  };

  beforeEach(() => {
    jest.clearAllMocks();
    spyMethods = {
      toAggregatedMetricResultSpy: jest
        .spyOn(AggregatedMetricMapper, 'toAggregatedMetricResult')
        .mockReturnValue({
          id: 'openPrsByStatus',
          status: 'success',
          metadata: {
            title: 'Open PRs',
            description: 'desc',
            type: 'number',
            history: undefined,
            aggregationType: aggregationTypes.statusGrouped,
          },
          result: mockStatusGroupedAggregationResult,
        }),
    };
  });

  it('should throw when aggregation type is not statusGrouped', async () => {
    const invalidAggregationConfig = mockScalarAggregationConfig(
      aggregationTypes.sum,
      {
        id: 'totalOpenPrs',
        metricId: metric.id,
      },
    );

    await expect(() =>
      strategy.aggregate({
        metric,
        entityRefs,
        thresholds: mockFirstThresholds,
        aggregationConfig: invalidAggregationConfig,
      }),
    ).rejects.toThrow(
      /Expected aggregation type "statusGrouped" but received "sum"/,
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
      mappedStatusGroupedResult,
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
      id: 'openPrsByStatus',
      status: 'success',
      metadata: {
        title: 'Open PRs',
        description: 'desc',
        type: 'number',
        history: undefined,
        aggregationType: aggregationTypes.statusGrouped,
      },
      result: mockStatusGroupedAggregationResult,
    });
  });
});
