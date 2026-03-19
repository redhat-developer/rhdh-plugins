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
import { MetricProvider } from '@red-hat-developer-hub/backstage-plugin-scorecard-node';
import type { LoggerService } from '@backstage/backend-plugin-api';
import type { Config } from '@backstage/config';
import { stringifyEntityRef, type Entity } from '@backstage/catalog-model';
import { CATALOG_FILTER_EXISTS } from '@backstage/catalog-client';

import { SonarQubeClient } from '../clients/SonarQubeClient';
import {
  type SonarQubeNumberMetricId,
  SONARQUBE_METRIC_CONFIG,
  SONARQUBE_NUMBER_THRESHOLDS,
  SONARQUBE_PROJECT_KEY_ANNOTATION,
} from './SonarQubeConfig';

const SONARQUBE_API_METRIC_KEYS: Record<SonarQubeNumberMetricId, string[]> = {
  open_issues: [],
  security_rating: ['security_rating'],
  security_issues: ['vulnerabilities'],
};

export class SonarQubeNumberMetricProvider implements MetricProvider<'number'> {
  private readonly client: SonarQubeClient;
  private readonly metricId: SonarQubeNumberMetricId;
  private readonly thresholds: ThresholdConfig;

  constructor(
    config: Config,
    logger: LoggerService,
    metricId: SonarQubeNumberMetricId,
    thresholds?: ThresholdConfig,
  ) {
    this.client = new SonarQubeClient(config, logger);
    this.metricId = metricId;
    this.thresholds = thresholds ?? SONARQUBE_NUMBER_THRESHOLDS[metricId];
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

  private getProjectKey(entity: Entity): string {
    const projectKey =
      entity.metadata.annotations?.[SONARQUBE_PROJECT_KEY_ANNOTATION];
    if (!projectKey) {
      throw new Error(
        `Missing annotation '${SONARQUBE_PROJECT_KEY_ANNOTATION}' for entity ${stringifyEntityRef(
          entity,
        )}`,
      );
    }
    return projectKey;
  }

  async calculateMetric(entity: Entity): Promise<number> {
    const projectKey = this.getProjectKey(entity);

    switch (this.metricId) {
      case 'open_issues':
        return this.client.getOpenIssuesCount(projectKey);
      case 'security_rating': {
        const measures = await this.client.getMeasures(
          projectKey,
          SONARQUBE_API_METRIC_KEYS.security_rating,
        );
        return measures.security_rating;
      }
      case 'security_issues': {
        const measures = await this.client.getMeasures(
          projectKey,
          SONARQUBE_API_METRIC_KEYS.security_issues,
        );
        return measures.vulnerabilities;
      }
      default:
        throw new Error(`Unknown metric ID: ${this.metricId}`);
    }
  }
}
