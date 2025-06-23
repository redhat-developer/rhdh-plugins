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

import { CatalogProcessorCache } from '@backstage/plugin-catalog-node';
import {
  MarketplacePlugin,
  MarketplacePackageInstallStatus,
  MarketplacePackage,
} from '@red-hat-developer-hub/backstage-plugin-marketplace-common';

import { DynamicPackageInstallStatusProcessor } from './DynamicPackageInstallStatusProcessor';
import { DynamicPluginManager } from '@backstage/backend-dynamic-feature-service';

const packageEntity: MarketplacePackage = {
  apiVersion: 'extensions.backstage.io/v1alpha1',
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

const locationSpec = {
  type: '',
  target: '',
};

const mockPluginProvider = new (DynamicPluginManager as any)();
mockPluginProvider._plugins = [{ name: 'plugin1' }, { name: 'plugin2' }];

describe('DynamicPackageInstallStatusProcessor', () => {
  beforeEach(() => {
    global.fetch = jest.fn().mockResolvedValue({} as any);
  });

  it('should return processor name', () => {
    const processor = new DynamicPackageInstallStatusProcessor(
      mockPluginProvider,
    );

    expect(processor.getProcessorName()).toBe(
      'DynamicPackageInstallStatusProcessor',
    );
  });

  describe('getCachedPlugins', () => {
    it('should use cached data if not expired', async () => {
      const cachedData = {
        plugins: ['plugin1'],
        cachedTime: Date.now(),
      };
      (cache.get as jest.Mock).mockResolvedValue(cachedData);

      const processor = new DynamicPackageInstallStatusProcessor(
        mockPluginProvider,
      );

      const result = await processor.getCachedPlugins(cache, 'some-entity-ref');
      expect(result).toEqual(cachedData);
      expect(cache.get).toHaveBeenCalledWith('some-entity-ref');
      expect(cache.set).not.toHaveBeenCalled();
    });

    it('should fetch and cache data if expired', async () => {
      const cachedData = {
        plugins: ['plugin1'],
        cachedTime: Date.now() - 120000, // Expired
      };
      (cache.get as jest.Mock).mockResolvedValue(cachedData);
      const processor = new DynamicPackageInstallStatusProcessor(
        mockPluginProvider,
      );

      const result = await processor.getCachedPlugins(cache, 'some-entity-ref');
      expect(result.plugins).toEqual(['plugin1', 'plugin2']);
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
        mockPluginProvider,
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

    it('should return Installed for the backend package name', async () => {
      const processor = new DynamicPackageInstallStatusProcessor(
        mockPluginProvider,
      );
      mockPluginProvider._plugins = [
        { name: 'red-hat-developer-hub-test-backend-plugin-dynamic' },
      ];

      const entity = await processor.preProcessEntity(
        {
          ...packageEntity,
          spec: {
            ...packageEntity.spec,
            packageName: '@red-hat-developer-hub/test-backend-plugin',
          },
        },
        locationSpec,
        jest.fn(),
        locationSpec,
        cache,
      );

      expect(entity.spec?.installStatus).toBe(
        MarketplacePackageInstallStatus.Installed,
      );
    });

    it('should not process if the installStatus is already set', async () => {
      const processor = new DynamicPackageInstallStatusProcessor(
        mockPluginProvider,
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
      const processor = new DynamicPackageInstallStatusProcessor(
        mockPluginProvider,
      );
      mockPluginProvider._plugins = [{ name: 'test-package' }];

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
      mockPluginProvider._plugins = [{ name: 'another-plugin' }];

      const processor = new DynamicPackageInstallStatusProcessor(
        mockPluginProvider,
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
        mockPluginProvider,
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
