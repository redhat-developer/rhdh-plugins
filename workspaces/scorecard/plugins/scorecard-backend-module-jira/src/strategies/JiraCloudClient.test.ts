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
import { JiraCloudClientStrategy } from './JiraCloudClientStrategy';

globalThis.fetch = jest.fn();

const mockConnectionStrategy = {
  getBaseUrl: jest.fn().mockReturnValue('https://example.com/api/rest/api/3'),
  getAuthHeaders: jest
    .fn()
    .mockResolvedValue({ Authorization: 'Basic dummyToken' }),
};

describe('JiraCloudClient', () => {
  let jiraCloudClient: JiraCloudClientStrategy;
  const mockedLogger = mockServices.logger.mock();

  beforeEach(() => {
    jiraCloudClient = new JiraCloudClientStrategy(
      mockConnectionStrategy,
      mockedLogger,
    );
  });

  afterEach(() => {
    jest.resetAllMocks();
    mockConnectionStrategy.getBaseUrl.mockReturnValue(
      'https://example.com/api/rest/api/3',
    );
    mockConnectionStrategy.getAuthHeaders.mockResolvedValue({
      Authorization: 'Basic dummyToken',
    });
  });

  describe('constructor', () => {
    it('should create JiraCloudClient successfully', () => {
      expect(jiraCloudClient).toBeInstanceOf(JiraCloudClientStrategy);
    });
  });

  describe('getSearchCountEndpoint', () => {
    it('should return correct search count endpoint', () => {
      const searchCountEndpoint = (
        jiraCloudClient as any
      ).getSearchCountEndpoint();
      expect(searchCountEndpoint).toEqual('/search/approximate-count');
    });
  });

  describe('buildSearchBody', () => {
    it('should return correct search body', () => {
      const searchBody = (jiraCloudClient as any).buildSearchBody(
        'project = CLOUD',
      );
      const responseBody = JSON.stringify({ jql: 'project = CLOUD' });
      expect(searchBody).toEqual(responseBody);
    });
  });

  describe('extractIssueCountFromResponse', () => {
    it('should return correct issue count', () => {
      const issueCount = (jiraCloudClient as any).extractIssueCountFromResponse(
        { count: 5 },
      );
      expect(issueCount).toBe(5);
    });

    it('should throw error for incorrect response data', () => {
      expect(() =>
        (jiraCloudClient as any).extractIssueCountFromResponse({}),
      ).toThrow('Incorrect response data for Jira Cloud client');
    });
  });

  describe('getCountOpenIssues', () => {
    it('should get count with Basic auth header', async () => {
      (globalThis.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: jest.fn().mockResolvedValueOnce({ count: 5 }),
      });

      const count = await jiraCloudClient.getCountOpenIssues(
        'project = "TEST"',
      );
      expect(count).toBe(5);
    });
  });

  describe('getApiVersion', () => {
    it('should return Jira Cloud api version', () => {
      const apiVersion = (jiraCloudClient as any).getApiVersion();
      expect(apiVersion).toEqual(3);
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
          items: [{ id: 'a' }, { id: 'b' }],
          isLast: true,
        }),
      });

      const results = await jiraCloudClient.sendPaginatedRequest({
        url: 'https://example.com/api/rest/api/3/search/jql',
        method: 'POST',
        body: { jql: 'project = "INC"' },
        responseSchema,
        mapper: page => page.items.map(item => item.id),
      });

      expect(results).toEqual(['a', 'b']);
      expect(
        JSON.parse((globalThis.fetch as jest.Mock).mock.calls[0][1].body),
      ).toEqual({ jql: 'project = "INC"' });
    });

    it('should page with nextPageToken and flatten mapped results', async () => {
      (globalThis.fetch as jest.Mock)
        .mockResolvedValueOnce({
          ok: true,
          json: jest.fn().mockResolvedValueOnce({
            items: [{ id: 'a' }],
            nextPageToken: 'token-2',
          }),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: jest.fn().mockResolvedValueOnce({
            items: [{ id: 'b' }],
            isLast: true,
          }),
        });

      const results = await jiraCloudClient.sendPaginatedRequest({
        url: 'https://example.com/api/rest/api/3/search/jql',
        method: 'POST',
        body: { jql: 'project = "INC"' },
        responseSchema,
        mapper: page => page.items.map(item => item.id),
      });

      expect(results).toEqual(['a', 'b']);
      expect(globalThis.fetch).toHaveBeenCalledTimes(2);
      expect(
        JSON.parse((globalThis.fetch as jest.Mock).mock.calls[0][1].body),
      ).not.toHaveProperty('nextPageToken');
      expect(
        JSON.parse((globalThis.fetch as jest.Mock).mock.calls[1][1].body)
          .nextPageToken,
      ).toBe('token-2');
    });

    it('should stop paging when fetch limit is reached', async () => {
      (globalThis.fetch as jest.Mock)
        .mockResolvedValueOnce({
          ok: true,
          json: jest.fn().mockResolvedValueOnce({
            items: [{ id: 'a' }, { id: 'b' }],
            nextPageToken: 'token-2',
          }),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: jest.fn().mockResolvedValueOnce({
            items: [{ id: 'c' }],
            isLast: true,
          }),
        });

      const results = await jiraCloudClient.sendPaginatedRequest({
        url: 'https://example.com/api/rest/api/3/search/jql',
        method: 'POST',
        body: { jql: 'project = "INC"' },
        responseSchema,
        mapper: page => page.items.map(item => item.id),
        fetchItemsLimit: 2,
      });

      expect(results).toEqual(['a', 'b']);
      expect(globalThis.fetch).toHaveBeenCalledTimes(1);
      expect(mockedLogger.warn).toHaveBeenCalledWith(
        'Reached fetchItemsLimit of 2 for Jira request to https://example.com/api/rest/api/3/search/jql; stopping fetch',
      );
    });

    it('should slice the last page when it exceeds remaining fetchItemsLimit', async () => {
      (globalThis.fetch as jest.Mock)
        .mockResolvedValueOnce({
          ok: true,
          json: jest.fn().mockResolvedValueOnce({
            items: [{ id: 'a' }, { id: 'b' }],
            nextPageToken: 'token-2',
          }),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: jest.fn().mockResolvedValueOnce({
            items: [{ id: 'c' }, { id: 'd' }],
            isLast: true,
          }),
        });

      const results = await jiraCloudClient.sendPaginatedRequest({
        url: 'https://example.com/api/rest/api/3/search/jql',
        method: 'POST',
        body: { jql: 'project = "INC"' },
        responseSchema,
        mapper: page => page.items.map(item => item.id),
        fetchItemsLimit: 3,
      });

      expect(results).toEqual(['a', 'b', 'c']);
      expect(globalThis.fetch).toHaveBeenCalledTimes(2);
      expect(mockedLogger.warn).toHaveBeenCalledWith(
        'Reached fetchItemsLimit of 3 for Jira request to https://example.com/api/rest/api/3/search/jql; stopping fetch',
      );
    });

    it('should warn when fetchItemsLimit truncates the last page', async () => {
      (globalThis.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: jest.fn().mockResolvedValueOnce({
          items: [{ id: 'a' }, { id: 'b' }, { id: 'c' }],
          isLast: true,
        }),
      });

      const results = await jiraCloudClient.sendPaginatedRequest({
        url: 'https://example.com/api/rest/api/3/search/jql',
        method: 'POST',
        body: { jql: 'project = "INC"' },
        responseSchema,
        mapper: page => page.items.map(item => item.id),
        fetchItemsLimit: 2,
      });

      expect(results).toEqual(['a', 'b']);
      expect(globalThis.fetch).toHaveBeenCalledTimes(1);
      expect(mockedLogger.warn).toHaveBeenCalledWith(
        'Reached fetchItemsLimit of 2 for Jira request to https://example.com/api/rest/api/3/search/jql; stopping fetch',
      );
    });

    it('should throw when response does not match schema', async () => {
      (globalThis.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: jest.fn().mockResolvedValueOnce({ items: 'bad' }),
      });

      await expect(
        jiraCloudClient.sendPaginatedRequest({
          url: 'https://example.com/api/rest/api/3/search/jql',
          method: 'POST',
          responseSchema,
          mapper: page => page.items.map(item => item.id),
        }),
      ).rejects.toThrow(
        'Incorrect response data from https://example.com/api/rest/api/3/search/jql',
      );
    });

    it('should throw when paging fields are invalid', async () => {
      (globalThis.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: jest.fn().mockResolvedValueOnce({
          items: [{ id: 'a' }],
          nextPageToken: 123,
        }),
      });

      await expect(
        jiraCloudClient.sendPaginatedRequest({
          url: 'https://example.com/api/rest/api/3/search/jql',
          method: 'POST',
          responseSchema,
          mapper: page => page.items.map(item => item.id),
        }),
      ).rejects.toThrow(
        'Incorrect response data from https://example.com/api/rest/api/3/search/jql',
      );
    });
  });

  describe('getIssues', () => {
    it('should return mapped Jira issues from /search/jql', async () => {
      (globalThis.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: jest.fn().mockResolvedValueOnce({
          issues: [
            {
              id: '10001',
              fields: {
                created: '2026-06-01T10:00:00.000+0530',
                resolutiondate: '2026-06-01T12:00:00.000+0530',
              },
            },
          ],
          isLast: true,
        }),
      });

      const issues = await jiraCloudClient.getIssues(
        '(project = "INC") AND (type = "Incident")',
      );
      const requestUrl = (globalThis.fetch as jest.Mock).mock.calls[0][0];
      const requestBody = JSON.parse(
        (globalThis.fetch as jest.Mock).mock.calls[0][1].body,
      );

      expect(requestUrl).toBe('https://example.com/api/rest/api/3/search/jql');
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
    });
  });
});
