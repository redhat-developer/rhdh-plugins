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

import { mockServices } from '@backstage/backend-test-utils';
import { DynamicPluginInstallStatusProcessor } from '../DynamicPluginInstallStatusProcessor';
import {
  InstallStatus,
  MarketplacePluginEntry,
} from '@red-hat-developer-hub/backstage-plugin-marketplace-common';
import { CatalogProcessorCache } from '@backstage/plugin-catalog-node';

const pluginEntity: MarketplacePluginEntry = {
  apiVersion: 'marketplace.backstage.io/v1alpha1',
  metadata: {
    name: 'testplugin',
    title: 'APIs with Test plugin',
    description: 'Test plugin.',
    tags: ['3scale', 'api'],
  },
  kind: 'Plugin',
  spec: {
    categories: ['API Discovery'],
    developer: 'Red Hat',
    icon: 'https://janus-idp.io/images/plugins/3scale.svg',
    type: 'frontend-plugin',
    lifecycle: 'production',
    owner: 'test-group',
    description: 'Test plugin',
    installation: {
      markdown: '# Installation \n run `yarn add test-plugin`',
    },
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
const authService = mockServices.auth.mock();
const locationSpec = {
  type: '',
  target: '',
};

describe('DynamicPluginInstallStatusProcessor', () => {
  beforeEach(() => {
    global.fetch = jest.fn().mockResolvedValue({} as any);
  });

  it('should return processor name', () => {
    const processor = new DynamicPluginInstallStatusProcessor(
      mockServices.discovery.mock(),
      authService,
    );

    expect(processor.getProcessorName()).toBe(
      'DynamicPluginInstallStatusProcessor',
    );
  });

  describe('getInstalledPlugins', () => {
    it('should fetch installed plugins successfully', async () => {
      const pluginsMock = { plugin1: {}, plugin2: {} };

      (fetch as jest.Mock).mockResolvedValue(
        new Response(JSON.stringify(pluginsMock), { status: 200 }),
      );

      const processor = new DynamicPluginInstallStatusProcessor(
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
      const processor = new DynamicPluginInstallStatusProcessor(
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

      const processor = new DynamicPluginInstallStatusProcessor(
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

      const processor = new DynamicPluginInstallStatusProcessor(
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
      jest.resetAllMocks();
    });

    it('should not process if the installStatus is already set', async () => {
      const processor = new DynamicPluginInstallStatusProcessor(
        discoveryService,
        authService,
      );

      const entity = await processor.preProcessEntity(
        {
          ...pluginEntity,
          spec: {
            ...pluginEntity.spec,
            installStatus: InstallStatus.Installed,
          },
        },
        locationSpec,
        jest.fn(),
        locationSpec,
        cache,
      );

      expect(entity.spec?.installStatus).toBe(InstallStatus.Installed);
    });

    it('should return Installed', async () => {
      const pluginsMock = { testplugin: {}, plugin2: {} };

      (fetch as jest.Mock).mockResolvedValue(
        new Response(JSON.stringify(pluginsMock), { status: 200 }),
      );

      const processor = new DynamicPluginInstallStatusProcessor(
        discoveryService,
        authService,
      );

      const entity = await processor.preProcessEntity(
        pluginEntity,
        locationSpec,
        jest.fn(),
        locationSpec,
        cache,
      );

      expect(entity.spec?.installStatus).toBe(InstallStatus.Installed);
    });

    it('should set installStatus to NotInstalled if the plugin is not found', async () => {
      const entity: MarketplacePluginEntry = {
        apiVersion: 'marketplace.backstage.io/v1alpha1',
        kind: 'Plugin',
        metadata: { name: 'unknown-plugin' },
        spec: {},
      };
      const pluginsMock = { plugin1: {}, plugin2: {} };
      (fetch as jest.Mock).mockResolvedValue(
        new Response(JSON.stringify(pluginsMock), { status: 200 }),
      );

      const processor = new DynamicPluginInstallStatusProcessor(
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
      expect(result.spec?.installStatus).toBe('NotInstalled');
    });

    it('should return the entity unchanged for non-plugin entities', async () => {
      const entity: MarketplacePluginEntry = {
        apiVersion: 'other-api/v1',
        kind: 'Component',
        metadata: { name: 'component1' },
        spec: {},
      };

      const processor = new DynamicPluginInstallStatusProcessor(
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
      expect(result).toEqual(entity);
    });
  });
});
