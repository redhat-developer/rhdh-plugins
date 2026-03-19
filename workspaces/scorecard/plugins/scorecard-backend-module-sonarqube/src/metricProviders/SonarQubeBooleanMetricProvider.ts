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
  SONARQUBE_BOOLEAN_THRESHOLDS,
  SONARQUBE_METRIC_CONFIG,
  SONARQUBE_PROJECT_KEY_ANNOTATION,
} from './SonarQubeConfig';

export class SonarQubeBooleanMetricProvider
  implements MetricProvider<'boolean'>
{
  private readonly client: SonarQubeClient;
  private readonly thresholds: ThresholdConfig;

  constructor(
    config: Config,
    logger: LoggerService,
    thresholds?: ThresholdConfig,
  ) {
    this.client = new SonarQubeClient(config, logger);
    this.thresholds = thresholds ?? SONARQUBE_BOOLEAN_THRESHOLDS;
  }

  getProviderDatasourceId(): string {
    return 'sonarqube';
  }

  getProviderId(): string {
    return SONARQUBE_METRIC_CONFIG.quality_gate.id;
  }

  getMetricType(): 'boolean' {
    return 'boolean';
  }

  getMetric(): Metric<'boolean'> {
    const meta = SONARQUBE_METRIC_CONFIG.quality_gate;
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

  async calculateMetric(entity: Entity): Promise<boolean> {
    const projectKey =
      entity.metadata.annotations?.[SONARQUBE_PROJECT_KEY_ANNOTATION];
    if (!projectKey) {
      throw new Error(
        `Missing annotation '${SONARQUBE_PROJECT_KEY_ANNOTATION}' for entity ${stringifyEntityRef(
          entity,
        )}`,
      );
    }
    return this.client.getQualityGateStatus(projectKey);
  }
}
