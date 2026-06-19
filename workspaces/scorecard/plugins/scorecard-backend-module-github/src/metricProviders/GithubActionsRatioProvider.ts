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
import { WorkflowRun } from '../github/types';

const RATIO_THRESHOLDS: ThresholdConfig = {
  rules: [
    { key: 'success', expression: '>=80' },
    { key: 'warning', expression: '50-79' },
    { key: 'error', expression: '<50' },
  ],
};

const METRIC_IDS = {
  SUCCESS_RATIO_7D: 'github.actions_success_ratio_7d',
  SUCCESS_RATIO_24H: 'github.actions_success_ratio_24h',
} as const;

function filterRunsByWindow(
  runs: WorkflowRun[],
  hoursAgo: number,
): WorkflowRun[] {
  const cutoff = new Date();
  cutoff.setHours(cutoff.getHours() - hoursAgo);
  return runs.filter(r => new Date(r.created_at) >= cutoff);
}

function computeSuccessRatio(runs: WorkflowRun[]): number {
  const completed = runs.filter(r => r.status === 'completed');
  const successful = completed.filter(r => r.conclusion === 'success');
  const failed = completed.filter(r => r.conclusion === 'failure');
  const total = successful.length + failed.length;
  if (total === 0) {
    return 100;
  }
  return Math.round((successful.length / total) * 1000) / 10;
}

export class GithubActionsRatioProvider implements MetricProvider<'number'> {
  private readonly githubClient: GithubClient;

  private constructor(config: Config) {
    this.githubClient = new GithubClient(config);
  }

  getProviderDatasourceId(): string {
    return 'github';
  }

  getProviderId() {
    return METRIC_IDS.SUCCESS_RATIO_7D;
  }

  getMetricType(): 'number' {
    return 'number';
  }

  getMetric(): Metric<'number'> {
    return {
      id: METRIC_IDS.SUCCESS_RATIO_7D,
      title: 'GitHub Actions success ratio (7d)',
      description:
        'Ratio of successful to successful+failed GitHub Actions workflow runs in the last 7 days (percentage). Cancelled and skipped runs are excluded.',
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
        id: METRIC_IDS.SUCCESS_RATIO_24H,
        title: 'GitHub Actions success ratio (24h)',
        description:
          'Ratio of successful to successful+failed GitHub Actions workflow runs in the last 24 hours (percentage). Cancelled and skipped runs are excluded.',
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

  static fromConfig(config: Config): GithubActionsRatioProvider {
    return new GithubActionsRatioProvider(config);
  }

  async calculateMetric(entity: Entity): Promise<number> {
    const metrics = await this.calculateMetrics(entity);
    return metrics.get(METRIC_IDS.SUCCESS_RATIO_7D) ?? 100;
  }

  async calculateMetrics(entity: Entity): Promise<Map<string, number>> {
    const repository = getRepositoryInformationFromEntity(entity);
    const { target } = getEntitySourceLocation(entity);

    const since = new Date();
    since.setDate(since.getDate() - 7);
    const sinceStr = since.toISOString().split('T')[0];

    const runs = await this.githubClient.getWorkflowRuns(
      target,
      repository,
      sinceStr,
    );

    const runs24h = filterRunsByWindow(runs, 24);

    const results = new Map<string, number>();
    results.set(METRIC_IDS.SUCCESS_RATIO_7D, computeSuccessRatio(runs));
    results.set(METRIC_IDS.SUCCESS_RATIO_24H, computeSuccessRatio(runs24h));

    return results;
  }
}

export { RATIO_THRESHOLDS };
