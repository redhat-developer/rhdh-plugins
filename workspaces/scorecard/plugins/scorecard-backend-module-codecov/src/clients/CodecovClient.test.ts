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

import { ConfigReader } from '@backstage/config';
import { CodecovClient } from './CodecovClient';
import { mockServices } from '@backstage/backend-test-utils';

const mockFetch = jest.fn();
globalThis.fetch = mockFetch;

const SAMPLE_RESPONSE = {
  name: 'rhdh-plugins',
  private: false,
  updatestamp: '2026-06-19T10:29:51.283089Z',
  author: {
    service: 'github',
    username: 'redhat-developer',
    name: 'redhat-developer',
  },
  language: 'typescript',
  branch: 'main',
  active: true,
  activated: true,
  totals: {
    files: 2252,
    lines: 85789,
    hits: 45982,
    misses: 38246,
    partials: 1561,
    coverage: 53.59,
    branches: 24121,
    methods: 13480,
    sessions: 23,
    complexity: 0.0,
    complexity_total: 0.0,
    complexity_ratio: 0,
    diff: 0,
  },
};

describe('CodecovClient', () => {
  const logger = mockServices.logger.mock();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('fetches repo info with correct URL', async () => {
    const config = new ConfigReader({});
    const client = new CodecovClient(config, logger);

    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => SAMPLE_RESPONSE,
    });

    const result = await client.getRepoInfo(
      'github',
      'redhat-developer',
      'rhdh-plugins',
    );

    expect(result).toEqual(SAMPLE_RESPONSE);
    expect(mockFetch).toHaveBeenCalledWith(
      'https://api.codecov.io/api/v2/github/redhat-developer/repos/rhdh-plugins/',
      expect.objectContaining({
        headers: { accept: 'application/json' },
      }),
    );
  });

  it('sends Authorization header when auth token is configured', async () => {
    const config = new ConfigReader({
      codecov: {
        accounts: [{ name: 'default', authToken: 'my-token' }],
      },
    });
    const client = new CodecovClient(config, logger);

    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => SAMPLE_RESPONSE,
    });

    await client.getRepoInfo('github', 'redhat-developer', 'rhdh-plugins');

    expect(mockFetch).toHaveBeenCalledWith(
      expect.any(String),
      expect.objectContaining({
        headers: {
          accept: 'application/json',
          Authorization: 'bearer my-token',
        },
      }),
    );
  });

  it('sends no Authorization header when no token is configured', async () => {
    const config = new ConfigReader({});
    const client = new CodecovClient(config, logger);

    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => SAMPLE_RESPONSE,
    });

    await client.getRepoInfo('github', 'redhat-developer', 'rhdh-plugins');

    expect(mockFetch).toHaveBeenCalledWith(
      expect.any(String),
      expect.objectContaining({
        headers: { accept: 'application/json' },
      }),
    );
  });

  it('uses the specified account name for auth token lookup', async () => {
    const config = new ConfigReader({
      codecov: {
        accounts: [
          { name: 'default', authToken: 'default-token' },
          { name: 'custom', authToken: 'custom-token' },
        ],
      },
    });
    const client = new CodecovClient(config, logger);

    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => SAMPLE_RESPONSE,
    });

    await client.getRepoInfo(
      'github',
      'redhat-developer',
      'rhdh-plugins',
      'custom',
    );

    expect(mockFetch).toHaveBeenCalledWith(
      expect.any(String),
      expect.objectContaining({
        headers: {
          accept: 'application/json',
          Authorization: 'bearer custom-token',
        },
      }),
    );
  });

  it('uses custom defaultAccount name from config', async () => {
    const config = new ConfigReader({
      codecov: {
        defaultAccount: 'myorg',
        accounts: [{ name: 'myorg', authToken: 'org-token' }],
      },
    });
    const client = new CodecovClient(config, logger);

    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => SAMPLE_RESPONSE,
    });

    await client.getRepoInfo('github', 'redhat-developer', 'rhdh-plugins');

    expect(mockFetch).toHaveBeenCalledWith(
      expect.any(String),
      expect.objectContaining({
        headers: {
          accept: 'application/json',
          Authorization: 'bearer org-token',
        },
      }),
    );
  });

  it('throws when API returns non-OK response', async () => {
    const config = new ConfigReader({});
    const client = new CodecovClient(config, logger);

    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 404,
      statusText: 'Not Found',
    });

    await expect(
      client.getRepoInfo('github', 'redhat-developer', 'unknown-repo'),
    ).rejects.toThrow(/Codecov API error: 404 Not Found/);
  });

  it('sends no auth header for account without authToken', async () => {
    const config = new ConfigReader({
      codecov: {
        accounts: [{ name: 'default' }],
      },
    });
    const client = new CodecovClient(config, logger);

    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => SAMPLE_RESPONSE,
    });

    await client.getRepoInfo('github', 'redhat-developer', 'rhdh-plugins');

    expect(mockFetch).toHaveBeenCalledWith(
      expect.any(String),
      expect.objectContaining({
        headers: { accept: 'application/json' },
      }),
    );
  });
});
