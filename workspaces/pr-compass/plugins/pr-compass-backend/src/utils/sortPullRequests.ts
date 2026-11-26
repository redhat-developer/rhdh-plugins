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

import {
  pullRequestBadgePriority,
  type PullRequest,
} from '@red-hat-developer-hub/backstage-plugin-pr-compass-common';

function comparePullRequests(a: PullRequest, b: PullRequest): number {
  return (
    pullRequestBadgePriority[a.badge] - pullRequestBadgePriority[b.badge] ||
    Date.parse(b.updatedAt) - Date.parse(a.updatedAt) ||
    a.id.localeCompare(b.id)
  );
}

/**
 * Orders pull requests: badge priority, then most recently updated, then `id`.
 */
export function sortPullRequests(pullRequests: PullRequest[]): PullRequest[] {
  return [...pullRequests].sort(comparePullRequests);
}
