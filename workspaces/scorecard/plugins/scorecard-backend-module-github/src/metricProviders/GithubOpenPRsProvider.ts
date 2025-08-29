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
import {
  DEFAULT_NUMBER_THRESHOLDS,
  Metric,
  ThresholdConfig,
} from '@red-hat-developer-hub/backstage-plugin-scorecard-common';
import {
  MetricProvider,
  validateThresholds,
} from '@red-hat-developer-hub/backstage-plugin-scorecard-node';

export class GithubOpenPRsProvider implements MetricProvider<'number'> {
  private readonly thresholds: ThresholdConfig;

  private constructor(thresholds?: ThresholdConfig) {
    this.thresholds = thresholds ?? DEFAULT_NUMBER_THRESHOLDS;
  }

  getProviderDatasourceId(): string {
    return 'github';
  }

  getProviderId() {
    return 'github.open-prs';
  }

  getMetric(): Metric<'number'> {
    return {
      id: this.getProviderId(),
      title: 'Github open PRs',
      description:
        'Current count of open Pull Requests for a given GitHub repository.',
      type: 'number',
      history: true,
    };
  }

  getMetricThresholds(): ThresholdConfig {
    return this.thresholds;
  }

  static fromConfig(config: Config): GithubOpenPRsProvider {
    const configPath = 'scorecard.plugins.github.open_prs.thresholds';
    const configuredThresholds = config.getOptional(configPath);
    if (configuredThresholds !== undefined) {
      validateThresholds(configuredThresholds, 'number');
    }

    return new GithubOpenPRsProvider(configuredThresholds);
  }

  async calculateMetric(entity: Entity): Promise<number> {
    return entity.metadata.name.length;
  }
}
