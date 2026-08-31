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

import { fetchEntities } from './catalogClient';

// Save and restore the global fetch so tests are isolated
const originalFetch = globalThis.fetch;
let mockFetch: jest.Mock;

beforeEach(() => {
  mockFetch = jest.fn();
  globalThis.fetch = mockFetch;
});

afterEach(() => {
  globalThis.fetch = originalFetch;
});

describe('fetchEntities', () => {
  describe('URL validation', () => {
    it('rejects a malformed URL', async () => {
      await expect(fetchEntities({ catalogUrl: 'not-a-url' })).rejects.toThrow(
        'Invalid catalog URL',
      );
    });

    it('rejects a URL with an unsupported protocol', async () => {
      await expect(
        fetchEntities({ catalogUrl: 'ftp://example.com' }),
      ).rejects.toThrow('must use http or https');
    });

    it.each(['file:', 'data:'])(
      'rejects the %s protocol',
      async (protocol: string) => {
        await expect(
          fetchEntities({ catalogUrl: `${protocol}//example.com` }),
        ).rejects.toThrow('must use http or https');
      },
    );

    it('accepts an http URL', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => [],
      });

      await fetchEntities({ catalogUrl: 'http://localhost:7007' });

      expect(mockFetch).toHaveBeenCalledTimes(1);
      const calledUrl = mockFetch.mock.calls[0][0] as string;
      expect(calledUrl).toContain('http://localhost:7007');
    });

    it('accepts an https URL', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => [],
      });

      await fetchEntities({ catalogUrl: 'https://backstage.example.com' });

      expect(mockFetch).toHaveBeenCalledTimes(1);
      const calledUrl = mockFetch.mock.calls[0][0] as string;
      expect(calledUrl).toContain('https://backstage.example.com');
    });
  });

  describe('request construction', () => {
    it('calls the catalog entities endpoint', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => [],
      });

      await fetchEntities({ catalogUrl: 'http://localhost:7007' });

      const calledUrl = mockFetch.mock.calls[0][0] as string;
      expect(calledUrl).toBe('http://localhost:7007/api/catalog/entities');
    });

    it('includes the Authorization header when a token is provided', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => [],
      });

      await fetchEntities({
        catalogUrl: 'http://localhost:7007',
        token: 'my-secret-token',
      });

      const calledOptions = mockFetch.mock.calls[0][1] as RequestInit;
      expect(calledOptions.headers).toEqual(
        expect.objectContaining({ Authorization: 'Bearer my-secret-token' }),
      );
    });

    it('omits the Authorization header when no token is provided', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => [],
      });

      await fetchEntities({ catalogUrl: 'http://localhost:7007' });

      const calledOptions = mockFetch.mock.calls[0][1] as RequestInit;
      const headers = calledOptions.headers as Record<string, string>;
      expect(headers.Authorization).toBeUndefined();
    });

    it('passes filter as a query parameter', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => [],
      });

      await fetchEntities({
        catalogUrl: 'http://localhost:7007',
        filter: 'kind=API',
      });

      const calledUrl = mockFetch.mock.calls[0][0] as string;
      expect(calledUrl).toContain('filter=kind%3DAPI');
    });

    it('omits filter parameter when not provided', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => [],
      });

      await fetchEntities({ catalogUrl: 'http://localhost:7007' });

      const calledUrl = mockFetch.mock.calls[0][0] as string;
      expect(calledUrl).not.toContain('filter=');
    });

    it('preserves a path prefix on the catalog URL (reverse proxy mount)', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => [],
      });

      await fetchEntities({ catalogUrl: 'http://localhost:7007/backstage' });

      const calledUrl = mockFetch.mock.calls[0][0] as string;
      expect(calledUrl).toBe(
        'http://localhost:7007/backstage/api/catalog/entities',
      );
    });

    it('preserves a path prefix that already ends with a slash', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => [],
      });

      await fetchEntities({ catalogUrl: 'http://localhost:7007/backstage/' });

      const calledUrl = mockFetch.mock.calls[0][0] as string;
      expect(calledUrl).toBe(
        'http://localhost:7007/backstage/api/catalog/entities',
      );
    });
  });

  describe('response handling', () => {
    it('returns parsed entities on success', async () => {
      const entities = [
        { kind: 'API', metadata: { name: 'test' } },
        { kind: 'Component', metadata: { name: 'test2' } },
      ];

      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => entities,
      });

      const result = await fetchEntities({
        catalogUrl: 'http://localhost:7007',
      });

      expect(result).toEqual(entities);
    });

    it('throws on non-200 response', async () => {
      mockFetch.mockResolvedValue({
        ok: false,
        status: 401,
        statusText: 'Unauthorized',
      });

      await expect(
        fetchEntities({ catalogUrl: 'http://localhost:7007' }),
      ).rejects.toThrow('Catalog API request failed: 401 Unauthorized');
    });

    it('throws on non-200 response with server error', async () => {
      mockFetch.mockResolvedValue({
        ok: false,
        status: 500,
        statusText: 'Internal Server Error',
      });

      await expect(
        fetchEntities({ catalogUrl: 'http://localhost:7007' }),
      ).rejects.toThrow(
        'Catalog API request failed: 500 Internal Server Error',
      );
    });

    it('throws when the response is not an array', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => ({ items: [] }),
      });

      await expect(
        fetchEntities({ catalogUrl: 'http://localhost:7007' }),
      ).rejects.toThrow('unexpected response shape');
    });

    it('throws when array items are missing required entity fields', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => [{ notAnEntity: true }],
      });

      await expect(
        fetchEntities({ catalogUrl: 'http://localhost:7007' }),
      ).rejects.toThrow('unexpected response shape');
    });
  });
});
