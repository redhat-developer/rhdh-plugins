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
  jest.resetAllMocks();
});

describe('discoverQuayRepositories', () => {
  it('discovers repositories from a single page', async () => {
    global.fetch = jest.fn().mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        repositories: [
          { namespace: 'test-org', name: 'repo-a' },
          { namespace: 'test-org', name: 'repo-b' },
        ],
      }),
    });

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
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          repositories: Array.from({ length: 100 }, (_, i) => ({
            namespace: 'test-org',
            name: `repo-${i}`,
          })),
          next_page: 'page2token',
        }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          repositories: [
            { namespace: 'test-org', name: 'repo-100' },
            { namespace: 'test-org', name: 'repo-101' },
          ],
        }),
      });
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
    global.fetch = jest.fn().mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        repositories: [],
      }),
    });

    const result = await discoverQuayRepositories(baseConfig, mockLogger);

    expect(result).toEqual([]);
  });

  it('uses the configured tag instead of latest', async () => {
    global.fetch = jest.fn().mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        repositories: [{ namespace: 'test-org', name: 'repo-a' }],
      }),
    });

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
    global.fetch = jest.fn().mockResolvedValueOnce({
      ok: true,
      json: async () => ({ unexpected: 'shape' }),
    });

    await expect(
      discoverQuayRepositories(baseConfig, mockLogger),
    ).rejects.toThrow(
      'Quay repository list response for test-org did not contain a repositories array',
    );
  });

  it('detects pagination cycles', async () => {
    const fetchMock = jest
      .fn()
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          repositories: Array.from({ length: 100 }, (_, i) => ({
            namespace: 'test-org',
            name: `repo-${i}`,
          })),
          next_page: 'cycle-token',
        }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          repositories: Array.from({ length: 100 }, (_, i) => ({
            namespace: 'test-org',
            name: `repo-${100 + i}`,
          })),
          next_page: 'cycle-token', // Same token — cycle
        }),
      });
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
    global.fetch = jest.fn().mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        repositories: [
          { namespace: 'test-org', name: 'valid-repo' },
          { namespace: 'rogue-ns', name: 'sneaky-repo' },
        ],
      }),
    });

    const result = await discoverQuayRepositories(baseConfig, mockLogger);

    expect(result).toEqual(['quay.io/test-org/valid-repo:latest']);
    expect(mockLogger.warn).toHaveBeenCalledWith(
      expect.stringContaining(
        "namespace 'rogue-ns' does not match organization 'test-org'",
      ),
    );
  });

  it('skips repositories with missing name or namespace', async () => {
    global.fetch = jest.fn().mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        repositories: [
          { namespace: 'test-org', name: 'valid-repo' },
          { namespace: '', name: 'no-ns' },
          { namespace: 'test-org', name: '' },
          { name: 'no-ns-field' },
        ],
      }),
    });

    const result = await discoverQuayRepositories(baseConfig, mockLogger);

    expect(result).toEqual(['quay.io/test-org/valid-repo:latest']);
    expect(mockLogger.warn).toHaveBeenCalledWith(
      expect.stringContaining('missing name or namespace'),
    );
  });

  it('skips repositories with invalid name format', async () => {
    global.fetch = jest.fn().mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        repositories: [
          { namespace: 'test-org', name: 'valid-repo' },
          { namespace: 'test-org', name: '../traversal' },
        ],
      }),
    });

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
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          repositories: [{ namespace: 'test-org', name: 'repo-a' }],
        }),
      });
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
