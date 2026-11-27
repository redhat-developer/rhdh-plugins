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
import { GitlabGraphql } from './graphQL/GitlabGraphQL';
import { GitlabREST } from './rest/GitlabREST';
import type {
  JobsResponse,
  JobsWindowStatsOptions,
  JobsResponseItem,
  JobsRequestParams,
  JobsWindowStatsResult,
  RequestURL,
  ProjectSlug,
  MRsResponseItem,
  PipelinesCountRequestParams,
  MRsCountOptions,
  MRsCountResult,
  IssuesCountOptions,
} from './types';
import { countIfTimestampInWindow } from './utils/countIfTimestampInWindow';
import { isTimestampInWindow } from './utils/isTimestampInWindow';
import { isGraphqlFeatureError } from './utils/isGraphqlFeatureError';
import { shouldContinueJobsPaging } from './utils/shouldContinueJobsPaging';
import { scanPages } from '../utils/scanPages';
import { ISSUE_STATUSES, MERGE_REQUEST_STATUSES } from './constants';

export class GitlabClient {
  private readonly rest: GitlabREST;
  private readonly logger: LoggerService;
  private readonly graphql: GitlabGraphql;

  constructor(
    config: Config,
    logger: LoggerService,
    options?: {
      graphql?: GitlabGraphql;
      rest?: GitlabREST;
    },
  ) {
    this.logger = logger;
    this.graphql = options?.graphql ?? new GitlabGraphql(config, logger);
    this.rest = options?.rest ?? new GitlabREST(config, logger);
  }

  async getOpenIssuesCount(
    url: RequestURL,
    projectSlug: ProjectSlug,
  ): Promise<number> {
    return this.graphql.projectIssueCount(url, {
      projectPath: projectSlug,
      state: ISSUE_STATUSES.OPENED,
    });
  }

  async getOpenedIssuesCount(
    url: RequestURL,
    projectSlug: ProjectSlug,
    options: IssuesCountOptions,
  ): Promise<number> {
    const { since } = options;

    return this.graphql.projectIssueCount(url, {
      projectPath: projectSlug,
      createdAfter: since.toISOString(),
    });
  }

  async getClosedIssuesCount(
    url: RequestURL,
    projectSlug: ProjectSlug,
    options: IssuesCountOptions,
  ): Promise<number> {
    const { since } = options;

    return this.graphql.projectIssueCount(url, {
      projectPath: projectSlug,
      closedAfter: since.toISOString(),
    });
  }

  private async getClosedMergeRequestsCountRest(
    url: RequestURL,
    projectSlug: ProjectSlug,
    options: MRsCountOptions,
  ): Promise<number> {
    const { since } = options;
    const updatedAfter = since.toISOString();

    const [closed, merged] = await Promise.all([
      scanPages<MRsResponseItem, MRsCountResult>(this.logger, {
        fetchPage: async (page, perPage) => {
          const { data } = await this.rest.mergeRequests(url, projectSlug, {
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
      scanPages<MRsResponseItem, MRsCountResult>(this.logger, {
        fetchPage: async (page, perPage) => {
          const { data } = await this.rest.mergeRequests(url, projectSlug, {
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

  async getOpenMergeRequestsCount(
    url: RequestURL,
    projectSlug: ProjectSlug,
  ): Promise<number> {
    return this.graphql.projectMergeRequestCount(url, {
      projectPath: projectSlug,
      state: MERGE_REQUEST_STATUSES.OPENED,
    });
  }

  async getOpenedMergeRequestsCount(
    url: RequestURL,
    projectSlug: ProjectSlug,
    options: MRsCountOptions,
  ): Promise<number> {
    const { since } = options;

    return this.graphql.projectMergeRequestCount(url, {
      projectPath: projectSlug,
      createdAfter: since.toISOString(),
    });
  }

  async getClosedMergeRequestsCount(
    url: RequestURL,
    projectSlug: ProjectSlug,
    options: MRsCountOptions,
  ): Promise<number> {
    const { since } = options;
    const sinceIso = since.toISOString();

    try {
      const [closedCount, mergedCount] = await Promise.all([
        this.graphql.projectMergeRequestCount(url, {
          projectPath: projectSlug,
          closedAfter: sinceIso,
          closedBefore: new Date().toISOString(),
        }),
        this.graphql.projectMergeRequestCount(url, {
          projectPath: projectSlug,
          mergedAfter: sinceIso,
        }),
      ]);

      return closedCount + mergedCount;
    } catch (error) {
      if (!isGraphqlFeatureError(error)) {
        throw error;
      }

      const message = error instanceof Error ? error.message : String(error);

      this.logger.warn(
        `GitLab GraphQL closed merge request filters are unsupported for '${projectSlug}' ` +
          `(requires GitLab ≥ 18.6 for closedAfter); falling back to REST: ${message}`,
      );

      return this.getClosedMergeRequestsCountRest(url, projectSlug, options);
    }
  }

  async getPipelinesCount(
    url: RequestURL,
    projectSlug: ProjectSlug,
    requestParams: PipelinesCountRequestParams,
  ): Promise<number> {
    return this.graphql.projectPipelinesCount(url, {
      projectPath: projectSlug,
      updatedAfter: requestParams.since.toISOString(),
      status: requestParams.status,
    });
  }

  async getJobs(
    url: RequestURL,
    projectSlug: ProjectSlug,
    requestParams: JobsRequestParams = {},
  ): Promise<JobsResponse> {
    return this.rest.jobs(url, projectSlug, requestParams);
  }

  async getJobsWindowStats(
    url: RequestURL,
    projectSlug: ProjectSlug,
    options: JobsWindowStatsOptions,
  ): Promise<JobsWindowStatsResult> {
    const { since, scope, fetchItemsLimit } = options;

    return scanPages<JobsResponseItem, JobsWindowStatsResult>(this.logger, {
      fetchItemsLimit,
      context: `jobs in '${projectSlug}'`,
      initialResult: { started: 0, successful: 0, failed: 0 },
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
      shouldContinue: items => shouldContinueJobsPaging(items, since),
    });
  }
}
