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
  advanceAfterResolvedCursor,
  applyMaxEntriesSoftStop,
  buildPageRequestUrl,
  buildServersEndpoint,
  fetchRegistryPage,
  fetchRegistryServers,
  isAtEndCursor,
  isRedirectStatus,
  McpRegistryClientError,
  parseServersEndpointUrl,
  resolveNextCursor,
  resolveRedirectUrl,
  truncateErrorBody,
  assertRequestHostAllowed,
  validateRedirectTarget,
} from './client';
import type { McpRegistryListResponse } from './client';
import { createMockServerDoc } from './testUtils';

function mockHeaders(entries: Record<string, string> = {}): Headers {
  return {
    get: (name: string) => {
      const key = Object.keys(entries).find(
        k => k.toLowerCase() === name.toLowerCase(),
      );
      return key ? entries[key] : null;
    },
  } as Headers;
}

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

    expect(result.servers).toHaveLength(1);
    expect(result.servers[0].server.name).toBe('test/server-a');
    expect(result.resumeCursor).toBeUndefined();
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

    expect(result.servers).toHaveLength(2);
    expect(result.resumeCursor).toBeUndefined();
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

    expect(result.servers).toHaveLength(1);
    expect(result.resumeCursor).toBeUndefined();
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

    expect(result.servers).toHaveLength(1);
    expect(result.resumeCursor).toBeUndefined();
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

  it('returns a resumeCursor when default pageLimit of 10 is reached with more pages', async () => {
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

    const result = await fetchRegistryServers({
      baseUrl: 'https://registry.example.com',
      apiVersion: 'v1',
      pageLimit: 10,
      fetchApi: fn,
    });

    expect(result.servers).toHaveLength(10);
    expect(result.resumeCursor).toBe('cursor-10');
    expect(fn).toHaveBeenCalledTimes(10);
  });

  it('returns a resumeCursor when configured pageLimit is reached with more pages', async () => {
    const page1: McpRegistryListResponse = {
      servers: [{ server: createMockServerDoc('test/server-a', '1.0.0') }],
      metadata: { count: 3, nextCursor: 'cursor-1' },
    };
    const page2: McpRegistryListResponse = {
      servers: [{ server: createMockServerDoc('test/server-b', '2.0.0') }],
      metadata: { count: 3, nextCursor: 'cursor-2' },
    };
    const fn = mockFetch([{ body: page1 }, { body: page2 }]);

    const result = await fetchRegistryServers({
      baseUrl: 'https://registry.example.com',
      apiVersion: 'v1',
      pageLimit: 2,
      fetchApi: fn,
    });

    expect(result.servers).toHaveLength(2);
    expect(result.resumeCursor).toBe('cursor-2');
    expect(fn).toHaveBeenCalledTimes(2);
  });

  it('resumes from startCursor on a follow-up fetch', async () => {
    const page3: McpRegistryListResponse = {
      servers: [{ server: createMockServerDoc('test/server-c', '3.0.0') }],
      metadata: { count: 3 },
    };
    const fn = mockFetch([{ body: page3 }]);
    const seenCursors = new Set(['cursor-1', 'cursor-2']);

    const result = await fetchRegistryServers({
      baseUrl: 'https://registry.example.com',
      apiVersion: 'v1',
      pageLimit: 2,
      startCursor: 'cursor-2',
      seenCursors,
      priorEntryCount: 2,
      fetchApi: fn,
    });

    expect(result.servers).toHaveLength(1);
    expect(result.servers[0].server.name).toBe('test/server-c');
    expect(result.resumeCursor).toBeUndefined();
    expect(result.seenCursors).toEqual(new Set(['cursor-1', 'cursor-2']));
    // Input options set must not be mutated.
    expect(seenCursors).toEqual(new Set(['cursor-1', 'cursor-2']));
    expect(fn).toHaveBeenCalledTimes(1);
    const calledUrl = fn.mock.calls[0][0] as string;
    expect(calledUrl).toContain('cursor=cursor-2');
  });

  it('returns an updated seenCursors set without mutating the input', async () => {
    const page1: McpRegistryListResponse = {
      servers: [{ server: createMockServerDoc('test/server-a', '1.0.0') }],
      metadata: { count: 2, nextCursor: 'cursor-1' },
    };
    const page2: McpRegistryListResponse = {
      servers: [{ server: createMockServerDoc('test/server-b', '2.0.0') }],
      metadata: { count: 2 },
    };
    const fn = mockFetch([{ body: page1 }, { body: page2 }]);
    const seenCursors = new Set<string>();

    const result = await fetchRegistryServers({
      baseUrl: 'https://registry.example.com',
      apiVersion: 'v1',
      pageLimit: 10,
      seenCursors,
      fetchApi: fn,
    });

    expect(result.seenCursors).toEqual(new Set(['cursor-1']));
    expect(seenCursors.size).toBe(0);
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

  it('soft-stops at maxEntries and returns endCursor without the tipping page', async () => {
    const page1: McpRegistryListResponse = {
      servers: Array.from({ length: 40 }, (_, i) => ({
        server: createMockServerDoc(`test/server-${i}`, '1.0.0'),
      })),
      metadata: { count: 100, nextCursor: 'cursor-1' },
    };
    const page2: McpRegistryListResponse = {
      servers: Array.from({ length: 40 }, (_, i) => ({
        server: createMockServerDoc(`test/server-${i + 40}`, '1.0.0'),
      })),
      metadata: { count: 100, nextCursor: 'cursor-2' },
    };
    const fn = mockFetch([{ body: page1 }, { body: page2 }]);

    const result = await fetchRegistryServers({
      baseUrl: 'https://registry.example.com',
      apiVersion: 'v1',
      pageLimit: 10,
      maxEntries: 50,
      fetchApi: fn,
    });

    expect(result.servers).toHaveLength(40);
    expect(result.resumeCursor).toBeUndefined();
    expect(result.endCursor).toBe('cursor-1');
    expect(fn).toHaveBeenCalledTimes(2);
  });

  it('keeps a single oversized first page and ends at its nextCursor', async () => {
    const largePage: McpRegistryListResponse = {
      servers: Array.from({ length: 100 }, (_, i) => ({
        server: createMockServerDoc(`test/server-${i}`, '1.0.0'),
      })),
      metadata: { count: 100, nextCursor: 'cursor-next' },
    };
    const fn = mockFetch([{ body: largePage }]);

    const result = await fetchRegistryServers({
      baseUrl: 'https://registry.example.com',
      apiVersion: 'v1',
      pageLimit: 10,
      maxEntries: 50,
      fetchApi: fn,
    });

    expect(result.servers).toHaveLength(100);
    expect(result.endCursor).toBe('cursor-next');
  });

  it('succeeds when hostAllowList includes the baseUrl hostname', async () => {
    const body: McpRegistryListResponse = {
      servers: [{ server: createMockServerDoc('test/server-a', '1.0.0') }],
      metadata: { count: 1 },
    };
    const fn = mockFetch([{ body }]);

    const result = await fetchRegistryServers({
      baseUrl: 'https://registry.example.com',
      apiVersion: 'v1',
      pageLimit: 10,
      hostAllowList: ['registry.example.com'],
      fetchApi: fn,
    });

    expect(result.servers).toHaveLength(1);
  });

  it('throws when hostAllowList does not include the baseUrl hostname', async () => {
    const fn = mockFetch([]);

    await expect(
      fetchRegistryServers({
        baseUrl: 'https://registry.example.com',
        apiVersion: 'v1',
        pageLimit: 10,
        hostAllowList: ['other.example.com'],
        fetchApi: fn,
      }),
    ).rejects.toThrow(/not in the configured hostAllowList/);

    // Verify no fetch was attempted
    expect(fn).not.toHaveBeenCalled();
  });

  it('throws when a redirect Location points to a disallowed host', async () => {
    const fn = jest.fn().mockResolvedValueOnce({
      ok: false,
      status: 302,
      headers: mockHeaders({
        Location: 'https://evil.example.com/v1/servers',
      }),
      json: async () => ({}),
      text: async () => '',
    } as unknown as Response);

    await expect(
      fetchRegistryServers({
        baseUrl: 'https://registry.example.com',
        apiVersion: 'v1',
        pageLimit: 10,
        hostAllowList: ['registry.example.com'],
        fetchApi: fn,
      }),
    ).rejects.toThrow(/not in the configured hostAllowList/);

    expect(fn).toHaveBeenCalledTimes(1);
    expect(fn).toHaveBeenCalledWith('https://registry.example.com/v1/servers', {
      redirect: 'manual',
    });
  });

  it('follows an allowlisted redirect Location before reading the body', async () => {
    const body: McpRegistryListResponse = {
      servers: [{ server: createMockServerDoc('test/server-a', '1.0.0') }],
      metadata: { count: 1 },
    };
    const fn = jest
      .fn()
      .mockResolvedValueOnce({
        ok: false,
        status: 302,
        headers: mockHeaders({
          Location: 'https://registry.example.com/v1/servers?redirected=1',
        }),
        json: async () => ({}),
        text: async () => '',
      } as unknown as Response)
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        headers: mockHeaders(),
        json: async () => body,
        text: async () => JSON.stringify(body),
      } as unknown as Response);

    const result = await fetchRegistryServers({
      baseUrl: 'https://registry.example.com',
      apiVersion: 'v1',
      pageLimit: 10,
      hostAllowList: ['registry.example.com'],
      fetchApi: fn,
    });

    expect(result.servers).toHaveLength(1);
    expect(fn).toHaveBeenCalledTimes(2);
    expect(fn).toHaveBeenNthCalledWith(
      2,
      'https://registry.example.com/v1/servers?redirected=1',
      { redirect: 'manual' },
    );
  });

  it('does not enforce maxEntries when unset', async () => {
    const largePage: McpRegistryListResponse = {
      servers: Array.from({ length: 100 }, (_, i) => ({
        server: createMockServerDoc(`test/server-${i}`, '1.0.0'),
      })),
      metadata: { count: 100 },
    };
    const fn = mockFetch([{ body: largePage }]);

    const result = await fetchRegistryServers({
      baseUrl: 'https://registry.example.com',
      apiVersion: 'v1',
      pageLimit: 10,
      fetchApi: fn,
    });

    expect(result.servers).toHaveLength(100);
    expect(result.resumeCursor).toBeUndefined();
  });

  it('counts priorEntryCount toward maxEntries soft-stop', async () => {
    const page: McpRegistryListResponse = {
      servers: Array.from({ length: 10 }, (_, i) => ({
        server: createMockServerDoc(`test/server-${i}`, '1.0.0'),
      })),
      metadata: { count: 10, nextCursor: 'cursor-x' },
    };
    const fn = mockFetch([{ body: page }]);

    const result = await fetchRegistryServers({
      baseUrl: 'https://registry.example.com',
      apiVersion: 'v1',
      pageLimit: 10,
      maxEntries: 50,
      priorEntryCount: 45,
      startCursor: 'cursor-prior',
      fetchApi: fn,
    });

    expect(result.servers).toHaveLength(0);
    expect(result.endCursor).toBe('cursor-prior');
    expect(result.resumeCursor).toBeUndefined();
  });

  it('stops at a supplied endCursor instead of walking further', async () => {
    const page1: McpRegistryListResponse = {
      servers: [{ server: createMockServerDoc('test/server-a', '1.0.0') }],
      metadata: { count: 3, nextCursor: 'cursor-end' },
    };
    const fn = mockFetch([{ body: page1 }]);

    const result = await fetchRegistryServers({
      baseUrl: 'https://registry.example.com',
      apiVersion: 'v1',
      pageLimit: 10,
      endCursor: 'cursor-end',
      fetchApi: fn,
    });

    expect(result.servers).toHaveLength(1);
    expect(result.resumeCursor).toBeUndefined();
    expect(fn).toHaveBeenCalledTimes(1);
  });
});

describe('parseServersEndpointUrl', () => {
  it('returns a URL for a valid endpoint', () => {
    const url = parseServersEndpointUrl('https://registry.example.com', 'v1');
    expect(url.toString()).toBe('https://registry.example.com/v1/servers');
  });

  it('throws McpRegistryClientError for an invalid endpoint URL', () => {
    expect(() => parseServersEndpointUrl('://bad', 'v1')).toThrow(
      McpRegistryClientError,
    );
    expect(() => parseServersEndpointUrl('://bad', 'v1')).toThrow(
      /Invalid MCP Registry endpoint URL/,
    );
  });
});

describe('buildPageRequestUrl', () => {
  const endpoint = new URL('https://registry.example.com/v1/servers');

  it('returns the endpoint when cursor and pageSize are omitted', () => {
    expect(buildPageRequestUrl(endpoint).toString()).toBe(
      'https://registry.example.com/v1/servers',
    );
  });

  it('adds cursor and limit query params when provided', () => {
    const url = buildPageRequestUrl(endpoint, 'abc', 25);
    expect(url.searchParams.get('cursor')).toBe('abc');
    expect(url.searchParams.get('limit')).toBe('25');
  });

  it('does not mutate the original endpoint URL', () => {
    buildPageRequestUrl(endpoint, 'abc', 25);
    expect(endpoint.search).toBe('');
  });
});

describe('truncateErrorBody', () => {
  it('returns the body unchanged when within the limit', () => {
    expect(truncateErrorBody('short')).toBe('short');
  });

  it('truncates long bodies and appends a marker', () => {
    const raw = 'a'.repeat(300);
    const truncated = truncateErrorBody(raw, 10);
    expect(truncated).toBe(`${'a'.repeat(10)}…(truncated)`);
  });
});

describe('fetchRegistryPage', () => {
  it('returns a validated list response', async () => {
    const body: McpRegistryListResponse = {
      servers: [{ server: createMockServerDoc('a/b', '1.0.0') }],
      metadata: { count: 1 },
    };
    const doFetch = jest.fn().mockResolvedValue({
      ok: true,
      status: 200,
      headers: mockHeaders(),
      json: async () => body,
      text: async () => JSON.stringify(body),
    } as unknown as Response);

    await expect(
      fetchRegistryPage(
        doFetch,
        new URL('https://registry.example.com/v1/servers'),
      ),
    ).resolves.toEqual(body);
    expect(doFetch).toHaveBeenCalledWith(
      'https://registry.example.com/v1/servers',
      { redirect: 'manual' },
    );
  });

  it('throws when the servers field is missing', async () => {
    const doFetch = jest.fn().mockResolvedValue({
      ok: true,
      status: 200,
      headers: mockHeaders(),
      json: async () => ({ metadata: {} }),
      text: async () => '{}',
    } as unknown as Response);

    await expect(
      fetchRegistryPage(
        doFetch,
        new URL('https://registry.example.com/v1/servers'),
      ),
    ).rejects.toThrow(/missing "servers" array/);
  });

  it('throws when redirect Location points to a disallowed host', async () => {
    const doFetch = jest.fn().mockResolvedValue({
      ok: false,
      status: 302,
      headers: mockHeaders({
        Location: 'https://evil.example.com/v1/servers',
      }),
      json: async () => ({}),
      text: async () => '',
    } as unknown as Response);

    await expect(
      fetchRegistryPage(
        doFetch,
        new URL('https://registry.example.com/v1/servers'),
        ['registry.example.com'],
      ),
    ).rejects.toThrow(/not in the configured hostAllowList/);
    expect(doFetch).toHaveBeenCalledTimes(1);
  });

  it('follows redirect Location when the target host is allowlisted', async () => {
    const body: McpRegistryListResponse = {
      servers: [{ server: createMockServerDoc('a/b', '1.0.0') }],
      metadata: { count: 1 },
    };
    const doFetch = jest
      .fn()
      .mockResolvedValueOnce({
        ok: false,
        status: 301,
        headers: mockHeaders({ Location: '/v1/servers-mirror' }),
        json: async () => ({}),
        text: async () => '',
      } as unknown as Response)
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        headers: mockHeaders(),
        json: async () => body,
        text: async () => JSON.stringify(body),
      } as unknown as Response);

    await expect(
      fetchRegistryPage(
        doFetch,
        new URL('https://registry.example.com/v1/servers'),
        ['registry.example.com'],
      ),
    ).resolves.toEqual(body);
    expect(doFetch).toHaveBeenNthCalledWith(
      2,
      'https://registry.example.com/v1/servers-mirror',
      { redirect: 'manual' },
    );
  });

  it('throws when a redirect is missing the Location header', async () => {
    const doFetch = jest.fn().mockResolvedValue({
      ok: false,
      status: 302,
      headers: mockHeaders(),
      json: async () => ({}),
      text: async () => '',
    } as unknown as Response);

    await expect(
      fetchRegistryPage(
        doFetch,
        new URL('https://registry.example.com/v1/servers'),
      ),
    ).rejects.toThrow(/without a Location header/);
  });

  it('throws when redirect Location uses a non-http(s) protocol', async () => {
    const doFetch = jest.fn().mockResolvedValue({
      ok: false,
      status: 302,
      headers: mockHeaders({ Location: 'file:///etc/passwd' }),
      json: async () => ({}),
      text: async () => '',
    } as unknown as Response);

    await expect(
      fetchRegistryPage(
        doFetch,
        new URL('https://registry.example.com/v1/servers'),
      ),
    ).rejects.toThrow(/disallowed protocol/);
  });

  it('throws after exceeding the redirect hop limit', async () => {
    const doFetch = jest.fn().mockImplementation(async () => ({
      ok: false,
      status: 302,
      headers: mockHeaders({
        Location: 'https://registry.example.com/v1/servers?next=1',
      }),
      json: async () => ({}),
      text: async () => '',
    }));

    await expect(
      fetchRegistryPage(
        doFetch,
        new URL('https://registry.example.com/v1/servers'),
      ),
    ).rejects.toThrow(/exceeded 10 redirects/);
    expect(doFetch).toHaveBeenCalledTimes(11);
  });

  it('follows redirects when hostAllowList is omitted', async () => {
    const body: McpRegistryListResponse = {
      servers: [{ server: createMockServerDoc('a/b', '1.0.0') }],
      metadata: { count: 1 },
    };
    const doFetch = jest
      .fn()
      .mockResolvedValueOnce({
        ok: false,
        status: 307,
        headers: mockHeaders({
          Location: 'https://any-host.example.com/v1/servers',
        }),
        json: async () => ({}),
        text: async () => '',
      } as unknown as Response)
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        headers: mockHeaders(),
        json: async () => body,
        text: async () => JSON.stringify(body),
      } as unknown as Response);

    await expect(
      fetchRegistryPage(
        doFetch,
        new URL('https://registry.example.com/v1/servers'),
      ),
    ).resolves.toEqual(body);
  });

  it('follows a multi-hop redirect chain when every hop is allowlisted', async () => {
    const body: McpRegistryListResponse = {
      servers: [{ server: createMockServerDoc('a/b', '1.0.0') }],
      metadata: { count: 1 },
    };
    const doFetch = jest
      .fn()
      .mockResolvedValueOnce({
        ok: false,
        status: 302,
        headers: mockHeaders({ Location: '/hop-1' }),
        json: async () => ({}),
        text: async () => '',
      } as unknown as Response)
      .mockResolvedValueOnce({
        ok: false,
        status: 308,
        headers: mockHeaders({
          Location: 'https://registry.example.com/hop-2',
        }),
        json: async () => ({}),
        text: async () => '',
      } as unknown as Response)
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        headers: mockHeaders(),
        json: async () => body,
        text: async () => JSON.stringify(body),
      } as unknown as Response);

    await expect(
      fetchRegistryPage(
        doFetch,
        new URL('https://registry.example.com/v1/servers'),
        ['registry.example.com'],
      ),
    ).resolves.toEqual(body);
    expect(doFetch).toHaveBeenCalledTimes(3);
    expect(doFetch).toHaveBeenNthCalledWith(
      2,
      'https://registry.example.com/hop-1',
      { redirect: 'manual' },
    );
    expect(doFetch).toHaveBeenNthCalledWith(
      3,
      'https://registry.example.com/hop-2',
      { redirect: 'manual' },
    );
  });

  it('throws on an invalid Location without issuing a follow-up request', async () => {
    const doFetch = jest.fn().mockResolvedValue({
      ok: false,
      status: 302,
      headers: mockHeaders({ Location: 'http://[' }),
      json: async () => ({}),
      text: async () => '',
    } as unknown as Response);

    await expect(
      fetchRegistryPage(
        doFetch,
        new URL('https://registry.example.com/v1/servers'),
      ),
    ).rejects.toThrow(/invalid redirect Location/);
    expect(doFetch).toHaveBeenCalledTimes(1);
  });

  it('truncates non-2xx response bodies in the error', async () => {
    const doFetch = jest.fn().mockResolvedValue({
      ok: false,
      status: 500,
      headers: mockHeaders(),
      json: async () => ({}),
      text: async () => 'x'.repeat(300),
    } as unknown as Response);

    await expect(
      fetchRegistryPage(
        doFetch,
        new URL('https://registry.example.com/v1/servers'),
      ),
    ).rejects.toThrow(/…\(truncated\)/);
  });
});

describe('redirect helpers', () => {
  it('recognizes redirect status codes', () => {
    expect(isRedirectStatus(301)).toBe(true);
    expect(isRedirectStatus(302)).toBe(true);
    expect(isRedirectStatus(303)).toBe(true);
    expect(isRedirectStatus(307)).toBe(true);
    expect(isRedirectStatus(308)).toBe(true);
    expect(isRedirectStatus(200)).toBe(false);
    expect(isRedirectStatus(404)).toBe(false);
  });

  it('resolves absolute and relative Location values', () => {
    const current = new URL('https://registry.example.com/v1/servers');
    expect(
      resolveRedirectUrl(current, 'https://other.example.com/path').toString(),
    ).toBe('https://other.example.com/path');
    expect(resolveRedirectUrl(current, '/v2/servers').toString()).toBe(
      'https://registry.example.com/v2/servers',
    );
  });

  it('throws McpRegistryClientError for an invalid Location value', () => {
    expect(() =>
      resolveRedirectUrl(
        new URL('https://registry.example.com/v1/servers'),
        'http://[',
      ),
    ).toThrow(McpRegistryClientError);
    expect(() =>
      resolveRedirectUrl(
        new URL('https://registry.example.com/v1/servers'),
        'http://[',
      ),
    ).toThrow(/invalid redirect Location/);
  });

  it('rejects non-http(s) redirect targets', () => {
    expect(() =>
      validateRedirectTarget(new URL('ftp://registry.example.com/v1/servers')),
    ).toThrow(/disallowed protocol/);
  });

  it('allows http(s) redirect targets and enforces hostAllowList', () => {
    expect(() =>
      validateRedirectTarget(
        new URL('https://registry.example.com/v1/servers'),
        ['registry.example.com'],
      ),
    ).not.toThrow();
    expect(() =>
      validateRedirectTarget(
        new URL('http://registry.example.com/v1/servers'),
        ['registry.example.com'],
      ),
    ).not.toThrow();
    expect(() =>
      validateRedirectTarget(new URL('https://evil.example.com/v1/servers'), [
        'registry.example.com',
      ]),
    ).toThrow(/not in the configured hostAllowList/);
  });
});

describe('assertRequestHostAllowed', () => {
  it('does nothing when hostAllowList is undefined', () => {
    expect(() =>
      assertRequestHostAllowed(
        new URL('https://registry.example.com/v1/servers'),
        undefined,
      ),
    ).not.toThrow();
  });

  it('passes when hostname is in the allow list', () => {
    expect(() =>
      assertRequestHostAllowed(
        new URL('https://registry.example.com/v1/servers'),
        ['registry.example.com'],
      ),
    ).not.toThrow();
  });

  it('throws McpRegistryClientError when hostname is not in the allow list', () => {
    expect(() =>
      assertRequestHostAllowed(new URL('https://evil.example.com/v1/servers'), [
        'registry.example.com',
      ]),
    ).toThrow(McpRegistryClientError);
    expect(() =>
      assertRequestHostAllowed(new URL('https://evil.example.com/v1/servers'), [
        'registry.example.com',
      ]),
    ).toThrow(/not in the configured hostAllowList/);
  });

  it('matches case-insensitively', () => {
    expect(() =>
      assertRequestHostAllowed(
        new URL('https://Registry.Example.COM/v1/servers'),
        ['registry.example.com'],
      ),
    ).not.toThrow();
  });
});

describe('resolveNextCursor', () => {
  it('returns complete when nextCursor is absent or empty', () => {
    const seen = new Set<string>();
    expect(resolveNextCursor(undefined, seen, 1, 10)).toEqual({
      status: 'complete',
    });
    expect(resolveNextCursor(null, seen, 1, 10)).toEqual({
      status: 'complete',
    });
    expect(resolveNextCursor('', seen, 1, 10)).toEqual({
      status: 'complete',
    });
    expect(seen.size).toBe(0);
  });

  it('returns continue without mutating the seen set', () => {
    const seen = new Set<string>();
    expect(resolveNextCursor('page-2', seen, 1, 10)).toEqual({
      status: 'continue',
      cursor: 'page-2',
    });
    expect(seen.size).toBe(0);
  });

  it('throws on a repeated cursor', () => {
    const seen = new Set(['page-2']);
    expect(() => resolveNextCursor('page-2', seen, 2, 10)).toThrow(
      /repeated cursor/,
    );
  });

  it('returns pageLimitReached without mutating the seen set', () => {
    const seen = new Set<string>();
    expect(resolveNextCursor('page-2', seen, 1, 1)).toEqual({
      status: 'pageLimitReached',
      resumeCursor: 'page-2',
    });
    expect(seen.size).toBe(0);
  });
});

describe('applyMaxEntriesSoftStop', () => {
  it('drops the tipping page and ends at the page cursor', () => {
    const tipped = [{ server: createMockServerDoc('a/tip', '1.0.0') }];
    const prior = [{ server: createMockServerDoc('a/keep', '1.0.0') }];
    expect(
      applyMaxEntriesSoftStop({
        serversIncludingTippedPage: [...prior, ...tipped],
        tippedPageSize: 1,
        priorEntryCount: 0,
        pageCursor: 'cursor-tip',
        startCursor: undefined,
        tippedNextCursor: 'cursor-next',
      }),
    ).toEqual({
      servers: prior,
      endCursor: 'cursor-tip',
    });
  });

  it('keeps a single oversized tipped page and ends at its next cursor', () => {
    const tipped = [
      { server: createMockServerDoc('a/a', '1.0.0') },
      { server: createMockServerDoc('a/b', '1.0.0') },
    ];
    expect(
      applyMaxEntriesSoftStop({
        serversIncludingTippedPage: tipped,
        tippedPageSize: 2,
        priorEntryCount: 0,
        pageCursor: undefined,
        startCursor: undefined,
        tippedNextCursor: 'cursor-next',
      }),
    ).toEqual({
      servers: tipped,
      endCursor: 'cursor-next',
    });
  });
});

describe('advanceAfterResolvedCursor', () => {
  it('maps complete without recording a cursor', () => {
    const seen = new Set<string>();
    expect(
      advanceAfterResolvedCursor({ status: 'complete' }, seen, undefined),
    ).toEqual({ action: 'complete' });
    expect(seen.size).toBe(0);
  });

  it('records and resumes when pageLimit is reached', () => {
    const seen = new Set<string>();
    expect(
      advanceAfterResolvedCursor(
        { status: 'pageLimitReached', resumeCursor: 'cursor-2' },
        seen,
        undefined,
      ),
    ).toEqual({ action: 'resume', resumeCursor: 'cursor-2' });
    expect(seen.has('cursor-2')).toBe(true);
  });

  it('stops at endCursor instead of resuming', () => {
    const seen = new Set<string>();
    expect(
      advanceAfterResolvedCursor(
        { status: 'pageLimitReached', resumeCursor: 'end' },
        seen,
        'end',
      ),
    ).toEqual({ action: 'stopAtEnd' });
    expect(seen.has('end')).toBe(true);
  });

  it('continues paging and records the cursor', () => {
    const seen = new Set<string>();
    expect(
      advanceAfterResolvedCursor(
        { status: 'continue', cursor: 'cursor-2' },
        seen,
        undefined,
      ),
    ).toEqual({ action: 'continue', cursor: 'cursor-2' });
    expect(seen.has('cursor-2')).toBe(true);
  });
});

describe('isAtEndCursor', () => {
  it('is true only when both values are set and equal', () => {
    expect(isAtEndCursor('end', 'end')).toBe(true);
    expect(isAtEndCursor('end', 'other')).toBe(false);
    expect(isAtEndCursor(undefined, 'end')).toBe(false);
    expect(isAtEndCursor('end', undefined)).toBe(false);
  });
});
