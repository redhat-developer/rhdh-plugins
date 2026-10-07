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

import type { LoggerService } from '@backstage/backend-plugin-api';
import { discoverQuayRepositories } from './QuayDiscovery';
import type { QuayDiscoveryConfig } from './types';
import { DEFAULT_SKILL_IMAGE_OPTIONS, MAX_DISCOVERY_PAGES } from './types';

const mockLogger: LoggerService = {
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
  debug: jest.fn(),
  child: jest.fn().mockReturnThis(),
};

const baseConfig: QuayDiscoveryConfig = {
  registry: 'quay.io',
  organization: 'test-org',
  tag: 'latest',
};

// Save and restore global fetch
const originalFetch = global.fetch;

afterEach(() => {
  global.fetch = originalFetch;
  jest.restoreAllMocks();
  jest.useRealTimers();
  jest.resetAllMocks();
});

describe('discovery request resilience', () => {
  it('releases an error body even when cleanup fails', async () => {
    const response = new Response('not found', { status: 404 });
    const cancel = jest
      .spyOn(response.body!, 'cancel')
      .mockRejectedValue(new Error('cleanup failed'));
    global.fetch = jest.fn().mockResolvedValue(response);
    await expect(
      discoverQuayRepositories(baseConfig, mockLogger),
    ).rejects.toThrow('404');
    expect(cancel).toHaveBeenCalledTimes(1);
  });

  it('rejects an unsafe redirect before fetching its destination', async () => {
    global.fetch = jest.fn().mockResolvedValue(
      new Response(null, {
        status: 302,
        headers: { location: 'http://localhost/internal' },
      }),
    );
    await expect(
      discoverQuayRepositories(baseConfig, mockLogger),
    ).rejects.toThrow('public HTTPS URL');
    expect(global.fetch).toHaveBeenCalledTimes(1);
  });

  it('retries a wrapped network error', async () => {
    jest.useFakeTimers();
    global.fetch = jest
      .fn()
      .mockRejectedValueOnce(
        Object.assign(new TypeError('fetch failed'), {
          cause: Object.assign(new Error('socket closed'), {
            code: 'ECONNRESET',
          }),
        }),
      )
      .mockResolvedValueOnce(Response.json({ repositories: [] }));
    const result = discoverQuayRepositories(baseConfig, mockLogger).catch(
      error => error,
    );
    await jest.runAllTimersAsync();
    expect(await result).toEqual([]);
  });

  it('gives a timed-out page attempt a fresh signal on retry', async () => {
    jest.useFakeTimers();
    const expired = AbortSignal.abort(
      new DOMException('request timed out', 'TimeoutError'),
    );
    jest
      .spyOn(AbortSignal, 'timeout')
      .mockReturnValueOnce(expired)
      .mockReturnValue(new AbortController().signal);
    global.fetch = jest.fn().mockImplementation(async (_url, init) => {
      init.signal.throwIfAborted();
      return Response.json({ repositories: [] });
    });
    const result = discoverQuayRepositories(baseConfig, mockLogger).catch(
      error => error,
    );
    await jest.runAllTimersAsync();
    expect(await result).toEqual([]);
  });

  it('stops during retry backoff without starting another request', async () => {
    jest.useFakeTimers();
    const parent = new AbortController();
    global.fetch = jest.fn().mockRejectedValue(
      Object.assign(new Error('ECONNRESET'), {
        code: 'ECONNRESET',
      }),
    );
    let settled = false;
    const result = discoverQuayRepositories(
      baseConfig,
      mockLogger,
      parent.signal,
    ).catch(error => {
      settled = true;
      return error;
    });
    await jest.advanceTimersByTimeAsync(0);
    parent.abort();
    await jest.advanceTimersByTimeAsync(0);
    expect(settled).toBe(true);
    expect(global.fetch).toHaveBeenCalledTimes(1);
    await result;
  });

  it('rejects discovery bodies exceeding the default byte limit', async () => {
    global.fetch = jest.fn().mockResolvedValue(
      Response.json({
        repositories: [],
        padding: 'x'.repeat(5 * 1024 * 1024),
      }),
    );
    await expect(
      discoverQuayRepositories(baseConfig, mockLogger),
    ).rejects.toThrow('maximum allowed size');
    expect(global.fetch).toHaveBeenCalledTimes(1);
  });
});

describe('discoverQuayRepositories', () => {
  it('discovers repositories from a single page', async () => {
    global.fetch = jest.fn().mockResolvedValueOnce(
      Response.json({
        repositories: [
          { namespace: 'test-org', name: 'repo-a' },
          { namespace: 'test-org', name: 'repo-b' },
        ],
      }),
    );

    const result = await discoverQuayRepositories(baseConfig, mockLogger);

    expect(result).toEqual([
      'quay.io/test-org/repo-a:latest',
      'quay.io/test-org/repo-b:latest',
    ]);
    expect(global.fetch).toHaveBeenCalledTimes(1);
    const calledUrl = new URL(
      (global.fetch as jest.Mock).mock.calls[0][0] as string,
    );
    expect(calledUrl.searchParams.get('namespace')).toBe('test-org');
    expect(calledUrl.searchParams.get('public')).toBe('true');
  });

  it('follows pagination across multiple pages', async () => {
    const fetchMock = jest
      .fn()
      .mockResolvedValueOnce(
        Response.json({
          repositories: Array.from({ length: 100 }, (_, i) => ({
            namespace: 'test-org',
            name: `repo-${i}`,
          })),
          next_page: 'page2token',
        }),
      )
      .mockResolvedValueOnce(
        Response.json({
          repositories: [
            { namespace: 'test-org', name: 'repo-100' },
            { namespace: 'test-org', name: 'repo-101' },
          ],
        }),
      );
    global.fetch = fetchMock;

    const result = await discoverQuayRepositories(baseConfig, mockLogger);

    expect(result).toHaveLength(102);
    expect(result[0]).toBe('quay.io/test-org/repo-0:latest');
    expect(result).toContain('quay.io/test-org/repo-101:latest');
    expect(result).toEqual([...result].sort());
    expect(fetchMock).toHaveBeenCalledTimes(2);

    // Second call should include next_page parameter
    const secondUrl = new URL(fetchMock.mock.calls[1][0] as string);
    expect(secondUrl.searchParams.get('next_page')).toBe('page2token');
  });

  it('returns empty array for successful empty discovery', async () => {
    global.fetch = jest.fn().mockResolvedValueOnce(
      Response.json({
        repositories: [],
      }),
    );

    const result = await discoverQuayRepositories(baseConfig, mockLogger);

    expect(result).toEqual([]);
  });

  it('uses the configured tag instead of latest', async () => {
    global.fetch = jest.fn().mockResolvedValueOnce(
      Response.json({
        repositories: [{ namespace: 'test-org', name: 'repo-a' }],
      }),
    );

    const config = { ...baseConfig, tag: 'v2.0' };
    const result = await discoverQuayRepositories(config, mockLogger);

    expect(result).toEqual(['quay.io/test-org/repo-a:v2.0']);
  });

  it('throws on listing failure', async () => {
    global.fetch = jest.fn().mockResolvedValueOnce({
      ok: false,
      status: 404,
      statusText: 'Not Found',
    });

    await expect(
      discoverQuayRepositories(baseConfig, mockLogger),
    ).rejects.toThrow(
      'Quay repository list request failed for organization test-org: 404 Not Found',
    );
  });

  it('throws on invalid response body', async () => {
    global.fetch = jest
      .fn()
      .mockResolvedValueOnce(Response.json({ unexpected: 'shape' }));

    await expect(
      discoverQuayRepositories(baseConfig, mockLogger),
    ).rejects.toThrow(
      'Quay repository list response for test-org did not contain a repositories array',
    );
  });

  it('detects pagination cycles', async () => {
    const fetchMock = jest
      .fn()
      .mockResolvedValueOnce(
        Response.json({
          repositories: Array.from({ length: 100 }, (_, i) => ({
            namespace: 'test-org',
            name: `repo-${i}`,
          })),
          next_page: 'cycle-token',
        }),
      )
      .mockResolvedValueOnce(
        Response.json({
          repositories: Array.from({ length: 100 }, (_, i) => ({
            namespace: 'test-org',
            name: `repo-${100 + i}`,
          })),
          next_page: 'cycle-token', // Same token — cycle
        }),
      );
    global.fetch = fetchMock;

    const result = await discoverQuayRepositories(baseConfig, mockLogger);

    // Should have stopped at 2 pages after detecting the cycle
    expect(result).toHaveLength(200);
    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(mockLogger.warn).toHaveBeenCalledWith(
      expect.stringContaining('pagination cycle'),
    );
  });

  it('throws when called with an already-aborted signal', async () => {
    const abortController = new AbortController();
    abortController.abort();

    await expect(
      discoverQuayRepositories(baseConfig, mockLogger, abortController.signal),
    ).rejects.toThrow('This operation was aborted');
  });

  it('rejects repositories whose namespace does not match the configured organization', async () => {
    global.fetch = jest.fn().mockResolvedValueOnce(
      Response.json({
        repositories: [
          { namespace: 'test-org', name: 'valid-repo' },
          { namespace: 'rogue-ns', name: 'sneaky-repo' },
        ],
      }),
    );

    const result = await discoverQuayRepositories(baseConfig, mockLogger);

    expect(result).toEqual(['quay.io/test-org/valid-repo:latest']);
    expect(mockLogger.warn).toHaveBeenCalledWith(
      expect.stringContaining(
        "namespace 'rogue-ns' does not match organization 'test-org'",
      ),
    );
  });

  it('skips repositories with missing name or namespace', async () => {
    global.fetch = jest.fn().mockResolvedValueOnce(
      Response.json({
        repositories: [
          { namespace: 'test-org', name: 'valid-repo' },
          { namespace: '', name: 'no-ns' },
          { namespace: 'test-org', name: '' },
          { name: 'no-ns-field' },
        ],
      }),
    );

    const result = await discoverQuayRepositories(baseConfig, mockLogger);

    expect(result).toEqual(['quay.io/test-org/valid-repo:latest']);
    expect(mockLogger.warn).toHaveBeenCalledWith(
      expect.stringContaining('missing name or namespace'),
    );
  });

  it('skips repositories with invalid name format', async () => {
    global.fetch = jest.fn().mockResolvedValueOnce(
      Response.json({
        repositories: [
          { namespace: 'test-org', name: 'valid-repo' },
          { namespace: 'test-org', name: '../traversal' },
        ],
      }),
    );

    const result = await discoverQuayRepositories(baseConfig, mockLogger);

    expect(result).toEqual(['quay.io/test-org/valid-repo:latest']);
    expect(mockLogger.warn).toHaveBeenCalledWith(
      expect.stringContaining("invalid name '../traversal'"),
    );
  });

  it('retries on transient fetch failure and succeeds', async () => {
    const transientError = new Error('ECONNRESET');
    const fetchMock = jest
      .fn()
      .mockRejectedValueOnce(transientError)
      .mockResolvedValueOnce(
        Response.json({
          repositories: [{ namespace: 'test-org', name: 'repo-a' }],
        }),
      );
    global.fetch = fetchMock;

    const result = await discoverQuayRepositories(baseConfig, mockLogger);

    expect(result).toEqual(['quay.io/test-org/repo-a:latest']);
    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(mockLogger.warn).toHaveBeenCalledWith(
      expect.stringContaining('Transient failure'),
      expect.any(Error),
    );
  }, 10_000);

  it('throws after exhausting retries on persistent transient failure', async () => {
    const transientError = new Error('ECONNREFUSED');
    global.fetch = jest
      .fn()
      .mockRejectedValueOnce(transientError)
      .mockRejectedValueOnce(transientError)
      .mockRejectedValueOnce(transientError);

    await expect(
      discoverQuayRepositories(baseConfig, mockLogger),
    ).rejects.toThrow('ECONNREFUSED');
  }, 15_000);
});

describe('all-tag discovery', () => {
  const allTagsConfig = {
    registry: baseConfig.registry,
    organization: baseConfig.organization,
  };
  const repositories = {
    repositories: [{ namespace: 'test-org', name: 'repo-a' }],
  };

  it('discovers every active tag, retaining aliases with the same digest', async () => {
    global.fetch = jest
      .fn()
      .mockResolvedValueOnce(Response.json(repositories))
      .mockResolvedValueOnce(
        Response.json({
          tags: [
            { name: 'v2', manifest_digest: 'sha256:same' },
            { name: 'latest', manifest_digest: 'sha256:same' },
            { name: 'V1', manifest_digest: 'sha256:other' },
          ],
          has_additional: false,
        }),
      );

    await expect(
      discoverQuayRepositories(allTagsConfig, mockLogger),
    ).resolves.toEqual([
      'quay.io/test-org/repo-a:V1',
      'quay.io/test-org/repo-a:latest',
      'quay.io/test-org/repo-a:v2',
    ]);
    expect(global.fetch).toHaveBeenCalledTimes(2);
    const tagUrl = new URL((global.fetch as jest.Mock).mock.calls[1][0]);
    expect(tagUrl.pathname).toBe('/api/v1/repository/test-org/repo-a/tag/');
    expect(tagUrl.searchParams.get('onlyActiveTags')).toBe('true');
    expect(tagUrl.searchParams.get('page')).toBe('1');
    expect(tagUrl.searchParams.get('limit')).toBe('100');
  });

  it('deduplicates repositories and refs across pages and follows tag pagination', async () => {
    global.fetch = jest
      .fn()
      .mockResolvedValueOnce(
        Response.json({
          repositories: [
            { namespace: 'test-org', name: 'repo-b' },
            ...repositories.repositories,
          ],
          next_page: 'next',
        }),
      )
      .mockResolvedValueOnce(Response.json(repositories))
      .mockResolvedValueOnce(
        Response.json({ tags: [{ name: 'v2' }], has_additional: true }),
      )
      .mockResolvedValueOnce(
        Response.json({
          tags: [{ name: 'v2' }, { name: 'v1' }],
          has_additional: false,
        }),
      )
      .mockResolvedValueOnce(
        Response.json({ tags: [{ name: 'v3' }], has_additional: false }),
      );

    await expect(
      discoverQuayRepositories(allTagsConfig, mockLogger),
    ).resolves.toEqual([
      'quay.io/test-org/repo-a:v1',
      'quay.io/test-org/repo-a:v2',
      'quay.io/test-org/repo-b:v3',
    ]);
    expect(global.fetch).toHaveBeenCalledTimes(5);
    const secondTagPage = new URL((global.fetch as jest.Mock).mock.calls[3][0]);
    expect(secondTagPage.searchParams.get('page')).toBe('2');
    expect(secondTagPage.searchParams.get('onlyActiveTags')).toBe('true');
  });

  it('returns no candidates when a repository has no active tags', async () => {
    global.fetch = jest
      .fn()
      .mockResolvedValueOnce(Response.json(repositories))
      .mockResolvedValueOnce(
        Response.json({ tags: [], has_additional: false }),
      );
    await expect(
      discoverQuayRepositories(allTagsConfig, mockLogger),
    ).resolves.toEqual([]);
  });

  it.each([
    null,
    { tags: {} },
    { tags: [] },
    { tags: [], has_additional: 'false' },
  ])('rejects malformed tag-list responses: %j', async body => {
    global.fetch = jest
      .fn()
      .mockResolvedValueOnce(Response.json(repositories))
      .mockResolvedValueOnce(Response.json(body));
    await expect(
      discoverQuayRepositories(allTagsConfig, mockLogger),
    ).rejects.toThrow('Invalid Quay tag list response for test-org/repo-a');
    expect(global.fetch).toHaveBeenCalledTimes(2);
  });

  it('skips malformed repository and tag entries without losing valid candidates', async () => {
    global.fetch = jest
      .fn()
      .mockResolvedValueOnce(
        Response.json({
          repositories: [
            null,
            12,
            { name: 1, namespace: 'test-org' },
            ...repositories.repositories,
          ],
        }),
      )
      .mockResolvedValueOnce(
        Response.json({
          tags: [
            null,
            { name: 3 },
            { name: '../bad' },
            { name: '*' },
            { name: 'x'.repeat(129) },
            { name: 'v1' },
          ],
          has_additional: false,
        }),
      );
    await expect(
      discoverQuayRepositories(allTagsConfig, mockLogger),
    ).resolves.toEqual(['quay.io/test-org/repo-a:v1']);
    expect(mockLogger.warn).toHaveBeenCalledWith(
      expect.stringContaining('invalid tag'),
    );
  });

  it.each([{ tags: [] }, { tags: [{ name: 'v1' }] }])(
    'stops tag pagination that makes no progress: %j',
    async ({ tags }) => {
      global.fetch = jest
        .fn()
        .mockResolvedValueOnce(Response.json(repositories))
        .mockResolvedValueOnce(
          Response.json({ tags: [{ name: 'v1' }], has_additional: true }),
        )
        .mockResolvedValueOnce(Response.json({ tags, has_additional: true }));
      await expect(
        discoverQuayRepositories(allTagsConfig, mockLogger),
      ).resolves.toEqual(['quay.io/test-org/repo-a:v1']);
      expect(global.fetch).toHaveBeenCalledTimes(3);
      expect(mockLogger.warn).toHaveBeenCalledWith(
        expect.stringContaining('tag pagination made no progress'),
      );
    },
  );

  it('shares the page budget between repository pages and every repository tag list', async () => {
    global.fetch = jest.fn().mockImplementation(async (request: string) => {
      const url = new URL(request);
      if (url.pathname.endsWith('/tag/')) {
        return Response.json({
          tags: [{ name: `v${url.searchParams.get('page')}` }],
          has_additional: true,
        });
      }
      return Response.json({
        repositories: [
          { namespace: 'test-org', name: 'repo-a' },
          { namespace: 'test-org', name: 'repo-b' },
        ],
      });
    });
    const result = await discoverQuayRepositories(allTagsConfig, mockLogger);
    expect(global.fetch).toHaveBeenCalledTimes(MAX_DISCOVERY_PAGES);
    expect(result).toHaveLength(MAX_DISCOVERY_PAGES - 1);
    expect(
      result.every(ref => ref.startsWith('quay.io/test-org/repo-a:')),
    ).toBe(true);
    expect(mockLogger.warn).toHaveBeenCalledWith(
      expect.stringContaining(`page limit (${MAX_DISCOVERY_PAGES})`),
    );
  });

  it('counts repository pagination against the same tag budget', async () => {
    global.fetch = jest.fn().mockImplementation(async (request: string) => {
      const url = new URL(request);
      if (url.pathname.endsWith('/tag/')) {
        return Response.json({ tags: [{ name: 'v1' }], has_additional: false });
      }
      const page = Number(url.searchParams.get('next_page') ?? '1');
      return Response.json({
        ...repositories,
        ...(page < MAX_DISCOVERY_PAGES - 1
          ? { next_page: String(page + 1) }
          : {}),
      });
    });
    await expect(
      discoverQuayRepositories(allTagsConfig, mockLogger),
    ).resolves.toEqual(['quay.io/test-org/repo-a:v1']);
    expect(global.fetch).toHaveBeenCalledTimes(MAX_DISCOVERY_PAGES);
    expect(mockLogger.warn).not.toHaveBeenCalled();
  });

  it('surfaces tag-list HTTP failures instead of treating the repository as empty', async () => {
    const response = new Response('not found', { status: 404 });
    const cancel = jest.spyOn(response.body!, 'cancel');
    global.fetch = jest
      .fn()
      .mockResolvedValueOnce(Response.json(repositories))
      .mockResolvedValueOnce(response);
    await expect(
      discoverQuayRepositories(allTagsConfig, mockLogger),
    ).rejects.toThrow(
      'Quay tag list request failed for repository test-org/repo-a: 404',
    );
    expect(cancel).toHaveBeenCalledTimes(1);
    expect(global.fetch).toHaveBeenCalledTimes(2);
  });

  it('retries tag pages using the shared retry options', async () => {
    jest.useFakeTimers();
    global.fetch = jest
      .fn()
      .mockResolvedValueOnce(Response.json(repositories))
      .mockResolvedValueOnce(new Response('unavailable', { status: 503 }))
      .mockResolvedValueOnce(
        Response.json({ tags: [{ name: 'v1' }], has_additional: false }),
      );
    const result = discoverQuayRepositories(
      allTagsConfig,
      mockLogger,
      undefined,
      {
        ...DEFAULT_SKILL_IMAGE_OPTIONS,
        retryBaseDelayMs: 25,
      },
    );
    await jest.advanceTimersByTimeAsync(24);
    expect(global.fetch).toHaveBeenCalledTimes(2);
    await jest.advanceTimersByTimeAsync(1);
    await expect(result).resolves.toEqual(['quay.io/test-org/repo-a:v1']);
    expect(global.fetch).toHaveBeenCalledTimes(3);
  });

  it('bounds tag response bodies using the configured discovery limit', async () => {
    global.fetch = jest
      .fn()
      .mockResolvedValueOnce(Response.json(repositories))
      .mockResolvedValueOnce(
        Response.json({
          tags: [],
          has_additional: false,
          padding: 'x'.repeat(200),
        }),
      );
    await expect(
      discoverQuayRepositories(allTagsConfig, mockLogger, undefined, {
        ...DEFAULT_SKILL_IMAGE_OPTIONS,
        maxDiscoveryResponseSizeBytes: 100,
      }),
    ).rejects.toThrow('maximum allowed size');
    expect(global.fetch).toHaveBeenCalledTimes(2);
  });

  it('honors cancellation between tag pages without starting another request', async () => {
    const controller = new AbortController();
    global.fetch = jest
      .fn()
      .mockResolvedValueOnce(Response.json(repositories))
      .mockImplementationOnce(async () => {
        controller.abort();
        return Response.json({ tags: [{ name: 'v1' }], has_additional: true });
      });
    await expect(
      discoverQuayRepositories(allTagsConfig, mockLogger, controller.signal),
    ).rejects.toThrow('This operation was aborted');
    expect(global.fetch).toHaveBeenCalledTimes(2);
  });
});

describe('configured discovery limits', () => {
  it('enforces the configured response size', async () => {
    global.fetch = jest
      .fn()
      .mockResolvedValue(Response.json({ repositories: [] }));
    await expect(
      discoverQuayRepositories(baseConfig, mockLogger, undefined, {
        ...DEFAULT_SKILL_IMAGE_OPTIONS,
        maxDiscoveryResponseSizeBytes: 5,
      }),
    ).rejects.toThrow('maximum allowed size');
    expect(global.fetch).toHaveBeenCalledTimes(1);
  });
  it('disables retries when maxRetries is zero', async () => {
    global.fetch = jest
      .fn()
      .mockResolvedValue(new Response('unavailable', { status: 503 }));
    await expect(
      discoverQuayRepositories(baseConfig, mockLogger, undefined, {
        ...DEFAULT_SKILL_IMAGE_OPTIONS,
        maxRetries: 0,
      }),
    ).rejects.toThrow('503');
    expect(global.fetch).toHaveBeenCalledTimes(1);
  });
  it('uses the configured timeout for every page attempt', async () => {
    jest.useFakeTimers();
    jest.spyOn(AbortSignal, 'timeout').mockImplementation(ms => {
      const controller = new AbortController();
      setTimeout(
        () => controller.abort(new DOMException('expired', 'TimeoutError')),
        ms,
      );
      return controller.signal;
    });
    global.fetch = jest
      .fn()
      .mockImplementationOnce(
        (_url, init) =>
          new Promise((_resolve, reject) => {
            init.signal.addEventListener(
              'abort',
              () => reject(init.signal.reason),
              { once: true },
            );
          }),
      )
      .mockResolvedValueOnce(Response.json({ repositories: [] }));
    const result = discoverQuayRepositories(baseConfig, mockLogger, undefined, {
      ...DEFAULT_SKILL_IMAGE_OPTIONS,
      fetchTimeoutMs: 25,
      retryBaseDelayMs: 10,
    });
    await jest.advanceTimersByTimeAsync(34);
    expect(global.fetch).toHaveBeenCalledTimes(1);
    await jest.advanceTimersByTimeAsync(1);
    await expect(result).resolves.toEqual([]);
    expect(global.fetch).toHaveBeenCalledTimes(2);
  });
  it('retries HTTP 5xx after releasing the failed response', async () => {
    jest.useFakeTimers();
    const response = new Response('unavailable', { status: 503 });
    const cancel = jest.spyOn(response.body!, 'cancel');
    global.fetch = jest
      .fn()
      .mockResolvedValueOnce(response)
      .mockResolvedValueOnce(Response.json({ repositories: [] }));
    const result = discoverQuayRepositories(baseConfig, mockLogger);
    await jest.runAllTimersAsync();
    await expect(result).resolves.toEqual([]);
    expect(cancel).toHaveBeenCalledTimes(1);
    expect(global.fetch).toHaveBeenCalledTimes(2);
  });
});
