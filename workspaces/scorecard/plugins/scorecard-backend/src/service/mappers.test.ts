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

import { AggregatedMetricMapper } from './mappers';
import {
  DbAggregatedMetric,
  DbScalarAggregatedMetric,
} from '../database/types';
import {
  aggregationTypes,
  DEFAULT_NUMBER_THRESHOLDS,
  Metric,
  ThresholdConfig,
} from '@red-hat-developer-hub/backstage-plugin-scorecard-common';
import {
  mockScalarAggregationConfig,
  mockStatusGroupedAggregationConfig,
  mockWeightedStatusScoreAggregationConfig,
} from '../../__fixtures__/mockAggregationConfig';

describe('AggregatedMetricMapper', () => {
  const mockMetric: Metric = {
    id: 'test.metric',
    title: 'Test Metric',
    description: 'Test description',
    type: 'number',
    thresholds: { rules: [] },
  };

  describe('toAggregatedMetric', () => {
    it('should map DbAggregatedMetric to AggregatedMetric', () => {
      const dbMetric: DbAggregatedMetric = {
        metricId: 'test.metric',
        total: 10,
        maxTimestamp: new Date('2024-01-15T10:00:00Z'),
        statusCounts: {
          success: 5,
          warning: 3,
          error: 2,
        },
        calculationErrorCount: 1,
        latestEntityCount: 12,
      };

      const result = AggregatedMetricMapper.toAggregatedMetric(dbMetric);

      expect(result).toEqual({
        values: {
          success: 5,
          warning: 3,
          error: 2,
        },
        total: 10,
        timestamp: '2024-01-15T10:00:00.000Z',
        entitiesConsidered: 12,
        calculationErrorCount: 1,
      });
    });

    it('should handle undefined input with defaults', () => {
      const result = AggregatedMetricMapper.toAggregatedMetric();

      expect(result).toEqual({
        values: {},
        total: 0,
        timestamp: expect.any(String),
        entitiesConsidered: 0,
        calculationErrorCount: 0,
      });
    });

    it('should handle empty statusCounts', () => {
      const dbMetric: DbAggregatedMetric = {
        metricId: 'test.metric',
        total: 0,
        maxTimestamp: new Date('2024-01-15T10:00:00Z'),
        statusCounts: {},
        calculationErrorCount: 0,
        latestEntityCount: 0,
      };

      const result = AggregatedMetricMapper.toAggregatedMetric(dbMetric);

      expect(result.values).toEqual({});
      expect(result.total).toBe(0);
      expect(result.entitiesConsidered).toBe(0);
      expect(result.calculationErrorCount).toBe(0);
    });
  });

  describe('toScalarAggregatedMetric', () => {
    it('should map DbScalarAggregatedMetric to scalar aggregate', () => {
      const dbMetric: DbScalarAggregatedMetric = {
        metricId: 'test.metric',
        value: 847,
        total: 42,
        latestEntityCount: 45,
        calculationErrorCount: 3,
        maxTimestamp: new Date('2024-01-15T10:00:00Z'),
      };

      const result = AggregatedMetricMapper.toScalarAggregatedMetric(dbMetric);

      expect(result).toEqual({
        value: 847,
        total: 42,
        entitiesConsidered: 45,
        calculationErrorCount: 3,
        timestamp: '2024-01-15T10:00:00.000Z',
      });
    });

    it('should handle undefined input with defaults', () => {
      const result = AggregatedMetricMapper.toScalarAggregatedMetric();

      expect(result).toEqual({
        value: 0,
        total: 0,
        entitiesConsidered: 0,
        calculationErrorCount: 0,
        timestamp: expect.any(String),
      });
    });
  });

  describe('toAggregationMetadata', () => {
    it('should map to AggregationMetadata from metric and aggregationConfig', () => {
      const aggregationConfig = mockStatusGroupedAggregationConfig({
        title: 'KPI title',
        description: 'KPI description',
      });

      const result = AggregatedMetricMapper.toAggregationMetadata(
        mockMetric,
        aggregationConfig,
      );

      expect(result).toEqual({
        title: 'KPI title',
        description: 'KPI description',
        type: 'number',
        unit: undefined,
        history: undefined,
        visualization: undefined,
        aggregationType: aggregationTypes.statusGrouped,
      });
    });

    it('should use aggregationType from aggregationConfig', () => {
      const aggregationConfig = mockWeightedStatusScoreAggregationConfig({
        title: 'Weighted KPI',
        description: 'Weighted KPI description',
      });

      const result = AggregatedMetricMapper.toAggregationMetadata(
        mockMetric,
        aggregationConfig,
      );

      expect(result).toEqual({
        title: 'Weighted KPI',
        description: 'Weighted KPI description',
        type: 'number',
        unit: undefined,
        history: undefined,
        visualization: undefined,
        aggregationType: aggregationTypes.weightedStatusScore,
      });
    });

    it('should include filter in metadata for scalar KPI config', () => {
      const aggregationConfig = mockScalarAggregationConfig(
        aggregationTypes.sum,
        {
          filter: { status: 'error' },
        },
      );
      const result = AggregatedMetricMapper.toAggregationMetadata(
        mockMetric,
        aggregationConfig,
      );

      expect(result.filter).toEqual({ status: 'error' });
    });

    it('should omit filter in metadata when scalar KPI config has no filter', () => {
      const aggregationConfig = mockScalarAggregationConfig(
        aggregationTypes.sum,
      );
      const result = AggregatedMetricMapper.toAggregationMetadata(
        mockMetric,
        aggregationConfig,
      );

      expect(result).not.toHaveProperty('filter');
    });

    it('should include unit, history and visualization when defined on the metric', () => {
      const metricWithUnitAndHistory: Metric = {
        ...mockMetric,
        unit: 'h',
        history: true,
        defaultVisualization: 'sparkline',
      };

      const aggregationConfig = mockStatusGroupedAggregationConfig({
        title: 'KPI title',
        description: 'KPI description',
      });

      const result = AggregatedMetricMapper.toAggregationMetadata(
        metricWithUnitAndHistory,
        aggregationConfig,
      );

      expect(result).toEqual({
        title: 'KPI title',
        description: 'KPI description',
        type: 'number',
        unit: 'h',
        history: true,
        visualization: 'sparkline',
        aggregationType: aggregationTypes.statusGrouped,
      });
    });
  });

  describe('toAggregatedMetricResult', () => {
    const thresholds: ThresholdConfig = DEFAULT_NUMBER_THRESHOLDS;
    const toAggregationMetadataSpy = jest.spyOn(
      AggregatedMetricMapper,
      'toAggregationMetadata',
    );

    beforeEach(() => {
      jest.clearAllMocks();
    });

    it('should wrap a statusGrouped-shaped result and aggregation metadata from config', () => {
      const aggregationConfig = mockStatusGroupedAggregationConfig({
        id: 'kpi-1',
        title: 'KPI',
        description: 'KPI desc',
      });
      const result = AggregatedMetricMapper.toAggregatedMetricResult(
        mockMetric,
        {
          total: 3,
          timestamp: '2024-01-15T10:00:00.000Z',
          values: [
            { name: 'success', count: 1, score: 0 },
            { name: 'warning', count: 1, score: 0 },
            { name: 'error', count: 1, score: 0 },
          ],
          calculationErrorCount: 0,
          entitiesConsidered: 3,
          thresholds,
        },
        aggregationConfig,
      );

      expect(toAggregationMetadataSpy).toHaveBeenCalledTimes(1);
      expect(result).toEqual({
        id: 'test.metric',
        status: 'success',
        metadata: {
          title: 'KPI',
          description: 'KPI desc',
          type: 'number',
          unit: undefined,
          history: undefined,
          visualization: undefined,
          aggregationType: 'statusGrouped',
        },
        result: {
          total: 3,
          timestamp: '2024-01-15T10:00:00.000Z',
          values: [
            { name: 'success', count: 1, score: 0 },
            { name: 'warning', count: 1, score: 0 },
            { name: 'error', count: 1, score: 0 },
          ],
          calculationErrorCount: 0,
          entitiesConsidered: 3,
          thresholds,
        },
      });
    });

    it('should wrap a weightedStatusScore-shaped result and aggregationType from config', () => {
      const aggregationConfig = mockWeightedStatusScoreAggregationConfig({
        id: 'weightedKpi',
        title: 'Weighted Status Score KPI',
        description: 'Weighted status score KPI',
      });
      const result = AggregatedMetricMapper.toAggregatedMetricResult(
        mockMetric,
        {
          total: 10,
          timestamp: '2024-01-15T10:00:00.000Z',
          values: [
            { name: 'success', count: 5, score: 100 },
            { name: 'warning', count: 3, score: 50 },
            { name: 'error', count: 2, score: 0 },
          ],
          thresholds,
          weightedStatusScore: 50,
          weightedStatusSum: 500,
          weightedStatusMaxPossible: 1000,
          aggregationChartDisplayColor: 'warning.main',
        } as any,
        aggregationConfig,
      );

      expect(toAggregationMetadataSpy).toHaveBeenCalledTimes(1);
      expect(result.metadata.aggregationType).toBe(
        aggregationTypes.weightedStatusScore,
      );
      expect((result.result as any).weightedStatusScore).toBe(50);
    });

    it('should include filter in metadata for scalar KPI result wrapper', () => {
      const aggregationConfig = mockScalarAggregationConfig(
        aggregationTypes.sum,
        {
          filter: { status: 'error' },
        },
      );
      const result = AggregatedMetricMapper.toAggregatedMetricResult(
        mockMetric,
        {
          value: 30,
          total: 2,
          entitiesConsidered: 4,
          calculationErrorCount: 1,
          timestamp: '2024-01-15T10:00:00.000Z',
          thresholds,
          aggregationChartDisplayColor: 'warning.main',
        },
        aggregationConfig,
      );

      expect(toAggregationMetadataSpy).toHaveBeenCalledTimes(1);
      expect(result.metadata.filter).toEqual({ status: 'error' });
    });

    it('should omit filter in metadata for scalar KPI result wrapper without filter', () => {
      const aggregationConfig = mockScalarAggregationConfig(
        aggregationTypes.sum,
      );
      const result = AggregatedMetricMapper.toAggregatedMetricResult(
        mockMetric,
        {
          value: 30,
          total: 2,
          entitiesConsidered: 4,
          calculationErrorCount: 1,
          timestamp: '2024-01-15T10:00:00.000Z',
          thresholds,
          aggregationChartDisplayColor: 'warning.main',
        },
        aggregationConfig,
      );

      expect(toAggregationMetadataSpy).toHaveBeenCalledTimes(1);
      expect(result.metadata).not.toHaveProperty('filter');
    });
  });

  describe('toScalarAggregatedTimeSeriesPoint', () => {
    it('should omit errors when none are present', () => {
      expect(
        AggregatedMetricMapper.toScalarAggregatedTimeSeriesPoint({
          maxTimestamp: new Date('2024-01-01T18:30:00Z'),
          value: 12,
          successCount: 3,
          errorCount: 0,
          total: 3,
          errors: [],
        }),
      ).toEqual({
        value: 12,
        successCount: 3,
        errorCount: 0,
        total: 3,
        status: 'success',
        timestamp: '2024-01-01T18:30:00.000Z',
      });
    });

    it('should map a successful day', () => {
      expect(
        AggregatedMetricMapper.toScalarAggregatedTimeSeriesPoint({
          maxTimestamp: new Date('2024-01-01T18:30:00Z'),
          value: 12,
          successCount: 3,
          errorCount: 1,
          total: 4,
          errors: [{ message: 'boom', count: 1 }],
        }),
      ).toEqual({
        value: 12,
        successCount: 3,
        errorCount: 1,
        total: 4,
        status: 'success',
        errors: [{ message: 'boom', count: 1 }],
        timestamp: '2024-01-01T18:30:00.000Z',
      });
    });

    it('should map an error-only day with null value and status error', () => {
      expect(
        AggregatedMetricMapper.toScalarAggregatedTimeSeriesPoint({
          maxTimestamp: new Date('2024-01-01T18:30:00Z'),
          value: null,
          successCount: 0,
          errorCount: 2,
          total: 2,
          errors: [{ message: 'boom', count: 2 }],
        }),
      ).toEqual({
        value: null,
        successCount: 0,
        errorCount: 2,
        total: 2,
        status: 'error',
        errors: [{ message: 'boom', count: 2 }],
        timestamp: '2024-01-01T18:30:00.000Z',
      });
    });
  });

  describe('toScalarAggregatedMetricTimeSeriesResponse', () => {
    const toAggregationMetadataSpy = jest.spyOn(
      AggregatedMetricMapper,
      'toAggregationMetadata',
    );

    beforeEach(() => {
      jest.clearAllMocks();
    });

    it('should wrap points with aggregation id, thresholds, and aggregationChartDisplayColor', () => {
      const aggregationConfig = mockScalarAggregationConfig(
        aggregationTypes.sum,
        {
          id: 'totalOpenPrs',
        },
      );
      const points = [
        {
          value: 12,
          successCount: 3,
          errorCount: 0,
          total: 3,
          status: 'success' as const,
          timestamp: '2024-01-01T00:00:00.000Z',
        },
      ];

      const result =
        AggregatedMetricMapper.toScalarAggregatedMetricTimeSeriesResponse(
          mockMetric,
          aggregationConfig,
          points,
          DEFAULT_NUMBER_THRESHOLDS,
          'warning.main',
        );

      expect(result).toEqual({
        id: 'totalOpenPrs',
        metricId: 'test.metric',
        points,
        metadata: expect.objectContaining({
          aggregationType: aggregationTypes.sum,
        }),
        thresholds: DEFAULT_NUMBER_THRESHOLDS,
        aggregationChartDisplayColor: 'warning.main',
      });
    });

    it('should wrap points with metadata using `toAggregatedMetadata`', () => {
      const aggregationConfig = mockScalarAggregationConfig(
        aggregationTypes.sum,
        {
          id: 'totalOpenPrs',
        },
      );

      const result =
        AggregatedMetricMapper.toScalarAggregatedMetricTimeSeriesResponse(
          mockMetric,
          aggregationConfig,
          [],
          DEFAULT_NUMBER_THRESHOLDS,
          null,
        );

      expect(toAggregationMetadataSpy).toHaveBeenCalledTimes(1);
      expect(result.metadata).toEqual({
        description: 'Scalar aggregation KPI',
        history: undefined,
        title: 'Scalar KPI',
        type: 'number',
        unit: undefined,
        visualization: undefined,
        aggregationType: aggregationTypes.sum,
      });
    });
  });
});
