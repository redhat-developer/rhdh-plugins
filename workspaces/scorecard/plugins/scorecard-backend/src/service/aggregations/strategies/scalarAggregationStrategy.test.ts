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
import { mockFirstThresholds } from '../../../../__fixtures__/mockThresholds';
import { mockGithubOpenPrsMetric } from '../../../../__fixtures__/mockMetric';

jest.mock('../../../utils/aggregation/isScalarAggregationConfig');

describe('ScalarAggregationStrategy', () => {
  const metric = mockGithubOpenPrsMetric();

  const aggregationConfig = mockScalarAggregationConfig(aggregationTypes.sum, {
    id: 'totalOpenPrs',
    metricId: metric.id,
    options: {
      thresholds: mockFirstThresholds,
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
        thresholds: mockFirstThresholds,
        aggregationConfig,
      }),
    ).rejects.toThrow(/Expected a scalar aggregation config/);

    expect(spyMethods.isScalarAggregationConfigSpy).toHaveBeenCalledWith(
      aggregationConfig,
    );
  });

  it('should use default thresholds when no provided', async () => {
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
      thresholds: mockFirstThresholds,
      aggregationConfig: defaultAggregationConfig,
    });

    expect(spyMethods.toAggregatedMetricResultSpy).toHaveBeenCalledWith(
      metric,
      { ...loadedScalarMetric, thresholds: DEFAULT_NUMBER_THRESHOLDS },
      defaultAggregationConfig,
    );
  });

  it('should load scalar aggregate and maps to API result', async () => {
    await strategy.aggregate({
      metric,
      entityRefs,
      thresholds: mockFirstThresholds,
      aggregationConfig,
    });

    expect(loader.loadScalarMetricByEntityRefs).toHaveBeenCalledWith(
      entityRefs,
      metric.id,
      'sum',
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
      { ...loadedScalarMetric, thresholds: mockFirstThresholds },
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
});
