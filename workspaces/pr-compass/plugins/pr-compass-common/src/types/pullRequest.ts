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

import type { ScmUser, SourceStatus, PullRequestBadge } from '../types';

/**
 * @public
 */
export type PullRequest = {
  /** Unique pull request ID in the form of `host/owner/repo#number` */
  id: string;
  /** The SCM provider type that retrieved the pull request, matches Backstage integration type, e.g. `github`. */
  provider: string;
  host: string;
  url: string;
  title: string;
  /** Repository in the form of `owner/repo`. */
  repo: string;
  number: number;
  /** ISO 8601 UTC timestamp */
  updatedAt: string;
  badge: PullRequestBadge;
  author: ScmUser;
};

/**
 * Response of `GET /pull-requests`.
 *
 * @public
 */
export type ListPullRequestsResponse = {
  items: PullRequest[];
  page: number;
  pageSize: number;
  total: number;
  sources: SourceStatus[];
};
