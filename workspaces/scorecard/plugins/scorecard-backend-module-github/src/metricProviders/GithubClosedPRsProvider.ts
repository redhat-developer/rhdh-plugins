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
  INFORMATIONAL_NUMBER_THRESHOLD,
  Metric,
} from '@red-hat-developer-hub/backstage-plugin-scorecard-common';
import { MetricProvider } from '@red-hat-developer-hub/backstage-plugin-scorecard-node';
import { GithubClient } from '../github/GithubClient';
import { getRepositoryInformationFromEntity } from '../github/utils';

export class GithubClosedPRsProvider implements MetricProvider<'number'> {
  private readonly githubClient: GithubClient;

  private constructor(githubClient: GithubClient) {
    this.githubClient = githubClient;
  }

  getProviderDatasourceId(): string {
    return 'github';
  }

  getProviderId() {
    return 'github.closedPRs';
  }

  getMetrics(): Metric<'number'>[] {
    return [
      {
        id: 'github.closedPRs7d',
        title: 'GitHub closed PRs (7d)',
        description:
          'Number of pull requests closed in the last 7 days for a given GitHub repository.',
        type: 'number',
        thresholds: INFORMATIONAL_NUMBER_THRESHOLD,
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
  ): GithubClosedPRsProvider {
    return new GithubClosedPRsProvider(
      new GithubClient(config, options.logger),
    );
  }

  async calculateMetrics(entity: Entity): Promise<Map<string, number>> {
    const repository = getRepositoryInformationFromEntity(entity);
    const { target } = getEntitySourceLocation(entity);

    const since = new Date();
    since.setDate(since.getDate() - 7);
    const sinceStr = since.toISOString().split('T')[0];

    const result = await this.githubClient.getSearchCount(
      target,
      repository,
      `is:pr is:closed closed:>${sinceStr}`,
    );

    const results = new Map<string, number>();
    results.set('github.closedPRs7d', result);
    return results;
  }
}
