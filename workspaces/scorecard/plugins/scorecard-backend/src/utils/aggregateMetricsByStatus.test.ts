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

import { aggregateMetricsByStatus } from './aggregateMetricsByStatus';
import { DbMetricValue } from '../database/types';

describe('aggregateMetricsByStatus', () => {
  const createMetric = (
    metricId: string,
    status: 'success' | 'warning' | 'error',
    value: any = { count: 1 },
  ): DbMetricValue => ({
    id: 1,
    catalog_entity_ref: 'component:default/test',
    metric_id: metricId,
    value,
    timestamp: new Date(),
    status,
  });

  it('should return empty object when metrics array is empty', () => {
    const result = aggregateMetricsByStatus([]);
    expect(result).toEqual({});
  });

  describe('when metrics have valid status and value', () => {
    it('should aggregate single success metric', () => {
      const metrics = [createMetric('metric1', 'success')];
      const result = aggregateMetricsByStatus(metrics);

      expect(result).toEqual({
        metric1: {
          values: {
            success: 1,
            warning: 0,
            error: 0,
          },
          total: 1,
        },
      });
    });

    it('should aggregate single warning metric', () => {
      const metrics = [createMetric('metric1', 'warning')];
      const result = aggregateMetricsByStatus(metrics);

      expect(result).toEqual({
        metric1: {
          values: {
            success: 0,
            warning: 1,
            error: 0,
          },
          total: 1,
        },
      });
    });

    it('should aggregate single error metric', () => {
      const metrics = [createMetric('metric1', 'error')];
      const result = aggregateMetricsByStatus(metrics);

      expect(result).toEqual({
        metric1: {
          values: {
            success: 0,
            warning: 0,
            error: 1,
          },
          total: 1,
        },
      });
    });

    it('should aggregate multiple metrics with same metric_id', () => {
      const metrics = [
        createMetric('metric1', 'success'),
        createMetric('metric1', 'success'),
        createMetric('metric1', 'warning'),
        createMetric('metric1', 'error'),
      ];
      const result = aggregateMetricsByStatus(metrics);

      expect(result).toEqual({
        metric1: {
          values: {
            success: 2,
            warning: 1,
            error: 1,
          },
          total: 4,
        },
      });
    });

    it('should aggregate multiple metrics with different metric_ids', () => {
      const metrics = [
        createMetric('metric1', 'success'),
        createMetric('metric2', 'warning'),
        createMetric('metric3', 'error'),
      ];
      const result = aggregateMetricsByStatus(metrics);

      expect(result).toEqual({
        metric1: {
          values: {
            success: 1,
            warning: 0,
            error: 0,
          },
          total: 1,
        },
        metric2: {
          values: {
            success: 0,
            warning: 1,
            error: 0,
          },
          total: 1,
        },
        metric3: {
          values: {
            success: 0,
            warning: 0,
            error: 1,
          },
          total: 1,
        },
      });
    });

    it('should aggregate complex scenario with multiple metric_ids and statuses', () => {
      const metrics = [
        createMetric('metric1', 'success'),
        createMetric('metric1', 'success'),
        createMetric('metric1', 'warning'),
        createMetric('metric2', 'error'),
        createMetric('metric2', 'error'),
        createMetric('metric2', 'success'),
        createMetric('metric3', 'warning'),
      ];
      const result = aggregateMetricsByStatus(metrics);

      expect(result).toEqual({
        metric1: {
          values: {
            success: 2,
            warning: 1,
            error: 0,
          },
          total: 3,
        },
        metric2: {
          values: {
            success: 1,
            warning: 0,
            error: 2,
          },
          total: 3,
        },
        metric3: {
          values: {
            success: 0,
            warning: 1,
            error: 0,
          },
          total: 1,
        },
      });
    });
  });

  describe('when metrics have invalid status or value', () => {
    it('should skip metrics with null value', () => {
      const metrics: DbMetricValue[] = [
        createMetric('metric1', 'success', null),
        createMetric('metric1', 'warning', { count: 1 }),
      ];
      const result = aggregateMetricsByStatus(metrics);

      expect(result).toEqual({
        metric1: {
          values: {
            success: 0,
            warning: 1,
            error: 0,
          },
          total: 1,
        },
      });
    });

    it('should skip metrics without status', () => {
      const metrics: DbMetricValue[] = [
        // @ts-expect-error - for testing
        createMetric('metric1', undefined, { count: 1 }),
        createMetric('metric1', 'success'),
      ];
      const result = aggregateMetricsByStatus(metrics);

      expect(result).toEqual({
        metric1: {
          values: {
            success: 1,
            warning: 0,
            error: 0,
          },
          total: 1,
        },
      });
    });

    it('should skip metrics with both null value and no status', () => {
      const metrics: DbMetricValue[] = [
        {
          id: 1,
          catalog_entity_ref: 'component:default/test',
          metric_id: 'metric1',
          value: undefined,
          timestamp: new Date(),
        },
        createMetric('metric1', 'success'),
      ];
      const result = aggregateMetricsByStatus(metrics);

      expect(result).toEqual({
        metric1: {
          values: {
            success: 1,
            warning: 0,
            error: 0,
          },
          total: 1,
        },
      });
    });

    it('should handle undefined value as valid (not null)', () => {
      const metrics: DbMetricValue[] = [
        createMetric('metric1', 'success', undefined),
      ];
      const result = aggregateMetricsByStatus(metrics);

      // undefined !== null, so it should be included
      expect(result).toEqual({
        metric1: {
          values: {
            success: 1,
            warning: 0,
            error: 0,
          },
          total: 1,
        },
      });
    });

    it('should handle mixed valid and invalid metrics', () => {
      const metrics: DbMetricValue[] = [
        createMetric('metric1', 'success'),
        createMetric('metric1', 'warning', null),
        // @ts-expect-error - for testing
        createMetric('metric1', undefined, { count: 1 }),
        createMetric('metric1', 'error'),
        createMetric('metric2', 'success', null),
        createMetric('metric2', 'warning'),
      ];
      const result = aggregateMetricsByStatus(metrics);

      expect(result).toEqual({
        metric1: {
          values: {
            success: 1,
            warning: 0,
            error: 1,
          },
          total: 2,
        },
        metric2: {
          values: {
            success: 0,
            warning: 1,
            error: 0,
          },
          total: 1,
        },
      });
    });
  });

  describe('when all metrics are invalid', () => {
    it('should return empty object when all metrics have null value', () => {
      const metrics: DbMetricValue[] = [
        createMetric('metric1', 'success', null),
        createMetric('metric2', 'warning', null),
      ];
      const result = aggregateMetricsByStatus(metrics);

      expect(result).toEqual({});
    });

    it('should return empty object when all metrics have no status', () => {
      const metrics: DbMetricValue[] = [
        // @ts-expect-error - for testing
        createMetric('metric2', undefined, { count: 2 }),
        // @ts-expect-error - for testing
        createMetric('metric2', undefined, { count: 2 }),
      ];
      const result = aggregateMetricsByStatus(metrics);

      expect(result).toEqual({});
    });
  });

  describe('edge cases', () => {
    it('should handle zero value as valid (not null)', () => {
      const metrics: DbMetricValue[] = [createMetric('metric1', 'success', 0)];
      const result = aggregateMetricsByStatus(metrics);

      expect(result).toEqual({
        metric1: {
          values: {
            success: 1,
            warning: 0,
            error: 0,
          },
          total: 1,
        },
      });
    });

    it('should handle empty string value as valid (not null)', () => {
      const metrics: DbMetricValue[] = [createMetric('metric1', 'success', '')];
      const result = aggregateMetricsByStatus(metrics);

      expect(result).toEqual({
        metric1: {
          values: {
            success: 1,
            warning: 0,
            error: 0,
          },
          total: 1,
        },
      });
    });

    it('should handle false value as valid (not null)', () => {
      const metrics: DbMetricValue[] = [
        createMetric('metric1', 'success', false),
      ];

      const result = aggregateMetricsByStatus(metrics);

      expect(result).toEqual({
        metric1: {
          values: {
            success: 1,
            warning: 0,
            error: 0,
          },
          total: 1,
        },
      });
    });
  });
});
