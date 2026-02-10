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
  Metric,
  ThresholdConfig,
} from '@red-hat-developer-hub/backstage-plugin-scorecard-common';
import { MetricProvider } from '@red-hat-developer-hub/backstage-plugin-scorecard-node';

import { OpenSSFClient } from '../clients/OpenSSFClient';
import {
  OPENSSF_METRICS,
  OPENSSF_THRESHOLDS,
  OpenSSFMetricConfig,
} from './OpenSSFConfig';

export class OpenSSFMetricProvider implements MetricProvider<'number'> {
  protected readonly openSSFClient: OpenSSFClient;
  protected readonly thresholds: ThresholdConfig;

  constructor(
    readonly config: OpenSSFMetricConfig,
    thresholds: ThresholdConfig,
  ) {
    this.thresholds = thresholds;
    this.config = config;
    this.openSSFClient = new OpenSSFClient();
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
      'metadata.annotations.openssf/baseUrl': CATALOG_FILTER_EXISTS,
    };
  }

  async calculateMetric(entity: Entity): Promise<number> {
    const scorecard = await this.openSSFClient.getScorecard(entity);

    const metricName = this.getMetricName();
    const metric = scorecard.checks.find(c => c.name === metricName);

    if (!metric) {
      throw new Error(`OpenSSF check '${metricName}' not found in scorecard`);
    } else if (metric.score < 0 || metric.score > 10) {
      throw new Error(
        `OpenSSF check '${metricName}' has invalid score ${metric.score}`,
      );
    }
    return metric.score;
  }
}

/**
 * Creates all default OpenSSF metric providers.
 * @param clientOptions Optional base URL and git service host (from app-config)
 * @returns Array of OpenSSF metric providers
 */
export function createOpenSSFMetricProvider(): MetricProvider<'number'>[] {
  return OPENSSF_METRICS.map(
    config => new OpenSSFMetricProvider(config, OPENSSF_THRESHOLDS),
  );
}
