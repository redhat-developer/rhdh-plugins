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

import { ThresholdConfig } from '@red-hat-developer-hub/backstage-plugin-scorecard-common';
import { MetricProvider } from '@red-hat-developer-hub/backstage-plugin-scorecard-node';
import { AbstractMetricProvider } from './AbstractMetricProvider';
import { OPENSSF_METRICS, OpenSSFMetricConfig } from './OpenSSFConfig';

/**
 * Default metric provider for OpenSSF Security Scorecards.
 * Extracts a specific check from the OpenSSF scorecard response based on the provided configuration.
 */
export class DefaultOpenSSFMetricProvider extends AbstractMetricProvider {
  constructor(
    private readonly config: OpenSSFMetricConfig,
    thresholds?: ThresholdConfig,
  ) {
    super(thresholds);
  }

  getMetricName(): string {
    return this.config.name;
  }

  getMetricDisplayTitle(): string {
    return this.config.displayTitle;
  }

  getMetricDescription(): string {
    return this.config.description;
  }
}

/**
 * Creates all default OpenSSF metric providers.
 * @param thresholds Optional threshold configuration to apply to all providers
 * @returns Array of OpenSSF metric providers
 */
export function createDefaultOpenSSFMetricProviders(
  thresholds?: ThresholdConfig,
): MetricProvider<'number'>[] {
  return OPENSSF_METRICS.map(
    config => new DefaultOpenSSFMetricProvider(config, thresholds),
  );
}
