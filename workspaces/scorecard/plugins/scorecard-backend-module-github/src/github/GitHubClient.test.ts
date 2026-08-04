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

const mockedGraphqlClient = jest.fn();
const mockedListRepoWorkflows = jest.fn();
const mockedListWorkflowRuns = jest.fn();
const mockedCompareCommitsWithBasehead = jest.fn();
const mockedPaginate = jest.fn();

jest.mock('@octokit/graphql', () => ({
  graphql: {
    defaults: () => mockedGraphqlClient,
  },
}));

jest.mock('@octokit/rest', () => ({
  Octokit: jest.fn().mockImplementation(() => ({
    actions: {
      listRepoWorkflows: mockedListRepoWorkflows,
      listWorkflowRuns: mockedListWorkflowRuns,
    },
    repos: {
      compareCommitsWithBasehead: mockedCompareCommitsWithBasehead,
    },
    rest: {
      actions: {
        listRepoWorkflows: mockedListRepoWorkflows,
        listWorkflowRuns: mockedListWorkflowRuns,
      },
    },
    paginate: mockedPaginate,
  })),
}));

describe('GithubClient', () => {
  let githubClient: GithubClient;
  const repository: GithubRepository = {
    owner: 'owner',
    repo: 'repo',
  };

  const getCredentialsSpy = jest
    .spyOn(DefaultGithubCredentialsProvider.prototype, 'getCredentials')
    .mockResolvedValue({
      type: 'token',
      headers: { Authorization: 'Bearer dummy-token' },
      token: 'dummy-token',
    });

  beforeEach(() => {
    jest.clearAllMocks();

    const mockConfig = new ConfigReader({
      integrations: {
        github: [
          {
            host: 'github.com',
            token: 'dummy-token',
          },
        ],
      },
    });
    githubClient = new GithubClient(mockConfig);
  });

  describe('getOpenPullRequestsCount', () => {
    it('should return the count of open pull requests', async () => {
      const url = `https://github.com/owner/repo`;
      const response = {
        repository: {
          pullRequests: {
            totalCount: 42,
          },
        },
      };
      mockedGraphqlClient.mockResolvedValue(response);

      const result = await githubClient.getOpenPullRequestsCount(
        url,
        repository,
      );

      expect(result).toBe(42);
      expect(mockedGraphqlClient).toHaveBeenCalledTimes(1);
      expect(mockedGraphqlClient).toHaveBeenCalledWith(
        expect.stringContaining('query getOpenPRsCount'),
        repository,
      );
      expect(getCredentialsSpy).toHaveBeenCalledWith({
        url,
      });
    });

    it('should throw error when GitHub integration for URL is missing', async () => {
      const unknownUrl = 'https://unknown-host/owner/repo';
      await expect(
        githubClient.getOpenPullRequestsCount(unknownUrl, repository),
      ).rejects.toThrow(`Missing GitHub integration for '${unknownUrl}'`);
    });

    it('should throw when repository is not found or inaccessible', async () => {
      const url = `https://github.com/owner/repo`;
      mockedGraphqlClient.mockResolvedValue({ repository: null });

      await expect(
        githubClient.getOpenPullRequestsCount(url, repository),
      ).rejects.toThrow(
        `GitHub repository '${repository.owner}/${repository.repo}' was not found or is inaccessible`,
      );
    });
  });

  describe('getDeployments', () => {
    it('should return deployments filtered by date window in ascending order', async () => {
      const url = `https://github.com/owner/repo`;
      const from = new Date('2026-05-01T00:00:00.000Z');
      const to = new Date('2026-05-31T23:59:59.000Z');
      mockedGraphqlClient.mockResolvedValue({
        repository: {
          deployments: {
            nodes: [
              {
                databaseId: 102,
                commitOid: 'sha-within-window-newer',
                createdAt: '2026-05-20T10:00:00.000Z',
                environment: 'production',
                latestStatus: { state: 'SUCCESS' },
              },
              {
                databaseId: 101,
                commitOid: 'sha-within-window',
                createdAt: '2026-05-15T10:00:00.000Z',
                environment: 'production',
                latestStatus: { state: 'SUCCESS' },
              },
              {
                databaseId: 100,
                commitOid: 'sha-outside-window',
                createdAt: '2026-04-01T10:00:00.000Z',
                environment: 'production',
                latestStatus: { state: 'FAILURE' },
              },
            ],
            pageInfo: {
              hasNextPage: false,
              endCursor: null,
            },
          },
        },
      });

      const deployments = await githubClient.getDeployments(
        url,
        repository,
        from,
        to,
      );

      expect(deployments).toEqual([
        {
          id: 101,
          sha: 'sha-within-window',
          createdAt: '2026-05-15T10:00:00.000Z',
          environment: 'production',
          status: 'SUCCESS',
        },
        {
          id: 102,
          sha: 'sha-within-window-newer',
          createdAt: '2026-05-20T10:00:00.000Z',
          environment: 'production',
          status: 'SUCCESS',
        },
      ]);
      expect(mockedGraphqlClient).toHaveBeenCalledTimes(1);
      expect(mockedGraphqlClient).toHaveBeenCalledWith(
        expect.stringContaining('query getDeployments'),
        expect.objectContaining({
          owner: repository.owner,
          repo: repository.repo,
          after: null,
        }),
      );
      expect(getCredentialsSpy).toHaveBeenCalledWith({ url });
    });

    it('should throw when repository is not found or inaccessible', async () => {
      const url = `https://github.com/owner/repo`;
      mockedGraphqlClient.mockResolvedValue({ repository: null });

      await expect(
        githubClient.getDeployments(
          url,
          repository,
          new Date('2026-05-01T00:00:00.000Z'),
          new Date('2026-05-31T23:59:59.000Z'),
        ),
      ).rejects.toThrow(
        `GitHub repository '${repository.owner}/${repository.repo}' was not found or is inaccessible`,
      );
    });
  });

  describe('getCommitsPullRequests', () => {
    it('should return pull requests linked to commit shas', async () => {
      const url = `https://github.com/owner/repo`;
      const shaOne = '6f9cb0a3627d4f0f194f2efce2685f6f6fd7f8a1';
      const shaTwo = '122afb699853d5decd7225dee37a6bad7176b013';
      mockedGraphqlClient.mockResolvedValue({
        repository: {
          commit0: {
            associatedPullRequests: {
              nodes: [
                {
                  number: 123,
                  commits: {
                    nodes: [
                      {
                        commit: {
                          committedDate: '2026-05-28T08:30:00.000Z',
                        },
                      },
                    ],
                  },
                },
              ],
            },
          },
          commit1: {
            associatedPullRequests: {
              nodes: [
                {
                  number: 456,
                  commits: {
                    nodes: [
                      {
                        commit: {
                          committedDate: '2026-05-29T08:30:00.000Z',
                        },
                      },
                    ],
                  },
                },
              ],
            },
          },
        },
      });

      const pullRequestsBySha = await githubClient.getCommitsPullRequests(
        url,
        repository,
        [shaOne, shaTwo],
      );

      expect(Object.fromEntries(pullRequestsBySha)).toEqual({
        [shaOne]: [
          {
            number: 123,
            firstCommitAt: '2026-05-28T08:30:00.000Z',
          },
        ],
        [shaTwo]: [
          {
            number: 456,
            firstCommitAt: '2026-05-29T08:30:00.000Z',
          },
        ],
      });
      expect(mockedGraphqlClient).toHaveBeenCalledTimes(1);
      expect(mockedGraphqlClient).toHaveBeenCalledWith(
        expect.stringContaining('query getCommitsPullRequests'),
        expect.objectContaining({
          owner: repository.owner,
          repo: repository.repo,
          sha0: shaOne,
          sha1: shaTwo,
        }),
      );
      expect(getCredentialsSpy).toHaveBeenCalledWith({ url });
    });

    it('should throw when repository is not found or inaccessible', async () => {
      const url = `https://github.com/owner/repo`;
      mockedGraphqlClient.mockResolvedValue({ repository: null });

      await expect(
        githubClient.getCommitsPullRequests(url, repository, [
          '6f9cb0a3627d4f0f194f2efce2685f6f6fd7f8a1',
        ]),
      ).rejects.toThrow(
        `GitHub repository '${repository.owner}/${repository.repo}' was not found or is inaccessible`,
      );
    });
  });

  describe('getCommitShasBetween', () => {
    it('should return deduplicated commit shas across paginated compare results', async () => {
      const url = `https://github.com/owner/repo`;
      mockedCompareCommitsWithBasehead
        .mockResolvedValueOnce({
          data: {
            total_commits: 101,
            commits: [{ sha: 'sha-two' }, { sha: 'sha-three' }],
          },
        })
        .mockResolvedValueOnce({
          data: {
            total_commits: 101,
            commits: [{ sha: 'sha-three' }, { sha: 'sha-four' }],
          },
        });

      const commitShas = await githubClient.getCommitShasBetween(
        url,
        repository,
        'sha-one',
        'sha-four',
      );

      expect(commitShas).toEqual(['sha-two', 'sha-three', 'sha-four']);
      expect(mockedCompareCommitsWithBasehead).toHaveBeenNthCalledWith(
        1,
        expect.objectContaining({
          owner: repository.owner,
          repo: repository.repo,
          basehead: 'sha-one...sha-four',
          per_page: 100,
          page: 1,
        }),
      );
      expect(mockedCompareCommitsWithBasehead).toHaveBeenNthCalledWith(
        2,
        expect.objectContaining({
          basehead: 'sha-one...sha-four',
          per_page: 100,
          page: 2,
        }),
      );
      expect(getCredentialsSpy).toHaveBeenCalledWith({ url });
    });
  });

  describe('getWorkflowRuns', () => {
    it('should return workflow runs filtered by workflow name and date window in ascending order', async () => {
      const url = `https://github.com/owner/repo`;
      const from = new Date('2026-05-01T00:00:00.000Z');
      const to = new Date('2026-05-31T23:59:59.000Z');

      mockedPaginate
        .mockResolvedValueOnce([
          { id: 11, name: 'Deploy', path: '.github/workflows/deploy.yml' },
          { id: 22, name: 'CI', path: '.github/workflows/ci.yml' },
        ])
        .mockResolvedValueOnce([
          {
            id: 1002,
            sha: 'sha-two',
            createdAt: '2026-05-11T10:00:00.000Z',
            status: null,
            conclusion: null,
          },
          {
            id: 1001,
            sha: 'sha-one',
            createdAt: '2026-05-10T10:00:00.000Z',
            status: 'completed',
            conclusion: 'success',
          },
        ]);

      const workflowRuns = await githubClient.getWorkflowRuns(
        url,
        repository,
        'Deploy',
        from,
        to,
      );

      expect(workflowRuns).toEqual([
        {
          id: 1001,
          sha: 'sha-one',
          createdAt: '2026-05-10T10:00:00.000Z',
          status: 'completed',
          conclusion: 'success',
        },
        {
          id: 1002,
          sha: 'sha-two',
          createdAt: '2026-05-11T10:00:00.000Z',
          status: null,
          conclusion: null,
        },
      ]);
      expect(mockedPaginate).toHaveBeenNthCalledWith(
        1,
        mockedListRepoWorkflows,
        expect.objectContaining({
          owner: repository.owner,
          repo: repository.repo,
          per_page: 100,
        }),
        expect.any(Function),
      );
    });

    it('should throw when workflow cannot be resolved by name', async () => {
      const url = `https://github.com/owner/repo`;
      mockedPaginate.mockResolvedValueOnce([
        { id: 22, name: 'CI', path: '.github/workflows/ci.yml' },
      ]);

      await expect(
        githubClient.getWorkflowRuns(
          url,
          repository,
          'Deploy',
          new Date('2026-05-01T00:00:00.000Z'),
          new Date('2026-05-31T23:59:59.000Z'),
        ),
      ).rejects.toThrow(
        `Workflow 'Deploy' was not found in '${repository.owner}/${repository.repo}'`,
      );
    });
  });
});
