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

import { DbMetricValue } from '../database/types';
import { AggregatedMetricsByStatus } from '../service/CatalogMetricService';

export function aggregateMetricsByStatus(
  metrics: DbMetricValue[],
): AggregatedMetricsByStatus {
  const aggregatedMetrics: AggregatedMetricsByStatus = {};

  for (const metric of metrics) {
    if (metric.status && metric.value !== null) {
      if (!Object.hasOwn(aggregatedMetrics, metric.metric_id)) {
        aggregatedMetrics[metric.metric_id] = {
          values: {
            success: 0,
            warning: 0,
            error: 0,
          },
          total: 0,
        };
      }

      aggregatedMetrics[metric.metric_id].values[metric.status]++;
      aggregatedMetrics[metric.metric_id].total++;
    }
  }

  return aggregatedMetrics;
}
