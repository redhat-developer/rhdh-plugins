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

import { ConfigReader } from '@backstage/config';
import type { Entity } from '@backstage/catalog-model';
import { GithubPRPassRateProvider } from './GithubPRPassRateProvider';
import { GithubClient } from '../github/GithubClient';

jest.mock('@backstage/catalog-model', () => ({
  ...jest.requireActual('@backstage/catalog-model'),
  getEntitySourceLocation: jest.fn().mockReturnValue({
    type: 'url',
    target: 'https://github.com/org/orgRepo/tree/main/',
  }),
}));
jest.mock('../github/GithubClient');

const mockEntity: Entity = {
  apiVersion: 'backstage.io/v1alpha1',
  kind: 'Component',
  metadata: {
    name: 'test-component',
    annotations: {
      'github.com/project-slug': 'org/orgRepo',
    },
  },
};

describe('GithubPRPassRateProvider', () => {
  const mockedGithubClient = GithubClient as jest.MockedClass<
    typeof GithubClient
  >;
  const mockedGithubClientInstance = {
    getPullRequestsWithCommitStatuses: jest.fn(),
  } as any;
  mockedGithubClient.mockImplementation(() => mockedGithubClientInstance);

  let provider: GithubPRPassRateProvider;

  beforeEach(() => {
    jest.clearAllMocks();
    provider = GithubPRPassRateProvider.fromConfig(new ConfigReader({}));
  });

  it('should return all metric IDs', () => {
    expect(provider.getMetricIds()).toEqual([
      'github.pr_ci_first_time_pass_rate_7d',
      'github.pr_ci_first_time_pass_rate_24h',
    ]);
  });

  it('should calculate PR CI first time pass rates', async () => {
    const now = new Date();
    const hoursAgo = (h: number) =>
      new Date(now.getTime() - h * 60 * 60 * 1000).toISOString();

    mockedGithubClientInstance.getPullRequestsWithCommitStatuses.mockResolvedValue(
      [
        // 7d window, success
        {
          createdAt: hoursAgo(72),
          firstPushLastCommitState: 'SUCCESS',
        },
        // 7d window, failure
        {
          createdAt: hoursAgo(48),
          firstPushLastCommitState: 'FAILURE',
        },
        // 24h window, success
        {
          createdAt: hoursAgo(5),
          firstPushLastCommitState: 'SUCCESS',
        },
        // 24h window, success
        {
          createdAt: hoursAgo(2),
          firstPushLastCommitState: 'SUCCESS',
        },
      ],
    );

    const results = await provider.calculateMetrics!(mockEntity);

    // 7d: 3 success out of 4 with CI = 75%
    expect(results.get('github.pr_ci_first_time_pass_rate_7d')).toBe(75);
    // 24h: 2 success out of 2 with CI = 100%
    expect(results.get('github.pr_ci_first_time_pass_rate_24h')).toBe(100);
  });

  it('should skip PRs without CI checks', async () => {
    mockedGithubClientInstance.getPullRequestsWithCommitStatuses.mockResolvedValue(
      [
        {
          createdAt: new Date().toISOString(),
          firstPushLastCommitState: null,
        },
      ],
    );

    const results = await provider.calculateMetrics!(mockEntity);

    expect(results.get('github.pr_ci_first_time_pass_rate_7d')).toBe(100);
  });

  it('should return 100% when no PRs exist', async () => {
    mockedGithubClientInstance.getPullRequestsWithCommitStatuses.mockResolvedValue(
      [],
    );

    const results = await provider.calculateMetrics!(mockEntity);

    expect(results.get('github.pr_ci_first_time_pass_rate_7d')).toBe(100);
    expect(results.get('github.pr_ci_first_time_pass_rate_24h')).toBe(100);
  });

  it('should handle mixed CI states', async () => {
    const hoursAgo = (h: number) =>
      new Date(Date.now() - h * 60 * 60 * 1000).toISOString();

    mockedGithubClientInstance.getPullRequestsWithCommitStatuses.mockResolvedValue(
      [
        {
          createdAt: hoursAgo(48),
          firstPushLastCommitState: 'SUCCESS',
        },
        {
          createdAt: hoursAgo(48),
          firstPushLastCommitState: 'FAILURE',
        },
        {
          createdAt: hoursAgo(48),
          firstPushLastCommitState: 'PENDING',
        },
        {
          createdAt: hoursAgo(48),
          firstPushLastCommitState: null,
        },
      ],
    );

    const results = await provider.calculateMetrics!(mockEntity);

    // 1 success out of 3 with CI (null excluded) = 33.3%
    expect(results.get('github.pr_ci_first_time_pass_rate_7d')).toBe(33.3);
  });
});
