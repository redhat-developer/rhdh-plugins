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
import type { Config } from '@backstage/config';
import { MetricProvidersRegistry } from '../providers/MetricProvidersRegistry';
import { AGGREGATION_KPIS_CONFIG_PATH } from '../constants';
import { aggregationConfigSchema } from './schemas/aggregationConfigSchemas';
import type { ValidatedAggregationConfig } from './schemas/aggregationConfigSchemas';
import { buildAggregationConfig } from '../utils/buildAggregationConfig';
import { validateThresholdsForAggregation } from '@red-hat-developer-hub/backstage-plugin-scorecard-node';
import {
  aggregationTypes,
  scalarAggregationTypes,
} from '@red-hat-developer-hub/backstage-plugin-scorecard-common';

function isScalarAggregationType(type: string): boolean {
  return (scalarAggregationTypes as readonly string[]).includes(type);
}

function validateScalarAggregationConfig(
  aggregationConfig: ValidatedAggregationConfig,
  registry: MetricProvidersRegistry,
  aggregationId: string,
): void {
  if (!isScalarAggregationType(aggregationConfig.type)) {
    return;
  }

  const metric = registry.getMetric(aggregationConfig.metricId);

  if (metric.type === 'boolean') {
    throw new InputError(
      `Aggregation KPI "${aggregationId}" uses type "${aggregationConfig.type}" which requires a number metric, but "${aggregationConfig.metricId}" is boolean.`,
    );
  }
}

export function parseValidatedAggregationConfig(
  config: unknown,
): ValidatedAggregationConfig {
  const parsed = aggregationConfigSchema.safeParse(config);

  if (!parsed.success) {
    const errorMessage = parsed.error.errors
      .map(error => `${error.message} for attribute "${error.path.join('.')}"`)
      .join('; ');

    throw new InputError(`${errorMessage}`);
  }

  if (
    parsed.data.type !== aggregationTypes.statusGrouped &&
    parsed.data.options?.thresholds
  ) {
    validateThresholdsForAggregation(parsed.data.options.thresholds, 'number');
  }

  return parsed.data;
}

export function validateAggregationConfig(options: {
  rootConfig: Config;
  registry: MetricProvidersRegistry;
}): void {
  const { rootConfig, registry } = options;

  const aggregationKPIsConfig = rootConfig.getOptionalConfig(
    AGGREGATION_KPIS_CONFIG_PATH,
  );

  if (!aggregationKPIsConfig) {
    return;
  }

  for (const aggregationId of aggregationKPIsConfig.keys()) {
    const config = aggregationKPIsConfig.getConfig(aggregationId);

    const aggregationConfig = parseValidatedAggregationConfig(
      buildAggregationConfig(aggregationId, {
        config,
      }),
    );

    if (!registry.hasProvider(aggregationConfig.metricId)) {
      throw new Error(
        `Metric provider with ID '${aggregationConfig.metricId}' is not registered (${AGGREGATION_KPIS_CONFIG_PATH}.${aggregationId}).`,
      );
    }

    validateScalarAggregationConfig(aggregationConfig, registry, aggregationId);
  }
}
