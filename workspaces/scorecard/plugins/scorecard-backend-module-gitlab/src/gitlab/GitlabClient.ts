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

type GitlabApi = InstanceType<typeof Gitlab>;

type GitlabIssuesOptions = {
  state?: 'opened' | 'closed';
  createdAfter?: string;
  updatedAfter?: string;
};

type GitlabMergeRequestsOptions = {
  state?: 'opened' | 'closed' | 'merged';
  createdAfter?: string;
  updatedAfter?: string;
};

type FetchJobsSinceOptions = {
  since: Date;
  scope?: string[];
  fetchItemsLimit?: number;
};

export class GitlabClient {
  private static readonly MAX_JOBS_PAGES = 10;
  private static readonly GITLAB_JOBS_PAGE_SIZE = 100;
  private static readonly JOBS_FETCH_ITEMS_LIMIT = 1000;

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
      this.logger.warn(
        `No GitLab token provided for '${url}'. Configure integrations.gitlab token (Backend Service Integration).`,
      );
    }

    return new Gitlab({
      host: gitlabIntegration.config.baseUrl,
      ...(token ? { oauthToken: token } : {}),
    });
  }

  private resolveTotalCount(
    total: number | undefined,
    context: string,
  ): number {
    if (!Number.isFinite(total)) {
      throw new Error(
        `GitLab did not return a pagination total for ${context}. ` +
          'Counts cannot be derived from a single page when X-Total is absent.',
      );
    }
    return total as number;
  }

  private async getIssuesCount(
    url: string,
    projectSlug: string,
    options?: GitlabIssuesOptions,
  ): Promise<number> {
    const api = await this.getGitlabApi(url);
    const { paginationInfo } = await api.Issues.all({
      projectId: projectSlug,
      perPage: 1,
      maxPages: 1,
      page: 1,
      showExpanded: true,
      ...options,
    });
    return this.resolveTotalCount(
      paginationInfo.total,
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
    return this.getIssuesCount(url, projectSlug, {
      state: 'closed',
      updatedAfter: since.toISOString(),
    });
  }

  private async getMergeRequestsCount(
    url: string,
    projectSlug: string,
    options?: GitlabMergeRequestsOptions,
  ): Promise<number> {
    const api = await this.getGitlabApi(url);
    const { paginationInfo } = await api.MergeRequests.all({
      projectId: projectSlug,
      perPage: 1,
      maxPages: 1,
      page: 1,
      showExpanded: true,
      ...options,
    });
    return this.resolveTotalCount(
      paginationInfo.total,
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
    const closedMRs = await this.getMergeRequestsCount(url, projectSlug, {
      state: 'closed',
      updatedAfter: since.toISOString(),
    });
    const mergedMRs = await this.getMergeRequestsCount(url, projectSlug, {
      state: 'merged',
      updatedAfter: since.toISOString(),
    });

    return closedMRs + mergedMRs;
  }

  async getPipelinesCount(
    url: string,
    projectSlug: string,
    since: Date,
    status?: string,
  ): Promise<number> {
    const api = await this.getGitlabApi(url);
    const { paginationInfo } = await api.Pipelines.all(projectSlug, {
      updatedAfter: since.toISOString(),
      ...(status ? { status: status as 'success' | 'failed' } : {}),
      perPage: 1,
      maxPages: 1,
      page: 1,
      showExpanded: true,
    });
    return this.resolveTotalCount(
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

  private async fetchJobsSince(
    api: GitlabApi,
    projectSlug: string,
    options: FetchJobsSinceOptions,
  ): Promise<Array<{ created_at: string }>> {
    const {
      since,
      scope,
      fetchItemsLimit = GitlabClient.JOBS_FETCH_ITEMS_LIMIT,
    } = options;

    const perPage = GitlabClient.GITLAB_JOBS_PAGE_SIZE;

    const allItems: Array<{ created_at: string }> = [];

    let page = 1;
    let hasMore = true;
    let truncated = false;

    while (hasMore && allItems.length < fetchItemsLimit) {
      if (page > GitlabClient.MAX_JOBS_PAGES) {
        truncated = true;
        break;
      }

      // GitLab accepts repeated scope[] query params; gitbeaker types only a
      // single JobScope in this release, so cast options for array callers.
      const jobOptions = {
        ...(scope && scope.length > 0 ? { scope } : {}),
        page,
        perPage,
        maxPages: 1,
      } as { page: number; perPage: number; maxPages: number };

      const items = (await api.Jobs.all(projectSlug, jobOptions)) as {
        created_at: string;
      }[];

      if (items.length === 0) {
        hasMore = false;
        continue;
      }

      for (const item of items) {
        if (allItems.length >= fetchItemsLimit) {
          truncated = true;
          break;
        }
        if (new Date(item.created_at) >= since) {
          allItems.push(item);
        }
      }

      if (allItems.length >= fetchItemsLimit) {
        truncated = true;
        hasMore = false;
        continue;
      }

      // If the oldest item on this page is before 'since', we've gone far enough
      const oldestItem = items[items.length - 1];
      if (new Date(oldestItem.created_at) < since) {
        hasMore = false;
        continue;
      }

      if (items.length < perPage) {
        hasMore = false;
        continue;
      }

      page++;
    }

    if (truncated) {
      this.logger.warn(
        `Reached jobs fetch limit for '${projectSlug}' ` +
          `(fetchItemsLimit=${fetchItemsLimit}, maxPages=${GitlabClient.MAX_JOBS_PAGES}); stopping fetch`,
      );
    }

    return allItems;
  }
}
