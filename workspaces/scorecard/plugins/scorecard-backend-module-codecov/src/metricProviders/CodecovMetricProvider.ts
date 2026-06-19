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
import { type Entity } from '@backstage/catalog-model';
import { CATALOG_FILTER_EXISTS } from '@backstage/catalog-client';

import { CodecovClient } from '../clients/CodecovClient';
import {
  type CodecovMetricId,
  CODECOV_METRICS,
  CODECOV_METRIC_CONFIG,
  CODECOV_NUMBER_THRESHOLDS,
  CODECOV_TOTALS_FIELD_MAP,
  CODECOV_REPO_ANNOTATION,
  resolveCodecovEntityInfo,
} from './CodecovConfig';

export class CodecovMetricProvider implements MetricProvider<'number'> {
  private constructor(
    private readonly client: CodecovClient,
    private readonly metricId: CodecovMetricId,
    private readonly thresholds: ThresholdConfig,
  ) {}

  getProviderDatasourceId(): string {
    return 'codecov';
  }

  getProviderId(): string {
    return CODECOV_METRIC_CONFIG[this.metricId].id;
  }

  getMetricType(): 'number' {
    return 'number';
  }

  getMetric(): Metric<'number'> {
    const meta = CODECOV_METRIC_CONFIG[this.metricId];
    return {
      id: meta.id,
      title: meta.title,
      description: meta.description,
      type: this.getMetricType(),
      history: true,
    };
  }

  getMetricIds(): string[] {
    return CODECOV_METRICS.map(id => CODECOV_METRIC_CONFIG[id].id);
  }

  getMetrics(): Metric<'number'>[] {
    return CODECOV_METRICS.map(id => ({
      id: CODECOV_METRIC_CONFIG[id].id,
      title: CODECOV_METRIC_CONFIG[id].title,
      description: CODECOV_METRIC_CONFIG[id].description,
      type: 'number' as const,
      history: true,
    }));
  }

  getMetricThresholds(): ThresholdConfig {
    return this.thresholds;
  }

  getCatalogFilter(): Record<string, string | symbol | (string | symbol)[]> {
    return {
      [`metadata.annotations.${CODECOV_REPO_ANNOTATION}`]:
        CATALOG_FILTER_EXISTS,
    };
  }

  async calculateMetric(entity: Entity): Promise<number> {
    const { service, owner, repo, accountName } =
      resolveCodecovEntityInfo(entity);
    const repoInfo = await this.client.getRepoInfo(
      service,
      owner,
      repo,
      accountName,
    );

    const field = CODECOV_TOTALS_FIELD_MAP[this.metricId];
    return repoInfo.totals[field];
  }

  async calculateMetrics(entity: Entity): Promise<Map<string, number>> {
    const { service, owner, repo, accountName } =
      resolveCodecovEntityInfo(entity);
    const repoInfo = await this.client.getRepoInfo(
      service,
      owner,
      repo,
      accountName,
    );

    const results = new Map<string, number>();
    for (const id of CODECOV_METRICS) {
      const field = CODECOV_TOTALS_FIELD_MAP[id];
      results.set(CODECOV_METRIC_CONFIG[id].id, repoInfo.totals[field]);
    }
    return results;
  }

  static fromConfig(
    config: Config,
    logger: LoggerService,
    metricId: CodecovMetricId,
  ): CodecovMetricProvider {
    const client = new CodecovClient(config, logger);
    return new CodecovMetricProvider(
      client,
      metricId,
      CODECOV_NUMBER_THRESHOLDS[metricId],
    );
  }
}
