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

import { AggregatedMetricLoader } from './AggregatedMetricLoader';
import type { DatabaseMetricValues } from '../../database/DatabaseMetricValues';
import { AggregatedMetricMapper } from '../mappers';
import {
  AggregatedMetric,
  ScalarAggregatedMetric,
} from '@red-hat-developer-hub/backstage-plugin-scorecard-common';

describe('AggregatedMetricLoader', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('loadStatusGroupedMetricByEntityRefs', () => {
    const aggregatedMetric = {
      values: { success: 3, error: 1, warning: 2 },
      total: 6,
      timestamp: '2025-01-01T10:30:00.000Z',
      entitiesConsidered: 1,
      calculationErrorCount: 1,
    } as AggregatedMetric;

    const readAggregatedMetricByEntityRefs = jest
      .fn()
      .mockResolvedValue(aggregatedMetric);

    let spyMethods: {
      toAggregatedMetricSpy: jest.SpyInstance;
    };
    let loader: AggregatedMetricLoader;

    beforeEach(() => {
      spyMethods = {
        toAggregatedMetricSpy: jest.spyOn(
          AggregatedMetricMapper,
          'toAggregatedMetric',
        ),
      };
      loader = new AggregatedMetricLoader({
        readAggregatedMetricByEntityRefs,
      } as unknown as DatabaseMetricValues);
    });

    it('should map empty aggregated metric when entityRefs is empty', async () => {
      await loader.loadStatusGroupedMetricByEntityRefs([], 'metric.id');

      expect(spyMethods.toAggregatedMetricSpy).toHaveBeenCalledWith();
      expect(readAggregatedMetricByEntityRefs).not.toHaveBeenCalled();
    });

    it('should read aggregated metric by entity refs', async () => {
      await loader.loadStatusGroupedMetricByEntityRefs(
        ['component:default/a'],
        'metric.id',
      );

      expect(readAggregatedMetricByEntityRefs).toHaveBeenCalledWith(
        ['component:default/a'],
        'metric.id',
      );
    });

    it('should map aggregated metric', async () => {
      await loader.loadStatusGroupedMetricByEntityRefs(
        ['component:default/a'],
        'metric.id',
      );

      expect(spyMethods.toAggregatedMetricSpy).toHaveBeenCalledWith(
        aggregatedMetric,
      );
    });
  });

  describe('loadScalarMetricByEntityRefs', () => {
    const scalarAggregatedMetric = {
      value: 847,
      total: 42,
      entitiesConsidered: 45,
      calculationErrorCount: 3,
      timestamp: '2025-01-01T10:30:00.000Z',
    } as ScalarAggregatedMetric;

    const readScalarAggregatedMetricByEntityRefs = jest
      .fn()
      .mockResolvedValue(scalarAggregatedMetric);

    let spyMethods: {
      toScalarAggregatedMetricSpy: jest.SpyInstance;
    };
    let loader: AggregatedMetricLoader;

    beforeEach(() => {
      spyMethods = {
        toScalarAggregatedMetricSpy: jest.spyOn(
          AggregatedMetricMapper,
          'toScalarAggregatedMetric',
        ),
      };
      loader = new AggregatedMetricLoader({
        readScalarAggregatedMetricByEntityRefs,
      } as unknown as DatabaseMetricValues);
    });

    it('should map empty scalar aggregated metric when entityRefs is empty', async () => {
      await loader.loadScalarMetricByEntityRefs([], 'metric.id', 'sum');

      expect(spyMethods.toScalarAggregatedMetricSpy).toHaveBeenCalledWith();
      expect(readScalarAggregatedMetricByEntityRefs).not.toHaveBeenCalled();
    });

    it('should read scalar aggregated metric by entity refs', async () => {
      await loader.loadScalarMetricByEntityRefs(
        ['component:default/a'],
        'metric.id',
        'sum',
      );

      expect(readScalarAggregatedMetricByEntityRefs).toHaveBeenCalledWith(
        ['component:default/a'],
        'metric.id',
        'sum',
        undefined,
      );
    });

    it('should map scalar aggregated metric', async () => {
      await loader.loadScalarMetricByEntityRefs(
        ['component:default/a'],
        'metric.id',
        'sum',
      );

      expect(spyMethods.toScalarAggregatedMetricSpy).toHaveBeenCalledWith(
        scalarAggregatedMetric,
      );
    });

    it('should forward filter to scalar DB read', async () => {
      await loader.loadScalarMetricByEntityRefs(
        ['component:default/a'],
        'metric.id',
        'sum',
        { status: 'error' },
      );

      expect(readScalarAggregatedMetricByEntityRefs).toHaveBeenCalledWith(
        ['component:default/a'],
        'metric.id',
        'sum',
        { status: 'error' },
      );
    });
  });

  describe('loadScalarMetricTimeSeriesByEntityRefs', () => {
    const dbRows = [
      { utcDay: '2024-01-01', value: 12, total: 3 },
      { utcDay: '2024-01-02', value: 5, total: 3 },
    ];
    const readScalarAggregatedMetricTimeSeriesByEntityRefs = jest
      .fn()
      .mockResolvedValue(dbRows);
    const from = new Date('2024-01-01T00:00:00Z');
    const to = new Date('2024-01-31T00:00:00Z');

    let loader: AggregatedMetricLoader;

    beforeEach(() => {
      loader = new AggregatedMetricLoader({
        readScalarAggregatedMetricTimeSeriesByEntityRefs,
      } as unknown as DatabaseMetricValues);
    });

    it('should return empty points when entityRefs is empty', async () => {
      const result = await loader.loadScalarMetricTimeSeriesByEntityRefs(
        [],
        'metric.id',
        'sum',
        from,
        to,
      );

      expect(result).toEqual([]);
      expect(
        readScalarAggregatedMetricTimeSeriesByEntityRefs,
      ).not.toHaveBeenCalled();
    });

    it('should map db rows to time-series points', async () => {
      const result = await loader.loadScalarMetricTimeSeriesByEntityRefs(
        ['component:default/a'],
        'metric.id',
        'sum',
        from,
        to,
        { status: 'error' },
      );

      expect(
        readScalarAggregatedMetricTimeSeriesByEntityRefs,
      ).toHaveBeenCalledWith(
        ['component:default/a'],
        'metric.id',
        'sum',
        from,
        to,
        { status: 'error' },
      );
      expect(result).toEqual([
        { value: 12, total: 3, timestamp: '2024-01-01T00:00:00.000Z' },
        { value: 5, total: 3, timestamp: '2024-01-02T00:00:00.000Z' },
      ]);
    });
  });
});
