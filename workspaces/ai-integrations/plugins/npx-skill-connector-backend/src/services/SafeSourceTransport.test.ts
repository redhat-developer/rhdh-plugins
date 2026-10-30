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
  fetchSourceBuffer,
  validateAllowedOrigin,
  validateRequestUrl,
  readResponseBuffer,
  withRequestTimeout,
} from './SafeSourceTransport';

describe('fetchSourceBuffer', () => {
  const source = { indexUrl: 'https://skills.example.com/index.json' };
  let fetchMock: jest.SpyInstance;

  beforeEach(() => {
    fetchMock = jest.spyOn(global, 'fetch');
  });

  afterEach(() => jest.restoreAllMocks());

  it('rejects an artifact outside the configured origins before fetching', async () => {
    await expect(
      fetchSourceBuffer('https://other.example/skill.md', source, 'artifact'),
    ).rejects.toThrow('unconfigured origin');
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('rejects a redirect outside the configured origins', async () => {
    fetchMock.mockResolvedValueOnce(
      new Response(null, {
        status: 302,
        headers: { location: 'https://other.example/skill.md' },
      }),
    );
    await expect(
      fetchSourceBuffer(
        'https://skills.example.com/skill.md',
        source,
        'artifact',
      ),
    ).rejects.toThrow('unconfigured origin');
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it('rejects a redirect with embedded credentials', async () => {
    fetchMock.mockResolvedValueOnce(
      new Response(null, {
        status: 302,
        headers: {
          location: 'https://user:secret@skills.example.com/skill.md',
        },
      }),
    );
    await expect(
      fetchSourceBuffer(
        'https://skills.example.com/skill.md',
        source,
        'artifact',
      ),
    ).rejects.toThrow('credentials');
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it('permits an explicitly configured artifact origin', async () => {
    fetchMock.mockResolvedValueOnce(new Response('skill'));
    await expect(
      fetchSourceBuffer(
        'https://cdn.example.com/skill.md',
        { ...source, allowedOrigins: ['https://cdn.example.com'] },
        'artifact',
      ),
    ).resolves.toEqual(Buffer.from('skill'));
  });

  it('rejects a redirect to a literal IP address', async () => {
    fetchMock.mockResolvedValueOnce(
      new Response(null, {
        status: 302,
        headers: { location: 'https://127.0.0.1/skill.md' },
      }),
    );
    await expect(
      fetchSourceBuffer(
        'https://skills.example.com/skill.md',
        source,
        'artifact',
      ),
    ).rejects.toThrow('localhost or a literal IP');
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it('rejects a redirect to HTTP', async () => {
    fetchMock.mockResolvedValueOnce(
      new Response(null, {
        status: 302,
        headers: { location: 'http://skills.example.com/skill.md' },
      }),
    );
    await expect(
      fetchSourceBuffer(
        'https://skills.example.com/skill.md',
        source,
        'artifact',
      ),
    ).rejects.toThrow('HTTPS');
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it('rejects an artifact larger than one MiB', async () => {
    fetchMock.mockResolvedValueOnce(
      new Response(Buffer.alloc(1024 * 1024 + 1)),
    );
    await expect(
      fetchSourceBuffer(
        'https://skills.example.com/skill.md',
        source,
        'artifact',
      ),
    ).rejects.toThrow('exceeds maximum');
  });
});

describe('validateRequestUrl', () => {
  it('accepts a valid HTTPS URL', () => {
    expect(() =>
      validateRequestUrl(new URL('https://example.com/path')),
    ).not.toThrow();
  });

  it('rejects non-HTTPS URLs', () => {
    expect(() => validateRequestUrl(new URL('http://example.com'))).toThrow(
      'HTTPS',
    );
  });

  it('rejects URLs with embedded credentials', () => {
    expect(() =>
      validateRequestUrl(new URL('https://user:pass@example.com')),
    ).toThrow('credentials');
  });

  it('rejects localhost', () => {
    expect(() => validateRequestUrl(new URL('https://localhost/path'))).toThrow(
      'localhost or a literal IP',
    );
  });

  it('rejects .localhost subdomains', () => {
    expect(() =>
      validateRequestUrl(new URL('https://evil.localhost/path')),
    ).toThrow('localhost or a literal IP');
  });

  it('rejects raw IPv4 addresses', () => {
    expect(() =>
      validateRequestUrl(new URL('https://192.168.1.1/path')),
    ).toThrow('localhost or a literal IP');
  });

  it('rejects raw IPv6 addresses', () => {
    expect(() => validateRequestUrl(new URL('https://[::1]/path'))).toThrow(
      'localhost or a literal IP',
    );
  });
});

describe('validateAllowedOrigin', () => {
  it('normalizes a valid HTTPS origin', () => {
    expect(validateAllowedOrigin('https://CDN.example.com:443/')).toBe(
      'https://cdn.example.com',
    );
  });

  it('rejects origins with paths', () => {
    expect(() => validateAllowedOrigin('https://cdn.example.com/docs')).toThrow(
      'path',
    );
  });

  it('rejects origins with query strings', () => {
    expect(() => validateAllowedOrigin('https://cdn.example.com?q=1')).toThrow(
      'path',
    );
  });

  it('rejects origins with fragments', () => {
    expect(() =>
      validateAllowedOrigin('https://cdn.example.com#section'),
    ).toThrow('path');
  });

  it('rejects HTTP origins', () => {
    expect(() => validateAllowedOrigin('http://cdn.example.com')).toThrow(
      'HTTPS',
    );
  });

  it('rejects origins with embedded credentials', () => {
    expect(() =>
      validateAllowedOrigin('https://user:pass@cdn.example.com'),
    ).toThrow('credentials');
  });
});

describe('readResponseBuffer', () => {
  it('reads a response within the size limit', async () => {
    const body = Buffer.from('hello world');
    const response = new Response(body, {
      headers: { 'content-length': String(body.length) },
    });
    const buffer = await readResponseBuffer(response, 1024);
    expect(buffer.toString('utf-8')).toBe('hello world');
  });

  it('rejects a response exceeding content-length limit', async () => {
    const response = new Response('', {
      headers: { 'content-length': '999999999' },
    });
    await expect(readResponseBuffer(response, 1024)).rejects.toThrow(
      'exceeds maximum',
    );
  });

  it('rejects a streaming response exceeding byte limit', async () => {
    const largeBody = Buffer.alloc(2048, 'x');
    const response = new Response(largeBody);
    await expect(readResponseBuffer(response, 1024)).rejects.toThrow(
      'exceeds maximum',
    );
  });
});

describe('withRequestTimeout', () => {
  it('completes within the timeout', async () => {
    const result = await withRequestTimeout(async () => 42, undefined, 5000);
    expect(result).toBe(42);
  });

  it('rejects if the parent signal is already aborted', async () => {
    const controller = new AbortController();
    controller.abort(new Error('cancelled'));
    await expect(
      withRequestTimeout(async () => 42, controller.signal, 5000),
    ).rejects.toThrow('cancelled');
  });

  it('rejects when an operation runs past the time limit', async () => {
    await expect(
      withRequestTimeout(() => new Promise(() => undefined), undefined, 10),
    ).rejects.toBeDefined();
  });
});
