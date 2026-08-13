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
import { z } from 'zod';
import { JiraDataCenterClientStrategy } from './JiraDataCenterClientStrategy';

globalThis.fetch = jest.fn();

const mockConnectionStrategy = {
  getBaseUrl: jest.fn().mockReturnValue('https://example.com/api/rest/api/2'),
  getAuthHeaders: jest
    .fn()
    .mockResolvedValue({ Authorization: 'Bearer dummyToken' }),
};

describe('JiraDataCenterClient', () => {
  let jiraDataCenterClient: JiraDataCenterClientStrategy;
  const mockedLogger = mockServices.logger.mock();

  beforeEach(() => {
    jiraDataCenterClient = new JiraDataCenterClientStrategy(
      mockConnectionStrategy,
      mockedLogger,
    );
  });

  afterEach(() => {
    jest.resetAllMocks();
    mockConnectionStrategy.getBaseUrl.mockReturnValue(
      'https://example.com/api/rest/api/2',
    );
    mockConnectionStrategy.getAuthHeaders.mockResolvedValue({
      Authorization: 'Bearer dummyToken',
    });
  });

  describe('constructor', () => {
    it('should create JiraDataCenterClient successfully', () => {
      expect(jiraDataCenterClient).toBeInstanceOf(JiraDataCenterClientStrategy);
    });
  });

  describe('buildSearchBody', () => {
    it('should return correct search body', () => {
      const searchBody = (jiraDataCenterClient as any).buildSearchBody(
        'project = DATACENTER',
      );
      const responseBody = JSON.stringify({
        jql: 'project = DATACENTER',
        fields: [],
        maxResults: 0,
      });
      expect(searchBody).toEqual(responseBody);
    });
  });

  describe('extractIssueCountFromResponse', () => {
    it('should return correct issue count', () => {
      const issueCount = (
        jiraDataCenterClient as any
      ).extractIssueCountFromResponse({ total: 10 });
      expect(issueCount).toBe(10);
    });

    it('should throw error for incorrect response data', () => {
      expect(() =>
        (jiraDataCenterClient as any).extractIssueCountFromResponse({}),
      ).toThrow('Incorrect response data for Jira Data Center client');
    });
  });

  describe('getCountOpenIssues', () => {
    it('should get count of open issues', async () => {
      (globalThis.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: jest.fn().mockResolvedValueOnce({ total: 10 }),
      });

      const count = await jiraDataCenterClient.getCountOpenIssues(
        'project = "DATACENTER"',
      );
      expect(count).toBe(10);
    });
  });

  describe('getApiVersion', () => {
    it('should return Jira Data Center api version', () => {
      const apiVersion = (jiraDataCenterClient as any).getApiVersion();
      expect(apiVersion).toEqual(2);
    });
  });

  describe('sendPaginatedRequest', () => {
    const responseSchema = z.object({
      items: z.array(z.object({ id: z.string() })),
    });

    it('should return mapped results from a single page', async () => {
      (globalThis.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: jest.fn().mockResolvedValueOnce({
          startAt: 0,
          maxResults: 50,
          total: 2,
          items: [{ id: 'a' }, { id: 'b' }],
        }),
      });

      const results = await jiraDataCenterClient.sendPaginatedRequest({
        url: 'https://example.com/api/rest/api/2/search',
        method: 'POST',
        body: { jql: 'project = "INC"' },
        responseSchema,
        mapper: page => page.items.map(item => item.id),
      });

      expect(results).toEqual(['a', 'b']);
      expect(
        JSON.parse((globalThis.fetch as jest.Mock).mock.calls[0][1].body),
      ).toEqual({ jql: 'project = "INC"', startAt: 0 });
    });

    it('should page with startAt and flatten mapped results', async () => {
      (globalThis.fetch as jest.Mock)
        .mockResolvedValueOnce({
          ok: true,
          json: jest.fn().mockResolvedValueOnce({
            startAt: 0,
            maxResults: 1,
            total: 2,
            items: [{ id: 'a' }],
          }),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: jest.fn().mockResolvedValueOnce({
            startAt: 1,
            maxResults: 1,
            total: 2,
            items: [{ id: 'b' }],
          }),
        });

      const results = await jiraDataCenterClient.sendPaginatedRequest({
        url: 'https://example.com/api/rest/api/2/search',
        method: 'POST',
        body: { jql: 'project = "INC"' },
        responseSchema,
        mapper: page => page.items.map(item => item.id),
      });

      expect(results).toEqual(['a', 'b']);
      expect(globalThis.fetch).toHaveBeenCalledTimes(2);
      expect(
        JSON.parse((globalThis.fetch as jest.Mock).mock.calls[0][1].body)
          .startAt,
      ).toBe(0);
      expect(
        JSON.parse((globalThis.fetch as jest.Mock).mock.calls[1][1].body)
          .startAt,
      ).toBe(1);
    });

    it('should stop paging when fetch limit is reached', async () => {
      (globalThis.fetch as jest.Mock)
        .mockResolvedValueOnce({
          ok: true,
          json: jest.fn().mockResolvedValueOnce({
            startAt: 0,
            maxResults: 2,
            total: 4,
            items: [{ id: 'a' }, { id: 'b' }],
          }),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: jest.fn().mockResolvedValueOnce({
            startAt: 2,
            maxResults: 2,
            total: 4,
            items: [{ id: 'c' }, { id: 'd' }],
          }),
        });

      const results = await jiraDataCenterClient.sendPaginatedRequest({
        url: 'https://example.com/api/rest/api/2/search',
        method: 'POST',
        body: { jql: 'project = "INC"' },
        responseSchema,
        mapper: page => page.items.map(item => item.id),
        fetchItemsLimit: 2,
      });

      expect(results).toEqual(['a', 'b']);
      expect(globalThis.fetch).toHaveBeenCalledTimes(1);
      expect(mockedLogger.warn).toHaveBeenCalledWith(
        'Reached fetchItemsLimit of 2 for Jira request to https://example.com/api/rest/api/2/search; stopping fetch',
      );
    });

    it('should slice the last page when it exceeds remaining fetchItemsLimit', async () => {
      (globalThis.fetch as jest.Mock)
        .mockResolvedValueOnce({
          ok: true,
          json: jest.fn().mockResolvedValueOnce({
            startAt: 0,
            maxResults: 2,
            total: 5,
            items: [{ id: 'a' }, { id: 'b' }],
          }),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: jest.fn().mockResolvedValueOnce({
            startAt: 2,
            maxResults: 3,
            total: 5,
            items: [{ id: 'c' }, { id: 'd' }],
          }),
        });

      const results = await jiraDataCenterClient.sendPaginatedRequest({
        url: 'https://example.com/api/rest/api/2/search',
        method: 'POST',
        body: { jql: 'project = "INC"' },
        responseSchema,
        mapper: page => page.items.map(item => item.id),
        fetchItemsLimit: 3,
      });

      expect(results).toEqual(['a', 'b', 'c']);
      expect(globalThis.fetch).toHaveBeenCalledTimes(2);
      expect(mockedLogger.warn).toHaveBeenCalledWith(
        'Reached fetchItemsLimit of 3 for Jira request to https://example.com/api/rest/api/2/search; stopping fetch',
      );
    });

    it('should warn when fetchItemsLimit truncates the last page', async () => {
      (globalThis.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: jest.fn().mockResolvedValueOnce({
          startAt: 0,
          maxResults: 3,
          total: 3,
          items: [{ id: 'a' }, { id: 'b' }, { id: 'c' }],
        }),
      });

      const results = await jiraDataCenterClient.sendPaginatedRequest({
        url: 'https://example.com/api/rest/api/2/search',
        method: 'POST',
        body: { jql: 'project = "INC"' },
        responseSchema,
        mapper: page => page.items.map(item => item.id),
        fetchItemsLimit: 2,
      });

      expect(results).toEqual(['a', 'b']);
      expect(globalThis.fetch).toHaveBeenCalledTimes(1);
      expect(mockedLogger.warn).toHaveBeenCalledWith(
        'Reached fetchItemsLimit of 2 for Jira request to https://example.com/api/rest/api/2/search; stopping fetch',
      );
    });

    it('should throw when paging fields are missing', async () => {
      (globalThis.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: jest.fn().mockResolvedValueOnce({
          items: [{ id: 'a' }],
        }),
      });

      await expect(
        jiraDataCenterClient.sendPaginatedRequest({
          url: 'https://example.com/api/rest/api/2/search',
          method: 'POST',
          responseSchema,
          mapper: page => page.items.map(item => item.id),
        }),
      ).rejects.toThrow(
        'Incorrect response data from https://example.com/api/rest/api/2/search',
      );
    });

    it('should throw when response does not match schema', async () => {
      (globalThis.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: jest.fn().mockResolvedValueOnce({
          startAt: 0,
          maxResults: 50,
          total: 1,
          items: 'bad',
        }),
      });

      await expect(
        jiraDataCenterClient.sendPaginatedRequest({
          url: 'https://example.com/api/rest/api/2/search',
          method: 'POST',
          responseSchema,
          mapper: page => page.items.map(item => item.id),
        }),
      ).rejects.toThrow(
        'Incorrect response data from https://example.com/api/rest/api/2/search',
      );
    });
  });

  describe('getIssues', () => {
    it('should return mapped Jira issues from /search', async () => {
      (globalThis.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: jest.fn().mockResolvedValueOnce({
          startAt: 0,
          maxResults: 50,
          total: 1,
          issues: [
            {
              id: '10001',
              fields: {
                created: '2026-06-01T10:00:00.000+0530',
                resolutiondate: '2026-06-01T12:00:00.000+0530',
              },
            },
          ],
        }),
      });

      const issues = await jiraDataCenterClient.getIssues(
        '(project = "INC") AND (type = "Incident")',
      );
      const requestUrl = (globalThis.fetch as jest.Mock).mock.calls[0][0];
      const requestBody = JSON.parse(
        (globalThis.fetch as jest.Mock).mock.calls[0][1].body,
      );

      expect(requestUrl).toBe('https://example.com/api/rest/api/2/search');
      expect(issues).toEqual([
        {
          id: '10001',
          createdAt: '2026-06-01T04:30:00.000Z',
          resolutionAt: '2026-06-01T06:30:00.000Z',
        },
      ]);
      expect(requestBody.jql).toContain('project = "INC"');
      expect(requestBody.fields).toEqual(['created', 'resolutiondate']);
      expect(requestBody).not.toHaveProperty('maxResults');
      expect(requestBody.startAt).toBe(0);
    });
  });
});
