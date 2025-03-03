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

import { mockServices } from '@backstage/backend-test-utils';
import { CatalogProcessorCache } from '@backstage/plugin-catalog-node';
import {
  MarketplacePlugin,
  MarketplacePackageInstallStatus,
  MarketplacePackage,
} from '@red-hat-developer-hub/backstage-plugin-marketplace-common';

import { DynamicPackageInstallStatusProcessor } from './DynamicPackageInstallStatusProcessor';

const packageEntity: MarketplacePackage = {
  apiVersion: 'marketplace.backstage.io/v1alpha1',
  kind: 'Package',
  metadata: {
    namespace: 'default',
    name: 'testpackage',
    title: 'APIs with Test package',
    description: 'Test package.',
    tags: ['3scale', 'api'],
  },
  spec: {
    packageName: 'test-package',
  },
};

const state: Record<string, any> = {};
const mockCacheGet = jest
  .fn()
  .mockImplementation(async (key: string) => state[key]);

const mockCacheSet = jest.fn().mockImplementation((key: string, value: any) => {
  state[key] = value;
});
const cache: CatalogProcessorCache = {
  get: mockCacheGet,
  set: mockCacheSet,
};

const discoveryService = mockServices.discovery.mock({
  getBaseUrl: async (pluginId: string) => {
    return `http://localhost:7007/api/${pluginId}`;
  },
});

const authService = mockServices.auth.mock({
  getPluginRequestToken: async () => ({ token: 'mockToken' }),
});

const locationSpec = {
  type: '',
  target: '',
};

describe('DynamicPackageInstallStatusProcessor', () => {
  beforeEach(() => {
    global.fetch = jest.fn().mockResolvedValue({} as any);
  });

  it('should return processor name', () => {
    const processor = new DynamicPackageInstallStatusProcessor(
      mockServices.discovery.mock(),
      authService,
    );

    expect(processor.getProcessorName()).toBe(
      'DynamicPackageInstallStatusProcessor',
    );
  });

  describe('getInstalledPlugins', () => {
    it('should fetch installed plugins successfully', async () => {
      const pluginsMock = { plugin1: {}, plugin2: {} };

      (fetch as jest.Mock).mockResolvedValue(
        new Response(JSON.stringify(pluginsMock), { status: 200 }),
      );

      const processor = new DynamicPackageInstallStatusProcessor(
        discoveryService,
        authService,
      );

      const result = await processor.getInstalledPlugins();
      expect(result).toEqual(pluginsMock);
      expect(discoveryService.getBaseUrl).toHaveBeenCalledWith('scalprum');
      expect(fetch).toHaveBeenCalledWith(
        'http://localhost:7007/api/scalprum/plugins',
        expect.any(Object),
      );
    });

    it('should handle non-200 responses gracefully', async () => {
      const processor = new DynamicPackageInstallStatusProcessor(
        discoveryService,
        authService,
      );

      (fetch as jest.Mock).mockResolvedValue(new Response('', { status: 500 }));

      const result = await processor.getInstalledPlugins();
      expect(result).toEqual([]);
    });
  });

  describe('getCachedPlugins', () => {
    it('should use cached data if not expired', async () => {
      const cachedData = {
        plugins: { plugin1: {} },
        cachedTime: Date.now(),
      };
      (cache.get as jest.Mock).mockResolvedValue(cachedData);

      const processor = new DynamicPackageInstallStatusProcessor(
        discoveryService,
        authService,
      );

      const result = await processor.getCachedPlugins(cache, 'some-entity-ref');
      expect(result).toEqual(cachedData);
      expect(cache.get).toHaveBeenCalledWith('some-entity-ref');
      expect(cache.set).not.toHaveBeenCalled();
    });

    it('should fetch and cache data if expired', async () => {
      const cachedData = {
        plugins: { plugin1: {} },
        cachedTime: Date.now() - 120000, // Expired
      };
      const pluginsMock = { plugin2: {} };
      (cache.get as jest.Mock).mockResolvedValue(cachedData);
      (fetch as jest.Mock).mockResolvedValue(
        new Response(JSON.stringify(pluginsMock), { status: 200 }),
      );

      const processor = new DynamicPackageInstallStatusProcessor(
        discoveryService,
        authService,
      );

      const result = await processor.getCachedPlugins(cache, 'some-entity-ref');
      expect(result.plugins).toEqual(pluginsMock);
      expect(cache.set).toHaveBeenCalledWith(
        'some-entity-ref',
        expect.any(Object),
      );
    });
  });

  describe('preProcessEntity', () => {
    afterEach(() => {
      jest.clearAllMocks();
    });

    it('should not process without packageName', async () => {
      const processor = new DynamicPackageInstallStatusProcessor(
        discoveryService,
        authService,
      );

      const entity = await processor.preProcessEntity(
        {
          ...packageEntity,
          spec: {
            ...packageEntity.spec,
            packageName: undefined,
          },
        },
        locationSpec,
        jest.fn(),
        locationSpec,
        cache,
      );

      expect(entity.spec?.installStatus).toBe(undefined);
    });

    it('should not process if the installStatus is already set', async () => {
      const processor = new DynamicPackageInstallStatusProcessor(
        discoveryService,
        authService,
      );

      const entity = await processor.preProcessEntity(
        {
          ...packageEntity,
          spec: {
            ...packageEntity.spec,
            installStatus: 'unknown-status',
          },
        },
        locationSpec,
        jest.fn(),
        locationSpec,
        cache,
      );

      expect(entity.spec?.installStatus).toBe('unknown-status');
    });

    it('should return Installed if the package is installed', async () => {
      const pluginsMock = { 'test-package': {} };
      (fetch as jest.Mock).mockResolvedValue(
        new Response(JSON.stringify(pluginsMock), { status: 200 }),
      );

      const processor = new DynamicPackageInstallStatusProcessor(
        discoveryService,
        authService,
      );

      const entity = await processor.preProcessEntity(
        packageEntity,
        locationSpec,
        jest.fn(),
        locationSpec,
        cache,
      );

      expect(entity.spec?.installStatus).toBe(
        MarketplacePackageInstallStatus.Installed,
      );
    });

    it('should set undefined if the plugin is not found', async () => {
      const pluginsMock = { 'another-plugin': {} };
      (fetch as jest.Mock).mockResolvedValue(
        new Response(JSON.stringify(pluginsMock), { status: 200 }),
      );

      const processor = new DynamicPackageInstallStatusProcessor(
        discoveryService,
        authService,
      );

      const result = await processor.preProcessEntity(
        packageEntity,
        locationSpec,
        jest.fn(),
        locationSpec,
        cache,
      );
      expect(result.spec?.installStatus).toBe(undefined);
    });

    it('should return the entity unchanged for non-plugin entities', async () => {
      const entity: MarketplacePlugin = {
        apiVersion: 'other-api/v1',
        kind: 'Component',
        metadata: { namespace: 'default', name: 'component1' },
        spec: {},
      };

      const processor = new DynamicPackageInstallStatusProcessor(
        discoveryService,
        authService,
      );

      const result = await processor.preProcessEntity(
        entity,
        locationSpec,
        jest.fn(),
        locationSpec,
        cache,
      );
      expect(result).toBe(entity);
    });
  });
});
