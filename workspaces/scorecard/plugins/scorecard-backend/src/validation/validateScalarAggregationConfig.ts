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
import { aggregationTypes } from '@red-hat-developer-hub/backstage-plugin-scorecard-common';
import { ThresholdResolver } from '../threshold/ThresholdResolver';
import { MetricProvidersRegistry } from '../providers/MetricProvidersRegistry';
import { ScalarAggregationConfig } from './schemas/aggregationConfigSchemas';
import { validateScalarFilterStatus } from './validateScalarFilterStatus';

type ValidateScalarAggregationConfigOptions = {
  aggregationConfig: ScalarAggregationConfig;
  aggregationId: string;
  registry: MetricProvidersRegistry;
  thresholdResolver: ThresholdResolver;
};

export function validateScalarAggregationConfig(
  options: ValidateScalarAggregationConfigOptions,
): void {
  const { aggregationConfig, aggregationId, registry, thresholdResolver } =
    options;
  const metric = registry.getMetric(aggregationConfig.metricId);

  if (
    metric.type === 'boolean' &&
    aggregationConfig.type !== aggregationTypes.count
  ) {
    throw new InputError(
      `Aggregation KPI "${aggregationId}" uses type "${aggregationConfig.type}" which requires a number metric, but "${aggregationConfig.metricId}" is boolean.`,
    );
  }

  validateScalarFilterStatus({
    aggregationConfig,
    aggregationId,
    registry,
    thresholdResolver,
  });
}
