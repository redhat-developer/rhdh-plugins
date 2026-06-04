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

import type { Config } from '@backstage/config';
import type { Entity } from '@backstage/catalog-model';
import type { ThresholdConfig } from '@red-hat-developer-hub/backstage-plugin-scorecard-common';
import {
  getThresholdsFromConfig,
  type MetricProvider,
} from '@red-hat-developer-hub/backstage-plugin-scorecard-node';
import { mergeEntityAndProviderThresholds } from '../utils/mergeEntityAndProviderThresholds';

export class ThresholdResolver {
  constructor(private readonly config: Config) {}

  resolveProviderThresholds(provider: MetricProvider): ThresholdConfig {
    return (
      getThresholdsFromConfig(
        this.config,
        `scorecard.plugins.${provider.getProviderId()}.thresholds`,
        provider.getMetricType(),
      ) ?? provider.getMetricThresholds()
    );
  }

  resolveEntityThresholds(
    entity: Entity,
    provider: MetricProvider,
  ): ThresholdConfig {
    return mergeEntityAndProviderThresholds(
      entity,
      provider,
      this.resolveProviderThresholds(provider),
    );
  }
}
