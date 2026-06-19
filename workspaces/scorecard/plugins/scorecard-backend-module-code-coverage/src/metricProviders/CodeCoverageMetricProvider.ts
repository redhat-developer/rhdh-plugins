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
import type { Entity } from '@backstage/catalog-model';
import { stringifyEntityRef } from '@backstage/catalog-model';
import { CATALOG_FILTER_EXISTS } from '@backstage/catalog-client';

import { CodeCoverageClient } from '../clients/CodeCoverageClient';
import {
  type CodeCoverageMetricId,
  CODE_COVERAGE_ANNOTATION,
  CODE_COVERAGE_METRIC_CONFIG,
  CODE_COVERAGE_AGGREGATE_KEYS,
  CODE_COVERAGE_THRESHOLDS,
} from './CodeCoverageConfig';

/**
 * Metric provider for a single code-coverage metric.
 * One instance per metric; the module registers eight providers.
 */
export class CodeCoverageMetricProvider implements MetricProvider<'number'> {
  private readonly client: CodeCoverageClient;
  private readonly metricId: CodeCoverageMetricId;

  constructor(client: CodeCoverageClient, metricId: CodeCoverageMetricId) {
    this.client = client;
    this.metricId = metricId;
  }

  getProviderDatasourceId(): string {
    return 'code-coverage';
  }

  getProviderId(): string {
    return CODE_COVERAGE_METRIC_CONFIG[this.metricId].id;
  }

  getMetricType(): 'number' {
    return 'number';
  }

  getMetric(): Metric<'number'> {
    const meta = CODE_COVERAGE_METRIC_CONFIG[this.metricId];
    return {
      id: meta.id,
      title: meta.title,
      description: meta.description,
      type: this.getMetricType(),
      history: true,
    };
  }

  getMetricThresholds(): ThresholdConfig {
    return CODE_COVERAGE_THRESHOLDS[this.metricId];
  }

  getCatalogFilter(): Record<string, string | symbol | (string | symbol)[]> {
    return {
      [`metadata.annotations.${CODE_COVERAGE_ANNOTATION}`]:
        CATALOG_FILTER_EXISTS,
    };
  }

  async calculateMetric(entity: Entity): Promise<number> {
    const entityRef = stringifyEntityRef(entity);
    const report = await this.client.getReport(entityRef);
    const mapping = CODE_COVERAGE_AGGREGATE_KEYS[this.metricId];
    return report.aggregate[mapping.section][mapping.field];
  }
}
