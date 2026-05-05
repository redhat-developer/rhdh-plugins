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
import {
  getThresholdsFromConfig,
  MetricProvider,
} from '@red-hat-developer-hub/backstage-plugin-scorecard-node';
import type { LoggerService } from '@backstage/backend-plugin-api';
import type { Config } from '@backstage/config';
import { type Entity } from '@backstage/catalog-model';

import { SonarQubeClient } from '../clients/SonarQubeClient';
import { SonarQubeBasicMetricProvider } from './SonarQubeBasicMetricProvider';
import {
  type SonarQubeBooleanMetricId,
  SONARQUBE_API_METRIC_KEYS,
  SONARQUBE_BOOLEAN_THRESHOLDS,
  parseProjectKeyAnnotation,
} from './SonarQubeConfig';

export class SonarQubeBooleanMetricProvider
  extends SonarQubeBasicMetricProvider<'boolean'>
  implements MetricProvider<'boolean'>
{
  constructor(
    client: SonarQubeClient,
    metricId: SonarQubeBooleanMetricId,
    thresholds: ThresholdConfig,
  ) {
    super(client, metricId, thresholds, 'boolean');
  }

  async calculateMetric(entity: Entity): Promise<boolean> {
    const { instanceName, projectKey } = parseProjectKeyAnnotation(entity);
    const mapping = SONARQUBE_API_METRIC_KEYS[this.metricId];

    if ('useQualityGateApi' in mapping) {
      return this.client.getQualityGateStatus(projectKey, instanceName);
    }

    throw new Error(`Unsupported metric ID: ${this.metricId}`);
  }

  static fromConfig(
    config: Config,
    logger: LoggerService,
    metricId: SonarQubeBooleanMetricId,
  ): SonarQubeBooleanMetricProvider {
    const client = new SonarQubeClient(config, logger);

    const thresholds =
      getThresholdsFromConfig(
        config,
        `scorecard.plugins.sonarqube.${metricId}.thresholds`,
        'boolean',
      ) ?? SONARQUBE_BOOLEAN_THRESHOLDS;

    return new SonarQubeBooleanMetricProvider(client, metricId, thresholds);
  }
}
