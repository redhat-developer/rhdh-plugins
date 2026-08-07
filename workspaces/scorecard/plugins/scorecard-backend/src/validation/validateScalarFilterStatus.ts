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

import { InputError } from '@backstage/errors';
import { MetricProvidersRegistry } from '../providers/MetricProvidersRegistry';
import { ThresholdResolver } from '../threshold/ThresholdResolver';
import { ScalarAggregationConfig } from './schemas/aggregationConfigSchemas';

export function validateScalarFilterStatus(options: {
  aggregationConfig: ScalarAggregationConfig;
  aggregationId: string;
  registry: MetricProvidersRegistry;
  thresholdResolver: ThresholdResolver;
}): void {
  const { aggregationConfig, aggregationId, registry, thresholdResolver } =
    options;
  const status = aggregationConfig.filter?.status;

  if (!status) {
    return;
  }

  const metric = registry.getMetric(aggregationConfig.metricId);
  const thresholds = thresholdResolver.resolveMetricThresholds(metric);
  const validKeys = thresholds.rules.map(rule => rule.key);

  if (!validKeys.includes(status)) {
    throw new InputError(
      `Aggregation KPI "${aggregationId}" filter.status "${status}" is not a threshold rule key ` +
        `for metric "${
          aggregationConfig.metricId
        }". Valid keys: ${validKeys.join(', ')}.`,
    );
  }
}
