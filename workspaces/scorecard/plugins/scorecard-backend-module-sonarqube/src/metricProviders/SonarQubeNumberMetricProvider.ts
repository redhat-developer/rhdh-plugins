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
import type { LoggerService } from '@backstage/backend-plugin-api';
import type { Config } from '@backstage/config';
import { type Entity } from '@backstage/catalog-model';

import { SonarQubeClient } from '../clients/SonarQubeClient';
import { SonarQubeBasicMetricProvider } from './SonarQubeBasicMetricProvider';
import {
  type SonarQubeNumberMetricId,
  SONARQUBE_API_METRIC_KEYS,
  SONARQUBE_NUMBER_THRESHOLDS,
  parseProjectKeyAnnotation,
} from './SonarQubeConfig';

export class SonarQubeNumberMetricProvider
  extends SonarQubeBasicMetricProvider<'number'>
  implements MetricProvider<'number'>
{
  constructor(
    client: SonarQubeClient,
    metricId: SonarQubeNumberMetricId,
    thresholds: ThresholdConfig,
  ) {
    super(client, metricId, thresholds, 'number');
  }

  async calculateMetrics(entity: Entity): Promise<Map<string, number>> {
    const { instanceName, projectKey } = parseProjectKeyAnnotation(entity);
    const mapping = SONARQUBE_API_METRIC_KEYS[this.metricId];

    let value: number;

    if ('useOpenIssuesApi' in mapping) {
      value = await this.client.getOpenIssuesCount(projectKey, instanceName);
    } else if ('apiKey' in mapping) {
      const measures = await this.client.getMeasures(
        projectKey,
        [mapping.apiKey],
        instanceName,
      );
      value = measures[mapping.apiKey];
    } else {
      throw new Error(`Unsupported metric ID: ${this.metricId}`);
    }

    const results = new Map<string, number>();
    results.set(this.getProviderId(), value);
    return results;
  }

  static fromConfig(
    config: Config,
    logger: LoggerService,
    metricId: SonarQubeNumberMetricId,
  ): SonarQubeNumberMetricProvider {
    const client = new SonarQubeClient(config, logger);
    return new SonarQubeNumberMetricProvider(
      client,
      metricId,
      SONARQUBE_NUMBER_THRESHOLDS[metricId],
    );
  }
}
