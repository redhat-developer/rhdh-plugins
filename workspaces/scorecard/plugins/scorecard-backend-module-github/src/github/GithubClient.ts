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
}
