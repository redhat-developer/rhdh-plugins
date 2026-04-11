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
import { AugmentApiClient, augmentApiRef } from './AugmentApi';
import {
  DiscoveryApi,
  FetchApi,
  ConfigApi,
  IdentityApi,
} from '@backstage/core-plugin-api';
import { createMockResponse } from '../test-utils/factories';

describe('AugmentApi', () => {
  let api: AugmentApiClient;
  let mockDiscoveryApi: jest.Mocked<DiscoveryApi>;
  let mockFetchApi: jest.Mocked<FetchApi>;
  let mockConfigApi: jest.Mocked<ConfigApi>;
  let mockIdentityApi: jest.Mocked<IdentityApi>;

  beforeEach(() => {
    mockDiscoveryApi = {
      getBaseUrl: jest
        .fn()
        .mockResolvedValue('http://localhost:7007/api/augment'),
    };

    mockIdentityApi = {
      getBackstageIdentity: jest.fn().mockResolvedValue({
        type: 'user',
        userEntityRef: 'user:default/guest',
        ownershipEntityRefs: [],
      }),
      getCredentials: jest.fn().mockResolvedValue({ token: 'test-token' }),
      getProfileInfo: jest.fn().mockResolvedValue({ displayName: 'Guest' }),
      signOut: jest.fn(),
    };

    mockFetchApi = {
      fetch: jest.fn(),
    };

    mockConfigApi = {
      getString: jest.fn(),
      getOptionalString: jest.fn(),
      getOptional: jest.fn(),
      getOptionalStringArray: jest.fn(),
      getConfig: jest.fn().mockReturnValue({
        getOptionalConfigArray: jest.fn().mockReturnValue([]),
      }),
      getOptionalConfig: jest.fn().mockReturnValue(undefined),
      getOptionalConfigArray: jest.fn().mockReturnValue([]),
      has: jest.fn(),
      keys: jest.fn().mockReturnValue([]),
      get: jest.fn(),
      getNumber: jest.fn(),
      getOptionalNumber: jest.fn(),
      getBoolean: jest.fn(),
      getOptionalBoolean: jest.fn(),
      getStringArray: jest.fn(),
      getConfigArray: jest.fn(),
    };

    api = new AugmentApiClient({
      discoveryApi: mockDiscoveryApi,
      fetchApi: mockFetchApi,
      configApi: mockConfigApi,
      identityApi: mockIdentityApi,
    });
  });

  describe('augmentApiRef', () => {
    it('should have correct id', () => {
      expect(augmentApiRef.id).toBe('plugin.augment.api');
    });
  });

  describe('getStatus', () => {
    it('should fetch status from backend', async () => {
      const mockStatus = {
        success: true,
        status: {
          vectorStoreIds: ['vs_test'],
          model: 'test-model',
          documentsCount: 5,
        },
      };

      mockFetchApi.fetch.mockResolvedValue(
        createMockResponse({
          ok: true,
          json: jest.fn().mockResolvedValue(mockStatus),
        }),
      );

      const result = await api.getStatus();

      expect(mockDiscoveryApi.getBaseUrl).toHaveBeenCalledWith('augment');
      expect(mockFetchApi.fetch).toHaveBeenCalledWith(
        'http://localhost:7007/api/augment/status',
      );
      expect(result).toEqual(mockStatus);
    });
  });

  describe('getBranding', () => {
    it('should fetch branding configuration', async () => {
      const mockBrandingData = {
        appName: 'Augment',
        tagline: 'Your AI assistant',
        primaryColor: '#9333ea',
      };

      mockFetchApi.fetch.mockResolvedValue(
        createMockResponse({
          ok: true,
          json: jest.fn().mockResolvedValue({ branding: mockBrandingData }),
        }),
      );

      const result = await api.getBranding();

      expect(mockFetchApi.fetch).toHaveBeenCalledWith(
        'http://localhost:7007/api/augment/branding',
      );
      expect(result).toEqual(mockBrandingData);
    });
  });
});
