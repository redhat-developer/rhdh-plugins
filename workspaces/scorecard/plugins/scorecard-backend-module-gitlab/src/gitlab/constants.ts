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

import { IssueStatus, MergeRequestStatus, PipelinesStatus } from './types';

export const GITLAB_PROJECT_ANNOTATION = 'gitlab.com/project-slug';

export const GITLAB_MAX_PAGES = 10;

export const GITLAB_PAGE_SIZE = 100;

export const GITLAB_FETCH_ITEMS_LIMIT = 1000;

export const PIPELINES_STATUSES = {
  SUCCESS: 'SUCCESS',
  FAILED: 'FAILED',
} as const satisfies Record<string, PipelinesStatus>;

export const ISSUE_STATUSES = {
  OPENED: 'opened',
  CLOSED: 'closed',
} as const satisfies Record<string, IssueStatus>;

export const MERGE_REQUEST_STATUSES = {
  OPENED: 'opened',
  CLOSED: 'closed',
  MERGED: 'merged',
} as const satisfies Record<string, MergeRequestStatus>;
