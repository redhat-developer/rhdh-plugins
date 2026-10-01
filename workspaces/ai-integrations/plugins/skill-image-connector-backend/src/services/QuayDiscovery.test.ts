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
import { DEFAULT_SKILL_IMAGE_OPTIONS } from './types';

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
    expect(result[101]).toBe('quay.io/test-org/repo-101:latest');
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
    ).rejects.toThrow('Quay discovery was aborted');
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
