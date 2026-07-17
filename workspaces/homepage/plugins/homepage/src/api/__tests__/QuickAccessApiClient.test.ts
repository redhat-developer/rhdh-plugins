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

import type {
  ConfigApi,
  DiscoveryApi,
  IdentityApi,
} from '@backstage/core-plugin-api';

import { QuickAccessApiClient } from '../QuickAccessApiClient';

describe('QuickAccessApiClient', () => {
  let client: QuickAccessApiClient;
  let mockDiscoveryApi: jest.Mocked<DiscoveryApi>;
  let mockConfigApi: jest.Mocked<ConfigApi>;
  let mockIdentityApi: jest.Mocked<IdentityApi>;
  let fetchMock: jest.Mock;

  const quickAccessData = [
    {
      title: 'Community',
      isExpanded: false,
      links: [
        {
          iconUrl: '/homepage/icons/icons8/web.png',
          label: 'Website',
          url: 'https://example.com',
        },
      ],
    },
  ];

  beforeEach(() => {
    fetchMock = jest.fn();
    global.fetch = fetchMock;

    mockDiscoveryApi = {
      getBaseUrl: jest
        .fn()
        .mockResolvedValue('http://localhost:7007/api/proxy'),
    };
    mockConfigApi = {
      getOptionalString: jest.fn().mockReturnValue(undefined),
    } as unknown as jest.Mocked<ConfigApi>;
    mockIdentityApi = {
      getCredentials: jest.fn().mockResolvedValue({ token: 'test-token' }),
    } as unknown as jest.Mocked<IdentityApi>;

    client = new QuickAccessApiClient({
      discoveryApi: mockDiscoveryApi,
      configApi: mockConfigApi,
      identityApi: mockIdentityApi,
    });
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('fetches quick access links using the default proxy path', async () => {
    fetchMock.mockResolvedValue({
      ok: true,
      json: jest.fn().mockResolvedValue(quickAccessData),
    });

    await expect(client.getQuickAccessLinks()).resolves.toEqual(
      quickAccessData,
    );
    expect(mockDiscoveryApi.getBaseUrl).toHaveBeenCalledWith('proxy');
    expect(fetchMock).toHaveBeenCalledWith(
      'http://localhost:7007/api/proxy/developer-hub',
      {
        headers: {
          'Content-Type': 'application/json',
          Authorization: 'Bearer test-token',
        },
      },
    );
  });

  it('uses configured developerHub.proxyPath when provided', async () => {
    mockConfigApi.getOptionalString.mockReturnValue('/custom-proxy');
    fetchMock.mockResolvedValue({
      ok: true,
      json: jest.fn().mockResolvedValue(quickAccessData),
    });

    await client.getQuickAccessLinks();

    expect(mockConfigApi.getOptionalString).toHaveBeenCalledWith(
      'developerHub.proxyPath',
    );
    expect(fetchMock).toHaveBeenCalledWith(
      'http://localhost:7007/api/proxy/custom-proxy',
      expect.any(Object),
    );
  });

  it('appends the provided path to the proxy URL', async () => {
    fetchMock.mockResolvedValue({
      ok: true,
      json: jest.fn().mockResolvedValue(quickAccessData),
    });

    await client.getQuickAccessLinks('/quick-access');

    expect(fetchMock).toHaveBeenCalledWith(
      'http://localhost:7007/api/proxy/developer-hub/quick-access',
      expect.any(Object),
    );
  });

  it('omits Authorization header when no identity token is available', async () => {
    mockIdentityApi.getCredentials.mockResolvedValue({ token: undefined });
    fetchMock.mockResolvedValue({
      ok: true,
      json: jest.fn().mockResolvedValue(quickAccessData),
    });

    await client.getQuickAccessLinks();

    expect(fetchMock).toHaveBeenCalledWith(
      'http://localhost:7007/api/proxy/developer-hub',
      {
        headers: {
          'Content-Type': 'application/json',
        },
      },
    );
  });

  it('throws when the proxy responds with an error status', async () => {
    fetchMock.mockResolvedValue({
      ok: false,
      status: 404,
      statusText: 'Not Found',
    });

    await expect(client.getQuickAccessLinks()).rejects.toThrow(
      'failed to fetch data, status 404: Not Found',
    );
  });
});
