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
  isPrivateAddress,
  validateAllowedOrigin,
  validateRequestUrl,
  readResponseBuffer,
  withRequestTimeout,
  HttpResponseError,
  validateAndResolveHost,
} from './SafeSourceTransport';

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
});

describe('HttpResponseError', () => {
  it('preserves status code', () => {
    const error = new HttpResponseError('Not found', 404);
    expect(error.status).toBe(404);
    expect(error.message).toBe('Not found');
    expect(error.name).toBe('HttpResponseError');
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
