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
import type { DbAggregatedMetric } from '../../database/types';
import type { DatabaseMetricValues } from '../../database/DatabaseMetricValues';

describe('AggregatedMetricLoader', () => {
  it('returns empty aggregation when entityRefs is empty without calling DB', async () => {
    const readAggregatedMetricByEntityRefs = jest.fn();
    const loader = new AggregatedMetricLoader({
      readAggregatedMetricByEntityRefs,
    } as unknown as DatabaseMetricValues);

    const result = await loader.loadStatusGroupedMetricByEntityRefs(
      [],
      'metric.id',
    );

    expect(readAggregatedMetricByEntityRefs).not.toHaveBeenCalled();
    expect(result.total).toBe(0);
    expect(result.values).toEqual({});
    expect(typeof result.timestamp).toBe('string');
  });

  it('reads DB and maps rows', async () => {
    const row: DbAggregatedMetric = {
      metric_id: 'm',
      total: 3,
      max_timestamp: new Date('2025-01-01T10:30:00.000Z'),
      statusCounts: { success: 3 },
      calculation_error_count: 1,
      latest_entity_count: 1,
    };

    const readAggregatedMetricByEntityRefs = jest.fn().mockResolvedValue(row);
    const loader = new AggregatedMetricLoader({
      readAggregatedMetricByEntityRefs,
    } as unknown as DatabaseMetricValues);

    const result = await loader.loadStatusGroupedMetricByEntityRefs(
      ['component:default/a'],
      'metric.id',
    );

    expect(readAggregatedMetricByEntityRefs).toHaveBeenCalledWith(
      ['component:default/a'],
      'metric.id',
    );
    expect(result.total).toBe(3);
    expect(result.values).toEqual({ success: 3 });
  });
});
