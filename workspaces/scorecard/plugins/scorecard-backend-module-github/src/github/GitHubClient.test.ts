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

import { mockServices } from '@backstage/backend-test-utils';
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
  const mockedLogger = mockServices.logger.mock();
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
    githubClient = new GithubClient(mockConfig, mockedLogger);
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

    it('should stop paging once fetchItemsLimit of in-window deployments is reached', async () => {
      const url = `https://github.com/owner/repo`;
      const from = new Date('2026-05-01T00:00:00.000Z');
      const to = new Date('2026-05-31T23:59:59.000Z');

      mockedGraphqlClient.mockResolvedValueOnce({
        repository: {
          deployments: {
            nodes: [
              {
                databaseId: 103,
                commitOid: 'sha-three',
                createdAt: '2026-05-20T10:00:00.000Z',
                environment: 'production',
                latestStatus: { state: 'SUCCESS' },
              },
              {
                databaseId: 102,
                commitOid: 'sha-two',
                createdAt: '2026-05-15T10:00:00.000Z',
                environment: 'production',
                latestStatus: { state: 'SUCCESS' },
              },
            ],
            pageInfo: {
              hasNextPage: true,
              endCursor: 'cursor-1',
            },
          },
        },
      });

      const deployments = await githubClient.getDeployments(
        url,
        repository,
        from,
        to,
        { fetchItemsLimit: 2 },
      );

      expect(deployments).toEqual([
        {
          id: 102,
          sha: 'sha-two',
          createdAt: '2026-05-15T10:00:00.000Z',
          environment: 'production',
          status: 'SUCCESS',
        },
        {
          id: 103,
          sha: 'sha-three',
          createdAt: '2026-05-20T10:00:00.000Z',
          environment: 'production',
          status: 'SUCCESS',
        },
      ]);
      expect(mockedGraphqlClient).toHaveBeenCalledTimes(1);
      expect(mockedLogger.warn).toHaveBeenCalledWith(
        'Reached fetchItemsLimit of 2 for deployments in owner/repo; stopping fetch',
      );
    });

    it('should take only remaining items when page exceeds fetchItemsLimit', async () => {
      const url = `https://github.com/owner/repo`;
      const from = new Date('2026-05-01T00:00:00.000Z');
      const to = new Date('2026-05-31T23:59:59.000Z');

      mockedGraphqlClient
        .mockResolvedValueOnce({
          repository: {
            deployments: {
              nodes: [
                {
                  databaseId: 104,
                  commitOid: 'sha-four',
                  createdAt: '2026-05-25T10:00:00.000Z',
                  environment: 'production',
                  latestStatus: { state: 'SUCCESS' },
                },
                {
                  databaseId: 103,
                  commitOid: 'sha-three',
                  createdAt: '2026-05-20T10:00:00.000Z',
                  environment: 'production',
                  latestStatus: { state: 'SUCCESS' },
                },
              ],
              pageInfo: {
                hasNextPage: true,
                endCursor: 'cursor-1',
              },
            },
          },
        })
        .mockResolvedValueOnce({
          repository: {
            deployments: {
              nodes: [
                {
                  databaseId: 102,
                  commitOid: 'sha-two',
                  createdAt: '2026-05-15T10:00:00.000Z',
                  environment: 'production',
                  latestStatus: { state: 'SUCCESS' },
                },
                {
                  databaseId: 101,
                  commitOid: 'sha-one',
                  createdAt: '2026-05-10T10:00:00.000Z',
                  environment: 'production',
                  latestStatus: { state: 'SUCCESS' },
                },
              ],
              pageInfo: {
                hasNextPage: true,
                endCursor: 'cursor-2',
              },
            },
          },
        });

      const deployments = await githubClient.getDeployments(
        url,
        repository,
        from,
        to,
        { fetchItemsLimit: 3 },
      );

      expect(deployments).toEqual([
        {
          id: 102,
          sha: 'sha-two',
          createdAt: '2026-05-15T10:00:00.000Z',
          environment: 'production',
          status: 'SUCCESS',
        },
        {
          id: 103,
          sha: 'sha-three',
          createdAt: '2026-05-20T10:00:00.000Z',
          environment: 'production',
          status: 'SUCCESS',
        },
        {
          id: 104,
          sha: 'sha-four',
          createdAt: '2026-05-25T10:00:00.000Z',
          environment: 'production',
          status: 'SUCCESS',
        },
      ]);
      expect(mockedGraphqlClient).toHaveBeenCalledTimes(2);
      expect(mockedLogger.warn).toHaveBeenCalledWith(
        'Reached fetchItemsLimit of 3 for deployments in owner/repo; stopping fetch',
      );
    });

    it('should warn when fetchItemsLimit truncates the last page', async () => {
      const url = `https://github.com/owner/repo`;
      const from = new Date('2026-05-01T00:00:00.000Z');
      const to = new Date('2026-05-31T23:59:59.000Z');

      mockedGraphqlClient.mockResolvedValueOnce({
        repository: {
          deployments: {
            nodes: [
              {
                databaseId: 103,
                commitOid: 'sha-three',
                createdAt: '2026-05-20T10:00:00.000Z',
                environment: 'production',
                latestStatus: { state: 'SUCCESS' },
              },
              {
                databaseId: 102,
                commitOid: 'sha-two',
                createdAt: '2026-05-15T10:00:00.000Z',
                environment: 'production',
                latestStatus: { state: 'SUCCESS' },
              },
              {
                databaseId: 101,
                commitOid: 'sha-one',
                createdAt: '2026-05-10T10:00:00.000Z',
                environment: 'production',
                latestStatus: { state: 'SUCCESS' },
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
        { fetchItemsLimit: 2 },
      );

      expect(deployments).toEqual([
        {
          id: 102,
          sha: 'sha-two',
          createdAt: '2026-05-15T10:00:00.000Z',
          environment: 'production',
          status: 'SUCCESS',
        },
        {
          id: 103,
          sha: 'sha-three',
          createdAt: '2026-05-20T10:00:00.000Z',
          environment: 'production',
          status: 'SUCCESS',
        },
      ]);
      expect(mockedLogger.warn).toHaveBeenCalledWith(
        'Reached fetchItemsLimit of 2 for deployments in owner/repo; stopping fetch',
      );
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

    it('should stop paging once fetchItemsLimit of commits is reached', async () => {
      const url = `https://github.com/owner/repo`;
      mockedCompareCommitsWithBasehead
        .mockResolvedValueOnce({
          data: {
            total_commits: 250,
            commits: [{ sha: 'sha-1' }, { sha: 'sha-2' }],
          },
        })
        .mockResolvedValueOnce({
          data: {
            total_commits: 250,
            commits: [{ sha: 'sha-3' }, { sha: 'sha-4' }],
          },
        });

      const commitShas = await githubClient.getCommitShasBetween(
        url,
        repository,
        'sha-base',
        'sha-head',
        { fetchItemsLimit: 3 },
      );

      expect(commitShas).toEqual(['sha-1', 'sha-2', 'sha-3']);
      expect(mockedCompareCommitsWithBasehead).toHaveBeenCalledTimes(2);
      expect(mockedLogger.warn).toHaveBeenCalledWith(
        'Reached fetchItemsLimit of 3 for commits between sha-base...sha-head in owner/repo; stopping fetch (250 commits reported)',
      );
    });

    it('should take only remaining items when the first page exceeds fetchItemsLimit', async () => {
      const url = `https://github.com/owner/repo`;
      mockedCompareCommitsWithBasehead.mockResolvedValueOnce({
        data: {
          total_commits: 5,
          commits: [
            { sha: 'sha-1' },
            { sha: 'sha-2' },
            { sha: 'sha-3' },
            { sha: 'sha-4' },
          ],
        },
      });

      const commitShas = await githubClient.getCommitShasBetween(
        url,
        repository,
        'sha-base',
        'sha-head',
        { fetchItemsLimit: 2 },
      );

      expect(commitShas).toEqual(['sha-1', 'sha-2']);
      expect(mockedCompareCommitsWithBasehead).toHaveBeenCalledTimes(1);
      expect(mockedLogger.warn).toHaveBeenCalledWith(
        'Reached fetchItemsLimit of 2 for commits between sha-base...sha-head in owner/repo; stopping fetch (5 commits reported)',
      );
    });

    it('should take only remaining items when a later page exceeds fetchItemsLimit', async () => {
      const url = `https://github.com/owner/repo`;
      mockedCompareCommitsWithBasehead
        .mockResolvedValueOnce({
          data: {
            total_commits: 250,
            commits: [{ sha: 'sha-1' }, { sha: 'sha-2' }, { sha: 'sha-3' }],
          },
        })
        .mockResolvedValueOnce({
          data: {
            total_commits: 250,
            commits: [{ sha: 'sha-4' }, { sha: 'sha-5' }, { sha: 'sha-6' }],
          },
        });

      const commitShas = await githubClient.getCommitShasBetween(
        url,
        repository,
        'sha-base',
        'sha-head',
        { fetchItemsLimit: 4 },
      );

      expect(commitShas).toEqual(['sha-1', 'sha-2', 'sha-3', 'sha-4']);
      expect(mockedCompareCommitsWithBasehead).toHaveBeenCalledTimes(2);
      expect(mockedCompareCommitsWithBasehead).toHaveBeenNthCalledWith(
        2,
        expect.objectContaining({ page: 2 }),
      );
      expect(mockedLogger.warn).toHaveBeenCalledWith(
        'Reached fetchItemsLimit of 4 for commits between sha-base...sha-head in owner/repo; stopping fetch (250 commits reported)',
      );
    });
  });

  describe('getWorkflowRuns', () => {
    it('should return workflow runs filtered by workflow name and date window in ascending order', async () => {
      const url = `https://github.com/owner/repo`;
      const from = new Date('2026-05-01T00:00:00.000Z');
      const to = new Date('2026-05-31T23:59:59.000Z');

      mockedPaginate.mockImplementation(async (endpoint, _params, mapFn) => {
        if (endpoint === mockedListRepoWorkflows) {
          const data = [
            { id: 11, name: 'Deploy', path: '.github/workflows/deploy.yml' },
            { id: 22, name: 'CI', path: '.github/workflows/ci.yml' },
          ];
          return mapFn ? mapFn({ data }) : data;
        }

        const data = [
          {
            id: 1002,
            head_sha: 'sha-two',
            created_at: '2026-05-11T10:00:00.000Z',
            status: null,
            conclusion: null,
          },
          {
            id: 1001,
            head_sha: 'sha-one',
            created_at: '2026-05-10T10:00:00.000Z',
            status: 'completed',
            conclusion: 'success',
          },
        ];
        return mapFn ? mapFn({ data }, () => undefined) : data;
      });

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

    it('should stop paging once fetchItemsLimit of workflow runs is reached', async () => {
      const url = `https://github.com/owner/repo`;
      const from = new Date('2026-05-01T00:00:00.000Z');
      const to = new Date('2026-05-31T23:59:59.000Z');

      mockedPaginate.mockImplementation(async (endpoint, _params, mapFn) => {
        if (endpoint === mockedListRepoWorkflows) {
          const data = [
            { id: 11, name: 'Deploy', path: '.github/workflows/deploy.yml' },
          ];
          return mapFn ? mapFn({ data }) : data;
        }

        const pages = [
          [
            {
              id: 1003,
              head_sha: 'sha-three',
              created_at: '2026-05-12T10:00:00.000Z',
              status: 'completed',
              conclusion: 'success',
            },
            {
              id: 1002,
              head_sha: 'sha-two',
              created_at: '2026-05-11T10:00:00.000Z',
              status: 'completed',
              conclusion: 'success',
            },
          ],
          [
            {
              id: 1001,
              head_sha: 'sha-one',
              created_at: '2026-05-10T10:00:00.000Z',
              status: 'completed',
              conclusion: 'success',
            },
          ],
        ];

        const results: unknown[] = [];
        for (const data of pages) {
          let stopped = false;
          const mapped = mapFn
            ? mapFn({ data }, () => {
                stopped = true;
              })
            : data;
          results.push(...(Array.isArray(mapped) ? mapped : []));
          if (stopped) {
            break;
          }
        }
        return results;
      });

      const workflowRuns = await githubClient.getWorkflowRuns(
        url,
        repository,
        'Deploy',
        from,
        to,
        { fetchItemsLimit: 2 },
      );

      expect(workflowRuns).toEqual([
        {
          id: 1002,
          sha: 'sha-two',
          createdAt: '2026-05-11T10:00:00.000Z',
          status: 'completed',
          conclusion: 'success',
        },
        {
          id: 1003,
          sha: 'sha-three',
          createdAt: '2026-05-12T10:00:00.000Z',
          status: 'completed',
          conclusion: 'success',
        },
      ]);
      expect(mockedPaginate).toHaveBeenCalledTimes(2);
    });

    it('should slice the last page and call done when it exceeds remaining fetchItemsLimit', async () => {
      const url = `https://github.com/owner/repo`;
      const from = new Date('2026-05-01T00:00:00.000Z');
      const to = new Date('2026-05-31T23:59:59.000Z');
      const doneCalls: boolean[] = [];

      mockedPaginate.mockImplementation(async (endpoint, _params, mapFn) => {
        if (endpoint === mockedListRepoWorkflows) {
          const data = [
            { id: 11, name: 'Deploy', path: '.github/workflows/deploy.yml' },
          ];
          return mapFn ? mapFn({ data }) : data;
        }

        const pages = [
          [
            {
              id: 1003,
              head_sha: 'sha-three',
              created_at: '2026-05-12T10:00:00.000Z',
              status: 'completed',
              conclusion: 'success',
            },
            {
              id: 1002,
              head_sha: 'sha-two',
              created_at: '2026-05-11T10:00:00.000Z',
              status: 'completed',
              conclusion: 'success',
            },
          ],
          [
            {
              id: 1001,
              head_sha: 'sha-one',
              created_at: '2026-05-10T10:00:00.000Z',
              status: 'completed',
              conclusion: 'success',
            },
            {
              id: 1000,
              head_sha: 'sha-zero',
              created_at: '2026-05-09T10:00:00.000Z',
              status: 'completed',
              conclusion: 'success',
            },
          ],
        ];

        const results: unknown[] = [];
        for (const data of pages) {
          let stopped = false;
          const mapped = mapFn
            ? mapFn({ data }, () => {
                stopped = true;
                doneCalls.push(true);
              })
            : data;
          results.push(...(Array.isArray(mapped) ? mapped : []));
          if (stopped) {
            break;
          }
        }
        return results;
      });

      const workflowRuns = await githubClient.getWorkflowRuns(
        url,
        repository,
        'Deploy',
        from,
        to,
        { fetchItemsLimit: 3 },
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
          status: 'completed',
          conclusion: 'success',
        },
        {
          id: 1003,
          sha: 'sha-three',
          createdAt: '2026-05-12T10:00:00.000Z',
          status: 'completed',
          conclusion: 'success',
        },
      ]);
      expect(doneCalls).toEqual([true]);
      expect(mockedPaginate).toHaveBeenCalledTimes(2);
    });

    it('should throw when workflow cannot be resolved by name', async () => {
      const url = `https://github.com/owner/repo`;
      mockedPaginate.mockImplementation(async (endpoint, _params, mapFn) => {
        if (endpoint === mockedListRepoWorkflows) {
          const data = [
            { id: 22, name: 'CI', path: '.github/workflows/ci.yml' },
          ];
          return mapFn ? mapFn({ data }) : data;
        }
        return [];
      });

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
