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
import { CATALOG_FILTER_EXISTS } from '@backstage/catalog-client';

import { SonarQubeClient } from '../clients/SonarQubeClient';
import {
  type SonarQubeMetricId,
  SONARQUBE_METRIC_CONFIG,
  SONARQUBE_PROJECT_KEY_ANNOTATION,
} from './SonarQubeConfig';

export class SonarQubeBasicMetricProvider<T extends 'boolean' | 'number'> {
  constructor(
    protected readonly client: SonarQubeClient,
    protected readonly metricId: SonarQubeMetricId,
    protected readonly thresholds: ThresholdConfig,
    private readonly metricType: T,
  ) {}

  getProviderDatasourceId(): string {
    return 'sonarqube';
  }

  getProviderId(): string {
    return SONARQUBE_METRIC_CONFIG[this.metricId].id;
  }

  getMetricType(): T {
    return this.metricType;
  }

  getMetric(): Metric<T> {
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
}
