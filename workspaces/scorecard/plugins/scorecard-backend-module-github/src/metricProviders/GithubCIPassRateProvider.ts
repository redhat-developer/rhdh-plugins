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

import type { Config } from '@backstage/config';
import { getEntitySourceLocation, type Entity } from '@backstage/catalog-model';
import { CATALOG_FILTER_EXISTS } from '@backstage/catalog-client';
import {
  Metric,
  ThresholdConfig,
} from '@red-hat-developer-hub/backstage-plugin-scorecard-common';
import { MetricProvider } from '@red-hat-developer-hub/backstage-plugin-scorecard-node';
import { GithubClient } from '../github/GithubClient';
import { getRepositoryInformationFromEntity } from '../github/utils';
import { PullRequestCommitStatus } from '../github/types';

const RATIO_THRESHOLDS: ThresholdConfig = {
  rules: [
    { key: 'success', expression: '>=80' },
    { key: 'warning', expression: '50-79' },
    { key: 'error', expression: '<50' },
  ],
};

const METRIC_IDS = {
  PASS_RATE_7D: 'github.ci_pass_rate_7d',
  PASS_RATE_24H: 'github.ci_pass_rate_24h',
} as const;

function computePassRate(statuses: PullRequestCommitStatus[]): number {
  // Only consider PRs that have CI checks
  const withCI = statuses.filter(s => s.firstPushLastCommitState !== null);
  if (withCI.length === 0) {
    return 100;
  }
  const passed = withCI.filter(
    s => s.firstPushLastCommitState === 'SUCCESS',
  ).length;
  return Math.round((passed / withCI.length) * 1000) / 10;
}

export class GithubCIPassRateProvider implements MetricProvider<'number'> {
  private readonly githubClient: GithubClient;

  private constructor(config: Config) {
    this.githubClient = new GithubClient(config);
  }

  getProviderDatasourceId(): string {
    return 'github';
  }

  getProviderId() {
    return METRIC_IDS.PASS_RATE_7D;
  }

  getMetricType(): 'number' {
    return 'number';
  }

  getMetric(): Metric<'number'> {
    return {
      id: METRIC_IDS.PASS_RATE_7D,
      title: 'GitHub CI pass rate (7d)',
      description:
        'Percentage of PRs opened in the last 7 days where all CI statuses passed on the first push (percentage).',
      type: this.getMetricType(),
      history: true,
    };
  }

  getMetricIds(): string[] {
    return Object.values(METRIC_IDS);
  }

  getMetrics(): Metric<'number'>[] {
    return [
      this.getMetric(),
      {
        id: METRIC_IDS.PASS_RATE_24H,
        title: 'GitHub CI pass rate (24h)',
        description:
          'Percentage of PRs opened in the last 24 hours where all CI statuses passed on the first push (percentage).',
        type: this.getMetricType(),
        history: true,
      },
    ];
  }

  getMetricThresholds(): ThresholdConfig {
    return RATIO_THRESHOLDS;
  }

  getCatalogFilter(): Record<string, string | symbol | (string | symbol)[]> {
    return {
      'metadata.annotations.github.com/project-slug': CATALOG_FILTER_EXISTS,
    };
  }

  static fromConfig(config: Config): GithubCIPassRateProvider {
    return new GithubCIPassRateProvider(config);
  }

  async calculateMetric(entity: Entity): Promise<number> {
    const metrics = await this.calculateMetrics(entity);
    return metrics.get(METRIC_IDS.PASS_RATE_7D) ?? 100;
  }

  async calculateMetrics(entity: Entity): Promise<Map<string, number>> {
    const repository = getRepositoryInformationFromEntity(entity);
    const { target } = getEntitySourceLocation(entity);

    const since7d = new Date();
    since7d.setDate(since7d.getDate() - 7);
    const sinceStr7d = since7d.toISOString().split('T')[0];

    const statuses7d =
      await this.githubClient.getPullRequestsWithCommitStatuses(
        target,
        repository,
        sinceStr7d,
      );

    const cutoff24h = new Date();
    cutoff24h.setHours(cutoff24h.getHours() - 24);
    const statuses24h = statuses7d.filter(
      s => new Date(s.createdAt) >= cutoff24h,
    );

    const results = new Map<string, number>();
    results.set(METRIC_IDS.PASS_RATE_7D, computePassRate(statuses7d));
    results.set(METRIC_IDS.PASS_RATE_24H, computePassRate(statuses24h));

    return results;
  }
}
