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

import { z } from 'zod';
import { InputError } from '@backstage/errors';
import type { AggregationConfig } from '../utils/buildAggregationConfig';
import { aggregationTypes } from '@red-hat-developer-hub/backstage-plugin-scorecard-common';
import type { Config } from '@backstage/config';
import { MetricProvidersRegistry } from '../providers/MetricProvidersRegistry';
import { AGGREGATION_KPIS_CONFIG_PATH } from '../constants';
import { buildAggregationConfig } from '../utils/buildAggregationConfig';

function parseAggregationConfig(config: unknown): AggregationConfig {
  const aggregationConfigSchema = z.object({
    type: z.nativeEnum(aggregationTypes),
    id: z.string().min(1).max(255),
    title: z.string().min(1).max(255),
    metricId: z.string().min(1).max(255),
    description: z.string().min(1).max(255),
  });

  const parsed = aggregationConfigSchema.safeParse(config);

  if (!parsed.success) {
    const errorMessage = parsed.error.errors
      .map(error => `${error.message} for attribute "${error.path.join('.')}"`)
      .join('; ');

    throw new InputError(`${errorMessage}`);
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

    const aggregationConfig = buildAggregationConfig(aggregationId, {
      config,
    });

    parseAggregationConfig(aggregationConfig);

    if (!registry.hasProvider(aggregationConfig.metricId)) {
      throw new Error(
        `Metric provider with ID '${aggregationConfig.metricId}' is not registered (${AGGREGATION_KPIS_CONFIG_PATH}.${aggregationId}).`,
      );
    }
  }
}
