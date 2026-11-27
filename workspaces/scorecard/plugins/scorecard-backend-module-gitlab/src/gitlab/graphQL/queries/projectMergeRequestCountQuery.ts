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

import type { MergeRequestStatus, ProjectSlug } from '../../types';

export type ProjectMergeRequestCountVariables = {
  projectPath: ProjectSlug;
  state?: MergeRequestStatus;
  createdAfter?: string;
  closedAfter?: string;
  closedBefore?: string;
  mergedAfter?: string;
};

export type ProjectMergeRequestCountResponse = {
  project: {
    mergeRequests: {
      count: number;
    } | null;
  } | null;
};

export const PROJECT_MERGE_REQUEST_COUNT_QUERY = `
  query projectMergeRequestCount(
    $projectPath: ID!
    $state: MergeRequestState
    $createdAfter: Time
    $closedAfter: Time
    $closedBefore: Time
    $mergedAfter: Time
  ) {
    project(fullPath: $projectPath) {
      mergeRequests(
        state: $state
        createdAfter: $createdAfter
        closedAfter: $closedAfter
        closedBefore: $closedBefore
        mergedAfter: $mergedAfter
      ) {
        count
      }
    }
  }
`;
