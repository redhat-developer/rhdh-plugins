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
  DefaultGitlabCredentialsProvider,
  ScmIntegrations,
} from '@backstage/integration';
import { Gitlab } from '@gitbeaker/rest';
import type {
  GitlabApi,
  GitlabIssuesRequestAttributes,
  GitlabMergeRequestsRequestAttributes,
  CountItemsSinceOptions,
  AllIssuesResponse,
  AllMergeRequestsResponse,
  GitlabJobsWindowStats,
  GitlabJobItem,
  FetchJobsSinceOptions,
} from './types';
import { resolveTotalCount } from './utils/resolveTotalCount';
import { parseIssuesResponse } from './utils/parseIssuesResponse';
import { parseMergeRequestsResponse } from './utils/parseMergeRequestsResponse';

export class GitlabClient {
  private static readonly MAX_PAGES = 10;
  private static readonly PAGE_SIZE = 100;
  private static readonly FETCH_ITEMS_LIMIT = 1000;

  private readonly integrations: ScmIntegrations;
  private readonly credentialsProvider: DefaultGitlabCredentialsProvider;
  private readonly logger: LoggerService;

  constructor(config: Config, logger: LoggerService) {
    this.integrations = ScmIntegrations.fromConfig(config);

    this.credentialsProvider =
      DefaultGitlabCredentialsProvider.fromIntegrations(this.integrations);
    this.logger = logger;
  }

  private async getGitlabApi(url: string): Promise<GitlabApi> {
    const gitlabIntegration = this.integrations.gitlab.byUrl(url);
    if (!gitlabIntegration) {
      throw new Error(`Missing GitLab integration for '${url}'`);
    }

    const { token } = await this.credentialsProvider.getCredentials({ url });

    if (!token) {
      throw new Error(
        `No GitLab token provided for '${url}'. Configure integrations.gitlab token (Backend Service Integration).`,
      );
    }

    return new Gitlab({
      host: gitlabIntegration.config.baseUrl,
      oauthToken: token,
    });
  }

  private async countItemsSince(
    options: CountItemsSinceOptions,
  ): Promise<number> {
    let count = 0;
    let scanned = 0;

    const { fetchPage, timestampField, since, context } = options;

    const limitReached = () => {
      this.logger.warn(
        `Reached fetch limit while counting ${context} ` +
          `(fetchItemsLimit=${GitlabClient.FETCH_ITEMS_LIMIT}, maxPages=${GitlabClient.MAX_PAGES}). ` +
          'Counts cannot be completed without scanning more candidates.',
      );

      return count;
    };

    for (
      let page = 1;
      page <= GitlabClient.MAX_PAGES &&
      scanned < GitlabClient.FETCH_ITEMS_LIMIT;
      page++
    ) {
      const items = await fetchPage(page, GitlabClient.PAGE_SIZE);

      if (items.length === 0) {
        return count;
      }

      for (const item of items) {
        if (scanned >= GitlabClient.FETCH_ITEMS_LIMIT) return limitReached();

        scanned++;

        const raw = item[timestampField];

        if (typeof raw === 'string' && new Date(raw) >= since) {
          count++;
        }
      }

      if (items.length < GitlabClient.PAGE_SIZE) return count;

      if (page === GitlabClient.MAX_PAGES) return limitReached();
    }
    return count;
  }

  async getIssues(
    url: string,
    projectSlug: string,
    requestAttributes: GitlabIssuesRequestAttributes = {},
  ): Promise<AllIssuesResponse> {
    const api = await this.getGitlabApi(url);

    const response = await api.Issues.all({
      projectId: projectSlug,
      page: 1,
      ...requestAttributes,
    });

    return parseIssuesResponse(response, this.logger);
  }

  async getIssuesCount(
    url: string,
    projectSlug: string,
    options?: GitlabIssuesRequestAttributes,
  ): Promise<number> {
    const requestAttributes = {
      ...options,
      perPage: 1,
      maxPages: 1,
      showExpanded: true,
    };

    const issues = await this.getIssues(url, projectSlug, requestAttributes);

    return resolveTotalCount(
      issues.paginationInfo?.total,
      `issues in '${projectSlug}'`,
    );
  }

  async getOpenIssuesCount(url: string, projectSlug: string): Promise<number> {
    return this.getIssuesCount(url, projectSlug, { state: 'opened' });
  }

  async getOpenedIssuesCount(
    url: string,
    projectSlug: string,
    since: Date,
  ): Promise<number> {
    return this.getIssuesCount(url, projectSlug, {
      createdAfter: since.toISOString(),
    });
  }

  async getClosedIssuesCount(
    url: string,
    projectSlug: string,
    since: Date,
  ): Promise<number> {
    return this.countItemsSince({
      fetchPage: async (page, perPage) => {
        const { data } = await this.getIssues(url, projectSlug, {
          state: 'closed',
          updatedAfter: since.toISOString(),
          page,
          perPage,
          maxPages: 1,
        });

        return data;
      },
      timestampField: 'closed_at',
      since,
      context: `closed issues in '${projectSlug}'`,
    });
  }

  async getMergeRequests(
    url: string,
    projectSlug: string,
    requestAttributes: GitlabMergeRequestsRequestAttributes = {},
  ): Promise<AllMergeRequestsResponse> {
    const api = await this.getGitlabApi(url);

    const response = await api.MergeRequests.all({
      projectId: projectSlug,
      page: 1,
      ...requestAttributes,
    });

    return parseMergeRequestsResponse(response, this.logger);
  }

  async getMergeRequestsCount(
    url: string,
    projectSlug: string,
    options?: GitlabMergeRequestsRequestAttributes,
  ): Promise<number> {
    const requestAttributes = {
      ...options,
      perPage: 1,
      maxPages: 1,
      showExpanded: true,
    };

    const mergeRequests = await this.getMergeRequests(
      url,
      projectSlug,
      requestAttributes,
    );

    return resolveTotalCount(
      mergeRequests.paginationInfo?.total,
      `merge requests in '${projectSlug}'`,
    );
  }

  async getOpenMergeRequestsCount(
    url: string,
    projectSlug: string,
  ): Promise<number> {
    return this.getMergeRequestsCount(url, projectSlug, { state: 'opened' });
  }

  async getOpenedMergeRequestsCount(
    url: string,
    projectSlug: string,
    since: Date,
  ): Promise<number> {
    return this.getMergeRequestsCount(url, projectSlug, {
      createdAfter: since.toISOString(),
    });
  }

  async getClosedMergeRequestsCount(
    url: string,
    projectSlug: string,
    since: Date,
  ): Promise<number> {
    const updatedAfter = since.toISOString();

    const [closedMRs, mergedMRs] = await Promise.all([
      this.countItemsSince({
        fetchPage: async (page, perPage) => {
          const { data } = await this.getMergeRequests(url, projectSlug, {
            state: 'closed',
            updatedAfter,
            page,
            perPage,
            maxPages: 1,
          });

          return data;
        },
        timestampField: 'closed_at',
        since,
        context: `closed merge requests in '${projectSlug}'`,
      }),
      this.countItemsSince({
        fetchPage: async (page, perPage) => {
          const { data } = await this.getMergeRequests(url, projectSlug, {
            state: 'merged',
            updatedAfter,
            page,
            perPage,
            maxPages: 1,
          });

          return data;
        },
        timestampField: 'merged_at',
        since,
        context: `merged merge requests in '${projectSlug}'`,
      }),
    ]);

    return closedMRs + mergedMRs;
  }

  async getPipelinesCount(
    url: string,
    projectSlug: string,
    since: Date,
    status?: string,
  ): Promise<number> {
    const api = await this.getGitlabApi(url);
    // gitbeaker AllPipelinesOptions does not yet include createdAfter; GitLab
    // project pipelines API supports created_after for "started" windows.
    const { paginationInfo } = await api.Pipelines.all(projectSlug, {
      ...({
        createdAfter: since.toISOString(),
      } as Record<string, string>),
      ...(status ? { status: status as 'success' | 'failed' } : {}),
      perPage: 1,
      maxPages: 1,
      page: 1,
      showExpanded: true,
    });

    return resolveTotalCount(
      paginationInfo.total,
      `pipelines in '${projectSlug}'`,
    );
  }

  async getJobsCount(
    url: string,
    projectSlug: string,
    options: FetchJobsSinceOptions,
  ): Promise<number> {
    const api = await this.getGitlabApi(url);
    const jobs = await this.fetchJobsSince(api, projectSlug, options);
    return jobs.length;
  }

  async getJobsWindowStats(
    url: string,
    projectSlug: string,
    options: { since: Date; fetchItemsLimit?: number },
  ): Promise<GitlabJobsWindowStats> {
    const api = await this.getGitlabApi(url);
    const jobs = await this.fetchJobsSince(api, projectSlug, {
      since: options.since,
      fetchItemsLimit: options.fetchItemsLimit,
    });

    let successful = 0;
    let failed = 0;
    for (const job of jobs) {
      if (job.status === 'success') {
        successful++;
      } else if (job.status === 'failed') {
        failed++;
      }
    }

    return {
      started: jobs.length,
      successful,
      failed,
    };
  }

  private async fetchJobsPage(
    api: GitlabApi,
    projectSlug: string,
    page: number,
    perPage: number,
    scope?: string[],
  ): Promise<GitlabJobItem[]> {
    // GitLab accepts repeated scope[] query params; gitbeaker types only a
    // single JobScope in this release, so cast options for array callers.
    const jobOptions = {
      ...(scope && scope.length > 0 ? { scope } : {}),
      page,
      perPage,
      maxPages: 1,
    } as { page: number; perPage: number; maxPages: number };

    return (await api.Jobs.all(projectSlug, jobOptions)) as GitlabJobItem[];
  }

  private appendJobsSince(
    items: GitlabJobItem[],
    since: Date,
    allItems: GitlabJobItem[],
    fetchItemsLimit: number,
  ): boolean {
    for (const item of items) {
      if (allItems.length >= fetchItemsLimit) {
        return true;
      }
      if (new Date(item.created_at) >= since) {
        allItems.push(item);
      }
    }

    return allItems.length >= fetchItemsLimit;
  }

  private shouldContinueJobsPaging(
    items: GitlabJobItem[],
    since: Date,
    perPage: number,
  ): boolean {
    const oldestItem = items.at(-1);

    if (oldestItem && new Date(oldestItem.created_at) < since) {
      return false;
    }

    return items.length >= perPage;
  }

  private async fetchJobsSince(
    api: GitlabApi,
    projectSlug: string,
    options: FetchJobsSinceOptions,
  ): Promise<GitlabJobItem[]> {
    const {
      since,
      scope,
      fetchItemsLimit = GitlabClient.FETCH_ITEMS_LIMIT,
    } = options;

    const perPage = GitlabClient.PAGE_SIZE;
    const allItems: GitlabJobItem[] = [];

    let page = 1;
    let hasMore = true;
    let truncated = false;

    while (hasMore && allItems.length < fetchItemsLimit) {
      if (page > GitlabClient.MAX_PAGES) {
        truncated = true;
        break;
      }

      const items = await this.fetchJobsPage(
        api,
        projectSlug,
        page,
        perPage,
        scope,
      );
      if (items.length === 0) {
        break;
      }

      if (this.appendJobsSince(items, since, allItems, fetchItemsLimit)) {
        truncated = true;
        break;
      }

      hasMore = this.shouldContinueJobsPaging(items, since, perPage);
      page++;
    }

    if (truncated) {
      this.logger.warn(
        `Reached jobs fetch limit for '${projectSlug}' ` +
          `(fetchItemsLimit=${fetchItemsLimit}, maxPages=${GitlabClient.MAX_PAGES}); stopping fetch`,
      );
    }

    return allItems;
  }
}
