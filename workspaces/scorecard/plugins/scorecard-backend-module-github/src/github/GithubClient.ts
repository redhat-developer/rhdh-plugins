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
import {
  DefaultGithubCredentialsProvider,
  ScmIntegrations,
} from '@backstage/integration';
import { GithubRepository } from './types';

export class GithubClient {
  private readonly integrations: ScmIntegrations;

  constructor(config: Config) {
    this.integrations = ScmIntegrations.fromConfig(config);
  }

  private async getOctokitClient(url: string): Promise<typeof graphql> {
    const githubIntegration = this.integrations.github.byUrl(url);
    if (!githubIntegration) {
      throw new Error(`Missing GitHub integration for '${url}'`);
    }

    const credentialsProvider =
      DefaultGithubCredentialsProvider.fromIntegrations(this.integrations);

    const { headers } = await credentialsProvider.getCredentials({
      url,
    });

    const { graphql } = await import('@octokit/graphql');
    return graphql.defaults({
      headers,
      baseUrl: githubIntegration.config.apiBaseUrl,
    });
  }

  async getOpenPullRequestsCount(
    url: string,
    repository: GithubRepository,
  ): Promise<number> {
    const octokit = await this.getOctokitClient(url);

    const query = `
      query getOpenPRsCount($owner: String!, $repo: String!) {
        repository(owner: $owner, name: $repo) {
          pullRequests(states: OPEN) {
            totalCount
          }
        }
      }
    `;

    const response = await octokit<{
      repository: {
        pullRequests: {
          totalCount: number;
        };
      };
    }>(query, {
      owner: repository.owner,
      repo: repository.repo,
    });

    return response.repository.pullRequests.totalCount;
  }

  /**
   * Build a unique GraphQL alias for each metric ID.
   *
   * GraphQL aliases must be valid identifiers (only [a-zA-Z0-9_]) and unique
   * within a query. Metric IDs are sanitized by replacing non-word characters
   * with underscores, but this is lossy — e.g. "read-me" and "read_me" both
   * become "read_me". To avoid alias collisions (which would cause silent data
   * loss), a numeric suffix is appended when a duplicate is detected.
   */
  private buildUniqueAliases(metricIds: string[]): Map<string, string> {
    const aliasToMetricId = new Map<string, string>();
    const usedAliases = new Set<string>();

    for (const metricId of metricIds) {
      let alias = metricId.replaceAll(/\W/g, '_');

      if (usedAliases.has(alias)) {
        let counter = 2;
        while (usedAliases.has(`${alias}__${counter}`)) {
          counter++;
        }
        alias = `${alias}__${counter}`;
      }

      usedAliases.add(alias);
      aliasToMetricId.set(alias, metricId);
    }

    return aliasToMetricId;
  }

  async checkFilesExist(
    url: string,
    repository: GithubRepository,
    files: Map<string, string>,
  ): Promise<Map<string, boolean>> {
    const octokit = await this.getOctokitClient(url);

    const aliasToMetricId = this.buildUniqueAliases([...files.keys()]);
    const fileChecksParts: string[] = [];

    for (const [alias, metricId] of aliasToMetricId) {
      const path = files.get(metricId)!;
      const expr = `HEAD:${path}`;
      fileChecksParts.push(
        `${alias}: object(expression: ${JSON.stringify(expr)}) { id }`,
      );
    }

    const fileChecks = fileChecksParts.join('\n');

    const query = `
    query checkFilesExist($owner: String!, $repo: String!) {
      repository(owner: $owner, name: $repo) {
        ${fileChecks}
      }
    }
  `;

    const response = await octokit<{
      repository: Record<string, { id: string } | null>;
    }>(query, {
      owner: repository.owner,
      repo: repository.repo,
    });

    // Map results back to original metric IDs
    const results = new Map<string, boolean>();
    for (const [sanitizedAlias, metricId] of aliasToMetricId) {
      results.set(metricId, response.repository[sanitizedAlias] !== null);
    }
    return results;
  }
}
