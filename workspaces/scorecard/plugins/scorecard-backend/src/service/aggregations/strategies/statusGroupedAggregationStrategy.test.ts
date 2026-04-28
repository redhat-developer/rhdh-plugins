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
  Metric,
  ThresholdConfig,
} from '@red-hat-developer-hub/backstage-plugin-scorecard-common';
import { AggregatedMetricLoader } from '../AggregatedMetricLoader';
import { StatusGroupedAggregationStrategy } from './StatusGroupedAggregationStrategy';
import { AggregatedMetricMapper } from '../../mappers';
import { DatabaseMetricValues } from '../../../database/DatabaseMetricValues';

describe('StatusGroupedAggregationStrategy', () => {
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

  it('loads aggregates and maps to status-grouped API result', async () => {
    const loadStatusGroupedMetricByEntityRefs = jest.fn().mockResolvedValue({
      values: { success: 2 },
      total: 2,
      timestamp: '2025-01-01T10:30:00.000Z',
    });

    const loader = {
      loadStatusGroupedMetricByEntityRefs,
    } as unknown as AggregatedMetricLoader;

    const toSpy = jest
      .spyOn(AggregatedMetricMapper, 'toAggregatedMetricResult')
      .mockReturnValue({
        id: metric.id,
        status: 'success',
        metadata: {
          title: metric.title,
          description: metric.description,
          type: metric.type,
          aggregationType: aggregationTypes.statusGrouped,
        },
        result: {
          total: 2,
          timestamp: '2025-01-01T10:30:00.000Z',
          values: [{ count: 2, name: 'success' }],
          thresholds,
          entitiesConsidered: 9,
          calculationErrorCount: 0,
        },
      });

    const strategy = new StatusGroupedAggregationStrategy(loader);
    const aggregationConfig = {
      id: metric.id,
      metricId: metric.id,
      type: aggregationTypes.statusGrouped,
    } as const;

    await strategy.aggregate({
      metric,
      entityRefs: ['component:default/a'],
      thresholds,
      aggregationConfig: aggregationConfig as any,
    });

    expect(loadStatusGroupedMetricByEntityRefs).toHaveBeenCalledWith(
      ['component:default/a'],
      metric.id,
    );
    expect(toSpy).toHaveBeenCalledWith(
      metric,
      expect.objectContaining({
        total: 2,
        values: expect.arrayContaining([
          expect.objectContaining({ name: 'error', count: 0 }),
          expect.objectContaining({ name: 'warning', count: 0 }),
          expect.objectContaining({ name: 'success', count: 2 }),
        ]),
      }),
      aggregationConfig,
    );

    toSpy.mockRestore();
  });

  it('delegates empty entityRefs to loader (no mock DB)', async () => {
    const loader = new AggregatedMetricLoader({
      readAggregatedMetricByEntityRefs: jest.fn(),
    } as unknown as DatabaseMetricValues);

    const strategy = new StatusGroupedAggregationStrategy(loader);
    const result = await strategy.aggregate({
      metric,
      entityRefs: [],
      thresholds,
      aggregationConfig: {
        id: metric.id,
        metricId: metric.id,
        type: aggregationTypes.statusGrouped,
      } as any,
    });

    expect(result.result.total).toBe(0);
    expect(
      result.result.values.map(v => ({ name: v.name, count: v.count })),
    ).toEqual([
      { name: 'error', count: 0 },
      { name: 'warning', count: 0 },
      { name: 'success', count: 0 },
    ]);
  });
});
