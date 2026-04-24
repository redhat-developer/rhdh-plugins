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
import { PlacementClient } from './PlacementClient';
import type { Resource, RehydrateRequest } from '../types/placement';

const BASE_URL = 'http://localhost/api/dcm';

const MOCK_RESOURCE: Resource = {
  catalog_item_instance_id: 'instance-abc',
  spec: { memory: '4Gi' },
};

function makeClient(fetchFn: jest.Mock) {
  const discoveryApi: DiscoveryApi = {
    getBaseUrl: jest.fn().mockResolvedValue(BASE_URL),
  };
  const fetchApi: FetchApi = { fetch: fetchFn };
  return new PlacementClient({ discoveryApi, fetchApi });
}

function okJson(data: unknown): Response {
  return {
    status: 200,
    ok: true,
    json: async () => data,
  } as unknown as Response;
}

describe('PlacementClient', () => {
  it('listResources calls GET /resources without query params by default', async () => {
    const fetchFn = jest
      .fn()
      .mockResolvedValue(okJson({ resources: [MOCK_RESOURCE] }));
    const client = makeClient(fetchFn);

    await client.listResources();

    expect(fetchFn).toHaveBeenCalledWith(
      `${BASE_URL}/proxy/resources`,
      expect.any(Object),
    );
  });

  it('listResources appends query params when options are provided', async () => {
    const fetchFn = jest.fn().mockResolvedValue(okJson({ resources: [] }));
    const client = makeClient(fetchFn);

    await client.listResources({
      provider: 'prov-1',
      maxPageSize: 10,
      pageToken: 'tok',
    });

    const calledUrl = fetchFn.mock.calls[0][0] as string;
    expect(calledUrl).toContain('provider=prov-1');
    expect(calledUrl).toContain('max_page_size=10');
    expect(calledUrl).toContain('page_token=tok');
  });

  it('createResource calls POST /resources without id query param by default', async () => {
    const fetchFn = jest.fn().mockResolvedValue(okJson(MOCK_RESOURCE));
    const client = makeClient(fetchFn);

    await client.createResource(MOCK_RESOURCE);

    const [url, init] = fetchFn.mock.calls[0];
    expect(url).toBe(`${BASE_URL}/proxy/resources`);
    expect(init.method).toBe('POST');
  });

  it('createResource appends id query param when provided', async () => {
    const fetchFn = jest.fn().mockResolvedValue(okJson(MOCK_RESOURCE));
    const client = makeClient(fetchFn);

    await client.createResource(MOCK_RESOURCE, 'custom-id');

    const calledUrl = fetchFn.mock.calls[0][0] as string;
    expect(calledUrl).toContain('id=custom-id');
  });

  it('deleteResource calls DELETE /resources/{id} and returns undefined', async () => {
    const fetchFn = jest
      .fn()
      .mockResolvedValue({ status: 204, ok: true } as Response);
    const client = makeClient(fetchFn);

    const result = await client.deleteResource('res-1');

    expect(result).toBeUndefined();
    const [url, init] = fetchFn.mock.calls[0];
    expect(url).toBe(`${BASE_URL}/proxy/resources/res-1`);
    expect(init.method).toBe('DELETE');
  });

  it('rehydrateResource calls POST /resources/{id}:rehydrate', async () => {
    const rehydrateReq: RehydrateRequest = { new_resource_id: 'new-res-2' };
    const fetchFn = jest.fn().mockResolvedValue(okJson(MOCK_RESOURCE));
    const client = makeClient(fetchFn);

    await client.rehydrateResource('res-1', rehydrateReq);

    const [url, init] = fetchFn.mock.calls[0];
    expect(url).toBe(`${BASE_URL}/proxy/resources/res-1:rehydrate`);
    expect(init.method).toBe('POST');
    expect(JSON.parse(init.body)).toEqual(rehydrateReq);
  });
});
