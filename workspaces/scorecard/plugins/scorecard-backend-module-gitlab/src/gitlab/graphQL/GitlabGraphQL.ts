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
import type { RequestURL } from '../types';
import { isTimestampInWindow } from '../utils/isTimestampInWindow';
import { scanByCursor } from '../../utils/scanByCursor';
import type { GraphqlRequestOptions, GraphqlResponseBody } from './types';
import {
  PROJECT_ISSUE_COUNT_QUERY,
  type ProjectIssueCountResponse,
  type ProjectIssueCountVariables,
} from './queries/projectIssueCountQuery';
import {
  PROJECT_MERGE_REQUEST_COUNT_QUERY,
  type ProjectMergeRequestCountResponse,
  type ProjectMergeRequestCountVariables,
} from './queries/projectMergeRequestCountQuery';
import {
  PROJECT_PIPELINES_QUERY,
  ProjectPipelinesVariables,
  type GitlabGraphqlPipelineNode,
  type ProjectPipelinesResponse,
} from './queries/projectPipelinesQuery';

export class GitlabGraphql {
  private readonly logger: LoggerService;
  private readonly basePath = 'api/graphql';
  private readonly integrations: ScmIntegrations;
  private readonly credentialsProvider: DefaultGitlabCredentialsProvider;

  constructor(config: Config, logger: LoggerService) {
    this.integrations = ScmIntegrations.fromConfig(config);

    this.credentialsProvider =
      DefaultGitlabCredentialsProvider.fromIntegrations(this.integrations);

    this.logger = logger;
  }

  async request<T>(options: GraphqlRequestOptions): Promise<T> {
    const { url, query, variables } = options;
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

    const graphqlUrl = `${gitlabIntegration.config.baseUrl.replace(
      /\/$/,
      '',
    )}/${this.basePath}`;

    const response = await fetch(graphqlUrl, {
      method: 'POST',
      redirect: 'error',
      signal: AbortSignal.timeout(10_000),
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ query, variables }),
    });

    if (!response.ok) {
      throw new Error(
        `GitLab GraphQL request failed with status ${response.status} ${response.statusText}`,
      );
    }

    const body = (await response.json()) as GraphqlResponseBody;

    if (body.errors?.length) {
      const messages = body.errors
        .map(error => error.message ?? 'Unknown GraphQL error')
        .join('; ');

      throw new Error(`GitLab GraphQL errors: ${messages}`);
    }

    if (body.data === undefined || body.data === null) {
      throw new Error('GitLab GraphQL response did not include data');
    }

    return body.data as T;
  }

  async projectIssueCount(
    url: RequestURL,
    variables: ProjectIssueCountVariables,
  ): Promise<number> {
    const data = await this.request<ProjectIssueCountResponse>({
      url,
      query: PROJECT_ISSUE_COUNT_QUERY,
      variables,
    });

    if (!data.project) {
      throw new Error(
        `GitLab project '${variables.projectPath}' was not found or is inaccessible`,
      );
    }

    const count = data.project.issues?.count;

    if (!Number.isFinite(count)) {
      throw new TypeError(
        `GitLab GraphQL did not return an issue count for '${variables.projectPath}'`,
      );
    }

    return count as number;
  }

  async projectMergeRequestCount(
    url: RequestURL,
    variables: ProjectMergeRequestCountVariables,
  ): Promise<number> {
    const data = await this.request<ProjectMergeRequestCountResponse>({
      url,
      query: PROJECT_MERGE_REQUEST_COUNT_QUERY,
      variables,
    });

    if (!data.project) {
      throw new Error(
        `GitLab project '${variables.projectPath}' was not found or is inaccessible`,
      );
    }

    const count = data.project.mergeRequests?.count;

    if (!Number.isFinite(count)) {
      throw new TypeError(
        `GitLab GraphQL did not return a merge request count for '${variables.projectPath}'`,
      );
    }

    return count as number;
  }

  async projectPipelinesCount(
    url: RequestURL,
    requestParams: ProjectPipelinesVariables,
  ): Promise<number> {
    const { projectPath, updatedAfter, status } = requestParams;

    const statusLabel = status ?? 'started';
    const timestampField = status ? 'finishedAt' : 'startedAt';

    const { count } = await scanByCursor<
      GitlabGraphqlPipelineNode,
      { count: number }
    >(this.logger, {
      fetchPage: async (cursor, pageSize) => {
        const data = await this.request<ProjectPipelinesResponse>({
          url,
          query: PROJECT_PIPELINES_QUERY,
          variables: {
            projectPath,
            updatedAfter,
            ...(status ? { status } : {}),
            first: pageSize,
            after: cursor,
          },
        });

        if (!data.project) {
          throw new Error(
            `GitLab project '${projectPath}' was not found or is inaccessible`,
          );
        }

        const connection = data.project.pipelines;

        const items = (connection?.nodes ?? []).filter(
          (node): node is GitlabGraphqlPipelineNode => node !== null,
        );

        return {
          items,
          nextCursor: connection?.pageInfo.endCursor ?? null,
          hasNextPage: Boolean(connection?.pageInfo.hasNextPage),
        };
      },
      getValue: (node, result) => {
        if (isTimestampInWindow(node[timestampField], updatedAfter)) {
          result.count++;
        }
      },
      initialResult: { count: 0 },
      context: `${statusLabel} pipelines in '${projectPath}'`,
    });

    return count;
  }
}
