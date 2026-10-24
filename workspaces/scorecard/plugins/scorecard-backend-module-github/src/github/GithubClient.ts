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
import {
  DefaultGithubCredentialsProvider,
  ScmIntegrations,
} from '@backstage/integration';
import { graphql } from '@octokit/graphql';
import { Octokit } from '@octokit/rest';
import {
  GithubDeployment,
  GithubDeploymentStatusConnection,
  GithubWorkflowRun,
  GithubPullRequest,
  GithubRepository,
  GithubDeploymentsQueryResponse,
  GithubCommitsPullRequestsQueryResponse,
  PullRequestWithReviews,
  WorkflowRun,
  PullRequestCommitStatus,
} from './types';
import {
  DEFAULT_DEPLOYMENT_FETCH_ITEMS_LIMIT,
  GITHUB_BATCH_SIZE,
  GITHUB_DEPLOYMENT_STATUSES_PAGE_SIZE,
  MAX_DEPLOYMENT_STATUS_PAGES,
} from './constants';
import { buildCommitsPullRequestsQuery } from './queries/buildCommitsPullRequestsQuery';
import { mapCommitsPullRequests } from './mappers';

export class GithubClient {
  private readonly integrations: ScmIntegrations;
  private readonly credentialsProvider: DefaultGithubCredentialsProvider;
  private readonly logger: LoggerService;

  constructor(config: Config, logger: LoggerService) {
    this.integrations = ScmIntegrations.fromConfig(config);
    this.credentialsProvider =
      DefaultGithubCredentialsProvider.fromIntegrations(this.integrations);
    this.logger = logger;
  }

  private async getOctokitClient(url: string): Promise<typeof graphql> {
    const githubIntegration = this.integrations.github.byUrl(url);
    if (!githubIntegration) {
      throw new Error(`Missing GitHub integration for '${url}'`);
    }

    const { headers } = await this.credentialsProvider.getCredentials({
      url,
    });

    return graphql.defaults({
      headers,
      baseUrl: githubIntegration.config.apiBaseUrl,
    });
  }

  private async getOctokitRestClient(url: string): Promise<Octokit> {
    const githubIntegration = this.integrations.github.byUrl(url);
    if (!githubIntegration) {
      throw new Error(`Missing GitHub integration for '${url}'`);
    }

    const { token } = await this.credentialsProvider.getCredentials({
      url,
    });

    return new Octokit({
      auth: token,
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

    const { headers } = await this.credentialsProvider.getCredentials({
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
      } | null;
    }>(query, {
      owner: repository.owner,
      repo: repository.repo,
    });

    if (!response.repository) {
      throw new Error(
        `GitHub repository '${repository.owner}/${repository.repo}' was not found or is inaccessible`,
      );
    }

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
      query getPRsWithReviews($q: String!, $cursor: String) {
        search(query: $q, type: ISSUE, first: 100, after: $cursor) {
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
          pageInfo {
            hasNextPage
            endCursor
          }
        }
      }
    `;

    const allPRs: PullRequestWithReviews[] = [];
    let cursor: string | null = null;
    const maxPages = 10;

    for (let page = 0; page < maxPages; page++) {
      const response: {
        search: {
          nodes: PullRequestWithReviews[];
          pageInfo: {
            hasNextPage: boolean;
            endCursor: string | null;
          };
        };
      } = await octokit(query, {
        q: searchQuery,
        cursor,
      });

      allPRs.push(...response.search.nodes);

      if (!response.search.pageInfo.hasNextPage) {
        break;
      }
      cursor = response.search.pageInfo.endCursor;
    }

    return allPRs;
  }

  async getDeployments(
    url: string,
    repository: GithubRepository,
    from: Date,
    to: Date,
    options?: { fetchItemsLimit?: number },
  ): Promise<GithubDeployment[]> {
    const fetchItemsLimit =
      options?.fetchItemsLimit ?? DEFAULT_DEPLOYMENT_FETCH_ITEMS_LIMIT;
    const octokit = await this.getOctokitClient(url);
    const deployments: GithubDeployment[] = [];
    const query = `
      query getDeployments($owner: String!, $repo: String!, $after: String) {
        repository(owner: $owner, name: $repo) {
          deployments(
            first: ${GITHUB_BATCH_SIZE}
            orderBy: { field: CREATED_AT, direction: DESC }
            after: $after
          ) {
            nodes {
              id
              databaseId
              commitOid
              createdAt
              environment
              latestStatus {
                state
              }
              statuses(first: ${GITHUB_DEPLOYMENT_STATUSES_PAGE_SIZE}) {
                nodes {
                  state
                  createdAt
                }
                pageInfo {
                  hasNextPage
                  endCursor
                }
              }
            }
            pageInfo {
              hasNextPage
              endCursor
            }
          }
        }
      }
    `;
    const fromTimestamp = from.getTime();
    const toTimestamp = to.getTime();
    let after: string | null = null;
    let hasMorePages = true;
    let reachedOlderThanWindow = false;

    while (hasMorePages && deployments.length < fetchItemsLimit) {
      const response: GithubDeploymentsQueryResponse = await octokit(query, {
        owner: repository.owner,
        repo: repository.repo,
        after: after,
      });

      if (!response.repository) {
        throw new Error(
          `GitHub repository '${repository.owner}/${repository.repo}' was not found or is inaccessible`,
        );
      }

      const pageDeployments = response.repository.deployments?.nodes ?? [];

      if (pageDeployments.length === 0) {
        break;
      }

      let truncatedCurrentPage = false;
      for (const deployment of pageDeployments) {
        if (deployments.length >= fetchItemsLimit) {
          truncatedCurrentPage = true;
          break;
        }

        if (!deployment?.databaseId || !deployment?.commitOid) {
          continue;
        }

        const deployedAt = Date.parse(deployment.createdAt);
        if (Number.isNaN(deployedAt)) {
          continue;
        }

        if (deployedAt < fromTimestamp) {
          reachedOlderThanWindow = true;
        }

        if (deployedAt >= fromTimestamp && deployedAt <= toTimestamp) {
          deployments.push({
            id: deployment.databaseId,
            sha: deployment.commitOid,
            createdAt: deployment.createdAt,
            environment: deployment.environment ?? null,
            status: await this.resolveDeploymentStatus(octokit, deployment),
          });
        }
      }

      const githubHasNextPage = Boolean(
        response.repository.deployments?.pageInfo.hasNextPage,
      );
      if (
        deployments.length >= fetchItemsLimit &&
        (githubHasNextPage || truncatedCurrentPage)
      ) {
        this.logger.warn(
          `Reached fetchItemsLimit of ${fetchItemsLimit} for deployments in ${repository.owner}/${repository.repo}; stopping fetch`,
        );
      }

      hasMorePages =
        deployments.length < fetchItemsLimit &&
        !reachedOlderThanWindow &&
        githubHasNextPage;
      after = response.repository.deployments?.pageInfo.endCursor ?? null;
    }

    // GitHub returns DESC by createdAt so we can stop early when outside of time range;
    // normalize to ASC for chronological processing (oldest -> newest).
    return deployments.reverse();
  }

  /**
   * The deployment result is the newest SUCCESS when one exists, including
   * when a later status is `inactive`, `failure`, or `error`. GitHub appends
   * `inactive` after a newer deployment in the same non-production environment.
   * Status pages are newest-first, so paging stops at the first page that
   * contains a success. With no success, the result is `latestStatus`.
   */
  private async resolveDeploymentStatus(
    octokit: Awaited<ReturnType<GithubClient['getOctokitClient']>>,
    deployment: NonNullable<
      NonNullable<
        NonNullable<GithubDeploymentsQueryResponse['repository']>['deployments']
      >['nodes']
    >[number],
  ): Promise<string | null> {
    let connection = deployment?.statuses;
    let successfulStatus = latestSuccessfulStatus(connection?.nodes);
    const seenCursors = new Set<string>();
    let pages = 0;

    while (
      !successfulStatus &&
      pages < MAX_DEPLOYMENT_STATUS_PAGES &&
      connection?.pageInfo?.hasNextPage &&
      connection.pageInfo.endCursor &&
      deployment?.id &&
      !seenCursors.has(connection.pageInfo.endCursor)
    ) {
      pages += 1;
      seenCursors.add(connection.pageInfo.endCursor);
      connection = await this.fetchDeploymentStatusPage(
        octokit,
        deployment.id,
        connection.pageInfo.endCursor,
      );
      successfulStatus = latestSuccessfulStatus(connection?.nodes);
    }

    return successfulStatus ?? deployment?.latestStatus?.state ?? null;
  }

  private async fetchDeploymentStatusPage(
    octokit: Awaited<ReturnType<GithubClient['getOctokitClient']>>,
    deploymentId: string,
    after: string,
  ): Promise<GithubDeploymentStatusConnection | null> {
    const query = `
      query getDeploymentStatuses($id: ID!, $after: String!) {
        node(id: $id) {
          ... on Deployment {
            statuses(first: ${GITHUB_DEPLOYMENT_STATUSES_PAGE_SIZE}, after: $after) {
              nodes {
                state
                createdAt
              }
              pageInfo {
                hasNextPage
                endCursor
              }
            }
          }
        }
      }
    `;
    const response = await octokit<{
      node?: { statuses?: GithubDeploymentStatusConnection | null } | null;
    }>(query, {
      id: deploymentId,
      after,
    });

    return response.node?.statuses ?? null;
  }

  async getCommitShasBetween(
    url: string,
    repository: GithubRepository,
    baseSha: string,
    headSha: string,
    options?: { fetchItemsLimit?: number },
  ): Promise<string[]> {
    const fetchItemsLimit =
      options?.fetchItemsLimit ?? DEFAULT_DEPLOYMENT_FETCH_ITEMS_LIMIT;
    const octokit = await this.getOctokitRestClient(url);

    const basehead = `${baseSha}...${headSha}`;
    const commitShas: string[] = [];

    // compareCommitsWithBasehead returns a mixed object (commits/files/url), not a list endpoint,
    // page manually instead of octokit.paginate because it is unable to handle typing correctly.
    const firstPage = await octokit.repos.compareCommitsWithBasehead({
      owner: repository.owner,
      repo: repository.repo,
      basehead,
      per_page: GITHUB_BATCH_SIZE,
      page: 1,
    });

    const totalCommits = firstPage.data.total_commits;
    const appendCommits = (commits: Array<{ sha: string }>) => {
      const remaining = fetchItemsLimit - commitShas.length;
      if (remaining <= 0) {
        return;
      }
      const pageShas = commits.map(commit => commit.sha);
      commitShas.push(
        ...(pageShas.length > remaining
          ? pageShas.slice(0, remaining)
          : pageShas),
      );
    };

    appendCommits(firstPage.data.commits);

    const totalPages = Math.ceil(totalCommits / GITHUB_BATCH_SIZE);
    for (
      let page = 2;
      page <= totalPages && commitShas.length < fetchItemsLimit;
      page++
    ) {
      const response = await octokit.repos.compareCommitsWithBasehead({
        owner: repository.owner,
        repo: repository.repo,
        basehead,
        per_page: GITHUB_BATCH_SIZE,
        page,
      });
      appendCommits(response.data.commits);
    }

    if (totalCommits > fetchItemsLimit) {
      this.logger.warn(
        `Reached fetchItemsLimit of ${fetchItemsLimit} for commits between ${baseSha}...${headSha} in ${repository.owner}/${repository.repo}; stopping fetch (${totalCommits} commits reported)`,
      );
    }

    return Array.from(new Set(commitShas));
  }

  async getCommitsPullRequests(
    url: string,
    repository: GithubRepository,
    shas: string[],
  ): Promise<Map<string, GithubPullRequest[]>> {
    const pullRequestsBySha = new Map<string, GithubPullRequest[]>();
    if (shas.length === 0) {
      return pullRequestsBySha;
    }

    const octokit = await this.getOctokitClient(url);
    for (let offset = 0; offset < shas.length; offset += GITHUB_BATCH_SIZE) {
      const batch = shas.slice(offset, offset + GITHUB_BATCH_SIZE);
      const { query, variables } = buildCommitsPullRequestsQuery(
        repository,
        batch,
      );

      const response = await octokit<GithubCommitsPullRequestsQueryResponse>(
        query,
        variables,
      );

      if (!response.repository) {
        throw new Error(
          `GitHub repository '${repository.owner}/${repository.repo}' was not found or is inaccessible`,
        );
      }

      for (const [sha, pullRequests] of mapCommitsPullRequests(
        response.repository,
        batch,
      )) {
        pullRequestsBySha.set(sha, pullRequests);
      }
    }

    return pullRequestsBySha;
  }

  async getWorkflowRuns(
    url: string,
    repository: GithubRepository,
    workflowName: string,
    from: Date,
    to: Date,
    options?: { fetchItemsLimit?: number },
  ): Promise<GithubWorkflowRun[]> {
    const fetchItemsLimit =
      options?.fetchItemsLimit ?? DEFAULT_DEPLOYMENT_FETCH_ITEMS_LIMIT;
    const octokit = await this.getOctokitRestClient(url);

    const workflows = await octokit.paginate(
      octokit.actions.listRepoWorkflows,
      {
        owner: repository.owner,
        repo: repository.repo,
        per_page: GITHUB_BATCH_SIZE,
      },
      response => response.data,
    );

    const workflow = workflows.find(
      item =>
        item.name === workflowName ||
        item.path === workflowName ||
        item.path.endsWith(`/${workflowName}`),
    );

    if (!workflow) {
      throw new Error(
        `Workflow '${workflowName}' was not found in '${repository.owner}/${repository.repo}'`,
      );
    }

    const workflowRuns: GithubWorkflowRun[] = [];
    await octokit.paginate(
      octokit.actions.listWorkflowRuns,
      {
        owner: repository.owner,
        repo: repository.repo,
        workflow_id: workflow.id,
        created: `${from.toISOString()}..${to.toISOString()}`,
        per_page: GITHUB_BATCH_SIZE,
      },
      (response, done) => {
        const remaining = fetchItemsLimit - workflowRuns.length;
        const pageRuns =
          response.data.length > remaining
            ? response.data.slice(0, remaining)
            : response.data;
        const mapped = pageRuns.map(run => ({
          id: run.id,
          sha: run.head_sha,
          createdAt: run.created_at,
          status: run.status ?? null,
          conclusion: run.conclusion ?? null,
        }));
        workflowRuns.push(...mapped);
        if (workflowRuns.length === fetchItemsLimit) {
          done();
        }
        return mapped;
      },
    );

    // GitHub returns DESC by createdAt
    // normalize to ASC for chronological processing (oldest -> newest).
    return workflowRuns.reverse();
  }

  async getRecentWorkflowRuns(
    url: string,
    repository: GithubRepository,
    since: string,
  ): Promise<WorkflowRun[]> {
    const { headers, apiBaseUrl } = await this.getRestConfig(url);

    const allRuns: WorkflowRun[] = [];
    let page = 1;
    const perPage = 100;
    let hasMore = true;
    const maxPages = 10;

    while (hasMore && page <= maxPages) {
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

    type PRWithCommits = {
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
    };

    const query = `
      query getPRsWithStatuses($q: String!, $cursor: String) {
        search(query: $q, type: ISSUE, first: 100, after: $cursor) {
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
          pageInfo {
            hasNextPage
            endCursor
          }
        }
      }
    `;

    const allPRs: PRWithCommits[] = [];
    let cursor: string | null = null;
    const maxPages = 10;

    for (let page = 0; page < maxPages; page++) {
      const response: {
        search: {
          nodes: PRWithCommits[];
          pageInfo: {
            hasNextPage: boolean;
            endCursor: string | null;
          };
        };
      } = await octokit(query, {
        q: searchQuery,
        cursor,
      });

      allPRs.push(...response.search.nodes);

      if (!response.search.pageInfo.hasNextPage) {
        break;
      }
      cursor = response.search.pageInfo.endCursor;
    }

    return allPRs.map(pr => {
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

/** Newest success on this page. Status pages are newest-first. */
function latestSuccessfulStatus(
  statuses: GithubDeploymentStatusConnection['nodes'] | null | undefined,
): string | null {
  let latestSuccessful: { state: string; createdAt: number } | undefined;

  for (const status of statuses ?? []) {
    if (status?.state?.toLowerCase() !== 'success') {
      continue;
    }

    const createdAt = Date.parse(status.createdAt ?? '');
    const createdAtTime = Number.isNaN(createdAt)
      ? Number.NEGATIVE_INFINITY
      : createdAt;
    if (!latestSuccessful || createdAtTime >= latestSuccessful.createdAt) {
      latestSuccessful = { state: status.state, createdAt: createdAtTime };
    }
  }

  return latestSuccessful?.state ?? null;
}
