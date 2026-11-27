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

import { type PullRequest } from '@red-hat-developer-hub/backstage-plugin-pr-compass-common';
import type { PullRequestProvider } from '@red-hat-developer-hub/backstage-plugin-pr-compass-node';
import { githubPullRequests, gitlabPullRequests } from '../__data__';
import { createFixturePullRequestProvider } from './fixturePullRequestProvider';

export function createMockPullRequestProvider(
  type: string,
  prs: PullRequest[] = [],
): jest.Mocked<PullRequestProvider> {
  const provider = createFixturePullRequestProvider(type, prs);
  return {
    type,
    listPullRequests: jest.fn(provider.listPullRequests),
  };
}

export const mockGithubPullRequestProvider = createMockPullRequestProvider(
  'github',
  githubPullRequests,
);

export const mockGitlabPullRequestProvider = createMockPullRequestProvider(
  'gitlab',
  gitlabPullRequests,
);
