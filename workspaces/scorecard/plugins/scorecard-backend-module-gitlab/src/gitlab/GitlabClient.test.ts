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
import { GitlabClient } from './GitlabClient';
import type { GitlabGraphql } from './graphQL/GitlabGraphQL';
import type { GitlabREST } from './rest/GitlabREST';

describe('GitlabClient', () => {
  let gitlabClient: GitlabClient;
  let mockedGraphql: {
    projectIssueCount: jest.Mock;
    projectMergeRequestCount: jest.Mock;
    projectPipelinesCount: jest.Mock;
  };
  let mockedRest: {
    mergeRequests: jest.Mock;
    jobs: jest.Mock;
  };

  const projectSlug = 'my-group/my-project';
  const url = 'https://gitlab.com/my-group/my-project';
  const mockedLogger = mockServices.logger.mock();

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

    mockedGraphql = {
      projectIssueCount: jest.fn(),
      projectMergeRequestCount: jest.fn(),
      projectPipelinesCount: jest.fn(),
    };
    mockedRest = {
      mergeRequests: jest.fn(),
      jobs: jest.fn(),
    };

    gitlabClient = new GitlabClient(mockConfig, mockedLogger, {
      graphql: mockedGraphql as unknown as GitlabGraphql,
      rest: mockedRest as unknown as GitlabREST,
    });
  });

  describe('getOpenIssuesCount', () => {
    it('should return the GraphQL issue count', async () => {
      mockedGraphql.projectIssueCount.mockResolvedValue(42);

      const result = await gitlabClient.getOpenIssuesCount(url, projectSlug);

      expect(result).toBe(42);
      expect(mockedGraphql.projectIssueCount).toHaveBeenCalledWith(url, {
        projectPath: projectSlug,
        state: 'opened',
      });
    });

    it('should throw error on GraphQL failure', async () => {
      mockedGraphql.projectIssueCount.mockRejectedValue(
        new Error('Request failed'),
      );

      await expect(
        gitlabClient.getOpenIssuesCount(url, projectSlug),
      ).rejects.toThrow('Request failed');
    });
  });

  describe('getOpenedIssuesCount', () => {
    it('should filter by createdAfter', async () => {
      mockedGraphql.projectIssueCount.mockResolvedValue(5);
      const since = new Date('2024-01-01T00:00:00Z');

      const result = await gitlabClient.getOpenedIssuesCount(url, projectSlug, {
        since,
      });

      expect(result).toBe(5);
      expect(mockedGraphql.projectIssueCount).toHaveBeenCalledWith(url, {
        projectPath: projectSlug,
        createdAfter: since.toISOString(),
      });
    });
  });

  describe('getClosedIssuesCount', () => {
    it('should filter by closedAfter', async () => {
      mockedGraphql.projectIssueCount.mockResolvedValue(2);
      const since = new Date('2024-01-01T00:00:00Z');

      const result = await gitlabClient.getClosedIssuesCount(url, projectSlug, {
        since,
      });

      expect(result).toBe(2);
      expect(mockedGraphql.projectIssueCount).toHaveBeenCalledWith(url, {
        projectPath: projectSlug,
        closedAfter: since.toISOString(),
      });
    });
  });

  describe('getOpenMergeRequestsCount', () => {
    it('should return the GraphQL merge request count', async () => {
      mockedGraphql.projectMergeRequestCount.mockResolvedValue(10);

      const result = await gitlabClient.getOpenMergeRequestsCount(
        url,
        projectSlug,
      );

      expect(result).toBe(10);
      expect(mockedGraphql.projectMergeRequestCount).toHaveBeenCalledWith(url, {
        projectPath: projectSlug,
        state: 'opened',
      });
      expect(mockedRest.mergeRequests).not.toHaveBeenCalled();
    });

    it('should throw on GraphQL failure', async () => {
      mockedGraphql.projectMergeRequestCount.mockRejectedValue(
        new Error('timeout'),
      );

      await expect(
        gitlabClient.getOpenMergeRequestsCount(url, projectSlug),
      ).rejects.toThrow('timeout');
      expect(mockedRest.mergeRequests).not.toHaveBeenCalled();
    });
  });

  describe('getOpenedMergeRequestsCount', () => {
    it('should filter by createdAfter via GraphQL', async () => {
      mockedGraphql.projectMergeRequestCount.mockResolvedValue(7);
      const since = new Date('2024-01-01T00:00:00Z');

      const result = await gitlabClient.getOpenedMergeRequestsCount(
        url,
        projectSlug,
        { since },
      );

      expect(result).toBe(7);
      expect(mockedGraphql.projectMergeRequestCount).toHaveBeenCalledWith(url, {
        projectPath: projectSlug,
        createdAfter: since.toISOString(),
      });
    });

    it('should throw on GraphQL failure', async () => {
      mockedGraphql.projectMergeRequestCount.mockRejectedValue(
        new Error('timeout'),
      );
      const since = new Date('2024-01-01T00:00:00Z');

      await expect(
        gitlabClient.getOpenedMergeRequestsCount(url, projectSlug, { since }),
      ).rejects.toThrow('timeout');
      expect(mockedRest.mergeRequests).not.toHaveBeenCalled();
    });
  });

  describe('getClosedMergeRequestsCount', () => {
    it('should sum GraphQL closedAfter and mergedAfter counts', async () => {
      const since = new Date('2024-01-01T00:00:00Z');
      const now = new Date('2024-01-08T12:00:00Z');
      jest.useFakeTimers({ now });

      mockedGraphql.projectMergeRequestCount
        .mockResolvedValueOnce(1)
        .mockResolvedValueOnce(2);

      try {
        const result = await gitlabClient.getClosedMergeRequestsCount(
          url,
          projectSlug,
          { since },
        );

        expect(result).toBe(3);
        expect(mockedGraphql.projectMergeRequestCount).toHaveBeenCalledTimes(2);
        expect(mockedGraphql.projectMergeRequestCount).toHaveBeenCalledWith(
          url,
          {
            projectPath: projectSlug,
            closedAfter: since.toISOString(),
            closedBefore: now.toISOString(),
          },
        );
        expect(mockedGraphql.projectMergeRequestCount).toHaveBeenCalledWith(
          url,
          {
            projectPath: projectSlug,
            mergedAfter: since.toISOString(),
          },
        );
        expect(mockedRest.mergeRequests).not.toHaveBeenCalled();
      } finally {
        jest.useRealTimers();
      }
    });

    it('should fall back to REST when closedAfter is unsupported', async () => {
      const since = new Date('2024-01-01T00:00:00Z');
      mockedGraphql.projectMergeRequestCount.mockRejectedValue(
        new Error(
          'GitLab GraphQL errors: Unknown argument "closedAfter" on field "mergeRequests"',
        ),
      );
      mockedRest.mergeRequests.mockImplementation(
        async (_url: string, _slug: string, options: { state?: string }) => {
          if (options.state === 'closed') {
            return {
              data: [
                { closed_at: '2024-01-02T00:00:00Z' },
                { closed_at: '2023-01-01T00:00:00Z' },
              ],
            };
          }
          return {
            data: [
              { merged_at: '2024-01-03T00:00:00Z' },
              { merged_at: '2024-01-04T00:00:00Z' },
              { merged_at: '2022-01-01T00:00:00Z' },
            ],
          };
        },
      );

      const result = await gitlabClient.getClosedMergeRequestsCount(
        url,
        projectSlug,
        { since },
      );

      expect(result).toBe(3);
      expect(mockedLogger.warn).toHaveBeenCalledWith(
        expect.stringContaining(
          `GitLab GraphQL closed merge request filters are unsupported for '${projectSlug}'`,
        ),
      );
      expect(mockedRest.mergeRequests).toHaveBeenCalledTimes(2);
    });

    it('should throw on unrelated GraphQL failures', async () => {
      const since = new Date('2024-01-01T00:00:00Z');
      mockedGraphql.projectMergeRequestCount.mockRejectedValue(
        new Error('GitLab GraphQL request failed with status 401 Unauthorized'),
      );

      await expect(
        gitlabClient.getClosedMergeRequestsCount(url, projectSlug, { since }),
      ).rejects.toThrow('401 Unauthorized');
      expect(mockedRest.mergeRequests).not.toHaveBeenCalled();
      expect(mockedLogger.warn).not.toHaveBeenCalled();
    });
  });

  describe('getPipelinesCount', () => {
    it('should delegate to GraphQL pipelines count', async () => {
      const since = new Date('2024-01-01T00:00:00Z');
      mockedGraphql.projectPipelinesCount.mockResolvedValue(4);

      const result = await gitlabClient.getPipelinesCount(url, projectSlug, {
        since,
        status: 'SUCCESS',
      });

      expect(result).toBe(4);
      expect(mockedGraphql.projectPipelinesCount).toHaveBeenCalledWith(url, {
        projectPath: projectSlug,
        updatedAfter: since.toISOString(),
        status: 'SUCCESS',
      });
    });
  });

  describe('getJobsWindowStats', () => {
    it('should classify jobs by started_at and finished_at', async () => {
      const now = Date.now();
      const since = new Date(now - 7 * 24 * 60 * 60 * 1000);

      mockedRest.jobs.mockResolvedValue({
        data: [
          {
            created_at: new Date(now - 1000).toISOString(),
            started_at: new Date(now - 1000).toISOString(),
            finished_at: new Date(now - 500).toISOString(),
            status: 'success',
          },
          {
            created_at: new Date(now - 2000).toISOString(),
            started_at: new Date(now - 2000).toISOString(),
            finished_at: new Date(now - 1500).toISOString(),
            status: 'success',
          },
          {
            created_at: new Date(now - 3000).toISOString(),
            started_at: new Date(now - 3000).toISOString(),
            finished_at: new Date(now - 2500).toISOString(),
            status: 'failed',
          },
          {
            created_at: new Date(now - 4000).toISOString(),
            started_at: new Date(now - 4000).toISOString(),
            finished_at: null,
            status: 'running',
          },
          {
            created_at: new Date(now - 5000).toISOString(),
            started_at: null,
            finished_at: null,
            status: 'pending',
          },
          {
            created_at: new Date(now - 6000).toISOString(),
            started_at: new Date(now - 6000).toISOString(),
            finished_at: new Date(now - 5500).toISOString(),
            status: 'canceled',
          },
        ],
      });

      const result = await gitlabClient.getJobsWindowStats(url, projectSlug, {
        since,
      });

      expect(result).toEqual({
        started: 5,
        successful: 2,
        failed: 1,
      });
      expect(mockedRest.jobs).toHaveBeenCalledTimes(1);
      expect(mockedRest.jobs).toHaveBeenCalledWith(url, projectSlug, {
        page: 1,
        perPage: 100,
        maxPages: 1,
      });
    });

    it('should stop at fetchItemsLimit and warn', async () => {
      const now = Date.now();
      const since = new Date(now - 10_000);
      const firstPage = Array.from({ length: 100 }, (_, index) => ({
        created_at: new Date(now - index).toISOString(),
        started_at: new Date(now - index).toISOString(),
        finished_at: new Date(now - index).toISOString(),
        status: 'success',
      }));

      mockedRest.jobs.mockResolvedValue({ data: firstPage });

      const result = await gitlabClient.getJobsWindowStats(url, projectSlug, {
        since,
        fetchItemsLimit: 50,
      });

      expect(result.started).toBe(50);
      expect(mockedRest.jobs).toHaveBeenCalledTimes(1);
      expect(mockedLogger.warn).toHaveBeenCalledWith(
        `Reached fetch limit while counting jobs in '${projectSlug}' ` +
          `(fetchItemsLimit=50, maxPages=10). ` +
          'Counts cannot be completed without scanning more candidates.',
      );
    });
  });
});
