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

import { KeycloakAuthClient } from '@red-hat-developer-hub/backstage-plugin-boost-node';

describe('KeycloakAuthClient', () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  const defaultConfig = {
    tokenEndpoint: 'http://keycloak/realms/boost/protocol/openid-connect/token',
    clientId: 'boost-client',
    clientSecret: 'boost-secret',
  };

  it('fetches a token via Client Credentials Grant', async () => {
    const mockFetch = jest.spyOn(global, 'fetch').mockResolvedValue({
      ok: true,
      json: async () => ({
        access_token: 'test-token-123',
        expires_in: 300,
      }),
    } as Response);

    const client = new KeycloakAuthClient(defaultConfig);
    const token = await client.getBearerToken();

    expect(token).toBe('test-token-123');
    expect(mockFetch).toHaveBeenCalledWith(
      defaultConfig.tokenEndpoint,
      expect.objectContaining({
        method: 'POST',
        body: 'grant_type=client_credentials',
      }),
    );
  });

  it('caches token and reuses it within expiry window', async () => {
    const mockFetch = jest.spyOn(global, 'fetch').mockResolvedValue({
      ok: true,
      json: async () => ({
        access_token: 'cached-token',
        expires_in: 300,
      }),
    } as Response);

    const client = new KeycloakAuthClient(defaultConfig, 60);

    const token1 = await client.getBearerToken();
    const token2 = await client.getBearerToken();

    expect(token1).toBe('cached-token');
    expect(token2).toBe('cached-token');
    expect(mockFetch).toHaveBeenCalledTimes(1);
  });

  it('applies consumer-default of 60s for expiryBuffer', async () => {
    jest.spyOn(global, 'fetch').mockResolvedValue({
      ok: true,
      json: async () => ({
        access_token: 'token',
        expires_in: 300,
      }),
    } as Response);

    // undefined expiryBuffer should default to 60
    const client = new KeycloakAuthClient(defaultConfig);
    const token = await client.getBearerToken();
    expect(token).toBe('token');
  });

  it('throws on failed Keycloak response', async () => {
    jest.spyOn(global, 'fetch').mockResolvedValue({
      ok: false,
      status: 401,
      statusText: 'Unauthorized',
    } as Response);

    const client = new KeycloakAuthClient(defaultConfig);
    await expect(client.getBearerToken()).rejects.toThrow(
      'Keycloak token request failed: 401 Unauthorized',
    );
  });

  it('throws when access_token is missing from response', async () => {
    jest.spyOn(global, 'fetch').mockResolvedValue({
      ok: true,
      json: async () => ({}),
    } as Response);

    const client = new KeycloakAuthClient(defaultConfig);
    await expect(client.getBearerToken()).rejects.toThrow(
      'Keycloak token response missing access_token',
    );
  });

  it('invalidateToken forces fresh fetch on next call', async () => {
    const mockFetch = jest
      .spyOn(global, 'fetch')
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          access_token: 'first-token',
          expires_in: 300,
        }),
      } as Response)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          access_token: 'second-token',
          expires_in: 300,
        }),
      } as Response);

    const client = new KeycloakAuthClient(defaultConfig, 60);

    const token1 = await client.getBearerToken();
    expect(token1).toBe('first-token');
    expect(mockFetch).toHaveBeenCalledTimes(1);

    client.invalidateToken();

    const token2 = await client.getBearerToken();
    expect(token2).toBe('second-token');
    expect(mockFetch).toHaveBeenCalledTimes(2);
  });

  it('uses custom tokenExpiryBufferSeconds', async () => {
    jest.spyOn(global, 'fetch').mockResolvedValue({
      ok: true,
      json: async () => ({
        access_token: 'token',
        expires_in: 300,
      }),
    } as Response);

    // Custom buffer of 120 seconds
    const client = new KeycloakAuthClient(defaultConfig, 120);
    const token = await client.getBearerToken();
    expect(token).toBe('token');
  });

  it('deduplicates concurrent token fetches', async () => {
    let resolveToken: (value: Response) => void;
    const fetchPromise = new Promise<Response>(resolve => {
      resolveToken = resolve;
    });
    const mockFetch = jest.spyOn(global, 'fetch').mockReturnValue(fetchPromise);

    const client = new KeycloakAuthClient(defaultConfig, 60);

    const p1 = client.getBearerToken();
    const p2 = client.getBearerToken();
    const p3 = client.getBearerToken();

    resolveToken!({
      ok: true,
      json: async () => ({ access_token: 'shared-token', expires_in: 300 }),
    } as Response);

    const [t1, t2, t3] = await Promise.all([p1, p2, p3]);

    expect(t1).toBe('shared-token');
    expect(t2).toBe('shared-token');
    expect(t3).toBe('shared-token');
    expect(mockFetch).toHaveBeenCalledTimes(1);
  });

  it('defaults expires_in to 300 when not in response', async () => {
    jest.spyOn(global, 'fetch').mockResolvedValue({
      ok: true,
      json: async () => ({
        access_token: 'token',
        // no expires_in
      }),
    } as Response);

    const client = new KeycloakAuthClient(defaultConfig, 60);
    const token = await client.getBearerToken();
    expect(token).toBe('token');
  });
});
