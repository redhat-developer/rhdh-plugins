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

import type { Entity } from '@backstage/catalog-model';
import { CATALOG_FILTER_EXISTS } from '@backstage/catalog-client';
import {
  Metric,
  ThresholdConfig,
} from '@red-hat-developer-hub/backstage-plugin-scorecard-common';
import { MetricProvider } from '@red-hat-developer-hub/backstage-plugin-scorecard-node';
import { FilecheckClient } from '../clients/FilecheckClient';
import {
  FilecheckConfig,
  DEFAULT_FILECHECK_THRESHOLDS,
} from './FilecheckConfig';

export class FilecheckMetricProvider implements MetricProvider<'boolean'> {
  private readonly client: FilecheckClient;
  private readonly filesConfig: FilecheckConfig;
  private readonly thresholds: ThresholdConfig;

  constructor(
    client: FilecheckClient,
    filesConfig: FilecheckConfig,
    thresholds?: ThresholdConfig,
  ) {
    this.client = client;
    this.filesConfig = filesConfig;
    this.thresholds = thresholds ?? DEFAULT_FILECHECK_THRESHOLDS;
  }

  getProviderDatasourceId(): string {
    return 'filecheck';
  }

  getProviderId(): string {
    return 'filecheck';
  }

  getMetricIds(): string[] {
    return this.filesConfig.files.map(f => `filecheck.${f.id}`);
  }

  getMetricType(): 'boolean' {
    return 'boolean';
  }

  getMetric(): Metric<'boolean'> {
    return this.getMetrics()[0];
  }

  getMetrics(): Metric<'boolean'>[] {
    return this.filesConfig.files.map(f => ({
      id: `filecheck.${f.id}`,
      title: `File: ${f.path}`,
      description: `Checks if ${f.path} exists in the repository.`,
      type: 'boolean' as const,
      history: true,
    }));
  }

  getMetricThresholds(): ThresholdConfig {
    return this.thresholds;
  }

  getCatalogFilter(): Record<string, string | symbol | (string | symbol)[]> {
    return {
      'metadata.annotations.backstage.io/source-location':
        CATALOG_FILTER_EXISTS,
    };
  }

  async calculateMetric(entity: Entity): Promise<boolean> {
    const results = await this.calculateMetrics(entity);
    const firstId = this.getMetricIds()[0];
    return results.get(firstId) ?? false;
  }

  async calculateMetrics(entity: Entity): Promise<Map<string, boolean>> {
    const results = new Map<string, boolean>();

    await Promise.all(
      this.filesConfig.files.map(async file => {
        const metricId = `filecheck.${file.id}`;
        const exists = await this.client.fileExists(entity, file.path);
        results.set(metricId, exists);
      }),
    );

    return results;
  }
}
