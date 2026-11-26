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
  ScanPagesOptions,
  AllIssuesResponse,
  AllMergeRequestsResponse,
  AllPipelinesResponse,
  AllJobsResponse,
  GitlabJobsWindowStats,
  GitlabJobItem,
  GitlabPipelineItem,
  FetchJobsWindowOptions,
  GitlabJobsRequestAttributes,
  GitlabPipelinesRequestAttributes,
  GitlabIssueItem,
  GitlabMergeRequestItem,
} from './types';
import { resolveTotalCount } from './utils/resolveTotalCount';
import { parseIssuesResponse } from './utils/parseIssuesResponse';
import { parseMergeRequestsResponse } from './utils/parseMergeRequestsResponse';
import { parsePipelinesResponse } from './utils/parsePipelinesResponse';
import { parseJobsResponse } from './utils/parseJobsResponse';
import { countIfTimestampInWindow } from './utils/countIfTimestampInWindow';
import { shouldContinueJobsPaging } from './utils/shouldContinueJobsPaging';
import { isTimestampInWindow } from './utils/isTimestampInWindow';

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

  private async scanPages<TItem, TResult>(
    options: ScanPagesOptions<TItem, TResult>,
  ): Promise<TResult> {
    const {
      fetchPage,
      getValue,
      initialResult,
      context,
      fetchItemsLimit = GitlabClient.FETCH_ITEMS_LIMIT,
      shouldContinue,
    } = options;

    const result = initialResult;
    let scanned = 0;

    const limitReached = () => {
      this.logger.warn(
        `Reached fetch limit while counting ${context} ` +
          `(fetchItemsLimit=${fetchItemsLimit}, maxPages=${GitlabClient.MAX_PAGES}). ` +
          'Counts cannot be completed without scanning more candidates.',
      );

      return result;
    };

    for (
      let page = 1;
      page <= GitlabClient.MAX_PAGES && scanned < fetchItemsLimit;
      page++
    ) {
      const items = await fetchPage(page, GitlabClient.PAGE_SIZE);

      if (items.length === 0) {
        return result;
      }

      for (const item of items) {
        if (scanned >= fetchItemsLimit) return limitReached();

        scanned++;
        getValue(item, result);
      }

      if (items.length < GitlabClient.PAGE_SIZE) return result;

      if (shouldContinue && !shouldContinue(items, GitlabClient.PAGE_SIZE)) {
        return result;
      }

      if (page === GitlabClient.MAX_PAGES) return limitReached();
    }

    return result;
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
    const { count } = await this.scanPages<GitlabIssueItem, { count: number }>({
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
      getValue: (item, result) =>
        countIfTimestampInWindow(item.closed_at, since, result),
      initialResult: { count: 0 },
      context: `closed issues in '${projectSlug}'`,
    });

    return count;
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

    const [closed, merged] = await Promise.all([
      this.scanPages<GitlabMergeRequestItem, { count: number }>({
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
        getValue: (item, result) =>
          countIfTimestampInWindow(item.closed_at, since, result),
        initialResult: { count: 0 },
        context: `closed merge requests in '${projectSlug}'`,
      }),
      this.scanPages<GitlabMergeRequestItem, { count: number }>({
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
        getValue: (item, result) =>
          countIfTimestampInWindow(item.merged_at, since, result),
        initialResult: { count: 0 },
        context: `merged merge requests in '${projectSlug}'`,
      }),
    ]);

    return closed.count + merged.count;
  }

  async getPipelines(
    url: string,
    projectSlug: string,
    requestAttributes: GitlabPipelinesRequestAttributes = {},
  ): Promise<AllPipelinesResponse> {
    const api = await this.getGitlabApi(url);

    const response = await api.Pipelines.all(projectSlug, {
      page: 1,
      ...requestAttributes,
    });

    return parsePipelinesResponse(response, this.logger);
  }

  async getPipelinesCount(
    url: string,
    projectSlug: string,
    since: Date,
    status?: GitlabPipelinesRequestAttributes['status'],
  ): Promise<number> {
    // GitLab list-pipelines has no started_after/finished_after. updatedAfter
    // only bounds candidates. We count by started_at or finished_at.
    const timestampField = status ? 'finished_at' : 'started_at';
    const statusLabel = status ?? 'started';

    const { count } = await this.scanPages<
      GitlabPipelineItem,
      { count: number }
    >({
      fetchPage: async (page, perPage) => {
        const { data } = await this.getPipelines(url, projectSlug, {
          updatedAfter: since.toISOString(),
          ...(status ? { status } : {}),
          page,
          perPage,
          maxPages: 1,
        });
        return data;
      },
      getValue: (item, result) =>
        countIfTimestampInWindow(item[timestampField], since, result),
      initialResult: { count: 0 },
      context: `${statusLabel} pipelines in '${projectSlug}'`,
    });

    return count;
  }

  async getJobs(
    url: string,
    projectSlug: string,
    requestAttributes: GitlabJobsRequestAttributes = {},
  ): Promise<AllJobsResponse> {
    const api = await this.getGitlabApi(url);
    const { scope, page = 1, perPage, maxPages } = requestAttributes;

    // GitLab accepts repeated scope[] query params; gitbeaker types only a
    // single JobScope in this release, so cast options for array callers.
    const jobOptions = {
      ...(scope && scope.length > 0 ? { scope } : {}),
      page,
      ...(perPage !== undefined ? { perPage } : {}),
      ...(maxPages !== undefined ? { maxPages } : {}),
    } as {
      page: number;
      perPage?: number;
      maxPages?: number;
    };

    const response = await api.Jobs.all(projectSlug, jobOptions);
    return parseJobsResponse(response, this.logger);
  }

  async getJobsWindowStats(
    url: string,
    projectSlug: string,
    options: FetchJobsWindowOptions,
  ): Promise<GitlabJobsWindowStats> {
    const { since, scope, fetchItemsLimit } = options;

    return this.scanPages<GitlabJobItem, GitlabJobsWindowStats>({
      fetchPage: async (page, perPage) => {
        const { data } = await this.getJobs(url, projectSlug, {
          scope,
          page,
          perPage,
          maxPages: 1,
        });
        return data;
      },
      getValue: (item, result) => {
        if (isTimestampInWindow(item.started_at, since)) {
          result.started++;
        }

        if (isTimestampInWindow(item.finished_at, since)) {
          if (item.status === 'success') {
            result.successful++;
          } else if (item.status === 'failed') {
            result.failed++;
          }
        }
      },
      initialResult: { started: 0, successful: 0, failed: 0 },
      context: `jobs in '${projectSlug}'`,
      fetchItemsLimit,
      shouldContinue: items => shouldContinueJobsPaging(items, since),
    });
  }
}
