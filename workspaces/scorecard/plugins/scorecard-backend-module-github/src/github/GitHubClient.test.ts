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
import { DefaultGithubCredentialsProvider } from '@backstage/integration';
import { GithubClient } from './GithubClient';
import { GithubRepository } from './types';
import { DEFAULT_GITHUB_HOSTNAME } from './constants';

describe('GithubClient', () => {
  let githubClient: GithubClient;
  const mockedGraphqlClient = jest.fn();
  const repository: GithubRepository = {
    owner: 'owner',
    repo: 'repo',
  };

  jest
    .spyOn(DefaultGithubCredentialsProvider.prototype, 'getCredentials')
    .mockResolvedValue({
      type: 'token',
      headers: { Authorization: 'Bearer dummy-token' },
      token: 'dummy-token',
    });

  beforeEach(() => {
    jest.clearAllMocks();

    // @ts-ignore
    jest.unstable_mockModule('@octokit/graphql', async () => ({
      graphql: {
        defaults: () => mockedGraphqlClient,
      },
    }));

    const mockConfig = new ConfigReader({
      integrations: {
        github: [
          {
            host: DEFAULT_GITHUB_HOSTNAME,
            token: 'dummy-token',
          },
        ],
      },
    });
    githubClient = new GithubClient(mockConfig);
  });

  describe('getOpenPullRequestsCount', () => {
    it('should return the count of open pull requests', async () => {
      const response = {
        repository: {
          pullRequests: {
            totalCount: 42,
          },
        },
      };
      mockedGraphqlClient.mockResolvedValue(response);

      const result = await githubClient.getOpenPullRequestsCount(
        repository,
        DEFAULT_GITHUB_HOSTNAME,
      );

      expect(result).toBe(42);
      expect(mockedGraphqlClient).toHaveBeenCalledTimes(1);
      expect(mockedGraphqlClient).toHaveBeenCalledWith(
        expect.stringContaining('query getOpenPRsCount'),
        repository,
      );
    });

    it('should throw error when GitHub integration for hostname is missing', async () => {
      await expect(
        githubClient.getOpenPullRequestsCount(repository, 'unknown-host'),
      ).rejects.toThrow("Missing GitHub integration for 'unknown-host'");
    });
  });
});
