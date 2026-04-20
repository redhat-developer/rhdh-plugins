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
  Metric,
  ThresholdConfig,
} from '@red-hat-developer-hub/backstage-plugin-scorecard-common';
import {
  getThresholdsFromConfig,
  MetricProvider,
} from '@red-hat-developer-hub/backstage-plugin-scorecard-node';
import type { LoggerService } from '@backstage/backend-plugin-api';
import type { Config } from '@backstage/config';
import { type Entity } from '@backstage/catalog-model';
import { CATALOG_FILTER_EXISTS } from '@backstage/catalog-client';

import { SonarQubeClient } from '../clients/SonarQubeClient';
import {
  type SonarQubeNumberMetricId,
  SONARQUBE_API_METRIC_KEYS,
  SONARQUBE_METRIC_CONFIG,
  SONARQUBE_NUMBER_THRESHOLDS,
  SONARQUBE_PROJECT_KEY_ANNOTATION,
  parseProjectKeyAnnotation,
} from './SonarQubeConfig';

export class SonarQubeNumberMetricProvider implements MetricProvider<'number'> {
  private readonly client: SonarQubeClient;
  private readonly metricId: SonarQubeNumberMetricId;
  private readonly thresholds: ThresholdConfig;

  constructor(
    client: SonarQubeClient,
    metricId: SonarQubeNumberMetricId,
    thresholds: ThresholdConfig,
  ) {
    this.client = client;
    this.metricId = metricId;
    this.thresholds = thresholds;
  }

  getProviderDatasourceId(): string {
    return 'sonarqube';
  }

  getProviderId(): string {
    return SONARQUBE_METRIC_CONFIG[this.metricId].id;
  }

  getMetricType(): 'number' {
    return 'number';
  }

  getMetric(): Metric<'number'> {
    const meta = SONARQUBE_METRIC_CONFIG[this.metricId];
    return {
      id: meta.id,
      title: meta.title,
      description: meta.description,
      type: this.getMetricType(),
      history: true,
    };
  }

  getMetricThresholds(): ThresholdConfig {
    return this.thresholds;
  }

  getCatalogFilter(): Record<string, string | symbol | (string | symbol)[]> {
    return {
      [`metadata.annotations.${SONARQUBE_PROJECT_KEY_ANNOTATION}`]:
        CATALOG_FILTER_EXISTS,
    };
  }

  async calculateMetric(entity: Entity): Promise<number> {
    const { instanceName, projectKey } = parseProjectKeyAnnotation(entity);
    const mapping = SONARQUBE_API_METRIC_KEYS[this.metricId];

    if ('useOpenIssuesApi' in mapping) {
      return this.client.getOpenIssuesCount(projectKey, instanceName);
    }

    if ('apiKey' in mapping) {
      const measures = await this.client.getMeasures(
        projectKey,
        [mapping.apiKey],
        instanceName,
      );
      return measures[mapping.apiKey];
    }

    throw new Error(`Unsupported metric ID: ${this.metricId}`);
  }

  static fromConfig(
    config: Config,
    logger: LoggerService,
    metricId: SonarQubeNumberMetricId,
  ): SonarQubeNumberMetricProvider {
    const client = new SonarQubeClient(config, logger);

    const thresholds =
      getThresholdsFromConfig(
        config,
        `scorecard.plugins.sonarqube.${metricId}.thresholds`,
        'number',
      ) ?? SONARQUBE_NUMBER_THRESHOLDS[metricId];

    return new SonarQubeNumberMetricProvider(client, metricId, thresholds);
  }
}
