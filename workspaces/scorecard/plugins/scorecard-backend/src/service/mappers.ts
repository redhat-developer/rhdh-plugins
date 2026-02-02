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
  AggregatedMetric,
  AggregatedMetricResult,
  Metric,
} from '@red-hat-developer-hub/backstage-plugin-scorecard-common';
import { DbAggregatedMetric } from '../database/types';

export class AggregatedMetricMapper {
  static toAggregatedMetric(
    aggregatedMetric?: DbAggregatedMetric,
  ): AggregatedMetric {
    const success = aggregatedMetric?.success ?? 0;
    const warning = aggregatedMetric?.warning ?? 0;
    const error = aggregatedMetric?.error ?? 0;
    const total = aggregatedMetric?.total ?? 0;
    const timestamp = aggregatedMetric?.max_timestamp
      ? new Date(aggregatedMetric.max_timestamp).toISOString()
      : new Date().toISOString();

    return {
      values: [
        { count: success, name: 'success' },
        { count: warning, name: 'warning' },
        { count: error, name: 'error' },
      ],
      total,
      timestamp,
    };
  }

  static toAggregatedMetricResult(
    metric: Metric,
    aggregatedMetric: AggregatedMetric,
  ): AggregatedMetricResult {
    return {
      id: metric.id,
      status: 'success',
      metadata: {
        title: metric.title,
        description: metric.description,
        type: metric.type,
        history: metric.history,
      },
      result: aggregatedMetric,
    };
  }
}
