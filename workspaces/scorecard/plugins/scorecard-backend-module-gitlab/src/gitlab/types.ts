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

import { Gitlab } from '@gitbeaker/rest';

export type GitlabApi = InstanceType<typeof Gitlab>;

export type GitlabIssuesRequestAttributes = {
  state?: 'opened' | 'closed';
  createdAfter?: string;
  updatedAfter?: string;
  page?: number;
  perPage?: number;
  maxPages?: number;
  showExpanded?: boolean;
};

export type GitlabMergeRequestsRequestAttributes = {
  state?: 'opened' | 'closed' | 'merged';
  createdAfter?: string;
  updatedAfter?: string;
  page?: number;
  perPage?: number;
  maxPages?: number;
  showExpanded?: boolean;
};

export type GitlabPipelinesRequestAttributes = {
  status?: 'success' | 'failed';
  updatedAfter?: string;
  page?: number;
  perPage?: number;
  maxPages?: number;
  showExpanded?: boolean;
};

export type TimestampedItem = Record<string, unknown>;

export type ScanPagesOptions<TItem, TResult> = {
  fetchPage: (page: number, perPage: number) => Promise<TItem[]>;
  getValue: (item: TItem, result: TResult) => void;
  initialResult: TResult;
  context: string;
  fetchItemsLimit?: number;
  shouldContinue?: (items: TItem[], perPage: number) => boolean;
};

export type GitlabPipelineItem = {
  started_at?: string | null;
  finished_at?: string | null;
  status?: string;
};

export type AllPipelinesResponse = {
  data: GitlabPipelineItem[];
  paginationInfo?: {
    total?: number;
  };
};

export type GitlabJobItem = {
  created_at: string;
  started_at?: string | null;
  finished_at?: string | null;
  status?: string;
};

export type GitlabJobsRequestAttributes = {
  scope?: string[];
  page?: number;
  perPage?: number;
  maxPages?: number;
};

export type FetchJobsWindowOptions = {
  since: Date;
  scope?: string[];
  fetchItemsLimit?: number;
};

export type GitlabJobsWindowStats = {
  started: number;
  successful: number;
  failed: number;
};

export type AllJobsResponse = {
  data: GitlabJobItem[];
  paginationInfo?: {
    total?: number;
  };
};

export type GitlabIssueItem = {
  closed_at?: string | null;
};

export type AllIssuesResponse = {
  data: GitlabIssueItem[];
  paginationInfo?: {
    total?: number;
  };
};

export type GitlabMergeRequestItem = {
  closed_at?: string | null;
  merged_at?: string | null;
};

export type AllMergeRequestsResponse = {
  data: GitlabMergeRequestItem[];
  paginationInfo?: {
    total?: number;
  };
};
