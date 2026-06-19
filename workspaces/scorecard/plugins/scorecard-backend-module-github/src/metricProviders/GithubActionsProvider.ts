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

const COUNT_THRESHOLDS: ThresholdConfig = {
  rules: [
    { key: 'success', expression: '<10' },
    { key: 'warning', expression: '10-50' },
    { key: 'error', expression: '>50' },
  ],
};

const RATIO_THRESHOLDS: ThresholdConfig = {
  rules: [
    { key: 'success', expression: '>=80' },
    { key: 'warning', expression: '50-79' },
    { key: 'error', expression: '<50' },
  ],
};

const METRIC_IDS = {
  STARTED: 'github.actions_started_7d',
  SUCCESSFUL: 'github.actions_successful_7d',
  FAILED: 'github.actions_failed_7d',
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

function countByConclusion(runs: WorkflowRun[], conclusion: string): number {
  return runs.filter(
    r => r.status === 'completed' && r.conclusion === conclusion,
  ).length;
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

export class GithubActionsProvider implements MetricProvider<'number'> {
  private readonly githubClient: GithubClient;

  private constructor(config: Config) {
    this.githubClient = new GithubClient(config);
  }

  getProviderDatasourceId(): string {
    return 'github';
  }

  getProviderId() {
    return METRIC_IDS.STARTED;
  }

  getMetricType(): 'number' {
    return 'number';
  }

  getMetric(): Metric<'number'> {
    return {
      id: METRIC_IDS.STARTED,
      title: 'GitHub Actions started (7d)',
      description:
        'Number of GitHub Actions workflow runs started in the last 7 days.',
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
        id: METRIC_IDS.SUCCESSFUL,
        title: 'GitHub Actions successful (7d)',
        description:
          'Number of successfully completed GitHub Actions workflow runs in the last 7 days.',
        type: this.getMetricType(),
        history: true,
      },
      {
        id: METRIC_IDS.FAILED,
        title: 'GitHub Actions failed (7d)',
        description:
          'Number of failed GitHub Actions workflow runs in the last 7 days.',
        type: this.getMetricType(),
        history: true,
      },
      {
        id: METRIC_IDS.SUCCESS_RATIO_7D,
        title: 'GitHub Actions success ratio (7d)',
        description:
          'Ratio of successful to successful+failed GitHub Actions workflow runs in the last 7 days (percentage).',
        type: this.getMetricType(),
        history: true,
      },
      {
        id: METRIC_IDS.SUCCESS_RATIO_24H,
        title: 'GitHub Actions success ratio (24h)',
        description:
          'Ratio of successful to successful+failed GitHub Actions workflow runs in the last 24 hours (percentage).',
        type: this.getMetricType(),
        history: true,
      },
    ];
  }

  getMetricThresholds(): ThresholdConfig {
    return COUNT_THRESHOLDS;
  }

  getCatalogFilter(): Record<string, string | symbol | (string | symbol)[]> {
    return {
      'metadata.annotations.github.com/project-slug': CATALOG_FILTER_EXISTS,
    };
  }

  static fromConfig(config: Config): GithubActionsProvider {
    return new GithubActionsProvider(config);
  }

  async calculateMetric(entity: Entity): Promise<number> {
    const metrics = await this.calculateMetrics(entity);
    return metrics.get(METRIC_IDS.STARTED) ?? 0;
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
    results.set(METRIC_IDS.STARTED, runs.length);
    results.set(METRIC_IDS.SUCCESSFUL, countByConclusion(runs, 'success'));
    results.set(METRIC_IDS.FAILED, countByConclusion(runs, 'failure'));
    results.set(METRIC_IDS.SUCCESS_RATIO_7D, computeSuccessRatio(runs));
    results.set(METRIC_IDS.SUCCESS_RATIO_24H, computeSuccessRatio(runs24h));

    return results;
  }
}

export { RATIO_THRESHOLDS, COUNT_THRESHOLDS };
