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

export type IssueStatus = 'opened' | 'closed';

export type IssuesCountOptions = {
  since: Date;
};

export type MergeRequestStatus = 'opened' | 'closed' | 'merged';

export type MRsRequestParams = {
  state?: MergeRequestStatus;
  createdAfter?: string;
  updatedAfter?: string;
  page?: number;
  perPage?: number;
  maxPages?: number;
  showExpanded?: boolean;
};

export type MRsCountOptions = {
  since: Date;
};

export type MRsResponse = {
  data: MRsResponseItem[];
  paginationInfo?: {
    total?: number;
  };
};

export type MRsResponseItem = {
  closed_at?: string | null;
  merged_at?: string | null;
};

export type MRsCountResult = {
  count: number;
};

export type PipelinesStatus = 'SUCCESS' | 'FAILED';

export type PipelinesCountRequestParams = {
  since: Date;
  status?: PipelinesStatus;
};

type JobScope = string[];

export type JobsWindowStatsOptions = {
  since: Date;
  scope?: JobScope;
  fetchItemsLimit?: number;
};

export type JobsRequestParams = {
  scope?: JobScope;
  page?: number;
  perPage?: number;
  maxPages?: number;
};

export type JobsResponse = {
  data: JobsResponseItem[];
  paginationInfo?: {
    total?: number;
  };
};

export type JobsResponseItem = {
  created_at: string;
  started_at?: string | null;
  finished_at?: string | null;
  status?: string;
};

export type JobsWindowStatsResult = {
  started: number;
  successful: number;
  failed: number;
};
