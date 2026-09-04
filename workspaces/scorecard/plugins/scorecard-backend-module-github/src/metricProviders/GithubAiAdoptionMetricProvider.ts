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
import { GithubCommit } from '../github/types';
import { getRepositoryInformationFromEntity } from '../github/utils';

export const AI_ADOPTION_RATE_TIME_RANGES = ['7d', '30d', '90d'];

export const AI_ADOPTION_RATE_THRESHOLD: ThresholdConfig = {
  rules: [
    { key: 'success', expression: '>=0.2' },
    { key: 'warning', expression: '>=0.1' },
    { key: 'error', expression: '>=0' },
  ],
};

/**
 * Known AI tool identifiers used in commit trailers.
 * Matched case-insensitively against the value after
 * `Assisted-by:` or `Co-authored-by:` (trailer keys are
 * matched case-insensitively per the git trailer spec).
 */
const AI_TOOL_PATTERNS: string[] = [
  'claude',
  'cursor',
  'copilot',
  'github copilot',
  'codeium',
  'cody',
  'tabnine',
  'gemini',
  'amazon q',
  'windsurf',
  'devin',
  'aider',
];

function parseDays(range: string): number {
  return parseInt(range.replace('d', ''), 10);
}

function isMergeCommit(message: string): boolean {
  return (
    message.startsWith('Merge pull request #') ||
    message.startsWith('Merge branch ')
  );
}

function isAiAssistedCommit(message: string): boolean {
  const lines = message.split('\n');
  for (const line of lines) {
    const trimmed = line.trim();
    const lower = trimmed.toLowerCase();
    let value: string | undefined;

    if (lower.startsWith('assisted-by: ')) {
      value = trimmed.slice('assisted-by: '.length).trim();
    } else if (lower.startsWith('co-authored-by: ')) {
      value = trimmed.slice('co-authored-by: '.length).trim();
    }

    if (value) {
      const lowerValue = value.toLowerCase();
      if (AI_TOOL_PATTERNS.some(tool => lowerValue.startsWith(tool))) {
        return true;
      }
    }
  }
  return false;
}

export class GithubAiAdoptionMetricProvider
  implements MetricProvider<'number'>
{
  private readonly githubClient: GithubClient;
  private readonly logger: LoggerService;

  private constructor(githubClient: GithubClient, logger: LoggerService) {
    this.githubClient = githubClient;
    this.logger = logger;
  }

  static fromConfig(
    config: Config,
    options: { logger: LoggerService },
  ): GithubAiAdoptionMetricProvider {
    return new GithubAiAdoptionMetricProvider(
      new GithubClient(config, options.logger),
      options.logger,
    );
  }

  getProviderDatasourceId(): string {
    return 'github';
  }

  getProviderId(): string {
    return 'github.aiAdoption';
  }

  getMetrics(): Metric<'number'>[] {
    return AI_ADOPTION_RATE_TIME_RANGES.map(range => ({
      id: `${this.getProviderId()}Rate[${range}]`,
      title: `GitHub AI adoption rate (${range})`,
      description: `Ratio of AI-assisted commits over the last ${range}.`,
      type: 'number' as const,
      thresholds: AI_ADOPTION_RATE_THRESHOLD,
      history: true,
    }));
  }

  getCatalogFilter(): Record<string, string | symbol | (string | symbol)[]> {
    return {
      'metadata.annotations.github.com/project-slug': CATALOG_FILTER_EXISTS,
    };
  }

  async calculateMetrics(entity: Entity): Promise<Map<string, number>> {
    const repository = getRepositoryInformationFromEntity(entity);
    const { target } = getEntitySourceLocation(entity);

    const maxDays = Math.max(...AI_ADOPTION_RATE_TIME_RANGES.map(parseDays));

    const since = new Date();
    since.setDate(since.getDate() - maxDays);

    const commits = await this.githubClient.getCommitHistory(
      target,
      repository,
      since,
    );

    const now = new Date();
    const results = new Map<string, number>();

    for (const range of AI_ADOPTION_RATE_TIME_RANGES) {
      const days = parseDays(range);
      const cutoff = new Date(now);
      cutoff.setDate(cutoff.getDate() - days);

      const rangeCommits = commits.filter(
        c => new Date(c.committedDate) >= cutoff,
      );

      const { ratio, total, ignored, aiAssisted, notAiAssisted } =
        this.analyzeCommits(rangeCommits);

      this.logger.info(
        `AI adoption [${range}] for ${repository.owner}/${repository.repo}: ` +
          `${total} commits analyzed, ${ignored} merge commits ignored, ` +
          `${aiAssisted} AI-assisted, ${notAiAssisted} not AI-assisted, ` +
          `ratio=${ratio}`,
      );

      const metricId = `${this.getProviderId()}Rate[${range}]`;
      results.set(metricId, ratio);
    }

    return results;
  }

  private analyzeCommits(commits: GithubCommit[]): {
    ratio: number;
    total: number;
    ignored: number;
    aiAssisted: number;
    notAiAssisted: number;
  } {
    let ignored = 0;
    let aiAssisted = 0;
    let notAiAssisted = 0;

    for (const commit of commits) {
      if (isMergeCommit(commit.message)) {
        ignored++;
        continue;
      }

      if (isAiAssistedCommit(commit.message)) {
        aiAssisted++;
      } else {
        notAiAssisted++;
      }
    }

    const analyzed = aiAssisted + notAiAssisted;
    const ratio = analyzed > 0 ? aiAssisted / analyzed : 0;

    return {
      ratio,
      total: commits.length,
      ignored,
      aiAssisted,
      notAiAssisted,
    };
  }
}
