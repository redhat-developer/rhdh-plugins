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
        `GitLab did not return a pagination total for issues in '${projectSlug}'`,
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
        `GitLab did not return a pagination total for issues in '${projectSlug}'`,
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

    it('should warn when no GitLab token is provided', async () => {
      getCredentialsSpy.mockResolvedValue({});
      mockGitlabApi.Issues.all.mockResolvedValue(mockExpandedCount(0));

      await gitlabClient.getOpenIssuesCount(url, projectSlug);

      expect(mockedLogger.warn).toHaveBeenCalledWith(
        `No GitLab token provided for '${url}'. Configure integrations.gitlab token (Backend Service Integration).`,
      );
      expect(MockGitlab).toHaveBeenCalledWith({
        host: 'https://gitlab.com',
      });
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
    it('should filter by state closed and updatedAfter', async () => {
      mockGitlabApi.Issues.all.mockResolvedValue(mockExpandedCount(3));
      const since = new Date('2024-01-01T00:00:00Z');

      const result = await gitlabClient.getClosedIssuesCount(
        url,
        projectSlug,
        since,
      );

      expect(result).toBe(3);
      expect(mockGitlabApi.Issues.all).toHaveBeenCalledWith(
        expect.objectContaining({
          projectId: projectSlug,
          state: 'closed',
          updatedAfter: since.toISOString(),
          showExpanded: true,
        }),
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
    it('should sum closed and merged counts', async () => {
      mockGitlabApi.MergeRequests.all
        .mockResolvedValueOnce(mockExpandedCount(4))
        .mockResolvedValueOnce(mockExpandedCount(6));

      const since = new Date('2024-01-01T00:00:00Z');
      const result = await gitlabClient.getClosedMergeRequestsCount(
        url,
        projectSlug,
        since,
      );

      expect(result).toBe(10);
      expect(mockGitlabApi.MergeRequests.all).toHaveBeenCalledTimes(2);
      expect(mockGitlabApi.MergeRequests.all).toHaveBeenNthCalledWith(
        1,
        expect.objectContaining({ state: 'closed' }),
      );
      expect(mockGitlabApi.MergeRequests.all).toHaveBeenNthCalledWith(
        2,
        expect.objectContaining({ state: 'merged' }),
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
        updatedAfter: since.toISOString(),
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
        updatedAfter: since.toISOString(),
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
