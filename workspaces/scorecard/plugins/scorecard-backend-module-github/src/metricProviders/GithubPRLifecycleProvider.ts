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

import type { LoggerService } from '@backstage/backend-plugin-api';
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
import { PullRequestWithReviews } from '../github/types';

const DURATION_THRESHOLDS: ThresholdConfig = {
  rules: [
    { key: 'success', expression: '<7' },
    { key: 'warning', expression: '7-14' },
    { key: 'error', expression: '>14' },
  ],
};

function computeAverageDays(durations: number[]): number {
  if (durations.length === 0) {
    return 0;
  }
  const totalMs = durations.reduce((sum, d) => sum + d, 0);
  return (
    Math.round((totalMs / durations.length / (1000 * 60 * 60 * 24)) * 10) / 10
  );
}

function getTimeToFirstReview(prs: PullRequestWithReviews[]): number {
  const durations: number[] = [];
  for (const pr of prs) {
    if (pr.reviews.nodes.length === 0) {
      continue;
    }
    const prCreated = new Date(pr.createdAt).getTime();
    const firstReview = Math.min(
      ...pr.reviews.nodes.map(r => new Date(r.createdAt).getTime()),
    );
    durations.push(firstReview - prCreated);
  }
  return computeAverageDays(durations);
}

function getTimeToFirstApproval(prs: PullRequestWithReviews[]): number {
  const durations: number[] = [];
  for (const pr of prs) {
    const approvals = pr.reviews.nodes.filter(r => r.state === 'APPROVED');
    if (approvals.length === 0) {
      continue;
    }
    const prCreated = new Date(pr.createdAt).getTime();
    const firstApproval = Math.min(
      ...approvals.map(r => new Date(r.createdAt).getTime()),
    );
    durations.push(firstApproval - prCreated);
  }
  return computeAverageDays(durations);
}

function getTimeToMerge(prs: PullRequestWithReviews[]): number {
  const durations: number[] = [];
  for (const pr of prs) {
    if (!pr.mergedAt) {
      continue;
    }
    const prCreated = new Date(pr.createdAt).getTime();
    const merged = new Date(pr.mergedAt).getTime();
    durations.push(merged - prCreated);
  }
  return computeAverageDays(durations);
}

export class GithubPRLifecycleProvider implements MetricProvider<'number'> {
  private readonly githubClient: GithubClient;

  private constructor(githubClient: GithubClient) {
    this.githubClient = githubClient;
  }

  getProviderDatasourceId(): string {
    return 'github';
  }

  getProviderId() {
    return 'github.prLifecycle';
  }

  getMetrics(): Metric<'number'>[] {
    return [
      {
        id: 'github.timeToReview',
        title: 'GitHub PR time to review (7d)',
        description:
          'Average days from PR creation to first review for PRs updated in the last 7 days.',
        type: 'number',
        thresholds: DURATION_THRESHOLDS,
        history: true,
      },
      {
        id: 'github.timeToApprove',
        title: 'GitHub PR time to approve (7d)',
        description:
          'Average days from PR creation to first approval for PRs updated in the last 7 days.',
        type: 'number',
        thresholds: DURATION_THRESHOLDS,
        history: true,
      },
      {
        id: 'github.timeToMerge',
        title: 'GitHub PR time to merge (7d)',
        description:
          'Average days from PR creation to merge for merged PRs updated in the last 7 days.',
        type: 'number',
        thresholds: DURATION_THRESHOLDS,
        history: true,
      },
    ];
  }

  getCatalogFilter(): Record<string, string | symbol | (string | symbol)[]> {
    return {
      'metadata.annotations.github.com/project-slug': CATALOG_FILTER_EXISTS,
    };
  }

  static fromConfig(
    config: Config,
    options: { logger: LoggerService },
  ): GithubPRLifecycleProvider {
    return new GithubPRLifecycleProvider(
      new GithubClient(config, options.logger),
    );
  }

  async calculateMetrics(entity: Entity): Promise<Map<string, number>> {
    const repository = getRepositoryInformationFromEntity(entity);
    const { target } = getEntitySourceLocation(entity);

    const since = new Date();
    since.setDate(since.getDate() - 7);
    const sinceStr = since.toISOString().split('T')[0];

    const prs = await this.githubClient.getPullRequestsWithReviews(
      target,
      repository,
      sinceStr,
    );

    const results = new Map<string, number>();
    results.set('github.timeToReview', getTimeToFirstReview(prs));
    results.set('github.timeToApprove', getTimeToFirstApproval(prs));
    results.set('github.timeToMerge', getTimeToMerge(prs));

    return results;
  }
}
