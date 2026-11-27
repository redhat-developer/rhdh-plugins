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

import type { IssueStatus, ProjectSlug } from '../../types';

export type ProjectIssueCountVariables = {
  projectPath: ProjectSlug;
  state?: IssueStatus;
  createdAfter?: string;
  closedAfter?: string;
};

export type ProjectIssueCountResponse = {
  project: {
    issues: {
      count: number;
    } | null;
  } | null;
};

export const PROJECT_ISSUE_COUNT_QUERY = `
  query projectIssueCount(
    $projectPath: ID!
    $state: IssuableState
    $createdAfter: Time
    $closedAfter: Time
  ) {
    project(fullPath: $projectPath) {
      issues(
        state: $state
        createdAfter: $createdAfter
        closedAfter: $closedAfter
      ) {
        count
      }
    }
  }
`;
