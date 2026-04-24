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

import type { DiscoveryApi, FetchApi } from '@backstage/core-plugin-api';
import { ProvidersClient } from './ProvidersClient';
import type { Provider } from '../types/providers';

const BASE_URL = 'http://localhost/api/dcm';

const MOCK_PROVIDER: Provider = {
  name: 'test-provider',
  display_name: 'Test Provider',
  endpoint: 'https://provider.example.com',
  service_type: 'openshift',
  schema_version: 'v1alpha1',
};

function makeClient(fetchFn: jest.Mock) {
  const discoveryApi: DiscoveryApi = {
    getBaseUrl: jest.fn().mockResolvedValue(BASE_URL),
  };
  const fetchApi: FetchApi = { fetch: fetchFn };
  return new ProvidersClient({ discoveryApi, fetchApi });
}

function okJson(data: unknown): Response {
  return {
    status: 200,
    ok: true,
    json: async () => data,
  } as unknown as Response;
}

describe('ProvidersClient', () => {
  it('listProviders calls GET /providers', async () => {
    const fetchFn = jest
      .fn()
      .mockResolvedValue(okJson({ providers: [MOCK_PROVIDER] }));
    const client = makeClient(fetchFn);

    await client.listProviders();

    expect(fetchFn).toHaveBeenCalledWith(
      `${BASE_URL}/proxy/providers`,
      expect.objectContaining({ headers: expect.any(Object) }),
    );
  });

  it('getProvider calls GET /providers/{id}', async () => {
    const fetchFn = jest.fn().mockResolvedValue(okJson(MOCK_PROVIDER));
    const client = makeClient(fetchFn);

    await client.getProvider('my-id');

    expect(fetchFn).toHaveBeenCalledWith(
      `${BASE_URL}/proxy/providers/my-id`,
      expect.any(Object),
    );
  });

  it('createProvider calls POST /providers with JSON body', async () => {
    const fetchFn = jest.fn().mockResolvedValue(okJson(MOCK_PROVIDER));
    const client = makeClient(fetchFn);

    await client.createProvider(MOCK_PROVIDER);

    const [url, init] = fetchFn.mock.calls[0];
    expect(url).toBe(`${BASE_URL}/proxy/providers`);
    expect(init.method).toBe('POST');
    expect(JSON.parse(init.body)).toEqual(MOCK_PROVIDER);
  });

  it('applyProvider calls PUT /providers/{id} with JSON body', async () => {
    const fetchFn = jest.fn().mockResolvedValue(okJson(MOCK_PROVIDER));
    const client = makeClient(fetchFn);

    await client.applyProvider('my-id', MOCK_PROVIDER);

    const [url, init] = fetchFn.mock.calls[0];
    expect(url).toBe(`${BASE_URL}/proxy/providers/my-id`);
    expect(init.method).toBe('PUT');
    expect(JSON.parse(init.body)).toEqual(MOCK_PROVIDER);
  });

  it('deleteProvider calls DELETE /providers/{id} and returns undefined', async () => {
    const fetchFn = jest
      .fn()
      .mockResolvedValue({ status: 204, ok: true } as Response);
    const client = makeClient(fetchFn);

    const result = await client.deleteProvider('my-id');

    expect(result).toBeUndefined();
    const [url, init] = fetchFn.mock.calls[0];
    expect(url).toBe(`${BASE_URL}/proxy/providers/my-id`);
    expect(init.method).toBe('DELETE');
  });
});
