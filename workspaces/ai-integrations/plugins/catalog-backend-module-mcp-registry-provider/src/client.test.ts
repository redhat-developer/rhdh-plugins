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

import {
  buildServersEndpoint,
  fetchRegistryServers,
  McpRegistryClientError,
} from './client';
import type { McpRegistryListResponse } from './client';
import { createMockServerDoc } from './testUtils';

describe('buildServersEndpoint', () => {
  it('constructs endpoint without trailing slash', () => {
    expect(buildServersEndpoint('https://registry.example.com', 'v1')).toBe(
      'https://registry.example.com/v1/servers',
    );
  });

  it('constructs endpoint with trailing slash on baseUrl', () => {
    expect(buildServersEndpoint('https://registry.example.com/', 'v0')).toBe(
      'https://registry.example.com/v0/servers',
    );
  });

  it('handles multiple trailing slashes', () => {
    expect(buildServersEndpoint('https://registry.example.com///', 'v1')).toBe(
      'https://registry.example.com/v1/servers',
    );
  });
});

describe('fetchRegistryServers', () => {
  function mockFetch(
    responses: Array<{
      status?: number;
      body?: McpRegistryListResponse | string;
      throws?: boolean;
    }>,
  ): jest.Mock {
    const fn = jest.fn();
    for (const resp of responses) {
      if (resp.throws) {
        fn.mockRejectedValueOnce(new Error('network error'));
      } else {
        fn.mockResolvedValueOnce({
          ok: (resp.status ?? 200) >= 200 && (resp.status ?? 200) < 300,
          status: resp.status ?? 200,
          json: async () => {
            if (typeof resp.body === 'string') {
              throw new Error('Invalid JSON');
            }
            return resp.body;
          },
          text: async () =>
            typeof resp.body === 'string'
              ? resp.body
              : JSON.stringify(resp.body),
        } as unknown as Response);
      }
    }
    return fn;
  }

  it('fetches a single page with no nextCursor', async () => {
    const body: McpRegistryListResponse = {
      servers: [{ server: createMockServerDoc('test/server-a', '1.0.0') }],
      metadata: { count: 1 },
    };
    const fn = mockFetch([{ body }]);

    const result = await fetchRegistryServers({
      baseUrl: 'https://registry.example.com',
      apiVersion: 'v1',
      pageLimit: 10,
      fetchApi: fn,
    });

    expect(result).toHaveLength(1);
    expect(result[0].server.name).toBe('test/server-a');
    expect(fn).toHaveBeenCalledTimes(1);
    // Verify no limit param when pageSize is omitted
    const calledUrl = fn.mock.calls[0][0] as string;
    expect(calledUrl).not.toContain('limit=');
  });

  it('traverses multiple pages via cursor', async () => {
    const page1: McpRegistryListResponse = {
      servers: [{ server: createMockServerDoc('test/server-a', '1.0.0') }],
      metadata: { count: 2, nextCursor: 'cursor-abc' },
    };
    const page2: McpRegistryListResponse = {
      servers: [{ server: createMockServerDoc('test/server-b', '2.0.0') }],
      metadata: { count: 2 },
    };
    const fn = mockFetch([{ body: page1 }, { body: page2 }]);

    const result = await fetchRegistryServers({
      baseUrl: 'https://registry.example.com',
      apiVersion: 'v1',
      pageLimit: 10,
      fetchApi: fn,
    });

    expect(result).toHaveLength(2);
    expect(fn).toHaveBeenCalledTimes(2);
    // Second call should include cursor
    const secondUrl = fn.mock.calls[1][0] as string;
    expect(secondUrl).toContain('cursor=cursor-abc');
  });

  it('stops on null nextCursor', async () => {
    const body: McpRegistryListResponse = {
      servers: [{ server: createMockServerDoc('test/server-a', '1.0.0') }],
      metadata: { count: 1, nextCursor: null },
    };
    const fn = mockFetch([{ body }]);

    const result = await fetchRegistryServers({
      baseUrl: 'https://registry.example.com',
      apiVersion: 'v1',
      pageLimit: 10,
      fetchApi: fn,
    });

    expect(result).toHaveLength(1);
    expect(fn).toHaveBeenCalledTimes(1);
  });

  it('stops on empty string nextCursor', async () => {
    const body: McpRegistryListResponse = {
      servers: [{ server: createMockServerDoc('test/server-a', '1.0.0') }],
      metadata: { count: 1, nextCursor: '' },
    };
    const fn = mockFetch([{ body }]);

    const result = await fetchRegistryServers({
      baseUrl: 'https://registry.example.com',
      apiVersion: 'v1',
      pageLimit: 10,
      fetchApi: fn,
    });

    expect(result).toHaveLength(1);
    expect(fn).toHaveBeenCalledTimes(1);
  });

  it('sends pageSize as limit query param on every request', async () => {
    const page1: McpRegistryListResponse = {
      servers: [{ server: createMockServerDoc('test/server-a', '1.0.0') }],
      metadata: { count: 2, nextCursor: 'cursor-xyz' },
    };
    const page2: McpRegistryListResponse = {
      servers: [{ server: createMockServerDoc('test/server-b', '2.0.0') }],
      metadata: { count: 2 },
    };
    const fn = mockFetch([{ body: page1 }, { body: page2 }]);

    await fetchRegistryServers({
      baseUrl: 'https://registry.example.com',
      apiVersion: 'v1',
      pageLimit: 10,
      pageSize: 50,
      fetchApi: fn,
    });

    const firstUrl = fn.mock.calls[0][0] as string;
    const secondUrl = fn.mock.calls[1][0] as string;
    expect(firstUrl).toContain('limit=50');
    expect(secondUrl).toContain('limit=50');
  });

  it('trips on default pageLimit of 10 at the 11th page', async () => {
    const pages = Array.from({ length: 10 }, (_, i) => ({
      body: {
        servers: [{ server: createMockServerDoc(`test/server-${i}`, '1.0.0') }],
        metadata: {
          count: 11,
          nextCursor: `cursor-${i + 1}`,
        },
      } as McpRegistryListResponse,
    }));
    const fn = mockFetch(pages);

    await expect(
      fetchRegistryServers({
        baseUrl: 'https://registry.example.com',
        apiVersion: 'v1',
        pageLimit: 10,
        fetchApi: fn,
      }),
    ).rejects.toThrow(McpRegistryClientError);

    await expect(
      fetchRegistryServers({
        baseUrl: 'https://registry.example.com',
        apiVersion: 'v1',
        pageLimit: 10,
        fetchApi: mockFetch(pages),
      }),
    ).rejects.toThrow(/page limit/i);
  });

  it('trips on configured pageLimit', async () => {
    const page1: McpRegistryListResponse = {
      servers: [{ server: createMockServerDoc('test/server-a', '1.0.0') }],
      metadata: { count: 3, nextCursor: 'cursor-1' },
    };
    const page2: McpRegistryListResponse = {
      servers: [{ server: createMockServerDoc('test/server-b', '2.0.0') }],
      metadata: { count: 3, nextCursor: 'cursor-2' },
    };
    const fn = mockFetch([{ body: page1 }, { body: page2 }]);

    await expect(
      fetchRegistryServers({
        baseUrl: 'https://registry.example.com',
        apiVersion: 'v1',
        pageLimit: 2,
        fetchApi: fn,
      }),
    ).rejects.toThrow(/page limit/i);
  });

  it('detects repeated cursor', async () => {
    const page1: McpRegistryListResponse = {
      servers: [{ server: createMockServerDoc('test/server-a', '1.0.0') }],
      metadata: { count: 2, nextCursor: 'cursor-repeat' },
    };
    const page2: McpRegistryListResponse = {
      servers: [{ server: createMockServerDoc('test/server-b', '2.0.0') }],
      metadata: { count: 2, nextCursor: 'cursor-repeat' },
    };
    const fn = mockFetch([{ body: page1 }, { body: page2 }]);

    await expect(
      fetchRegistryServers({
        baseUrl: 'https://registry.example.com',
        apiVersion: 'v1',
        pageLimit: 10,
        fetchApi: fn,
      }),
    ).rejects.toThrow(/repeated cursor/i);
  });

  it('throws on network error', async () => {
    const fn = mockFetch([{ throws: true }]);

    await expect(
      fetchRegistryServers({
        baseUrl: 'https://registry.example.com',
        apiVersion: 'v1',
        pageLimit: 10,
        fetchApi: fn,
      }),
    ).rejects.toThrow(McpRegistryClientError);
  });

  it('throws on non-2xx status', async () => {
    const fn = mockFetch([{ status: 500, body: 'Server Error' }]);

    await expect(
      fetchRegistryServers({
        baseUrl: 'https://registry.example.com',
        apiVersion: 'v1',
        pageLimit: 10,
        fetchApi: fn,
      }),
    ).rejects.toThrow(/HTTP 500/);
  });

  it('throws on unparseable JSON', async () => {
    const fn = jest.fn().mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => {
        throw new SyntaxError('Unexpected token');
      },
      text: async () => 'not json',
    } as unknown as Response);

    await expect(
      fetchRegistryServers({
        baseUrl: 'https://registry.example.com',
        apiVersion: 'v1',
        pageLimit: 10,
        fetchApi: fn,
      }),
    ).rejects.toThrow(/unparseable JSON/);
  });

  it('passes opaque cursor unchanged', async () => {
    const opaqueToken = 'eyJsYXN0X2lkIjoiYWJjMTIzIn0=';
    const page1: McpRegistryListResponse = {
      servers: [{ server: createMockServerDoc('test/server-a', '1.0.0') }],
      metadata: { count: 2, nextCursor: opaqueToken },
    };
    const page2: McpRegistryListResponse = {
      servers: [{ server: createMockServerDoc('test/server-b', '2.0.0') }],
      metadata: { count: 2 },
    };
    const fn = mockFetch([{ body: page1 }, { body: page2 }]);

    await fetchRegistryServers({
      baseUrl: 'https://registry.example.com',
      apiVersion: 'v1',
      pageLimit: 10,
      fetchApi: fn,
    });

    const secondUrl = fn.mock.calls[1][0] as string;
    // URL encodes the cursor, but the original value should be present
    expect(secondUrl).toContain(`cursor=${encodeURIComponent(opaqueToken)}`);
  });
});
