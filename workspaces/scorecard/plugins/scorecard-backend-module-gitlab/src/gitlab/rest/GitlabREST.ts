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
import { BasePaginationRequestOptions, PaginationTypes } from '@gitbeaker/core';
import type {
  RequestURL,
  ProjectSlug,
  MRsRequestParams,
  MRsResponse,
  JobsRequestParams,
  JobsResponse,
} from '../types';
import { parseJobsResponse } from '../utils/parseJobsResponse';
import { parseMergeRequestsResponse } from './utils/parseMergeRequestsResponse';

export class GitlabREST {
  private readonly logger: LoggerService;
  private readonly integrations: ScmIntegrations;
  private readonly credentialsProvider: DefaultGitlabCredentialsProvider;

  constructor(config: Config, logger: LoggerService) {
    this.logger = logger;

    this.integrations = ScmIntegrations.fromConfig(config);

    this.credentialsProvider =
      DefaultGitlabCredentialsProvider.fromIntegrations(this.integrations);
  }

  private async getGitlabApi(url: RequestURL): Promise<Gitlab> {
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

  async mergeRequests(
    url: RequestURL,
    projectSlug: ProjectSlug,
    requestParams: MRsRequestParams,
  ): Promise<MRsResponse> {
    const api = await this.getGitlabApi(url);

    const response = await api.MergeRequests.all({
      projectId: projectSlug,
      page: 1,
      ...requestParams,
    });

    return parseMergeRequestsResponse(response, this.logger);
  }

  async jobs(
    url: RequestURL,
    projectSlug: ProjectSlug,
    requestParams: JobsRequestParams,
  ): Promise<JobsResponse> {
    const api = await this.getGitlabApi(url);
    const { scope, page = 1, perPage, maxPages } = requestParams;

    // GitLab accepts repeated scope[] query params; gitbeaker types only a
    // single JobScope in this release, so cast options for array callers.
    const jobParams: BasePaginationRequestOptions<PaginationTypes> = {
      ...(scope && scope.length > 0 ? { scope } : {}),
      ...(perPage !== undefined ? { perPage } : {}),
      ...(maxPages !== undefined ? { maxPages } : {}),
      ...(page !== undefined ? { page } : {}),
    };

    const response = await api.Jobs.all(projectSlug, jobParams);

    return parseJobsResponse(response, this.logger);
  }
}
