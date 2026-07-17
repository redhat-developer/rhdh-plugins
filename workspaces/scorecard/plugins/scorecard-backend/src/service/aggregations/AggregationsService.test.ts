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
import { AggregationsService } from './AggregationsService';
import type { DatabaseMetricValues } from '../../database/DatabaseMetricValues';
import {
  mockScalarAggregationConfig,
  mockStatusGroupedAggregationConfig,
  mockWeightedStatusScoreAggregationConfig,
} from '../../../__fixtures__/mockAggregationConfig';
import {
  mockStatusGroupedAggregationResult,
  mockWeightedStatusScoreAggregationResult,
  mockScalarAggregationResult,
} from '../../../__fixtures__/mockAggregatedMetricResult';
import { mockFirstThresholds } from '../../../__fixtures__/mockThresholds';
import { buildMockMetricProvidersRegistry } from '../../../__fixtures__/mockMetricProvidersRegistry';
import { createAggregationStrategyRegistry } from './strategies/registerStrategies';
import type { AggregationStrategy } from './strategies/types';
import { mockGithubOpenPrsMetric } from '../../../__fixtures__/mockMetric';

jest.mock('./strategies/registerStrategies');

describe('AggregationsService', () => {
  const metric = mockGithubOpenPrsMetric();

  const entityRefs = ['component:default/a'];
  const logger = mockServices.logger.mock();
  const database = {} as DatabaseMetricValues;
  const metricProvidersRegistry = buildMockMetricProvidersRegistry({
    metricsList: [metric],
  });

  const statusGroupedAggregationConfig = mockStatusGroupedAggregationConfig({
    id: 'openPrsByStatus',
    metricId: metric.id,
  });

  const weightedAggregationConfig = mockWeightedStatusScoreAggregationConfig({
    id: 'weightedOpenPrs',
    metricId: metric.id,
  });

  const scalarAggregationConfig = mockScalarAggregationConfig(
    aggregationTypes.sum,
    {
      id: 'totalOpenPrs',
      metricId: metric.id,
    },
  );

  const statusGroupedApiResult = {
    id: 'openPrsByStatus',
    status: 'success' as const,
    metadata: {
      title: 'Open PRs',
      description: 'desc',
      type: 'number' as const,
      history: undefined,
      aggregationType: aggregationTypes.statusGrouped,
    },
    result: mockStatusGroupedAggregationResult,
  };

  const weightedApiResult = {
    id: 'weightedOpenPrs',
    status: 'success' as const,
    metadata: {
      title: 'Open PRs',
      description: 'desc',
      type: 'number' as const,
      history: undefined,
      aggregationType: aggregationTypes.weightedStatusScore,
    },
    result: mockWeightedStatusScoreAggregationResult,
  };

  const scalarApiResult = {
    id: 'totalOpenPrs',
    status: 'success' as const,
    metadata: {
      title: 'Open PRs',
      description: 'desc',
      type: 'number' as const,
      history: undefined,
      aggregationType: aggregationTypes.sum,
    },
    result: mockScalarAggregationResult,
  };

  const statusGroupedStrategy = {
    aggregate: jest.fn(),
  } as unknown as jest.Mocked<AggregationStrategy>;

  const weightedStrategy = {
    aggregate: jest.fn(),
  } as unknown as jest.Mocked<AggregationStrategy>;

  const scalarStrategy = {
    aggregate: jest.fn(),
  } as unknown as jest.Mocked<AggregationStrategy>;

  let service: AggregationsService;

  beforeEach(() => {
    jest.clearAllMocks();

    (createAggregationStrategyRegistry as jest.Mock).mockReturnValue(
      new Map<string, AggregationStrategy>([
        [aggregationTypes.statusGrouped, statusGroupedStrategy],
        [aggregationTypes.weightedStatusScore, weightedStrategy],
        [aggregationTypes.sum, scalarStrategy],
      ]),
    );

    statusGroupedStrategy.aggregate.mockResolvedValue(statusGroupedApiResult);
    weightedStrategy.aggregate.mockResolvedValue(weightedApiResult);
    scalarStrategy.aggregate.mockResolvedValue(scalarApiResult);

    service = new AggregationsService({
      config: mockServices.rootConfig({ data: {} }),
      database,
      logger,
    });
  });

  describe('getAggregatedMetricByEntityRefs', () => {
    it('should call statusGrouped strategy with aggregation options', async () => {
      const options = {
        metric,
        entityRefs,
        thresholds: mockFirstThresholds,
        aggregationConfig: statusGroupedAggregationConfig,
      };

      await service.getAggregatedMetricByEntityRefs(options);

      expect(statusGroupedStrategy.aggregate).toHaveBeenCalledWith(options);
      expect(weightedStrategy.aggregate).not.toHaveBeenCalled();
      expect(scalarStrategy.aggregate).not.toHaveBeenCalled();
    });

    it('should return statusGrouped strategy result', async () => {
      const result = await service.getAggregatedMetricByEntityRefs({
        metric,
        entityRefs,
        thresholds: mockFirstThresholds,
        aggregationConfig: statusGroupedAggregationConfig,
      });

      expect(result).toEqual(statusGroupedApiResult);
    });

    it('should call weightedStatusScore strategy when configured', async () => {
      const options = {
        metric,
        entityRefs,
        thresholds: mockFirstThresholds,
        aggregationConfig: weightedAggregationConfig,
      };

      const result = await service.getAggregatedMetricByEntityRefs(options);

      expect(weightedStrategy.aggregate).toHaveBeenCalledWith(options);
      expect(result).toEqual(weightedApiResult);
    });

    it('should call scalar strategy when configured', async () => {
      const options = {
        metric,
        entityRefs,
        thresholds: mockFirstThresholds,
        aggregationConfig: scalarAggregationConfig,
      };

      const result = await service.getAggregatedMetricByEntityRefs(options);

      expect(scalarStrategy.aggregate).toHaveBeenCalledWith(options);
      expect(result).toEqual(scalarApiResult);
    });

    it('should throw when aggregation type is not registered', async () => {
      await expect(() =>
        service.getAggregatedMetricByEntityRefs({
          metric,
          entityRefs: [],
          thresholds: mockFirstThresholds,
          aggregationConfig: {
            id: metric.id,
            metricId: metric.id,
            type: 'unknownStrategy' as any,
          } as any,
        }),
      ).rejects.toThrow(/Unsupported aggregation type: unknownStrategy/);
    });
  });

  describe('getAggregationConfig', () => {
    it('should default to statusGrouped with metric metadata when KPI config is absent', () => {
      const config = service.getAggregationConfig(
        'github.open_prs',
        metricProvidersRegistry,
      );

      expect(config).toEqual({
        id: 'github.open_prs',
        metricId: 'github.open_prs',
        title: metric.title,
        description: metric.description,
        type: aggregationTypes.statusGrouped,
      });
      expect(metricProvidersRegistry.getMetric).toHaveBeenCalledWith(
        'github.open_prs',
      );
      expect(logger.warn).toHaveBeenCalledWith(
        expect.stringContaining('github.open_prs'),
      );
    });

    it('should use scorecard.aggregationKPIs when present', () => {
      const config = mockServices.rootConfig({
        data: {
          scorecard: {
            aggregationKPIs: {
              myKpi: {
                title: 'KPI title',
                description: 'KPI desc',
                type: aggregationTypes.weightedStatusScore,
                metricId: 'github.open_prs',
                options: {
                  statusScores: { error: 0, warning: 50, success: 100 },
                },
              },
            },
          },
        },
      });

      const serviceWithConfig = new AggregationsService({
        config,
        database,
        logger,
      });

      expect(
        serviceWithConfig.getAggregationConfig(
          'myKpi',
          metricProvidersRegistry,
        ),
      ).toEqual(
        expect.objectContaining({
          id: 'myKpi',
          metricId: 'github.open_prs',
          title: 'KPI title',
          description: 'KPI desc',
          type: aggregationTypes.weightedStatusScore,
        }),
      );
      expect(metricProvidersRegistry.getMetric).not.toHaveBeenCalled();
    });

    it('should parse scalar sum KPI from scorecard.aggregationKPIs', () => {
      const config = mockServices.rootConfig({
        data: {
          scorecard: {
            aggregationKPIs: {
              totalOpenPrs: {
                title: 'Total Open PRs',
                description: 'Sum of open PRs',
                type: aggregationTypes.sum,
                metricId: 'github.open_prs',
              },
            },
          },
        },
      });

      const serviceWithConfig = new AggregationsService({
        config,
        database,
        logger,
      });

      expect(
        serviceWithConfig.getAggregationConfig(
          'totalOpenPrs',
          metricProvidersRegistry,
        ),
      ).toEqual(
        expect.objectContaining({
          id: 'totalOpenPrs',
          metricId: 'github.open_prs',
          title: 'Total Open PRs',
          description: 'Sum of open PRs',
          type: aggregationTypes.sum,
        }),
      );
    });

    it('should return cached config on repeated lookup for configured KPIs', () => {
      const config = mockServices.rootConfig({
        data: {
          scorecard: {
            aggregationKPIs: {
              myKpi: {
                title: 'KPI title',
                description: 'KPI desc',
                type: aggregationTypes.sum,
                metricId: 'github.open_prs',
              },
            },
          },
        },
      });

      const getOptionalConfigSpy = jest.spyOn(config, 'getOptionalConfig');

      const serviceWithConfig = new AggregationsService({
        config,
        database,
        logger,
      });

      const first = serviceWithConfig.getAggregationConfig(
        'myKpi',
        metricProvidersRegistry,
      );

      expect(getOptionalConfigSpy).toHaveBeenCalledWith(
        'scorecard.aggregationKPIs.myKpi',
      );

      const second = serviceWithConfig.getAggregationConfig(
        'myKpi',
        metricProvidersRegistry,
      );

      expect(getOptionalConfigSpy).not.toHaveBeenCalledTimes(2);

      expect(second).toBe(first);
    });

    it('should not cache fallback config when KPI block is absent', () => {
      const first = service.getAggregationConfig(
        'github.open_prs',
        metricProvidersRegistry,
      );
      const second = service.getAggregationConfig(
        'github.open_prs',
        metricProvidersRegistry,
      );

      expect(second).toEqual(first);
      expect(second).not.toBe(first);
      expect(logger.warn).toHaveBeenCalledTimes(2);
      expect(metricProvidersRegistry.getMetric).toHaveBeenCalledTimes(2);
    });
  });
});
