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

import { PullRequestBadges } from '@red-hat-developer-hub/backstage-plugin-pr-compass-common';

import type { PullRequest } from '@red-hat-developer-hub/backstage-plugin-pr-compass-common';
import { pr } from '../__fixtures__/mockPullRequest';

export const githubPullRequests: PullRequest[] = [
  pr(
    {
      repo: 'acme/platform',
      number: 841,
      title: 'Add retry to the API client',
    },
    { username: 'alice', ageDays: 4 },
  ),
  pr(
    {
      repo: 'acme/platform',
      number: 839,
      title: 'Fix flaky scheduler test',
    },
    { username: 'bob', ageDays: 9 },
  ),
  pr(
    {
      repo: 'acme/payments',
      number: 302,
      badge: PullRequestBadges.InProgress,
      title: 'Split adapter',
    },
    { username: 'john', ageDays: 2 },
  ),
  pr(
    {
      repo: 'acme/payments',
      number: 299,
      badge: PullRequestBadges.MergeReady,
      title: 'Bump lodash to 4.17.21',
    },
    { username: 'dependabot[bot]', ageDays: 1 },
  ),
];

export const gitlabPullRequests: PullRequest[] = [
  pr(
    {
      provider: 'gitlab',
      repo: 'acme/infra',
      number: 551,
      title: 'Update env vars',
    },
    { username: 'bob', ageDays: 6 },
  ),
  pr(
    {
      provider: 'gitlab',
      repo: 'acme/infra',
      number: 547,
      badge: PullRequestBadges.InProgress,
      title: 'WIP: migrate runners',
    },
    { ageDays: 12 },
  ),
  pr(
    {
      provider: 'gitlab',
      repo: 'acme/docs',
      number: 118,
      badge: PullRequestBadges.MergeReady,
      title: 'Clarify the onboarding guide',
    },
    { username: 'frank', ageDays: 3 },
  ),
];
