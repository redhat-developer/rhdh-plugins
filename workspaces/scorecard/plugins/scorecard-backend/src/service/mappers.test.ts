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
import { DbAggregatedMetric } from '../database/types';
import {
  aggregationKinds,
  DEFAULT_NUMBER_THRESHOLDS,
  Metric,
  ThresholdConfig,
} from '@red-hat-developer-hub/backstage-plugin-scorecard-common';
import type { AggregationConfig } from '../utils/buildAggregationConfig';

describe('AggregatedMetricMapper', () => {
  const mockMetric: Metric = {
    id: 'test.metric',
    title: 'Test Metric',
    description: 'Test description',
    type: 'number',
  };

  describe('toAggregatedMetric', () => {
    it('should map DbAggregatedMetric to AggregatedMetric', () => {
      const dbMetric: DbAggregatedMetric = {
        metric_id: 'test.metric',
        total: 10,
        max_timestamp: new Date('2024-01-15T10:00:00Z'),
        statusCounts: {
          success: 5,
          warning: 3,
          error: 2,
        },
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
      });
    });

    it('should handle undefined input with defaults', () => {
      const result = AggregatedMetricMapper.toAggregatedMetric();

      expect(result).toEqual({
        values: {},
        total: 0,
        timestamp: expect.any(String),
      });
    });

    it('should handle empty statusCounts', () => {
      const dbMetric: DbAggregatedMetric = {
        metric_id: 'test.metric',
        total: 0,
        max_timestamp: new Date('2024-01-15T10:00:00Z'),
        statusCounts: {},
      };

      const result = AggregatedMetricMapper.toAggregatedMetric(dbMetric);

      expect(result.values).toEqual({});
      expect(result.total).toBe(0);
    });
  });

  describe('toAggregationMetadata', () => {
    it('should map to AggregationMetadata when no aggregationConfig is provided', () => {
      const result = AggregatedMetricMapper.toAggregationMetadata(mockMetric);

      expect(result).toEqual({
        title: 'Test Metric',
        description: 'Test description',
        type: 'number',
        history: undefined,
        aggregationType: 'statusGrouped',
      });
    });

    it('should map to AggregationMetadata when aggregationConfig is provided', () => {
      const aggregationConfig: AggregationConfig = {
        id: 'test.metric',
        type: 'statusGrouped',
        title: 'Test Metric',
        description: 'Test description',
        metricId: 'test.metric',
      };
      const result = AggregatedMetricMapper.toAggregationMetadata(
        mockMetric,
        aggregationConfig,
      );

      expect(result).toEqual({
        title: aggregationConfig.title,
        description: aggregationConfig.description,
        type: 'number',
        history: undefined,
        aggregationType: aggregationConfig.type,
      });
    });
  });

  describe('toAggregatedMetricResult', () => {
    const thresholds: ThresholdConfig = DEFAULT_NUMBER_THRESHOLDS;

    it('should wrap a statusGrouped-shaped result and aggregation metadata from config', () => {
      const aggregationConfig: AggregationConfig = {
        id: 'kpi-1',
        type: 'statusGrouped',
        title: 'KPI',
        description: 'KPI desc',
        metricId: 'test.metric',
      } as AggregationConfig;
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
          thresholds,
        },
        aggregationConfig,
      );

      expect(result).toEqual({
        id: 'test.metric',
        status: 'success',
        metadata: {
          title: 'KPI',
          description: 'KPI desc',
          type: 'number',
          history: undefined,
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
          thresholds,
        },
      });
    });

    it('should wrap a average-shaped result and aggregationType from config', () => {
      const aggregationConfig: AggregationConfig = {
        id: 'avg.kpi',
        type: aggregationKinds.average,
        title: 'Avg KPI',
        description: 'Average KPI',
        metricId: 'test.metric',
      } as AggregationConfig;
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
          averageScore: 0.5,
          averageWeightedSum: 500,
          averageMaxPossible: 1000,
          aggregationChartDisplayColor: 'warning.main',
        } as any,
        aggregationConfig,
      );

      expect(result.metadata.aggregationType).toBe(aggregationKinds.average);
      expect((result.result as any).averageScore).toBe(0.5);
    });
  });
});
