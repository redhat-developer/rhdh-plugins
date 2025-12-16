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

import { CATALOG_FILTER_EXISTS } from '@backstage/catalog-client';
import { type Entity } from '@backstage/catalog-model';
import {
  DEFAULT_NUMBER_THRESHOLDS,
  Metric,
  ThresholdConfig,
} from '@red-hat-developer-hub/backstage-plugin-scorecard-common';
import { MetricProvider } from '@red-hat-developer-hub/backstage-plugin-scorecard-node';

import { OpenSSFClient } from '../clients/OpenSSFClient';
import { getRepositoryInformationFromEntity } from '../clients/utils';

/**
 * Abstract base class for OpenSSF metric providers.
 * Extracts a specific check from the OpenSSF scorecard response.
 *
 * Subclasses must implement:
 * - getCheckName(): The name of the check to extract (e.g., "Maintained", "Code-Review")
 * - getMetricName(): The metric name for the provider ID (e.g., "maintained", "code_review")
 * - getMetricTitle(): Display title for the metric
 * - getMetricDescription(): Description of what the metric measures
 */
export abstract class AbstractMetricProvider
  implements MetricProvider<'number'>
{
  protected readonly openSSFClient: OpenSSFClient;
  protected readonly thresholds: ThresholdConfig;

  constructor(thresholds?: ThresholdConfig) {
    this.openSSFClient = new OpenSSFClient();
    this.thresholds = thresholds ?? DEFAULT_NUMBER_THRESHOLDS;
  }

  protected abstract getMetricName(): string;

  protected abstract getMetricDisplayTitle(): string;

  protected abstract getMetricDescription(): string;

  getProviderDatasourceId(): string {
    return 'openssf';
  }

  getProviderId(): string {
    const normalizedName = this.getMetricName()
      .toLowerCase()
      .replace(/-/g, '_');
    return `openssf.${normalizedName}`;
  }

  getMetricType(): 'number' {
    return 'number';
  }

  getMetric(): Metric<'number'> {
    return {
      id: this.getProviderId(),
      title: this.getMetricDisplayTitle(),
      description: this.getMetricDescription(),
      type: this.getMetricType(),
      history: true,
    };
  }

  getMetricThresholds(): ThresholdConfig {
    return this.thresholds;
  }

  getCatalogFilter(): Record<string, string | symbol | (string | symbol)[]> {
    return {
      'metadata.annotations.openssf/project': CATALOG_FILTER_EXISTS,
    };
  }

  async calculateMetric(entity: Entity): Promise<number> {
    const { owner, repo } = getRepositoryInformationFromEntity(entity);
    const scorecard = await this.openSSFClient.getScorecard(owner, repo);

    const metricName = this.getMetricName();
    const metric = scorecard.checks.find(c => c.name === metricName);

    if (!metric) {
      throw new Error(
        `OpenSSF check '${metricName}' not found in scorecard for ${owner}/${repo}`,
      );
    }

    return metric.score;
  }
}
