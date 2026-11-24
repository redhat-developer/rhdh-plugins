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

import type {
  PullRequest,
  PullRequestBadge,
} from '@red-hat-developer-hub/backstage-plugin-pr-compass-common';

/**
 * @public
 */
export interface PullRequestFilters {
  badge?: PullRequestBadge;
}

/**
 * @public
 */
export interface ListPullRequestsOptions {
  /** Hostname of the configured SCM integration to retrieve pull requests from. */
  host: string;
  /** Access token for the authenticated user. */
  token: string;
  /** Optional dilters to apply when retrieving pull requests. */
  filters: PullRequestFilters;
  /** Maximum number of pull requests to return. */
  limit: number;
}

/**
 * @public
 */
export interface ListPullRequestsResult {
  /** Pull requests matching the requested filters. */
  items: PullRequest[];
  /** Whether the result was truncated because of the requested limit {@link ListPullRequestsOptions.limit} was reached. */
  truncated: boolean;
}

/**
 * A provider that retrieves pull requests from SCM instance.
 *
 * Providers are registered through 'pr-compass.providers' extension point.
 *
 * @public
 */
export interface PullRequestProvider {
  /**
   * The SCM provider type matching the Backstage integration type, e.g. `github`.
   * (e.g. `github`, `gitlab`)
   */
  readonly type: string;

  /** Retrieves pull requests for the authenticated user from the given SCM host. */
  listPullRequests(
    options: ListPullRequestsOptions,
  ): Promise<ListPullRequestsResult>;
}
