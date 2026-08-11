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
  CODECOV_TOTALS_FIELD_MAP,
  CODECOV_REPO_ANNOTATION,
  resolveCodecovEntityInfo,
} from './CodecovConfig';

export const CODECOV_METRIC_CONFIG: Record<
  CodecovMetricId,
  { id: string; title: string; description: string }
> = {
  coverage: {
    id: 'codecov.coverage',
    title: 'Codecov Code Coverage',
    description: 'Current code coverage percentage for the default branch.',
  },
  coverage_trend: {
    id: 'codecov.coverageTrend',
    title: 'Codecov Coverage Trend (7d)',
    description: 'Code coverage trend for the last 7 days.',
  },
  tracked_files: {
    id: 'codecov.trackedFiles',
    title: 'Codecov Tracked Files',
    description: 'Number of files tracked by Codecov.',
  },
  tracked_lines: {
    id: 'codecov.trackedLines',
    title: 'Codecov Tracked Lines',
    description: 'Total lines of code tracked by Codecov.',
  },
  covered_lines: {
    id: 'codecov.coveredLines',
    title: 'Codecov Covered Lines',
    description: 'Number of lines covered by tests.',
  },
  partial_lines: {
    id: 'codecov.partialLines',
    title: 'Codecov Partial Lines',
    description: 'Number of partially covered lines.',
  },
  missed_lines: {
    id: 'codecov.missedLines',
    title: 'Codecov Missed Lines',
    description: 'Number of lines not covered by tests.',
  },
};

export const CODECOV_NUMBER_THRESHOLDS: Record<
  CodecovMetricId,
  ThresholdConfig
> = {
  coverage: {
    rules: [
      { key: 'success', expression: '>80' },
      { key: 'warning', expression: '50-80' },
      { key: 'error', expression: '<50' },
    ],
  },
  coverage_trend: {
    rules: [
      { key: 'success', expression: '>0' },
      { key: 'warning', expression: '<=0' },
      { key: 'error', expression: '<0' },
    ],
  },
  tracked_files: {
    rules: [
      { key: 'success', expression: '>0' },
      { key: 'error', expression: '<=0' },
    ],
  },
  tracked_lines: {
    rules: [
      { key: 'success', expression: '>0' },
      { key: 'error', expression: '<=0' },
    ],
  },
  covered_lines: {
    rules: [
      { key: 'success', expression: '>0' },
      { key: 'error', expression: '<=0' },
    ],
  },
  partial_lines: {
    rules: [
      { key: 'success', expression: '<10' },
      { key: 'warning', expression: '10-50' },
      { key: 'error', expression: '>50' },
    ],
  },
  missed_lines: {
    rules: [
      { key: 'success', expression: '<10' },
      { key: 'warning', expression: '10-50' },
      { key: 'error', expression: '>50' },
    ],
  },
};

export class CodecovMetricProvider implements MetricProvider<'number'> {
  private constructor(private readonly client: CodecovClient) {}

  getProviderDatasourceId(): string {
    return 'codecov';
  }

  getProviderId(): string {
    return 'codecov.coverageReport';
  }

  getMetrics(): Metric<'number'>[] {
    return CODECOV_METRICS.map(metricId => {
      const meta = CODECOV_METRIC_CONFIG[metricId];
      return {
        id: meta.id,
        title: meta.title,
        description: meta.description,
        type: 'number' as const,
        thresholds: CODECOV_NUMBER_THRESHOLDS[metricId],
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
    const { service, owner, repo, accountName } =
      resolveCodecovEntityInfo(entity);
    const repoInfo = await this.client.getRepoInfo(
      service,
      owner,
      repo,
      accountName,
    );

    const results = new Map<string, number>();
    for (const metricId of CODECOV_METRICS) {
      const field = CODECOV_TOTALS_FIELD_MAP[metricId];
      const meta = CODECOV_METRIC_CONFIG[metricId];
      results.set(meta.id, repoInfo.totals[field]);
    }
    return results;
  }

  static fromConfig(
    config: Config,
    logger: LoggerService,
  ): CodecovMetricProvider {
    const client = new CodecovClient(config, logger);
    return new CodecovMetricProvider(client);
  }
}
