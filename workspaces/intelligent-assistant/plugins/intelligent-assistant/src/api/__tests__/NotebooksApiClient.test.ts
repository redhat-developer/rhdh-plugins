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
      expect(baseUrl).toBe(
        'http://localhost:7007/api/intelligent-assistant/notebooks',
      );
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
        'http://localhost:7007/api/intelligent-assistant/notebooks/v1/sessions/vs_test-123',
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
        'http://localhost:7007/api/intelligent-assistant/notebooks/v1/sessions/vs_test%2Fspecial%3Fchars',
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
        'http://localhost:7007/api/intelligent-assistant/notebooks/v1/sessions',
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
        'http://localhost:7007/api/intelligent-assistant/notebooks/v1/sessions',
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
        'http://localhost:7007/api/intelligent-assistant/notebooks/v1/sessions/vs_test-123',
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
        'http://localhost:7007/api/intelligent-assistant/notebooks/v1/sessions/vs_test-123',
        expect.objectContaining({
          method: 'DELETE',
        }),
      );
    });
  });

  describe('HTTP errors', () => {
    it('throws the JSON error field from a failed response', async () => {
      mockFetchApi.fetch.mockResolvedValue({
        ok: false,
        status: 503,
        statusText: 'Service Unavailable',
        text: jest
          .fn()
          .mockResolvedValue(JSON.stringify({ error: 'notebooks down' })),
      } as unknown as Response);

      await expect(client.listSessions()).rejects.toThrow('notebooks down');
    });

    it('throws plain-text error bodies when the payload is not JSON', async () => {
      mockFetchApi.fetch.mockResolvedValue({
        ok: false,
        status: 502,
        statusText: 'Bad Gateway',
        text: jest.fn().mockResolvedValue('gateway timeout'),
      } as unknown as Response);

      await expect(client.listSessions()).rejects.toThrow('gateway timeout');
    });
  });

  describe('uploadDocument', () => {
    const file = new File(['notes'], 'notes.md', { type: 'text/markdown' });

    it('sends multipart fields without forcing a JSON content type', async () => {
      const append = jest.spyOn(FormData.prototype, 'append');
      mockFetchApi.fetch.mockResolvedValue({
        ok: false,
        status: 202,
        text: jest.fn().mockResolvedValue(
          JSON.stringify({
            status: 'processing',
            document_id: 'doc-1',
            session_id: 'vs_test-123',
            message: 'accepted',
          }),
        ),
      } as unknown as Response);

      const result = await client.uploadDocument(
        'vs_test-123',
        file,
        'md',
        'Notes',
        'Notes v2',
      );

      expect(result).toEqual({
        status: 'processing',
        document_id: 'doc-1',
        session_id: 'vs_test-123',
        message: 'accepted',
      });

      const [url, init] = mockFetchApi.fetch.mock.calls[0];
      expect(url).toBe(
        'http://localhost:7007/api/intelligent-assistant/notebooks/v1/sessions/vs_test-123/documents',
      );
      expect(init?.method).toBe('PUT');
      expect(init?.headers).toBeUndefined();
      expect(init?.body).toBeInstanceOf(FormData);
      expect(append).toHaveBeenCalledWith('file', file);
      expect(append).toHaveBeenCalledWith('fileType', 'md');
      expect(append).toHaveBeenCalledWith('title', 'Notes');
      expect(append).toHaveBeenCalledWith('newTitle', 'Notes v2');
      append.mockRestore();
    });

    it('omits newTitle when the caller is not renaming on upload', async () => {
      const append = jest.spyOn(FormData.prototype, 'append');
      mockFetchApi.fetch.mockResolvedValue({
        ok: true,
        status: 200,
        text: jest.fn().mockResolvedValue(''),
      } as unknown as Response);

      await expect(
        client.uploadDocument('vs_test-123', file, 'md', 'Notes'),
      ).resolves.toEqual({});

      expect(append).not.toHaveBeenCalledWith('newTitle', expect.anything());
      append.mockRestore();
    });

    it('throws when the upload is rejected', async () => {
      mockFetchApi.fetch.mockResolvedValue({
        ok: false,
        status: 413,
        statusText: 'Payload Too Large',
        text: jest
          .fn()
          .mockResolvedValue(JSON.stringify({ error: 'file too large' })),
      } as unknown as Response);

      await expect(
        client.uploadDocument('vs_test-123', file, 'md', 'Notes'),
      ).rejects.toThrow('file too large');
    });
  });

  describe('documents', () => {
    it('falls back to document_id when a listed document has no title', async () => {
      mockFetchApi.fetch.mockResolvedValue({
        ok: true,
        text: jest.fn().mockResolvedValue(
          JSON.stringify({
            documents: [
              { document_id: 'doc-untitled' },
              { document_id: 'doc-2', title: 'Guide' },
            ],
          }),
        ),
      } as unknown as Response);

      await expect(client.listDocuments('vs/with slash')).resolves.toEqual([
        { document_id: 'doc-untitled', title: 'doc-untitled' },
        { document_id: 'doc-2', title: 'Guide' },
      ]);
      expect(mockFetchApi.fetch).toHaveBeenCalledWith(
        'http://localhost:7007/api/intelligent-assistant/notebooks/v1/sessions/vs%2Fwith%20slash/documents',
        expect.any(Object),
      );
    });

    it('renames and deletes a document by encoded id', async () => {
      mockFetchApi.fetch.mockResolvedValue({
        ok: true,
        text: jest.fn().mockResolvedValue(''),
      } as unknown as Response);

      await client.renameDocument('vs_test-123', 'doc/1', 'Renamed');
      await client.deleteDocument('vs_test-123', 'doc/1');

      expect(mockFetchApi.fetch).toHaveBeenNthCalledWith(
        1,
        'http://localhost:7007/api/intelligent-assistant/notebooks/v1/sessions/vs_test-123/documents/doc%2F1',
        expect.objectContaining({
          method: 'PATCH',
          body: JSON.stringify({ title: 'Renamed' }),
        }),
      );
      expect(mockFetchApi.fetch).toHaveBeenNthCalledWith(
        2,
        'http://localhost:7007/api/intelligent-assistant/notebooks/v1/sessions/vs_test-123/documents/doc%2F1',
        expect.objectContaining({ method: 'DELETE' }),
      );
    });

    it('returns document processing status', async () => {
      const status = { status: 'completed', document_id: 'doc-1' };
      mockFetchApi.fetch.mockResolvedValue({
        ok: true,
        text: jest.fn().mockResolvedValue(JSON.stringify(status)),
      } as unknown as Response);

      await expect(
        client.getDocumentStatus('vs_test-123', 'doc-1'),
      ).resolves.toEqual(status);
    });
  });

  describe('querySession', () => {
    it('returns the response reader and forwards the abort signal', async () => {
      const reader = { read: jest.fn() };
      mockFetchApi.fetch.mockResolvedValue({
        ok: true,
        body: { getReader: () => reader },
      } as unknown as Response);
      const controller = new AbortController();

      await expect(
        client.querySession('vs_test-123', 'summarize', {
          signal: controller.signal,
        }),
      ).resolves.toBe(reader);
      expect(mockFetchApi.fetch).toHaveBeenCalledWith(
        'http://localhost:7007/api/intelligent-assistant/notebooks/v1/sessions/vs_test-123/query',
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify({ query: 'summarize' }),
          signal: controller.signal,
        }),
      );
    });

    it('throws when the response has no body', async () => {
      mockFetchApi.fetch.mockResolvedValue({
        ok: true,
        body: null,
      } as unknown as Response);

      await expect(
        client.querySession('vs_test-123', 'summarize'),
      ).rejects.toThrow(
        'Readable stream is not supported or there is no body.',
      );
    });

    it('throws the error field from a failed query stream', async () => {
      const reader = {
        read: jest.fn().mockResolvedValue({
          done: false,
          value: new TextEncoder().encode(
            JSON.stringify({ error: 'quota exceeded' }),
          ),
        }),
      };
      mockFetchApi.fetch.mockResolvedValue({
        ok: false,
        body: { getReader: () => reader },
      } as unknown as Response);

      await expect(
        client.querySession('vs_test-123', 'summarize'),
      ).rejects.toThrow('failed to query notebook session: quota exceeded');
    });
  });
});
