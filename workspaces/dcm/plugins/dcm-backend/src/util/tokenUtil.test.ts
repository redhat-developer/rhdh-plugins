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

/* eslint-disable @backstage/no-undeclared-imports -- deps in dcm-backend package.json */
import { mockServices } from '@backstage/backend-test-utils';
import { getTokenFromApi, type TokenResult } from './tokenUtil';
import type { RouterOptions } from '../models/RouterOptions';

function makeOptions(
  configData: Record<string, Record<string, string>> = {},
): RouterOptions {
  return {
    logger: mockServices.rootLogger(),
    config: mockServices.rootConfig({ data: configData }),
    httpAuth: mockServices.httpAuth.mock(),
    permissions: mockServices.permissions.mock(),
    cache: mockServices.cache.mock(),
  };
}

const BASE_CONFIG = {
  dcm: {
    clientId: 'test-client-id',
    clientSecret: 'test-client-secret',
  },
};

const SSO_RESPONSE = {
  ok: true,
  statusText: 'OK',
  json: async () => ({ access_token: 'fresh-token', expires_in: 3600 }),
  text: async () => '',
} as Response;

describe('getTokenFromApi', () => {
  let fetchSpy: jest.SpyInstance;

  afterEach(() => {
    fetchSpy?.mockRestore();
  });

  it('fetches and returns a new token when cache is empty', async () => {
    fetchSpy = jest.spyOn(globalThis, 'fetch').mockResolvedValue(SSO_RESPONSE);

    const options = makeOptions(BASE_CONFIG);
    const result = await getTokenFromApi(options);

    expect(result.accessToken).toBe('fresh-token');
    expect(result.expiresAt).toBeGreaterThan(Date.now());
    expect(fetchSpy).toHaveBeenCalledWith(
      expect.stringContaining('/protocol/openid-connect/token'),
      expect.objectContaining({ method: 'POST' }),
    );
  });

  it('reuses a cached token when expiry is more than 60s away', async () => {
    fetchSpy = jest.spyOn(globalThis, 'fetch').mockResolvedValue(SSO_RESPONSE);

    const farFuture = Date.now() + 120_000;
    const cachedToken: TokenResult = {
      accessToken: 'cached-token',
      expiresAt: farFuture,
    };

    const cacheMock = mockServices.cache.mock();
    (cacheMock.get as jest.Mock).mockResolvedValue(cachedToken);

    const options: RouterOptions = {
      ...makeOptions(BASE_CONFIG),
      cache: cacheMock,
    };

    const result = await getTokenFromApi(options);

    expect(result.accessToken).toBe('cached-token');
    expect(result.expiresAt).toBe(farFuture);
    // SSO must NOT have been called
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it('fetches a new token when the cached token expires within 60s', async () => {
    fetchSpy = jest.spyOn(globalThis, 'fetch').mockResolvedValue(SSO_RESPONSE);

    // Token expiring 30 seconds from now — below the 60s threshold
    const nearExpiry = Date.now() + 30_000;
    const cachedToken: TokenResult = {
      accessToken: 'stale-token',
      expiresAt: nearExpiry,
    };

    const cacheMock = mockServices.cache.mock();
    (cacheMock.get as jest.Mock).mockResolvedValue(cachedToken);

    const options: RouterOptions = {
      ...makeOptions(BASE_CONFIG),
      cache: cacheMock,
    };

    const result = await getTokenFromApi(options);

    expect(result.accessToken).toBe('fresh-token');
    expect(fetchSpy).toHaveBeenCalledTimes(1);
  });

  it('caches the new token after a successful SSO fetch', async () => {
    fetchSpy = jest.spyOn(globalThis, 'fetch').mockResolvedValue(SSO_RESPONSE);

    const cacheMock = mockServices.cache.mock();
    (cacheMock.get as jest.Mock).mockResolvedValue(undefined);

    const options: RouterOptions = {
      ...makeOptions(BASE_CONFIG),
      cache: cacheMock,
    };

    await getTokenFromApi(options);

    expect(cacheMock.set).toHaveBeenCalledWith(
      'dcm_sso_access_token',
      expect.objectContaining({ accessToken: 'fresh-token' }),
      expect.objectContaining({ ttl: 3_600_000 }),
    );
  });

  it('throws a descriptive error when SSO returns a non-OK response', async () => {
    fetchSpy = jest.spyOn(globalThis, 'fetch').mockResolvedValue({
      ok: false,
      status: 401,
      statusText: 'Unauthorized',
      text: async () => '{"error":"invalid_client"}',
    } as Response);

    const options = makeOptions(BASE_CONFIG);

    await expect(getTokenFromApi(options)).rejects.toThrow(
      /SSO token request failed.*401.*Unauthorized/,
    );
  });

  it('uses the default SSO base URL when dcm.ssoBaseUrl is not set', async () => {
    fetchSpy = jest.spyOn(globalThis, 'fetch').mockResolvedValue(SSO_RESPONSE);

    const options = makeOptions(BASE_CONFIG);
    await getTokenFromApi(options);

    const calledUrl = fetchSpy.mock.calls[0][0] as string;
    expect(calledUrl).toContain('sso.redhat.com');
  });

  it('uses a custom ssoBaseUrl when configured', async () => {
    fetchSpy = jest.spyOn(globalThis, 'fetch').mockResolvedValue(SSO_RESPONSE);

    const options = makeOptions({
      dcm: {
        ...BASE_CONFIG.dcm,
        ssoBaseUrl: 'https://custom-sso.example.com',
      },
    });

    await getTokenFromApi(options);

    const calledUrl = fetchSpy.mock.calls[0][0] as string;
    expect(calledUrl).toContain('custom-sso.example.com');
  });
});
