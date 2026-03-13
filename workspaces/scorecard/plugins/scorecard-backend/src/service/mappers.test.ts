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
  DEFAULT_NUMBER_THRESHOLDS,
  Metric,
  ThresholdConfig,
} from '@red-hat-developer-hub/backstage-plugin-scorecard-common';

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

  describe('toAggregatedMetricResult', () => {
    const thresholds: ThresholdConfig = DEFAULT_NUMBER_THRESHOLDS;

    it('should map to AggregatedMetricResult with all threshold keys present', () => {
      const aggregatedMetric = {
        values: {
          success: 5,
          warning: 3,
          error: 2,
        },
        total: 10,
        timestamp: '2024-01-15T10:00:00.000Z',
      };

      const result = AggregatedMetricMapper.toAggregatedMetricResult(
        mockMetric,
        thresholds,
        aggregatedMetric,
      );

      expect(result).toEqual({
        id: 'test.metric',
        status: 'success',
        metadata: {
          title: 'Test Metric',
          description: 'Test description',
          type: 'number',
          history: undefined,
        },
        result: {
          ...aggregatedMetric,
          values: [
            { name: 'success', count: 5 },
            { name: 'warning', count: 3 },
            { name: 'error', count: 2 },
          ],
          thresholds,
        },
      });
    });

    it('should fill missing threshold keys with count 0', () => {
      const aggregatedMetric = {
        values: { success: 5 },
        total: 5,
        timestamp: '2024-01-15T10:00:00.000Z',
      };

      const result = AggregatedMetricMapper.toAggregatedMetricResult(
        mockMetric,
        thresholds,
        aggregatedMetric,
      );

      expect(result.result.values).toEqual([
        { name: 'success', count: 5 },
        { name: 'warning', count: 0 },
        { name: 'error', count: 0 },
      ]);
      expect(result.result.total).toBe(5);
    });

    it('should maintain threshold rules order', () => {
      const aggregatedMetric = {
        values: {
          error: 2,
          success: 5,
        },
        total: 7,
        timestamp: '2024-01-15T10:00:00.000Z',
      };

      const result = AggregatedMetricMapper.toAggregatedMetricResult(
        mockMetric,
        thresholds,
        aggregatedMetric,
      );

      expect(result.result.values).toEqual([
        { name: 'success', count: 5 },
        { name: 'warning', count: 0 },
        { name: 'error', count: 2 },
      ]);
    });

    it('should handle custom threshold keys', () => {
      const customThresholds: ThresholdConfig = {
        rules: [
          { key: 'critical', expression: '>100' },
          { key: 'high', expression: '50-100' },
          { key: 'warning', expression: '10-50' },
          { key: 'low', expression: '<10' },
        ],
      };

      const aggregatedMetric = {
        values: {
          critical: 1,
          low: 8,
        },
        total: 9,
        timestamp: '2024-01-15T10:00:00.000Z',
      };

      const result = AggregatedMetricMapper.toAggregatedMetricResult(
        mockMetric,
        customThresholds,
        aggregatedMetric,
      );

      expect(result.result.values).toEqual([
        { name: 'critical', count: 1 },
        { name: 'high', count: 0 },
        { name: 'warning', count: 0 },
        { name: 'low', count: 8 },
      ]);
    });

    it('should include color in thresholds when provided', () => {
      const thresholdsWithColor: ThresholdConfig = {
        rules: [
          { key: 'success', expression: '<10', color: '#4caf50' },
          { key: 'warning', expression: '10-50', color: 'warning.main' },
          { key: 'error', expression: '>50' },
        ],
      };

      const aggregatedMetric = {
        values: { success: 5 },
        total: 5,
        timestamp: '2024-01-15T10:00:00.000Z',
      };

      const result = AggregatedMetricMapper.toAggregatedMetricResult(
        mockMetric,
        thresholdsWithColor,
        aggregatedMetric,
      );

      expect(result.result.thresholds.rules).toEqual([
        { key: 'success', expression: '<10', color: '#4caf50' },
        { key: 'warning', expression: '10-50', color: 'warning.main' },
        { key: 'error', expression: '>50' },
      ]);
    });

    it('should handle empty values with all threshold keys filled as 0', () => {
      const aggregatedMetric = {
        values: {},
        total: 0,
        timestamp: '2024-01-15T10:00:00.000Z',
      };

      const result = AggregatedMetricMapper.toAggregatedMetricResult(
        mockMetric,
        thresholds,
        aggregatedMetric,
      );

      expect(result.result.values).toEqual([
        { name: 'success', count: 0 },
        { name: 'warning', count: 0 },
        { name: 'error', count: 0 },
      ]);
      expect(result.result.total).toBe(0);
    });
  });
});
