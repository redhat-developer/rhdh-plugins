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
import { mockServices } from '@backstage/backend-test-utils';
import {
  aggregationTypes,
  type WeightedStatusScoreAggregationResult,
  Metric,
  ThresholdConfig,
  DEFAULT_NUMBER_THRESHOLDS,
} from '@red-hat-developer-hub/backstage-plugin-scorecard-common';
import { AggregationsService } from './AggregationService';
import type { DatabaseMetricValues } from '../../database/DatabaseMetricValues';
import type {
  DbAggregatedMetric,
  DbScalarAggregatedMetric,
} from '../../database/types';
import {
  mockFallbackStatusGroupedAggregationConfig,
  mockScalarAggregationConfig,
  mockWeightedStatusScoreAggregationConfig,
} from '../../../__fixtures__/mockAggregationConfig';
import { isValidatedAggregationConfig } from './utils/aggregationRuntimeConfig';

function createDatabaseMock(options: {
  readAggregatedMetricByEntityRefs?: jest.Mock;
  readScalarAggregatedMetricByEntityRefs?: jest.Mock;
}): DatabaseMetricValues {
  return {
    readAggregatedMetricByEntityRefs:
      options.readAggregatedMetricByEntityRefs ?? jest.fn(),
    readScalarAggregatedMetricByEntityRefs:
      options.readScalarAggregatedMetricByEntityRefs ?? jest.fn(),
  } as unknown as DatabaseMetricValues;
}

describe('AggregationsService', () => {
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

  describe('getAggregatedMetricByEntityRefs', () => {
    it('should load via DB and maps through statusGrouped strategy', async () => {
      const dbRow: DbAggregatedMetric = {
        metric_id: metric.id,
        total: 3,
        max_timestamp: new Date('2025-01-01T10:00:00.000Z'),
        statusCounts: { error: 1, warning: 1, success: 1 },
        calculation_error_count: 1,
        latest_entity_count: 1,
      };
      const readAggregatedMetricByEntityRefs = jest
        .fn()
        .mockResolvedValue(dbRow);

      const service = new AggregationsService({
        config: mockServices.rootConfig({ data: {} }),
        database: createDatabaseMock({ readAggregatedMetricByEntityRefs }),
        logger: mockServices.logger.mock(),
      });

      const result = await service.getAggregatedMetricByEntityRefs({
        metric,
        entityRefs: ['component:default/a'],
        thresholds,
        aggregationConfig: mockFallbackStatusGroupedAggregationConfig({
          id: metric.id,
          metricId: metric.id,
        }),
      });

      expect(readAggregatedMetricByEntityRefs).toHaveBeenCalledWith(
        ['component:default/a'],
        metric.id,
      );
      expect(result.id).toBe(metric.id);
      expect(result.metadata?.aggregationType).toBe(
        aggregationTypes.statusGrouped,
      );
    });

    it('should use weightedStatusScore strategy when configured', async () => {
      const dbRow: DbAggregatedMetric = {
        metric_id: metric.id,
        total: 3,
        max_timestamp: new Date('2025-01-01T10:00:00.000Z'),
        statusCounts: { error: 1, warning: 1, success: 1 },
        calculation_error_count: 1,
        latest_entity_count: 1,
      };
      const readAggregatedMetricByEntityRefs = jest
        .fn()
        .mockResolvedValue(dbRow);

      const service = new AggregationsService({
        config: mockServices.rootConfig({ data: {} }),
        database: createDatabaseMock({ readAggregatedMetricByEntityRefs }),
        logger: mockServices.logger.mock(),
      });

      const result = await service.getAggregatedMetricByEntityRefs({
        metric,
        entityRefs: ['component:default/a'],
        thresholds,
        aggregationConfig: mockWeightedStatusScoreAggregationConfig({
          metricId: metric.id,
        }),
      });

      expect(readAggregatedMetricByEntityRefs).toHaveBeenCalledWith(
        ['component:default/a'],
        metric.id,
      );

      const aggregationResult =
        result.result as WeightedStatusScoreAggregationResult;

      expect(result.metadata?.aggregationType).toBe(
        aggregationTypes.weightedStatusScore,
      );
      expect(aggregationResult.weightedStatusScore).toBe(50);
      expect(aggregationResult.weightedStatusSum).toBe(150);
      expect(aggregationResult.weightedStatusMaxPossible).toBe(300);
    });

    it('should use sum strategy when configured', async () => {
      const dbRow: DbScalarAggregatedMetric = {
        metric_id: metric.id,
        value: 847,
        total: 42,
        latest_entity_count: 45,
        calculation_error_count: 3,
        max_timestamp: new Date('2025-01-01T10:00:00.000Z'),
      };
      const readScalarAggregatedMetricByEntityRefs = jest
        .fn()
        .mockResolvedValue(dbRow);

      const service = new AggregationsService({
        config: mockServices.rootConfig({ data: {} }),
        database: createDatabaseMock({
          readScalarAggregatedMetricByEntityRefs,
        }),
        logger: mockServices.logger.mock(),
      });

      const result = await service.getAggregatedMetricByEntityRefs({
        metric,
        entityRefs: ['component:default/a'],
        thresholds,
        aggregationConfig: mockScalarAggregationConfig(aggregationTypes.sum, {
          id: 'totalOpenPrs',
          title: 'Total Open PRs',
          description: 'Sum of open PRs',
          metricId: metric.id,
          options: undefined,
        }),
      });

      expect(readScalarAggregatedMetricByEntityRefs).toHaveBeenCalledWith(
        ['component:default/a'],
        metric.id,
        'sum',
      );
      expect(result.metadata?.aggregationType).toBe(aggregationTypes.sum);
      expect(result.result).toEqual({
        value: 847,
        total: 42,
        entitiesConsidered: 45,
        calculationErrorCount: 3,
        timestamp: '2025-01-01T10:00:00.000Z',
        thresholds: DEFAULT_NUMBER_THRESHOLDS,
      });
    });

    it('should throw when aggregation type is not registered', async () => {
      const service = new AggregationsService({
        config: mockServices.rootConfig({ data: {} }),
        database: createDatabaseMock({}),
        logger: mockServices.logger.mock(),
      });

      await expect(
        service.getAggregatedMetricByEntityRefs({
          metric,
          entityRefs: [],
          thresholds,
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
    it('should default to statusGrouped with metricId equal to aggregation id when KPI config is absent', () => {
      const logger = mockServices.logger.mock();
      const service = new AggregationsService({
        config: mockServices.rootConfig({ data: {} }),
        database: createDatabaseMock({}),
        logger,
      });

      const cfg = service.getAggregationConfig('github.open_prs');

      expect(cfg.id).toBe('github.open_prs');
      expect(cfg.metricId).toBe('github.open_prs');
      expect(cfg.type).toBe(aggregationTypes.statusGrouped);
      expect(logger.warn).toHaveBeenCalledWith(
        expect.stringContaining('github.open_prs'),
      );
    });

    it('should use scorecard.aggregationKPIs when present', () => {
      const config = new ConfigReader({
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
      });

      const service = new AggregationsService({
        config,
        database: createDatabaseMock({}),
        logger: mockServices.logger.mock(),
      });

      const cfg = service.getAggregationConfig('myKpi');

      expect(cfg.metricId).toBe('github.open_prs');
      expect(cfg.type).toBe(aggregationTypes.weightedStatusScore);
      expect(isValidatedAggregationConfig(cfg)).toBe(true);
      expect((cfg as any).title).toBe('KPI title');
    });
  });
});
