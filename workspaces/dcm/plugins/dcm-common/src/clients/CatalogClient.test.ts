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
import { CatalogClient } from './CatalogClient';
import type { CatalogItemInstance } from '../types/catalog';

const BASE_URL = 'http://localhost/api/dcm';

const MOCK_INSTANCE: CatalogItemInstance = {
  api_version: 'v1alpha1',
  display_name: 'Test instance',
  uid: 'inst-1',
  spec: {
    catalog_item_id: 'ci-1',
    user_values: [],
  },
  resource_id: 'res-new',
};

function makeClient(fetchFn: jest.Mock) {
  const discoveryApi: DiscoveryApi = {
    getBaseUrl: jest.fn().mockResolvedValue(BASE_URL),
  };
  const fetchApi: FetchApi = { fetch: fetchFn };
  return new CatalogClient({ discoveryApi, fetchApi });
}

function okJson(data: unknown): Response {
  return {
    status: 200,
    ok: true,
    json: async () => data,
  } as unknown as Response;
}

describe('CatalogClient', () => {
  it('rehydrateCatalogItemInstance calls POST catalog-item-instances/{id}:rehydrate', async () => {
    const fetchFn = jest.fn().mockResolvedValue(okJson(MOCK_INSTANCE));
    const client = makeClient(fetchFn);

    const result = await client.rehydrateCatalogItemInstance('inst-1');

    expect(result).toEqual(MOCK_INSTANCE);
    const [url, init] = fetchFn.mock.calls[0];
    expect(url).toBe(
      `${BASE_URL}/proxy/catalog-item-instances/inst-1:rehydrate`,
    );
    expect(init.method).toBe('POST');
  });
});
