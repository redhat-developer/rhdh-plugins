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

import { DefaultWidgetsApiClient } from '../DefaultWidgetsApiClient';

describe('DefaultWidgetsApiClient', () => {
  let client: DefaultWidgetsApiClient;
  let mockDiscoveryApi: jest.Mocked<DiscoveryApi>;
  let mockFetchApi: jest.Mocked<FetchApi>;

  beforeEach(() => {
    mockDiscoveryApi = {
      getBaseUrl: jest
        .fn()
        .mockResolvedValue('http://localhost:7007/api/homepage'),
    };
    mockFetchApi = {
      fetch: jest.fn(),
    };
    client = new DefaultWidgetsApiClient({
      discoveryApi: mockDiscoveryApi,
      fetchApi: mockFetchApi,
    });
  });

  it('fetches default widgets from the homepage backend', async () => {
    const widgets = {
      items: [{ id: 'headline', ref: 'homepage.headline' }],
    };
    mockFetchApi.fetch.mockResolvedValue({
      ok: true,
      json: jest.fn().mockResolvedValue(widgets),
    } as unknown as Response);

    await expect(client.getDefaultWidgets()).resolves.toEqual(widgets);
    expect(mockDiscoveryApi.getBaseUrl).toHaveBeenCalledWith('homepage');
    expect(mockFetchApi.fetch).toHaveBeenCalledWith(
      'http://localhost:7007/api/homepage/default-widgets',
    );
  });

  it('throws when the backend responds with an error status', async () => {
    mockFetchApi.fetch.mockResolvedValue({
      ok: false,
      status: 500,
      statusText: 'Internal Server Error',
    } as Response);

    await expect(client.getDefaultWidgets()).rejects.toThrow(
      'Failed to fetch default cards, status 500: Internal Server Error',
    );
  });
});
