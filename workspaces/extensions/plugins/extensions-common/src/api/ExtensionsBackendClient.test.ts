/*
 * Copyright The Backstage Authors
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

import type { ConfigApi } from '@backstage/core-plugin-api';

import {
  ExtensionsBackendClient,
  type FetchApi,
} from './ExtensionsBackendClient';

const BASE_URL = 'http://backstage.example/api/extensions';

const jsonResponse = (body: unknown, ok = true): Response =>
  ({
    ok,
    json: async () => body,
  }) as unknown as Response;

describe('ExtensionsBackendClient', () => {
  const fetchMock = jest.fn<Promise<Response>, Parameters<typeof fetch>>();
  const getBaseUrl = jest.fn().mockResolvedValue(BASE_URL);
  const getCredentials = jest.fn().mockResolvedValue({ token: 'test-token' });

  const createClient = () =>
    new ExtensionsBackendClient({
      discoveryApi: { getBaseUrl },
      fetchApi: { fetch: fetchMock as FetchApi['fetch'] },
      identityApi: { getCredentials },
      configApi: {} as unknown as ConfigApi,
    });

  beforeEach(() => {
    jest.clearAllMocks();
    getBaseUrl.mockResolvedValue(BASE_URL);
    getCredentials.mockResolvedValue({ token: 'test-token' });
    fetchMock.mockResolvedValue(jsonResponse({ items: [] }));
  });

  it('sends Authorization and Content-Type on getPlugins', async () => {
    const payload = { items: [{ metadata: { name: 'plugin1' } }] };
    fetchMock.mockResolvedValue(jsonResponse(payload));

    const result = await createClient().getPlugins({});

    expect(getBaseUrl).toHaveBeenCalledWith('extensions');
    expect(fetchMock).toHaveBeenCalledWith(`${BASE_URL}/plugins`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        Authorization: 'Bearer test-token',
      },
    });
    expect(result).toEqual(payload);
  });

  it('omits Authorization when identity has no token', async () => {
    getCredentials.mockResolvedValue({});

    await createClient().getPlugins({});

    expect(fetchMock).toHaveBeenCalledWith(`${BASE_URL}/plugins`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });
  });

  it('POSTs installPlugin path, auth header, and configYaml body', async () => {
    fetchMock.mockResolvedValue(jsonResponse({ status: 'OK' }));
    const configYaml = 'kind: Plugin';

    const result = await createClient().installPlugin(
      'default',
      'plugin1',
      configYaml,
    );

    expect(fetchMock).toHaveBeenCalledWith(
      `${BASE_URL}/plugin/default/plugin1/configuration`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: 'Bearer test-token',
        },
        body: JSON.stringify({ configYaml }),
      },
    );
    expect(result).toEqual({ status: 'OK' });
  });

  it('PATCHes enablePackage with encoded name and enabled body', async () => {
    fetchMock.mockResolvedValue(jsonResponse({ status: 'OK' }));

    const result = await createClient().enablePackage(
      'default',
      'package 11',
      false,
    );

    expect(fetchMock).toHaveBeenCalledWith(
      `${BASE_URL}/package/default/package%2011/configuration/disable`,
      {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: 'Bearer test-token',
        },
        body: JSON.stringify({ enabled: false }),
      },
    );
    expect(result).toEqual({ status: 'OK' });
  });

  it('returns parsed JSON when the response is not ok', async () => {
    const errorBody = { error: 'x' };
    fetchMock.mockResolvedValue(jsonResponse(errorBody, false));

    const result = await createClient().getPlugins({});

    expect(result).toEqual(errorBody);
  });
});
