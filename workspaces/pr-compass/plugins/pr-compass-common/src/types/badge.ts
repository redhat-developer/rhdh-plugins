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

/**
 * Triage state of a pull request, relative to the signed-in user.
 *
 * @public
 */
export const PullRequestBadges = {
  NeedsReview: 'NeedsReview',
  InProgress: 'InProgress',
  MergeReady: 'MergeReady',
} as const;

/**
 * @public
 */
export type PullRequestBadge =
  (typeof PullRequestBadges)[keyof typeof PullRequestBadges];

/**
 * Sort priority of PullRequestBadge values. Lower sorts first.
 *
 * @public
 */
export const pullRequestBadgePriority: Record<PullRequestBadge, number> = {
  NeedsReview: 0,
  InProgress: 1,
  MergeReady: 2,
};
