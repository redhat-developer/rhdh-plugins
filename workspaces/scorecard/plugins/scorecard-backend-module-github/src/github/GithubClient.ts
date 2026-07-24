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
import {
  GithubRepository,
  PullRequestWithReviews,
  WorkflowRun,
  PullRequestCommitStatus,
} from './types';

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

  private async getRestConfig(
    url: string,
  ): Promise<{ headers: Record<string, string>; apiBaseUrl: string }> {
    const githubIntegration = this.integrations.github.byUrl(url);
    if (!githubIntegration) {
      throw new Error(`Missing GitHub integration for '${url}'`);
    }

    const credentialsProvider =
      DefaultGithubCredentialsProvider.fromIntegrations(this.integrations);

    const { headers } = await credentialsProvider.getCredentials({
      url,
    });

    return {
      headers: {
        ...headers,
        Accept: 'application/vnd.github+json',
      } as Record<string, string>,
      apiBaseUrl:
        githubIntegration.config.apiBaseUrl ?? 'https://api.github.com',
    };
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

  async getOpenIssuesCount(
    url: string,
    repository: GithubRepository,
  ): Promise<number> {
    const octokit = await this.getOctokitClient(url);

    const query = `
      query getOpenIssuesCount($owner: String!, $repo: String!) {
        repository(owner: $owner, name: $repo) {
          issues(states: OPEN) {
            totalCount
          }
        }
      }
    `;

    const response = await octokit<{
      repository: {
        issues: {
          totalCount: number;
        };
      };
    }>(query, {
      owner: repository.owner,
      repo: repository.repo,
    });

    return response.repository.issues.totalCount;
  }

  async getSearchCount(
    url: string,
    repository: GithubRepository,
    searchQuery: string,
  ): Promise<number> {
    const octokit = await this.getOctokitClient(url);

    const fullQuery = `repo:${repository.owner}/${repository.repo} ${searchQuery}`;

    const query = `
      query getSearchCount($q: String!) {
        search(query: $q, type: ISSUE) {
          issueCount
        }
      }
    `;

    const response = await octokit<{
      search: {
        issueCount: number;
      };
    }>(query, {
      q: fullQuery,
    });

    return response.search.issueCount;
  }

  async getPullRequestsWithReviews(
    url: string,
    repository: GithubRepository,
    since: string,
  ): Promise<PullRequestWithReviews[]> {
    const octokit = await this.getOctokitClient(url);

    const searchQuery = `repo:${repository.owner}/${repository.repo} is:pr updated:>${since}`;

    const query = `
      query getPRsWithReviews($q: String!) {
        search(query: $q, type: ISSUE, first: 100) {
          nodes {
            ... on PullRequest {
              createdAt
              mergedAt
              reviews(first: 100) {
                nodes {
                  createdAt
                  state
                }
              }
            }
          }
        }
      }
    `;

    const response = await octokit<{
      search: {
        nodes: PullRequestWithReviews[];
      };
    }>(query, {
      q: searchQuery,
    });

    return response.search.nodes;
  }

  async getWorkflowRuns(
    url: string,
    repository: GithubRepository,
    since: string,
  ): Promise<WorkflowRun[]> {
    const { headers, apiBaseUrl } = await this.getRestConfig(url);

    const allRuns: WorkflowRun[] = [];
    let page = 1;
    const perPage = 100;
    let hasMore = true;

    while (hasMore) {
      const restUrl = `${apiBaseUrl}/repos/${encodeURIComponent(
        repository.owner,
      )}/${encodeURIComponent(
        repository.repo,
      )}/actions/runs?created=>${since}&per_page=${perPage}&page=${page}`;
      const response = await fetch(restUrl, { headers });

      if (!response.ok) {
        throw new Error(
          `GitHub API error: ${response.status} ${response.statusText}`,
        );
      }

      const data = (await response.json()) as {
        workflow_runs: WorkflowRun[];
        total_count: number;
      };

      allRuns.push(...data.workflow_runs);

      hasMore =
        allRuns.length < data.total_count &&
        data.workflow_runs.length >= perPage;
      page++;
    }

    return allRuns;
  }

  async getPullRequestsWithCommitStatuses(
    url: string,
    repository: GithubRepository,
    since: string,
  ): Promise<PullRequestCommitStatus[]> {
    const octokit = await this.getOctokitClient(url);

    const searchQuery = `repo:${repository.owner}/${repository.repo} is:pr created:>${since}`;

    const query = `
      query getPRsWithStatuses($q: String!) {
        search(query: $q, type: ISSUE, first: 100) {
          nodes {
            ... on PullRequest {
              createdAt
              commits(first: 100) {
                nodes {
                  commit {
                    committedDate
                    statusCheckRollup {
                      state
                    }
                  }
                }
              }
            }
          }
        }
      }
    `;

    const response = await octokit<{
      search: {
        nodes: Array<{
          createdAt: string;
          commits: {
            nodes: Array<{
              commit: {
                committedDate: string;
                statusCheckRollup: {
                  state: string;
                } | null;
              };
            }>;
          };
        }>;
      };
    }>(query, {
      q: searchQuery,
    });

    return response.search.nodes.map(pr => {
      // Find the last commit from the first push (committed on or before PR creation)
      const prCreatedAt = new Date(pr.createdAt).getTime();
      const firstPushCommits = pr.commits.nodes.filter(
        c => new Date(c.commit.committedDate).getTime() <= prCreatedAt + 60000, // 1 minute tolerance
      );

      const lastFirstPushCommit =
        firstPushCommits.length > 0
          ? firstPushCommits[firstPushCommits.length - 1]
          : null;

      return {
        createdAt: pr.createdAt,
        firstPushLastCommitState:
          lastFirstPushCommit?.commit.statusCheckRollup?.state ?? null,
      };
    });
  }
}
