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
import { DefaultGitlabCredentialsProvider } from '@backstage/integration';
import { Gitlab } from '@gitbeaker/rest';
import { GitlabClient } from './GitlabClient';

const mockGitlabApi = {
  Issues: { all: jest.fn() },
  MergeRequests: { all: jest.fn() },
  Pipelines: { all: jest.fn() },
  Jobs: { all: jest.fn() },
};

jest.mock('@gitbeaker/rest', () => ({
  Gitlab: jest.fn(() => mockGitlabApi),
}));

const MockGitlab = Gitlab as jest.MockedClass<typeof Gitlab>;

function mockExpandedCount(total: number, data: unknown[] = []) {
  return {
    data,
    paginationInfo: { total },
  };
}

describe('GitlabClient', () => {
  let gitlabClient: GitlabClient;

  const projectSlug = 'my-group/my-project';
  const url = 'https://gitlab.com/my-group/my-project';
  const mockedLogger = mockServices.logger.mock();

  const getCredentialsSpy = jest
    .spyOn(DefaultGitlabCredentialsProvider.prototype, 'getCredentials')
    .mockResolvedValue({
      headers: { Authorization: 'Bearer dummy-token' },
      token: 'dummy-token',
    });

  const mockConfig = mockServices.rootConfig({
    data: {
      integrations: {
        gitlab: [
          {
            host: 'gitlab.com',
            token: 'dummy-token',
            apiBaseUrl: 'https://gitlab.com/api/v4',
          },
        ],
      },
    },
  });

  beforeEach(() => {
    jest.clearAllMocks();

    getCredentialsSpy.mockResolvedValue({
      headers: { Authorization: 'Bearer dummy-token' },
      token: 'dummy-token',
    });

    MockGitlab.mockImplementation(() => mockGitlabApi as any);

    gitlabClient = new GitlabClient(mockConfig, mockedLogger);
  });

  describe('getOpenIssuesCount', () => {
    it('should return the count from paginationInfo.total', async () => {
      mockGitlabApi.Issues.all.mockResolvedValue(mockExpandedCount(42));

      const result = await gitlabClient.getOpenIssuesCount(url, projectSlug);

      expect(result).toBe(42);

      expect(getCredentialsSpy).toHaveBeenCalledWith({ url });

      expect(MockGitlab).toHaveBeenCalledWith({
        host: 'https://gitlab.com',
        oauthToken: 'dummy-token',
      });

      expect(mockGitlabApi.Issues.all).toHaveBeenCalledWith({
        projectId: projectSlug,
        state: 'opened',
        perPage: 1,
        maxPages: 1,
        page: 1,
        showExpanded: true,
      });
    });

    it('should throw when total is not finite', async () => {
      mockGitlabApi.Issues.all.mockResolvedValue({
        data: [{ id: 1 }],
        paginationInfo: { total: Number.NaN },
      });

      await expect(
        gitlabClient.getOpenIssuesCount(url, projectSlug),
      ).rejects.toThrow(
        `GitLab did not return a pagination total for issues in '${projectSlug}'. ` +
          'Counts cannot be derived from a single page when X-Total is absent.',
      );
    });

    it('should throw when total is undefined', async () => {
      mockGitlabApi.Issues.all.mockResolvedValue({
        data: [{ id: 1 }, { id: 2 }],
        paginationInfo: {},
      });

      await expect(
        gitlabClient.getOpenIssuesCount(url, projectSlug),
      ).rejects.toThrow(
        `GitLab did not return a pagination total for issues in '${projectSlug}'. ` +
          'Counts cannot be derived from a single page when X-Total is absent.',
      );
    });

    it('should throw error on API failure', async () => {
      mockGitlabApi.Issues.all.mockRejectedValue(new Error('Request failed'));

      await expect(
        gitlabClient.getOpenIssuesCount(url, projectSlug),
      ).rejects.toThrow('Request failed');
    });

    it('should throw when GitLab integration for URL is missing', async () => {
      const unknownUrl = 'https://unknown-host/my-group/my-project';
      await expect(
        gitlabClient.getOpenIssuesCount(unknownUrl, projectSlug),
      ).rejects.toThrow(`Missing GitLab integration for '${unknownUrl}'`);
    });

    it('should throw when no GitLab token is provided', async () => {
      getCredentialsSpy.mockResolvedValue({});

      await expect(
        gitlabClient.getOpenIssuesCount(url, projectSlug),
      ).rejects.toThrow(
        `No GitLab token provided for '${url}'. Configure integrations.gitlab token (Backend Service Integration).`,
      );
      expect(MockGitlab).not.toHaveBeenCalled();
    });
  });

  describe('getOpenedIssuesCount', () => {
    it('should filter by createdAfter', async () => {
      mockGitlabApi.Issues.all.mockResolvedValue(mockExpandedCount(5));
      const since = new Date('2024-01-01T00:00:00Z');

      const result = await gitlabClient.getOpenedIssuesCount(
        url,
        projectSlug,
        since,
      );

      expect(result).toBe(5);
      expect(mockGitlabApi.Issues.all).toHaveBeenCalledWith(
        expect.objectContaining({
          projectId: projectSlug,
          createdAfter: since.toISOString(),
          showExpanded: true,
        }),
      );
    });
  });

  describe('getClosedIssuesCount', () => {
    it('should count issues with closed_at in the window and exclude older closes', async () => {
      const since = new Date('2024-01-01T00:00:00Z');
      mockGitlabApi.Issues.all.mockResolvedValue([
        { closed_at: '2024-01-02T00:00:00Z' },
        { closed_at: '2023-12-01T00:00:00Z' },
        { closed_at: '2024-01-05T12:00:00Z' },
      ]);

      const result = await gitlabClient.getClosedIssuesCount(
        url,
        projectSlug,
        since,
      );

      expect(result).toBe(2);
      expect(mockGitlabApi.Issues.all).toHaveBeenCalledWith(
        expect.objectContaining({
          projectId: projectSlug,
          state: 'closed',
          updatedAfter: since.toISOString(),
          page: 1,
          perPage: 100,
          maxPages: 1,
        }),
      );
    });

    it('should page through candidates until a short page', async () => {
      const since = new Date('2024-01-01T00:00:00Z');
      const firstPage = Array.from({ length: 100 }, () => ({
        closed_at: '2024-01-02T00:00:00Z',
      }));
      const secondPage = [
        { closed_at: '2024-01-03T00:00:00Z' },
        { closed_at: '2023-01-01T00:00:00Z' },
      ];

      mockGitlabApi.Issues.all
        .mockResolvedValueOnce(firstPage)
        .mockResolvedValueOnce(secondPage);

      const result = await gitlabClient.getClosedIssuesCount(
        url,
        projectSlug,
        since,
      );

      expect(result).toBe(101);
      expect(mockGitlabApi.Issues.all).toHaveBeenCalledTimes(2);
      expect(mockGitlabApi.Issues.all).toHaveBeenNthCalledWith(
        2,
        expect.objectContaining({ page: 2 }),
      );
    });

    it('should stop at the candidate fetch cap and warn', async () => {
      const since = new Date('2024-01-01T00:00:00Z');
      const fullPage = Array.from({ length: 100 }, () => ({
        closed_at: '2024-01-02T00:00:00Z',
      }));
      mockGitlabApi.Issues.all.mockResolvedValue(fullPage);

      const result = await gitlabClient.getClosedIssuesCount(
        url,
        projectSlug,
        since,
      );

      expect(result).toBe(1000);
      expect(mockGitlabApi.Issues.all).toHaveBeenCalledTimes(10);
      expect(mockedLogger.warn).toHaveBeenCalledWith(
        `Reached fetch limit while counting closed issues in '${projectSlug}' ` +
          '(fetchItemsLimit=1000, maxPages=10). ' +
          'Counts cannot be completed without scanning more candidates.',
      );
    });
  });

  describe('getOpenMergeRequestsCount', () => {
    it('should return the count of open merge requests', async () => {
      mockGitlabApi.MergeRequests.all.mockResolvedValue(mockExpandedCount(10));

      const result = await gitlabClient.getOpenMergeRequestsCount(
        url,
        projectSlug,
      );

      expect(result).toBe(10);
      expect(mockGitlabApi.MergeRequests.all).toHaveBeenCalledWith(
        expect.objectContaining({
          projectId: projectSlug,
          state: 'opened',
          showExpanded: true,
        }),
      );
    });
  });

  describe('getOpenedMergeRequestsCount', () => {
    it('should filter by createdAfter', async () => {
      mockGitlabApi.MergeRequests.all.mockResolvedValue(mockExpandedCount(7));
      const since = new Date('2024-01-01T00:00:00Z');

      const result = await gitlabClient.getOpenedMergeRequestsCount(
        url,
        projectSlug,
        since,
      );

      expect(result).toBe(7);
      expect(mockGitlabApi.MergeRequests.all).toHaveBeenCalledWith(
        expect.objectContaining({
          projectId: projectSlug,
          createdAfter: since.toISOString(),
          showExpanded: true,
        }),
      );
    });
  });

  describe('getClosedMergeRequestsCount', () => {
    it('should sum closed and merged counts after closed_at/merged_at filters', async () => {
      const since = new Date('2024-01-01T00:00:00Z');
      mockGitlabApi.MergeRequests.all.mockImplementation(
        async (options: { state?: string }) => {
          if (options.state === 'closed') {
            return [
              { closed_at: '2024-01-02T00:00:00Z' },
              { closed_at: '2023-01-01T00:00:00Z' },
            ];
          }
          return [
            { merged_at: '2024-01-03T00:00:00Z' },
            { merged_at: '2024-01-04T00:00:00Z' },
            { merged_at: '2022-01-01T00:00:00Z' },
          ];
        },
      );

      const result = await gitlabClient.getClosedMergeRequestsCount(
        url,
        projectSlug,
        since,
      );

      expect(result).toBe(3);
      expect(mockGitlabApi.MergeRequests.all).toHaveBeenCalledTimes(2);
      expect(mockGitlabApi.MergeRequests.all).toHaveBeenCalledWith(
        expect.objectContaining({
          state: 'closed',
          updatedAfter: since.toISOString(),
          page: 1,
          perPage: 100,
          maxPages: 1,
        }),
      );
      expect(mockGitlabApi.MergeRequests.all).toHaveBeenCalledWith(
        expect.objectContaining({
          state: 'merged',
          updatedAfter: since.toISOString(),
          page: 1,
          perPage: 100,
          maxPages: 1,
        }),
      );
    });

    it('should stop at the candidate fetch cap for closed merge requests and warn', async () => {
      const since = new Date('2024-01-01T00:00:00Z');
      const fullPage = Array.from({ length: 100 }, () => ({
        closed_at: '2024-01-02T00:00:00Z',
      }));
      mockGitlabApi.MergeRequests.all.mockImplementation(
        async (options: { state?: string }) => {
          if (options.state === 'closed') {
            return fullPage;
          }
          return [{ merged_at: '2024-01-02T00:00:00Z' }];
        },
      );

      const result = await gitlabClient.getClosedMergeRequestsCount(
        url,
        projectSlug,
        since,
      );

      // closed pass hits the 1000-item cap; merged pass still adds 1
      expect(result).toBe(1001);
      expect(mockedLogger.warn).toHaveBeenCalledWith(
        `Reached fetch limit while counting closed merge requests in '${projectSlug}' ` +
          '(fetchItemsLimit=1000, maxPages=10). ' +
          'Counts cannot be completed without scanning more candidates.',
      );
    });
  });

  describe('getPipelinesCount', () => {
    it('should return pipeline count with status filter', async () => {
      mockGitlabApi.Pipelines.all.mockResolvedValue(mockExpandedCount(15));
      const since = new Date('2024-01-01T00:00:00Z');

      const result = await gitlabClient.getPipelinesCount(
        url,
        projectSlug,
        since,
        'success',
      );

      expect(result).toBe(15);
      expect(mockGitlabApi.Pipelines.all).toHaveBeenCalledWith(projectSlug, {
        createdAfter: since.toISOString(),
        status: 'success',
        perPage: 1,
        maxPages: 1,
        page: 1,
        showExpanded: true,
      });
    });

    it('should return pipeline count without status filter', async () => {
      mockGitlabApi.Pipelines.all.mockResolvedValue(mockExpandedCount(25));
      const since = new Date('2024-01-01T00:00:00Z');

      const result = await gitlabClient.getPipelinesCount(
        url,
        projectSlug,
        since,
      );

      expect(result).toBe(25);
      expect(mockGitlabApi.Pipelines.all).toHaveBeenCalledWith(projectSlug, {
        createdAfter: since.toISOString(),
        perPage: 1,
        maxPages: 1,
        page: 1,
        showExpanded: true,
      });
    });
  });

  describe('getJobsCount', () => {
    it('should return jobs count filtered by date', async () => {
      const now = Date.now();
      const since = new Date(now - 7 * 24 * 60 * 60 * 1000);

      mockGitlabApi.Jobs.all.mockResolvedValue([
        { created_at: new Date(now - 1000).toISOString() },
        { created_at: new Date(now - 2000).toISOString() },
        { created_at: new Date(now - 3000).toISOString() },
      ]);

      const result = await gitlabClient.getJobsCount(url, projectSlug, {
        since,
        scope: ['success'],
      });

      expect(result).toBe(3);
      expect(mockGitlabApi.Jobs.all).toHaveBeenCalledWith(projectSlug, {
        scope: ['success'],
        page: 1,
        perPage: 100,
        maxPages: 1,
      });
    });

    it('should omit scope when not provided', async () => {
      const now = Date.now();
      const since = new Date(now - 1000);

      mockGitlabApi.Jobs.all.mockResolvedValue([
        { created_at: new Date(now - 500).toISOString() },
      ]);

      await gitlabClient.getJobsCount(url, projectSlug, { since });

      expect(mockGitlabApi.Jobs.all).toHaveBeenCalledWith(projectSlug, {
        page: 1,
        perPage: 100,
        maxPages: 1,
      });
    });

    it('should omit scope when scope array is empty', async () => {
      const now = Date.now();
      const since = new Date(now - 1000);

      mockGitlabApi.Jobs.all.mockResolvedValue([
        { created_at: new Date(now - 500).toISOString() },
      ]);

      await gitlabClient.getJobsCount(url, projectSlug, { since, scope: [] });

      expect(mockGitlabApi.Jobs.all).toHaveBeenCalledWith(projectSlug, {
        page: 1,
        perPage: 100,
        maxPages: 1,
      });
    });

    it('should filter out jobs older than since date', async () => {
      const now = Date.now();
      const since = new Date(now - 1000);

      mockGitlabApi.Jobs.all.mockResolvedValue([
        { created_at: new Date(now - 500).toISOString() },
        { created_at: new Date(now - 5000).toISOString() },
      ]);

      const result = await gitlabClient.getJobsCount(url, projectSlug, {
        since,
      });

      expect(result).toBe(1);
    });

    it('should stop paging when the page is empty', async () => {
      const since = new Date('2024-01-01T00:00:00Z');
      mockGitlabApi.Jobs.all.mockResolvedValue([]);

      const result = await gitlabClient.getJobsCount(url, projectSlug, {
        since,
      });

      expect(result).toBe(0);
      expect(mockGitlabApi.Jobs.all).toHaveBeenCalledTimes(1);
    });

    it('should stop paging when the oldest job on the page is before since', async () => {
      const now = Date.now();
      const since = new Date(now - 2000);
      const page = Array.from({ length: 100 }, (_, index) => ({
        created_at: new Date(now - index * 10).toISOString(),
      }));
      page[99] = { created_at: new Date(now - 5000).toISOString() };

      mockGitlabApi.Jobs.all.mockResolvedValue(page);

      const result = await gitlabClient.getJobsCount(url, projectSlug, {
        since,
      });

      expect(result).toBe(99);
      expect(mockGitlabApi.Jobs.all).toHaveBeenCalledTimes(1);
    });

    it('should continue paging while all jobs on a full page are within since', async () => {
      const now = Date.now();
      const since = new Date(now - 10_000);
      const firstPage = Array.from({ length: 100 }, (_, index) => ({
        created_at: new Date(now - index).toISOString(),
      }));
      const secondPage = [
        { created_at: new Date(now - 150).toISOString() },
        { created_at: new Date(now - 200).toISOString() },
      ];

      mockGitlabApi.Jobs.all
        .mockResolvedValueOnce(firstPage)
        .mockResolvedValueOnce(secondPage);

      const result = await gitlabClient.getJobsCount(url, projectSlug, {
        since,
      });

      expect(result).toBe(102);
      expect(mockGitlabApi.Jobs.all).toHaveBeenCalledTimes(2);
      expect(mockGitlabApi.Jobs.all).toHaveBeenNthCalledWith(2, projectSlug, {
        page: 2,
        perPage: 100,
        maxPages: 1,
      });
    });

    it('should stop at fetchItemsLimit and warn', async () => {
      const now = Date.now();
      const since = new Date(now - 10_000);
      const firstPage = Array.from({ length: 100 }, (_, index) => ({
        created_at: new Date(now - index).toISOString(),
      }));

      mockGitlabApi.Jobs.all.mockResolvedValue(firstPage);

      const result = await gitlabClient.getJobsCount(url, projectSlug, {
        since,
        fetchItemsLimit: 50,
      });

      expect(result).toBe(50);
      expect(mockGitlabApi.Jobs.all).toHaveBeenCalledTimes(1);
      expect(mockedLogger.warn).toHaveBeenCalledWith(
        `Reached jobs fetch limit for '${projectSlug}' ` +
          `(fetchItemsLimit=50, maxPages=10); stopping fetch`,
      );
    });

    it('should stop paging after MAX_JOBS_PAGES and warn', async () => {
      const now = Date.now();
      const since = new Date(now - 1_000_000);
      const fullPage = Array.from({ length: 100 }, (_, index) => ({
        created_at: new Date(now - index).toISOString(),
      }));

      mockGitlabApi.Jobs.all.mockResolvedValue(fullPage);

      const result = await gitlabClient.getJobsCount(url, projectSlug, {
        since,
        // High enough that the page cap stops the fetch first
        fetchItemsLimit: 1001,
      });

      expect(result).toBe(10 * 100);
      expect(mockGitlabApi.Jobs.all).toHaveBeenCalledTimes(10);
      expect(mockedLogger.warn).toHaveBeenCalledWith(
        `Reached jobs fetch limit for '${projectSlug}' ` +
          `(fetchItemsLimit=1001, maxPages=10); stopping fetch`,
      );
    });
  });

  describe('getJobsWindowStats', () => {
    it('should classify jobs from a single unscoped fetch', async () => {
      const now = Date.now();
      const since = new Date(now - 7 * 24 * 60 * 60 * 1000);

      mockGitlabApi.Jobs.all.mockResolvedValue([
        { created_at: new Date(now - 1000).toISOString(), status: 'success' },
        { created_at: new Date(now - 2000).toISOString(), status: 'success' },
        { created_at: new Date(now - 3000).toISOString(), status: 'failed' },
        { created_at: new Date(now - 4000).toISOString(), status: 'running' },
        { created_at: new Date(now - 5000).toISOString(), status: 'canceled' },
      ]);

      const result = await gitlabClient.getJobsWindowStats(url, projectSlug, {
        since,
      });

      expect(result).toEqual({
        started: 5,
        successful: 2,
        failed: 1,
      });
      expect(mockGitlabApi.Jobs.all).toHaveBeenCalledTimes(1);
      expect(mockGitlabApi.Jobs.all).toHaveBeenCalledWith(projectSlug, {
        page: 1,
        perPage: 100,
        maxPages: 1,
      });
    });

    it('should exclude jobs older than since from stats', async () => {
      const now = Date.now();
      const since = new Date(now - 1000);

      mockGitlabApi.Jobs.all.mockResolvedValue([
        {
          created_at: new Date(now - 500).toISOString(),
          status: 'success',
        },
        {
          created_at: new Date(now - 5000).toISOString(),
          status: 'failed',
        },
      ]);

      const result = await gitlabClient.getJobsWindowStats(url, projectSlug, {
        since,
      });

      expect(result).toEqual({
        started: 1,
        successful: 1,
        failed: 0,
      });
    });
  });

  describe('multi-host GitLab', () => {
    it('should use self-hosted baseUrl from matching integration', async () => {
      const selfHostedUrl = 'https://gitlab.example.com/my-group/my-project';
      const client = new GitlabClient(
        mockServices.rootConfig({
          data: {
            integrations: {
              gitlab: [
                {
                  host: 'gitlab.example.com',
                  token: 'self-hosted-token',
                  apiBaseUrl: 'https://gitlab.example.com/api/v4',
                },
              ],
            },
          },
        }),
        mockedLogger,
      );

      getCredentialsSpy.mockResolvedValue({
        headers: { Authorization: 'Bearer self-hosted-token' },
        token: 'self-hosted-token',
      });
      mockGitlabApi.Issues.all.mockResolvedValue(mockExpandedCount(7));

      const result = await client.getOpenIssuesCount(
        selfHostedUrl,
        projectSlug,
      );

      expect(result).toBe(7);
      expect(getCredentialsSpy).toHaveBeenCalledWith({ url: selfHostedUrl });
      expect(MockGitlab).toHaveBeenCalledWith({
        host: 'https://gitlab.example.com',
        oauthToken: 'self-hosted-token',
      });
    });
  });
});
