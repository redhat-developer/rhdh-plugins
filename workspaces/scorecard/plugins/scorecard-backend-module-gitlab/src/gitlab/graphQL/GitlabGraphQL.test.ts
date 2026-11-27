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
import { GitlabGraphql } from './GitlabGraphQL';
import { PROJECT_ISSUE_COUNT_QUERY } from './queries/projectIssueCountQuery';
import { PROJECT_PIPELINES_QUERY } from './queries/projectPipelinesQuery';

describe('GitlabGraphql', () => {
  const url = 'https://gitlab.com/my-group/my-project';
  const projectSlug = 'my-group/my-project';
  const mockedLogger = mockServices.logger.mock();
  const fetchSpy = jest.spyOn(globalThis, 'fetch');

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
  });

  afterAll(() => {
    fetchSpy.mockRestore();
  });

  describe('request', () => {
    it('should POST to /api/graphql and return data', async () => {
      fetchSpy.mockResolvedValue({
        ok: true,
        json: async () => ({ data: { project: { id: '1' } } }),
      } as Response);

      const client = new GitlabGraphql(mockConfig, mockedLogger);
      const result = await client.request<{ project: { id: string } }>({
        url,
        query: 'query { project { id } }',
        variables: { projectPath: projectSlug },
      });

      expect(result).toEqual({ project: { id: '1' } });
      expect(fetchSpy).toHaveBeenCalledWith(
        'https://gitlab.com/api/graphql',
        expect.objectContaining({
          method: 'POST',
          headers: {
            Authorization: 'Bearer dummy-token',
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            query: 'query { project { id } }',
            variables: { projectPath: projectSlug },
          }),
        }),
      );
    });

    it('should throw when GraphQL returns errors', async () => {
      fetchSpy.mockResolvedValue({
        ok: true,
        json: async () => ({
          errors: [{ message: 'Field closedAfter is not defined' }],
        }),
      } as Response);

      const client = new GitlabGraphql(mockConfig, mockedLogger);
      await expect(
        client.request({ url, query: 'query { project { id } }' }),
      ).rejects.toThrow(
        'GitLab GraphQL errors: Field closedAfter is not defined',
      );
    });

    it('should throw when HTTP status is not ok', async () => {
      fetchSpy.mockResolvedValue({
        ok: false,
        status: 401,
        statusText: 'Unauthorized',
      } as Response);

      const client = new GitlabGraphql(mockConfig, mockedLogger);
      await expect(
        client.request({ url, query: 'query { project { id } }' }),
      ).rejects.toThrow(
        'GitLab GraphQL request failed with status 401 Unauthorized',
      );
    });

    it('should throw when integration is missing', async () => {
      const client = new GitlabGraphql(mockConfig, mockedLogger);
      await expect(
        client.request({
          url: 'https://unknown-host/group/project',
          query: 'query { project { id } }',
        }),
      ).rejects.toThrow(
        "Missing GitLab integration for 'https://unknown-host/group/project'",
      );
    });

    it('should throw when token is missing', async () => {
      getCredentialsSpy.mockResolvedValue({});
      const client = new GitlabGraphql(mockConfig, mockedLogger);
      await expect(
        client.request({ url, query: 'query { project { id } }' }),
      ).rejects.toThrow(
        `No GitLab token provided for '${url}'. Configure integrations.gitlab token (Backend Service Integration).`,
      );
    });
  });

  describe('projectIssueCount', () => {
    it('should return issue count from GraphQL', async () => {
      fetchSpy.mockResolvedValue({
        ok: true,
        json: async () => ({
          data: { project: { issues: { count: 42 } } },
        }),
      } as Response);

      const client = new GitlabGraphql(mockConfig, mockedLogger);
      const result = await client.projectIssueCount(url, {
        projectPath: projectSlug,
        state: 'opened',
      });

      expect(result).toBe(42);
      expect(fetchSpy).toHaveBeenCalledWith(
        'https://gitlab.com/api/graphql',
        expect.objectContaining({
          body: JSON.stringify({
            query: PROJECT_ISSUE_COUNT_QUERY,
            variables: {
              projectPath: projectSlug,
              state: 'opened',
            },
          }),
        }),
      );
    });

    it('should throw when project is missing', async () => {
      fetchSpy.mockResolvedValue({
        ok: true,
        json: async () => ({ data: { project: null } }),
      } as Response);

      const client = new GitlabGraphql(mockConfig, mockedLogger);
      await expect(
        client.projectIssueCount(url, {
          projectPath: projectSlug,
          state: 'opened',
        }),
      ).rejects.toThrow(
        `GitLab project '${projectSlug}' was not found or is inaccessible`,
      );
    });
  });

  describe('projectPipelinesCount', () => {
    it('should count successful pipelines by finishedAt in the window', async () => {
      const since = new Date('2024-01-01T00:00:00Z');
      fetchSpy.mockResolvedValue({
        ok: true,
        json: async () => ({
          data: {
            project: {
              pipelines: {
                pageInfo: { hasNextPage: false, endCursor: null },
                nodes: [
                  {
                    finishedAt: '2024-01-02T00:00:00Z',
                    startedAt: '2023-12-20T00:00:00Z',
                    status: 'SUCCESS',
                  },
                  {
                    finishedAt: '2023-12-15T00:00:00Z',
                    startedAt: '2023-12-15T00:00:00Z',
                    status: 'SUCCESS',
                  },
                  {
                    finishedAt: null,
                    startedAt: '2024-01-03T00:00:00Z',
                    status: 'RUNNING',
                  },
                ],
              },
            },
          },
        }),
      } as Response);

      const client = new GitlabGraphql(mockConfig, mockedLogger);
      const result = await client.projectPipelinesCount(url, {
        projectPath: projectSlug,
        updatedAfter: since.toISOString(),
        status: 'SUCCESS',
      });

      expect(result).toBe(1);
      expect(fetchSpy).toHaveBeenCalledWith(
        'https://gitlab.com/api/graphql',
        expect.objectContaining({
          body: JSON.stringify({
            query: PROJECT_PIPELINES_QUERY,
            variables: {
              projectPath: projectSlug,
              updatedAfter: since.toISOString(),
              status: 'SUCCESS',
              first: 100,
              after: null,
            },
          }),
        }),
      );
    });

    it('should count started pipelines by startedAt in the window', async () => {
      const since = new Date('2024-01-01T00:00:00Z');
      fetchSpy.mockResolvedValue({
        ok: true,
        json: async () => ({
          data: {
            project: {
              pipelines: {
                pageInfo: { hasNextPage: false, endCursor: null },
                nodes: [
                  {
                    startedAt: '2024-01-02T00:00:00Z',
                    finishedAt: null,
                    status: 'RUNNING',
                  },
                  {
                    startedAt: null,
                    finishedAt: null,
                    status: 'PENDING',
                  },
                  {
                    startedAt: '2023-12-01T00:00:00Z',
                    finishedAt: '2024-01-02T00:00:00Z',
                    status: 'SUCCESS',
                  },
                ],
              },
            },
          },
        }),
      } as Response);

      const client = new GitlabGraphql(mockConfig, mockedLogger);
      const result = await client.projectPipelinesCount(url, {
        projectPath: projectSlug,
        updatedAfter: since.toISOString(),
      });

      expect(result).toBe(1);
    });

    it('should page with cursors and warn when the fetch cap is hit', async () => {
      const since = new Date('2024-01-01T00:00:00Z');
      const fullPage = Array.from({ length: 100 }, () => ({
        startedAt: '2024-01-02T00:00:00Z',
        finishedAt: '2024-01-02T01:00:00Z',
        status: 'SUCCESS',
      }));

      let call = 0;
      fetchSpy.mockImplementation(async () => {
        call += 1;
        return {
          ok: true,
          json: async () => ({
            data: {
              project: {
                pipelines: {
                  pageInfo: {
                    hasNextPage: true,
                    endCursor: `cursor-${call}`,
                  },
                  nodes: fullPage,
                },
              },
            },
          }),
        } as Response;
      });

      const client = new GitlabGraphql(mockConfig, mockedLogger);
      const result = await client.projectPipelinesCount(url, {
        projectPath: projectSlug,
        updatedAfter: since.toISOString(),
        status: 'SUCCESS',
      });

      expect(result).toBe(1000);
      expect(fetchSpy).toHaveBeenCalledTimes(10);
      expect(mockedLogger.warn).toHaveBeenCalledWith(
        `Reached fetch limit while counting SUCCESS pipelines in '${projectSlug}' ` +
          `(fetchItemsLimit=1000). ` +
          'Counts cannot be completed without scanning more candidates.',
      );
    });
  });
});
