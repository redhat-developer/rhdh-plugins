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
import type { Entity } from '@backstage/catalog-model';

import { Metric } from '@red-hat-developer-hub/backstage-plugin-scorecard-common';
import { MetricProvider } from '@red-hat-developer-hub/backstage-plugin-scorecard-node';

import { CodecovClient } from '../clients/CodecovClient';
import { CODECOV_REPO_ANNOTATION } from '../annotations';
import {
  CODECOV_METRICS,
  CODECOV_METRIC_CONFIG,
  CODECOV_THRESHOLDS,
  CODECOV_TOTALS_FIELD_MAP,
} from './CodecovConfig';

/**
 * Metric provider for all Codecov metrics.
 * A single instance provides all seven metrics from one API call.
 */
export class CodecovMetricProvider implements MetricProvider<'number'> {
  private readonly client: CodecovClient;

  constructor(client: CodecovClient) {
    this.client = client;
  }

  getProviderDatasourceId(): string {
    return 'codecov';
  }

  getProviderId(): string {
    return 'codecov.repoMetrics';
  }

  getMetrics(): Metric<'number'>[] {
    return CODECOV_METRICS.map(metricId => {
      const meta = CODECOV_METRIC_CONFIG[metricId];
      return {
        id: meta.id,
        title: meta.title,
        description: meta.description,
        type: 'number' as const,
        thresholds: CODECOV_THRESHOLDS[metricId],
        ...(meta.unit ? { unit: meta.unit } : {}),
        history: true,
      };
    });
  }

  getCatalogFilter(): Record<string, string | symbol | (string | symbol)[]> {
    return {
      [`metadata.annotations.${CODECOV_REPO_ANNOTATION}`]:
        CATALOG_FILTER_EXISTS,
    };
  }

  async calculateMetrics(entity: Entity): Promise<Map<string, number>> {
    const repoData = await this.client.getRepoData(entity);
    const results = new Map<string, number>();

    for (const metricId of CODECOV_METRICS) {
      const fieldName = CODECOV_TOTALS_FIELD_MAP[metricId];
      const value = repoData.totals[fieldName as keyof typeof repoData.totals];
      if (value !== undefined && value !== null) {
        results.set(CODECOV_METRIC_CONFIG[metricId].id, value);
      }
    }

    return results;
  }
}
