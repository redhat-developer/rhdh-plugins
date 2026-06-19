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
import { GitlabClient } from './GitlabClient';

describe('GitlabClient', () => {
  let gitlabClient: GitlabClient;
  const projectSlug = 'my-group/my-project';
  const mockFetch = jest.fn();

  const mockConfig = new ConfigReader({
    integrations: {
      gitlab: [
        {
          host: 'gitlab.com',
          token: 'dummy-token',
          apiBaseUrl: 'https://gitlab.com/api/v4',
        },
      ],
    },
  });

  beforeEach(() => {
    jest.clearAllMocks();
    global.fetch = mockFetch;
    gitlabClient = new GitlabClient(mockConfig);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  function mockResponse(
    totalHeader: string | null,
    body: unknown[] = [],
    ok = true,
  ) {
    mockFetch.mockResolvedValue({
      ok,
      status: ok ? 200 : 500,
      statusText: ok ? 'OK' : 'Internal Server Error',
      headers: new Map([['x-total', totalHeader]]),
      json: async () => body,
    });
  }

  describe('getOpenIssuesCount', () => {
    it('should return the count from x-total header', async () => {
      mockResponse('42');
      const result = await gitlabClient.getOpenIssuesCount(projectSlug);

      expect(result).toBe(42);
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining(
          '/projects/my-group%2Fmy-project/issues?state=opened&per_page=1',
        ),
        expect.objectContaining({
          headers: { 'PRIVATE-TOKEN': 'dummy-token' },
        }),
      );
    });

    it('should throw error on API failure', async () => {
      mockResponse(null, [], false);
      await expect(
        gitlabClient.getOpenIssuesCount(projectSlug),
      ).rejects.toThrow('GitLab API error: 500 Internal Server Error');
    });
  });

  describe('getOpenedIssuesCount', () => {
    it('should filter by created_after', async () => {
      mockResponse('5');
      const since = new Date('2024-01-01T00:00:00Z');
      const result = await gitlabClient.getOpenedIssuesCount(
        projectSlug,
        since,
      );

      expect(result).toBe(5);
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('created_after=2024-01-01T00%3A00%3A00.000Z'),
        expect.any(Object),
      );
    });
  });

  describe('getClosedIssuesCount', () => {
    it('should filter by state closed and updated_after', async () => {
      mockResponse('3');
      const since = new Date('2024-01-01T00:00:00Z');
      const result = await gitlabClient.getClosedIssuesCount(
        projectSlug,
        since,
      );

      expect(result).toBe(3);
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('state=closed'),
        expect.any(Object),
      );
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('updated_after='),
        expect.any(Object),
      );
    });
  });

  describe('getOpenMergeRequestsCount', () => {
    it('should return the count of open merge requests', async () => {
      mockResponse('10');
      const result = await gitlabClient.getOpenMergeRequestsCount(projectSlug);

      expect(result).toBe(10);
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/merge_requests?state=opened'),
        expect.any(Object),
      );
    });
  });

  describe('getClosedMergeRequestsCount', () => {
    it('should sum closed and merged counts', async () => {
      mockFetch
        .mockResolvedValueOnce({
          ok: true,
          status: 200,
          statusText: 'OK',
          headers: new Map([['x-total', '4']]),
          json: async () => [],
        })
        .mockResolvedValueOnce({
          ok: true,
          status: 200,
          statusText: 'OK',
          headers: new Map([['x-total', '6']]),
          json: async () => [],
        });

      const since = new Date('2024-01-01T00:00:00Z');
      const result = await gitlabClient.getClosedMergeRequestsCount(
        projectSlug,
        since,
      );

      expect(result).toBe(10);
      expect(mockFetch).toHaveBeenCalledTimes(2);
    });
  });

  describe('getPipelinesCount', () => {
    it('should return pipeline count with status filter', async () => {
      mockResponse('15');
      const since = new Date('2024-01-01T00:00:00Z');
      const result = await gitlabClient.getPipelinesCount(
        projectSlug,
        since,
        'success',
      );

      expect(result).toBe(15);
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('status=success'),
        expect.any(Object),
      );
    });

    it('should return pipeline count without status filter', async () => {
      mockResponse('25');
      const since = new Date('2024-01-01T00:00:00Z');
      const result = await gitlabClient.getPipelinesCount(projectSlug, since);

      expect(result).toBe(25);
    });
  });

  describe('getJobsCount', () => {
    it('should return jobs count filtered by date', async () => {
      const now = Date.now();
      const since = new Date(now - 7 * 24 * 60 * 60 * 1000);

      mockFetch.mockResolvedValue({
        ok: true,
        status: 200,
        statusText: 'OK',
        headers: new Map([['x-total', null]]),
        json: async () => [
          { created_at: new Date(now - 1000).toISOString() },
          { created_at: new Date(now - 2000).toISOString() },
          { created_at: new Date(now - 3000).toISOString() },
        ],
      });

      const result = await gitlabClient.getJobsCount(projectSlug, since, [
        'success',
      ]);

      expect(result).toBe(3);
    });

    it('should filter out jobs older than since date', async () => {
      const now = Date.now();
      const since = new Date(now - 1000);

      mockFetch.mockResolvedValue({
        ok: true,
        status: 200,
        statusText: 'OK',
        headers: new Map([['x-total', null]]),
        json: async () => [
          { created_at: new Date(now - 500).toISOString() },
          { created_at: new Date(now - 5000).toISOString() },
        ],
      });

      const result = await gitlabClient.getJobsCount(projectSlug, since);

      expect(result).toBe(1);
    });
  });

  describe('fallback behavior', () => {
    it('should use default gitlab.com integration when no token is configured', () => {
      const client = new GitlabClient(
        new ConfigReader({
          integrations: {
            gitlab: [],
          },
        }),
      );

      // gitlab.com always has a default integration (without token)
      const result = (client as any).getApiBaseUrl('my-group/my-project');
      expect(result.apiBaseUrl).toBe('https://gitlab.com/api/v4');
      expect(result.token).toBeUndefined();
    });
  });
});
