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

import { ConfigApi, FetchApi } from '@backstage/core-plugin-api';

import { NotebooksApiClient } from '../NotebooksApiClient';

describe('NotebooksApiClient', () => {
  let mockConfigApi: jest.Mocked<ConfigApi>;
  let mockFetchApi: jest.Mocked<FetchApi>;
  let client: NotebooksApiClient;

  beforeEach(() => {
    mockConfigApi = {
      getString: jest.fn().mockReturnValue('http://localhost:7007'),
    } as unknown as jest.Mocked<ConfigApi>;

    mockFetchApi = {
      fetch: jest.fn(),
    } as unknown as jest.Mocked<FetchApi>;

    client = new NotebooksApiClient({
      configApi: mockConfigApi,
      fetchApi: mockFetchApi,
    });
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('getBaseUrl', () => {
    it('should return the correct base URL', async () => {
      const baseUrl = await client.getBaseUrl();
      expect(baseUrl).toBe('http://localhost:7007/api/lightspeed/ai-notebooks');
      expect(mockConfigApi.getString).toHaveBeenCalledWith('backend.baseUrl');
    });
  });

  describe('getSession', () => {
    it('should return session data when API call succeeds', async () => {
      const mockSession = {
        session_id: 'vs_test-123',
        name: 'Test Notebook',
        metadata: { conversation_id: 'conv-456' },
      };

      mockFetchApi.fetch.mockResolvedValue({
        ok: true,
        text: jest.fn().mockResolvedValue(
          JSON.stringify({
            session: mockSession,
            message: 'Session retrieved successfully',
          }),
        ),
      } as unknown as Response);

      const result = await client.getSession('vs_test-123');

      expect(result).toEqual(mockSession);
      expect(mockFetchApi.fetch).toHaveBeenCalledWith(
        'http://localhost:7007/api/lightspeed/ai-notebooks/v1/sessions/vs_test-123',
        expect.objectContaining({
          headers: { 'Content-Type': 'application/json' },
        }),
      );
    });

    it('should encode special characters in session ID', async () => {
      const mockSession = {
        session_id: 'vs_test/special?chars',
        name: 'Test Notebook',
      };

      mockFetchApi.fetch.mockResolvedValue({
        ok: true,
        text: jest
          .fn()
          .mockResolvedValue(JSON.stringify({ session: mockSession })),
      } as unknown as Response);

      await client.getSession('vs_test/special?chars');

      expect(mockFetchApi.fetch).toHaveBeenCalledWith(
        'http://localhost:7007/api/lightspeed/ai-notebooks/v1/sessions/vs_test%2Fspecial%3Fchars',
        expect.any(Object),
      );
    });

    it('should throw error when session is not found', async () => {
      mockFetchApi.fetch.mockResolvedValue({
        ok: false,
        status: 404,
        statusText: 'Not Found',
        text: jest
          .fn()
          .mockResolvedValue(JSON.stringify({ error: 'Session not found' })),
      } as unknown as Response);

      await expect(client.getSession('vs_invalid')).rejects.toThrow(
        'Session not found',
      );
    });

    it('should throw error when response has no session', async () => {
      mockFetchApi.fetch.mockResolvedValue({
        ok: true,
        text: jest
          .fn()
          .mockResolvedValue(
            JSON.stringify({ message: 'Success but no session' }),
          ),
      } as unknown as Response);

      await expect(client.getSession('vs_test-123')).rejects.toThrow(
        'Session not found',
      );
    });

    it('should throw error with custom error message from response', async () => {
      mockFetchApi.fetch.mockResolvedValue({
        ok: true,
        text: jest
          .fn()
          .mockResolvedValue(JSON.stringify({ error: 'Custom error message' })),
      } as unknown as Response);

      await expect(client.getSession('vs_test-123')).rejects.toThrow(
        'Custom error message',
      );
    });
  });

  describe('listSessions', () => {
    it('should return sessions when API call succeeds', async () => {
      const mockSessions = [
        { session_id: 'vs_1', name: 'Notebook 1' },
        { session_id: 'vs_2', name: 'Notebook 2' },
      ];

      mockFetchApi.fetch.mockResolvedValue({
        ok: true,
        text: jest
          .fn()
          .mockResolvedValue(JSON.stringify({ sessions: mockSessions })),
      } as unknown as Response);

      const result = await client.listSessions();

      expect(result).toEqual(mockSessions);
      expect(mockFetchApi.fetch).toHaveBeenCalledWith(
        'http://localhost:7007/api/lightspeed/ai-notebooks/v1/sessions',
        expect.any(Object),
      );
    });

    it('should return empty array when sessions is undefined', async () => {
      mockFetchApi.fetch.mockResolvedValue({
        ok: true,
        text: jest.fn().mockResolvedValue(JSON.stringify({})),
      } as unknown as Response);

      const result = await client.listSessions();
      expect(result).toEqual([]);
    });
  });

  describe('createSession', () => {
    it('should create and return session', async () => {
      const mockSession = {
        session_id: 'vs_new-123',
        name: 'New Notebook',
      };

      mockFetchApi.fetch.mockResolvedValue({
        ok: true,
        text: jest
          .fn()
          .mockResolvedValue(JSON.stringify({ session: mockSession })),
      } as unknown as Response);

      const result = await client.createSession('New Notebook', 'Description');

      expect(result).toEqual(mockSession);
      expect(mockFetchApi.fetch).toHaveBeenCalledWith(
        'http://localhost:7007/api/lightspeed/ai-notebooks/v1/sessions',
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify({
            name: 'New Notebook',
            description: 'Description',
          }),
        }),
      );
    });

    it('should throw error when creation fails', async () => {
      mockFetchApi.fetch.mockResolvedValue({
        ok: true,
        text: jest
          .fn()
          .mockResolvedValue(
            JSON.stringify({ error: 'Failed to create session' }),
          ),
      } as unknown as Response);

      await expect(client.createSession('New Notebook')).rejects.toThrow(
        'Failed to create session',
      );
    });
  });

  describe('renameSession', () => {
    it('should rename session successfully', async () => {
      mockFetchApi.fetch.mockResolvedValue({
        ok: true,
        text: jest.fn().mockResolvedValue(''),
      } as unknown as Response);

      await client.renameSession('vs_test-123', 'New Name');

      expect(mockFetchApi.fetch).toHaveBeenCalledWith(
        'http://localhost:7007/api/lightspeed/ai-notebooks/v1/sessions/vs_test-123',
        expect.objectContaining({
          method: 'PUT',
          body: JSON.stringify({ name: 'New Name' }),
        }),
      );
    });
  });

  describe('deleteSession', () => {
    it('should delete session successfully', async () => {
      mockFetchApi.fetch.mockResolvedValue({
        ok: true,
        text: jest.fn().mockResolvedValue(''),
      } as unknown as Response);

      await client.deleteSession('vs_test-123');

      expect(mockFetchApi.fetch).toHaveBeenCalledWith(
        'http://localhost:7007/api/lightspeed/ai-notebooks/v1/sessions/vs_test-123',
        expect.objectContaining({
          method: 'DELETE',
        }),
      );
    });
  });
});
