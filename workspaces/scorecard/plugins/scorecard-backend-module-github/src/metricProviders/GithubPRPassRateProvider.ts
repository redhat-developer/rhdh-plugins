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
    { key: 'warning', expression: '>=50' },
    { key: 'error', expression: '<50' },
  ],
};

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

export class GithubPRPassRateProvider implements MetricProvider<'number'> {
  private readonly githubClient: GithubClient;

  private constructor(config: Config) {
    this.githubClient = new GithubClient(config);
  }

  getProviderDatasourceId(): string {
    return 'github';
  }

  getProviderId() {
    return 'PRPassRateProvider';
  }

  getMetrics(): Metric<'number'>[] {
    return [
      {
        id: 'github.prCiFirstTimePassRate7d',
        title: 'GitHub PR CI first time pass rate (7d)',
        description:
          'First time pass rate (FTPR): percentage of PRs opened in the last 7 days where all CI statuses passed on the first push (percentage). PRs without CI checks are excluded.',
        type: 'number',
        thresholds: RATIO_THRESHOLDS,
        history: true,
      },
      {
        id: 'github.prCiFirstTimePassRate24h',
        title: 'GitHub PR CI first time pass rate (24h)',
        description:
          'First time pass rate (FTPR): percentage of PRs opened in the last 24 hours where all CI statuses passed on the first push (percentage). PRs without CI checks are excluded.',
        type: 'number',
        thresholds: RATIO_THRESHOLDS,
        history: true,
      },
    ];
  }

  getCatalogFilter(): Record<string, string | symbol | (string | symbol)[]> {
    return {
      'metadata.annotations.github.com/project-slug': CATALOG_FILTER_EXISTS,
    };
  }

  static fromConfig(config: Config): GithubPRPassRateProvider {
    return new GithubPRPassRateProvider(config);
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
    results.set('github.prCiFirstTimePassRate7d', computePassRate(statuses7d));
    results.set(
      'github.prCiFirstTimePassRate24h',
      computePassRate(statuses24h),
    );

    return results;
  }
}
