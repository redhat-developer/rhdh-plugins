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
import { ScmIntegrations } from '@backstage/integration';
import type { GitlabProjectSlug } from './types';

export class GitlabClient {
  private readonly integrations: ScmIntegrations;

  constructor(config: Config) {
    this.integrations = ScmIntegrations.fromConfig(config);
  }

  private getApiBaseUrl(projectSlug: string): {
    apiBaseUrl: string;
    token: string | undefined;
  } {
    // Derive the host from the project slug or default to gitlab.com
    const host = 'gitlab.com';
    const url = `https://${host}/${projectSlug}`;
    const integration = this.integrations.gitlab.byUrl(url);

    if (!integration) {
      throw new Error(`Missing GitLab integration for '${url}'`);
    }

    return {
      apiBaseUrl: integration.config.apiBaseUrl ?? `https://${host}/api/v4`,
      token: integration.config.token,
    };
  }

  private async fetchApi(
    projectSlug: GitlabProjectSlug,
    endpoint: string,
    params: Record<string, string> = {},
  ): Promise<Response> {
    const { apiBaseUrl, token } = this.getApiBaseUrl(projectSlug);
    const encodedProject = encodeURIComponent(projectSlug);
    const url = new URL(`${apiBaseUrl}/projects/${encodedProject}${endpoint}`);

    for (const [key, value] of Object.entries(params)) {
      url.searchParams.set(key, value);
    }

    const headers: Record<string, string> = {};
    if (token) {
      headers['PRIVATE-TOKEN'] = token;
    }

    return fetch(url.toString(), { headers });
  }

  private async fetchTotalCount(
    projectSlug: GitlabProjectSlug,
    endpoint: string,
    params: Record<string, string> = {},
  ): Promise<number> {
    const response = await this.fetchApi(projectSlug, endpoint, {
      ...params,
      per_page: '1',
    });

    if (!response.ok) {
      throw new Error(
        `GitLab API error: ${response.status} ${response.statusText}`,
      );
    }

    const total = response.headers.get('x-total');
    if (total !== null) {
      return parseInt(total, 10);
    }

    // Fallback: count items from response body
    const items = (await response.json()) as unknown[];
    return items.length;
  }

  async getOpenIssuesCount(projectSlug: GitlabProjectSlug): Promise<number> {
    return this.fetchTotalCount(projectSlug, '/issues', {
      state: 'opened',
    });
  }

  async getOpenedIssuesCount(
    projectSlug: GitlabProjectSlug,
    since: Date,
  ): Promise<number> {
    return this.fetchTotalCount(projectSlug, '/issues', {
      created_after: since.toISOString(),
    });
  }

  async getClosedIssuesCount(
    projectSlug: GitlabProjectSlug,
    since: Date,
  ): Promise<number> {
    return this.fetchTotalCount(projectSlug, '/issues', {
      state: 'closed',
      updated_after: since.toISOString(),
    });
  }

  async getOpenMergeRequestsCount(
    projectSlug: GitlabProjectSlug,
  ): Promise<number> {
    return this.fetchTotalCount(projectSlug, '/merge_requests', {
      state: 'opened',
    });
  }

  async getOpenedMergeRequestsCount(
    projectSlug: GitlabProjectSlug,
    since: Date,
  ): Promise<number> {
    return this.fetchTotalCount(projectSlug, '/merge_requests', {
      created_after: since.toISOString(),
    });
  }

  async getClosedMergeRequestsCount(
    projectSlug: GitlabProjectSlug,
    since: Date,
  ): Promise<number> {
    const closedCount = await this.fetchTotalCount(
      projectSlug,
      '/merge_requests',
      {
        state: 'closed',
        updated_after: since.toISOString(),
      },
    );
    const mergedCount = await this.fetchTotalCount(
      projectSlug,
      '/merge_requests',
      {
        state: 'merged',
        updated_after: since.toISOString(),
      },
    );
    return closedCount + mergedCount;
  }

  async getPipelinesCount(
    projectSlug: GitlabProjectSlug,
    since: Date,
    status?: string,
  ): Promise<number> {
    const params: Record<string, string> = {
      updated_after: since.toISOString(),
    };
    if (status) {
      params.status = status;
    }
    return this.fetchTotalCount(projectSlug, '/pipelines', params);
  }

  async getJobsCount(
    projectSlug: GitlabProjectSlug,
    since: Date,
    scope?: string[],
  ): Promise<number> {
    const params: Record<string, string> = {};

    if (scope && scope.length > 0) {
      params['scope[]'] = scope.join(',');
    }

    // The jobs API doesn't support date filtering directly,
    // so we need to fetch and filter by created_at
    const jobs = await this.fetchAllPages(projectSlug, '/jobs', params, since);
    return jobs.length;
  }

  private async fetchAllPages(
    projectSlug: GitlabProjectSlug,
    endpoint: string,
    params: Record<string, string>,
    since: Date,
  ): Promise<Array<{ created_at: string }>> {
    const allItems: Array<{ created_at: string }> = [];
    let page = 1;
    const perPage = 100;
    let hasMore = true;

    while (hasMore) {
      const response = await this.fetchApi(projectSlug, endpoint, {
        ...params,
        page: String(page),
        per_page: String(perPage),
      });

      if (!response.ok) {
        throw new Error(
          `GitLab API error: ${response.status} ${response.statusText}`,
        );
      }

      const items = (await response.json()) as Array<{ created_at: string }>;
      if (items.length === 0) {
        hasMore = false;
        continue;
      }

      for (const item of items) {
        if (new Date(item.created_at) >= since) {
          allItems.push(item);
        }
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

    return allItems;
  }
}
