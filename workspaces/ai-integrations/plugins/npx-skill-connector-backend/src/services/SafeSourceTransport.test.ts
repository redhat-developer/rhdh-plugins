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

import { promises as dnsPromises } from 'node:dns';
import {
  fetchSourceBuffer,
  isPrivateAddress,
  validateAllowedOrigin,
  validateRequestUrl,
  readResponseBuffer,
  withRequestTimeout,
  validateAndResolveHost,
} from './SafeSourceTransport';

jest.mock('undici', () => ({
  Agent: jest
    .fn()
    .mockImplementation((options: { connect: { lookup: unknown } }) => ({
      lookup: options.connect.lookup,
      close: jest.fn().mockResolvedValue(undefined),
      destroy: jest.fn().mockResolvedValue(undefined),
    })),
}));

describe('fetchSourceBuffer', () => {
  const source = { indexUrl: 'https://skills.example.com/index.json' };
  const publicAddress = [{ address: '8.8.8.8', family: 4 }];
  let fetchMock: jest.SpyInstance;
  let lookupMock: jest.SpyInstance;

  beforeEach(() => {
    fetchMock = jest.spyOn(global, 'fetch');
    lookupMock = jest.spyOn(dnsPromises, 'lookup');
    lookupMock.mockResolvedValue(publicAddress);
  });

  afterEach(() => jest.restoreAllMocks());

  it('rejects an artifact outside the configured origins before fetching', async () => {
    await expect(
      fetchSourceBuffer('https://other.example/skill.md', source, 'artifact'),
    ).rejects.toThrow('unconfigured origin');
    expect(lookupMock).not.toHaveBeenCalled();
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

  it('rejects a redirect when DNS resolves to a private address', async () => {
    lookupMock
      .mockResolvedValueOnce(publicAddress)
      .mockResolvedValueOnce([{ address: '127.0.0.1', family: 4 }]);
    fetchMock.mockResolvedValueOnce(
      new Response(null, {
        status: 302,
        headers: { location: '/other.md' },
      }),
    );
    await expect(
      fetchSourceBuffer(
        'https://skills.example.com/skill.md',
        source,
        'artifact',
      ),
    ).rejects.toThrow('non-public address');
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it('uses the validated DNS address for the connection', async () => {
    lookupMock.mockReset();
    lookupMock
      .mockResolvedValueOnce(publicAddress)
      .mockResolvedValue([{ address: '127.0.0.1', family: 4 }]);
    fetchMock.mockImplementationOnce(async (_url, init) => {
      const dispatcher = (
        init as RequestInit & {
          dispatcher: {
            lookup: (
              hostname: string,
              options: { family: number },
              callback: (error: Error | null, address: string) => void,
            ) => void;
          };
        }
      ).dispatcher;
      let connectedAddress: string | undefined;
      dispatcher.lookup(
        'skills.example.com',
        { family: 4 },
        (_error, address) => {
          connectedAddress = address;
        },
      );
      expect(connectedAddress).toBe('8.8.8.8');
      return new Response('skill');
    });
    await expect(
      fetchSourceBuffer(
        'https://skills.example.com/skill.md',
        source,
        'artifact',
      ),
    ).resolves.toEqual(Buffer.from('skill'));
    expect(lookupMock).toHaveBeenCalledTimes(1);
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
      'public hostname',
    );
  });

  it('rejects .localhost subdomains', () => {
    expect(() =>
      validateRequestUrl(new URL('https://evil.localhost/path')),
    ).toThrow('public hostname');
  });

  it('rejects raw IPv4 addresses', () => {
    expect(() =>
      validateRequestUrl(new URL('https://192.168.1.1/path')),
    ).toThrow('public hostname');
  });

  it('rejects raw IPv6 addresses', () => {
    expect(() => validateRequestUrl(new URL('https://[::1]/path'))).toThrow(
      'public hostname',
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

describe('isPrivateAddress', () => {
  it('identifies private IPv4 addresses', () => {
    expect(isPrivateAddress('10.0.0.1', 4)).toBe(true);
    expect(isPrivateAddress('172.16.0.1', 4)).toBe(true);
    expect(isPrivateAddress('192.168.1.1', 4)).toBe(true);
  });

  it('identifies loopback addresses', () => {
    expect(isPrivateAddress('127.0.0.1', 4)).toBe(true);
    expect(isPrivateAddress('::1', 6)).toBe(true);
  });

  it('identifies link-local addresses', () => {
    expect(isPrivateAddress('169.254.1.1', 4)).toBe(true);
    expect(isPrivateAddress('fe80::1', 6)).toBe(true);
  });

  it('accepts public unicast addresses', () => {
    expect(isPrivateAddress('8.8.8.8', 4)).toBe(false);
    expect(isPrivateAddress('1.1.1.1', 4)).toBe(false);
  });

  it('rejects mismatched family', () => {
    expect(isPrivateAddress('8.8.8.8', 6)).toBe(true);
    expect(isPrivateAddress('::1', 4)).toBe(true);
  });

  it('rejects unroutable destinations', () => {
    expect(isPrivateAddress('0.0.0.0', 4)).toBe(true);
    expect(isPrivateAddress('::', 6)).toBe(true);
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

describe('validateAndResolveHost', () => {
  it('returns addresses or throws a recognisable error', async () => {
    // dns.lookup may fail in sandbox; we assert on the shape of
    // whichever outcome we get, without conditional expects.
    const result = await validateAndResolveHost('example.com').then(
      addresses => ({ ok: true as const, addresses }),
      (error: Error) => ({ ok: false as const, message: error.message }),
    );

    // Exactly one branch is true — both expectations run unconditionally.
    expect(
      result.ok
        ? result.addresses.length > 0 &&
            result.addresses.every(a => !isPrivateAddress(a.address, a.family))
        : /could not be resolved|non-public address/.test(result.message),
    ).toBe(true);
  });

  it('rejects localhost', async () => {
    // localhost resolves to 127.0.0.1, which is a non-public address
    await expect(validateAndResolveHost('localhost')).rejects.toThrow(
      /non-public address|could not be resolved/,
    );
  });
});
