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

import type { ConnectionStrategy } from '../strategies/ConnectionStrategy';
import { mockServices } from '@backstage/backend-test-utils';
import { JiraClient } from './base';
import type { JiraIssue, Method } from './types';
import { JsonObject } from '@backstage/types';
import z from 'zod';

class TestJiraClient extends JiraClient {
  getSearchCountEndpoint(): string {
    return '/search';
  }

  buildSearchBody(jql: string): string {
    return JSON.stringify({ jql });
  }

  extractIssueCountFromResponse(): number {
    return 10;
  }

  getApiVersion(): number {
    return 3;
  }

  public getIssues(_jql: string): Promise<JiraIssue[]> {
    throw new Error('Method not implemented.');
  }

  public sendPaginatedRequest<TPage, TOut>(_options: {
    url: string;
    method: Method;
    body?: JsonObject;
    responseSchema: z.ZodType<TPage>;
    mapper: (page: TPage) => TOut[];
    fetchItemsLimit?: number;
  }): Promise<TOut[]> {
    throw new Error('Method not implemented.');
  }
}

globalThis.fetch = jest.fn();

describe('JiraClient', () => {
  let testJiraClient: TestJiraClient;
  let mockConnectionStrategy: ConnectionStrategy;
  const mockedLogger = mockServices.logger.mock();

  const mockMethod = 'GET';
  const mockURL = 'https://example.com/api';
  const mockResponse = { data: { total: 10 } };

  beforeEach(() => {
    (globalThis.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: jest.fn().mockResolvedValue({ total: 10 }),
    });

    mockConnectionStrategy = {
      getBaseUrl: jest
        .fn()
        .mockReturnValue('https://example.com/api/rest/api/3'),
      getAuthHeaders: jest
        .fn()
        .mockResolvedValue({ Authorization: 'Basic dummyToken' }),
    };

    testJiraClient = new TestJiraClient(mockConnectionStrategy, mockedLogger);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('constructor', () => {
    it('should have api version', () => {
      expect((testJiraClient as any).getApiVersion()).toEqual(3);
    });

    it('should have connection strategy', () => {
      const client = new TestJiraClient(mockConnectionStrategy, mockedLogger);

      expect((client as any).connectionStrategy).toBe(mockConnectionStrategy);
    });
  });

  describe('sendRequest', () => {
    describe('when request is successful', () => {
      beforeEach(() => {
        (globalThis.fetch as jest.Mock).mockResolvedValueOnce({
          ok: true,
          json: jest.fn().mockResolvedValueOnce(mockResponse),
        });
      });

      it('should use applied URL method and default headers', () => {
        (testJiraClient as any).sendRequest({
          url: mockURL,
          method: mockMethod,
        });
        expect(globalThis.fetch).toHaveBeenCalledWith(
          mockURL,
          expect.objectContaining({
            method: mockMethod,
            headers: expect.objectContaining({
              Accept: 'application/json',
              'Content-Type': 'application/json',
              'X-Atlassian-Token': 'no-check',
            }),
          }),
        );
      });

      it('should add additional header when provided', () => {
        (testJiraClient as any).sendRequest({
          url: mockURL,
          method: mockMethod,
          headers: { Authorization: `Bearer test-token` },
        });
        expect(globalThis.fetch).toHaveBeenCalledWith(
          mockURL,
          expect.objectContaining({
            headers: expect.objectContaining({
              Authorization: `Bearer test-token`,
            }),
          }),
        );
      });

      it('should add body when provided', () => {
        (testJiraClient as any).sendRequest({
          url: mockURL,
          method: mockMethod,
          body: 'maxResults: 0',
        });
        expect(globalThis.fetch).toHaveBeenCalledWith(
          mockURL,
          expect.objectContaining({
            body: 'maxResults: 0',
          }),
        );
      });
    });

    describe('when request fails', () => {
      beforeEach(() => {
        (globalThis.fetch as jest.Mock).mockReset();
      });

      it('should throw error when status is not ok', async () => {
        (globalThis.fetch as jest.Mock).mockResolvedValueOnce({
          ok: false,
          status: 404,
        });

        await expect(
          (testJiraClient as any).sendRequest({
            url: mockURL,
            method: mockMethod,
          }),
        ).rejects.toThrow('Jira request failed with status 404');
      });

      it('should throw error when fetch throws', async () => {
        (globalThis.fetch as jest.Mock).mockRejectedValueOnce(
          new Error('Network error'),
        );

        await expect(
          (testJiraClient as any).sendRequest({
            url: mockURL,
            method: mockMethod,
          }),
        ).rejects.toThrow('Jira error message: Network error');
      });
    });
  });

  describe('getBaseUrl', () => {
    it('should return URL', async () => {
      const baseUrl = await (testJiraClient as any).getBaseUrl();
      expect(baseUrl).toEqual('https://example.com/api/rest/api/3');
    });

    it('should get api version', async () => {
      await (testJiraClient as any).getBaseUrl();
      expect(mockConnectionStrategy.getBaseUrl).toHaveBeenCalledWith(3);
    });
  });

  describe('getAuthHeaders', () => {
    it('should return auth header', async () => {
      const authHeaders = await (testJiraClient as any).getAuthHeaders();
      expect(authHeaders).toEqual({ Authorization: 'Basic dummyToken' });
    });
  });

  describe('getCountOpenIssues', () => {
    it('should request open issues count with jql and return extracted count', async () => {
      jest
        .spyOn(testJiraClient as any, 'extractIssueCountFromResponse')
        .mockReturnValue(7);
      (globalThis.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: jest.fn().mockResolvedValue({ count: 7 }),
      });

      const count = await testJiraClient.getCountOpenIssues('project = "TEST"');

      expect(count).toEqual(7);
      expect(globalThis.fetch).toHaveBeenCalledWith(
        'https://example.com/api/rest/api/3/search',
        expect.objectContaining({
          method: 'POST',
          headers: expect.objectContaining({
            Authorization: 'Basic dummyToken',
          }),
          body: JSON.stringify({ jql: 'project = "TEST"' }),
        }),
      );
      expect(testJiraClient.extractIssueCountFromResponse).toHaveBeenCalledWith(
        { count: 7 },
      );
    });
  });
});
