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
  PullRequestBadges,
  type PullRequest,
} from '@red-hat-developer-hub/backstage-plugin-pr-compass-common';

export function pr(
  overrides: Partial<PullRequest> = {},
  options?: { username?: string; ageDays?: number },
): PullRequest {
  let host = overrides.host || 'github.com';
  if (overrides.provider === 'gitlab') {
    host = 'gitlab.com';
  }
  const repo = overrides.repo ?? 'acme/repo';
  const number = overrides.number ?? 1;
  const username = options?.username ?? 'jdoe';
  const updatedAt = options?.ageDays
    ? new Date(Date.now() - options.ageDays * 24 * 60 * 60 * 1000).toISOString()
    : new Date().toISOString();

  return {
    id: `${host}/${repo}#${number}`,
    provider: 'github',
    host,
    url: `https://${host}/${repo}/pull/${number}`,
    title: 'PR title',
    repo,
    number,
    updatedAt,
    badge: PullRequestBadges.NeedsReview,
    author: {
      id: `${host}/${username}`,
      username,
      avatarUrl: `https://avatars.example/${username}`,
    },
    ...overrides,
  };
}
