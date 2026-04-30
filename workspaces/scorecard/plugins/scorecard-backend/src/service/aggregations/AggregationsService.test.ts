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
  type AggregatedMetricAverageResult,
  Metric,
  ThresholdConfig,
  type AggregationConfig,
} from '@red-hat-developer-hub/backstage-plugin-scorecard-common';
import { DEFAULT_AVERAGE_KPI_RESULT_THRESHOLDS } from '../../constants/aggregationKPIs';
import { AggregationsService } from './AggregationService';
import type { DatabaseMetricValues } from '../../database/DatabaseMetricValues';
import type { DbAggregatedMetric } from '../../database/types';
import { AggregationOptions } from './types';

function createDatabaseMock(
  readAggregatedMetricByEntityRefs: jest.Mock,
): DatabaseMetricValues {
  return {
    readAggregatedMetricByEntityRefs,
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

  it('getAggregatedMetricByEntityRefs loads via DB and maps through statusGrouped strategy', async () => {
    const dbRow: DbAggregatedMetric = {
      metric_id: metric.id,
      total: 3,
      max_timestamp: new Date('2025-01-01T10:00:00.000Z'),
      statusCounts: { error: 1, warning: 1, success: 1 },
      calculation_error_count: 1,
      latest_entity_count: 1,
    };
    const readAggregatedMetricByEntityRefs = jest.fn().mockResolvedValue(dbRow);

    const service = new AggregationsService({
      config: mockServices.rootConfig({ data: {} }),
      database: createDatabaseMock(readAggregatedMetricByEntityRefs),
      logger: mockServices.logger.mock(),
    });

    const result = await service.getAggregatedMetricByEntityRefs({
      metric,
      entityRefs: ['component:default/a'],
      thresholds,
      aggregationConfig: {
        id: metric.id,
        metricId: metric.id,
        type: aggregationTypes.statusGrouped,
      } as any,
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

  it('getAggregatedMetricByEntityRefs uses average strategy when configured', async () => {
    const dbRow: DbAggregatedMetric = {
      metric_id: metric.id,
      total: 3,
      max_timestamp: new Date('2025-01-01T10:00:00.000Z'),
      statusCounts: { error: 1, warning: 1, success: 1 },
      calculation_error_count: 1,
      latest_entity_count: 1,
    };
    const readAggregatedMetricByEntityRefs = jest.fn().mockResolvedValue(dbRow);

    const service = new AggregationsService({
      config: mockServices.rootConfig({ data: {} }),
      database: createDatabaseMock(readAggregatedMetricByEntityRefs),
      logger: mockServices.logger.mock(),
    });

    const result = await service.getAggregatedMetricByEntityRefs({
      metric,
      entityRefs: ['component:default/a'],
      thresholds,
      aggregationConfig: {
        id: 'avgKpi',
        title: 'Average KPI',
        description: 'Average KPI description',
        metricId: metric.id,
        type: aggregationTypes.average,
        options: {
          statusScores: { error: 0, warning: 50, success: 100 },
          thresholds: DEFAULT_AVERAGE_KPI_RESULT_THRESHOLDS,
        },
      } as AggregationConfig,
    } as AggregationOptions);

    expect(readAggregatedMetricByEntityRefs).toHaveBeenCalledWith(
      ['component:default/a'],
      metric.id,
    );

    const aggregationResult = result.result as AggregatedMetricAverageResult;

    expect(result.metadata?.aggregationType).toBe(aggregationTypes.average);
    expect(aggregationResult.averageScore).toBeCloseTo(0.5, 5);
    expect(aggregationResult.averageWeightedSum).toBe(150);
    expect(aggregationResult.averageMaxPossible).toBe(300);
  });

  it('getAggregatedMetricByEntityRefs throws when aggregation type is not registered', async () => {
    const service = new AggregationsService({
      config: mockServices.rootConfig({ data: {} }),
      database: createDatabaseMock(jest.fn()),
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

  describe('getAggregationConfig', () => {
    it('defaults to statusGrouped with metricId equal to aggregation id when KPI config is absent', () => {
      const logger = mockServices.logger.mock();
      const service = new AggregationsService({
        config: mockServices.rootConfig({ data: {} }),
        database: createDatabaseMock(jest.fn()),
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

    it('uses scorecard.aggregationKPIs when present', () => {
      const config = new ConfigReader({
        scorecard: {
          aggregationKPIs: {
            myKpi: {
              title: 'KPI title',
              description: 'KPI desc',
              type: aggregationTypes.average,
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
        database: createDatabaseMock(jest.fn()),
        logger: mockServices.logger.mock(),
      });

      const cfg = service.getAggregationConfig('myKpi');

      expect(cfg.metricId).toBe('github.open_prs');
      expect(cfg.type).toBe(aggregationTypes.average);
      expect(cfg.title).toBe('KPI title');
    });
  });
});
