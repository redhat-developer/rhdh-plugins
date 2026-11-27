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
import {
  SourceErrorCodes,
  type PullRequest,
  type ListPullRequestsResponse,
  type SourceStatus,
} from '@red-hat-developer-hub/backstage-plugin-pr-compass-common';
import {
  PullRequestProviderError,
  type PullRequestFilters,
} from '@red-hat-developer-hub/backstage-plugin-pr-compass-node';
import { sortPullRequests } from '../utils';
import { validatePullRequests } from '../validation';
import type { SourceResolver } from './SourceResolver';
import type { PullRequestProvidersRegistry } from '../providers/PullRequestProvidersRegistry';

export interface PullRequestServiceOptions {
  sourceResolver: SourceResolver;
  providersRegistry: PullRequestProvidersRegistry;
  logger: LoggerService;
  /** Maximum number of pull requests requested from each source. */
  maxPullRequests: number;
}

export interface ListPullRequestsOptions {
  /** Source id to token */
  scmTokens: Record<string, string>;
  filters: PullRequestFilters;
  page: number;
  pageSize: number;
}

export class PullRequestService {
  private readonly sourceResolver: SourceResolver;
  private readonly providersRegistry: PullRequestProvidersRegistry;
  private readonly logger: LoggerService;
  private readonly maxPullRequests: number;

  constructor(options: PullRequestServiceOptions) {
    this.sourceResolver = options.sourceResolver;
    this.providersRegistry = options.providersRegistry;
    this.logger = options.logger;
    this.maxPullRequests = options.maxPullRequests;
  }

  async list(
    options: ListPullRequestsOptions,
  ): Promise<ListPullRequestsResponse> {
    const { scmTokens, filters, page, pageSize } = options;
    const gatheredPRs: PullRequest[] = [];

    const sourceStatuses = await Promise.all(
      this.sourceResolver
        .listSources()
        .map(async (source): Promise<SourceStatus | undefined> => {
          const { id: sourceId } = source;
          const provider = this.providersRegistry.getProvider(source.type);
          if (!provider) {
            return undefined;
          }

          const token = scmTokens[sourceId];
          if (!token) {
            return { sourceId, error: SourceErrorCodes.SCM_SESSION_REQUIRED };
          }

          try {
            const result = await provider.listPullRequests({
              host: source.host,
              token,
              filters,
              limit: this.maxPullRequests,
            });
            const { valid, invalidCount } = validatePullRequests(result.items);
            if (invalidCount > 0) {
              this.logger.warn(
                `Discarded ${invalidCount} invalid pull request(s) from source '${sourceId}'`,
              );
            }
            gatheredPRs.push(...valid);
            return { sourceId, truncated: result.truncated };
          } catch (error) {
            const code = PullRequestProviderError.is(error)
              ? error.code
              : SourceErrorCodes.FETCH_FAILED;
            this.logger.error('Failed to list pull requests', {
              source: sourceId,
              code,
            });
            return { sourceId, error: code };
          }
        }),
    );

    const sortedPRs = sortPullRequests(gatheredPRs);
    const start = (page - 1) * pageSize;

    return {
      items: sortedPRs.slice(start, start + pageSize),
      page,
      pageSize,
      total: sortedPRs.length,
      sources: sourceStatuses.filter(
        (status): status is SourceStatus => status !== undefined,
      ),
    };
  }
}
