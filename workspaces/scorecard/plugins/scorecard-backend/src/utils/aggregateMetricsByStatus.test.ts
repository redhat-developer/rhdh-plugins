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
import { DbMetricValue, DbMetricValueStatus } from '../database/types';
import { MetricValue } from '@red-hat-developer-hub/backstage-plugin-scorecard-common';

describe('aggregateMetricsByStatus', () => {
  const createMetric = (
    metricId: string,
    status: DbMetricValueStatus | null = null,
    value: MetricValue | null = null,
  ): DbMetricValue => ({
    id: 1,
    catalog_entity_ref: 'component:default/test',
    metric_id: metricId,
    value,
    timestamp: new Date(),
    error_message: null,
    status,
  });

  it('should return empty object when metrics array is empty', () => {
    const result = aggregateMetricsByStatus([]);
    expect(result).toEqual({});
  });

  describe('when metrics have valid status and value', () => {
    it('should aggregate single success metric', () => {
      const metrics = [createMetric('metric1', 'success', 98)];
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
      const metrics = [createMetric('metric1', 'warning', 88)];
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
      const metrics = [createMetric('metric1', 'error', 77)];
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
        createMetric('metric1', 'success', 66),
        createMetric('metric1', 'success', 16),
        createMetric('metric1', 'warning', 55),
        createMetric('metric1', 'error', 44),
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

    it('should aggregate complex scenario with multiple metric_ids and statuses', () => {
      const metrics = [
        createMetric('metric1', 'success', 16),
        createMetric('metric1', 'success', 26),
        createMetric('metric1', 'warning', 26),
        createMetric('metric2', 'error', 36),
        createMetric('metric2', 'error', 46),
        createMetric('metric2', 'success', 56),
        createMetric('metric3', 'warning', 66),
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

  it('should skip metrics when value is null', () => {
    const metrics: DbMetricValue[] = [
      createMetric('metric1', 'success'),
      createMetric('metric1', 'warning', 1),
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

  it('should skip metrics when status is null', () => {
    const metrics: DbMetricValue[] = [
      createMetric('metric1', null, 1),
      createMetric('metric1', 'success', 4),
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

  it('should handle mixed valid and invalid metrics', () => {
    const metrics: DbMetricValue[] = [
      createMetric('metric1', 'success', 1),
      createMetric('metric1', 'warning'),
      createMetric('metric1', null, 2),
      createMetric('metric1', 'error', 3),
      createMetric('metric2', 'success'),
      createMetric('metric2', 'warning', 4),
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

  it('should return empty object when all metrics are invalid', () => {
    const metrics: DbMetricValue[] = [
      createMetric('metric1', 'success'),
      createMetric('metric2', null, 11),
    ];
    const result = aggregateMetricsByStatus(metrics);

    expect(result).toEqual({});
  });

  describe('edge cases', () => {
    it('should handle zero value', () => {
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

    it('should handle false value', () => {
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
