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
import { MarketplacePackageInstallStatus } from '@red-hat-developer-hub/backstage-plugin-extensions-common';

import { DynamicPackageInstallStatusProcessor } from './DynamicPackageInstallStatusProcessor';
import { DynamicPluginManager } from '@backstage/backend-dynamic-feature-service';
import { mockServices } from '@backstage/backend-test-utils';
import {
  locationSpec,
  packageEntity,
  pluginEntity,
} from '../../__fixtures__/mockData';

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

const mockPluginProvider = new (DynamicPluginManager as any)();
mockPluginProvider._plugins = [
  { name: 'plugin1', version: '1.1.0' },
  { name: 'plugin2', version: '2.2.0' },
];

describe('DynamicPackageInstallStatusProcessor', () => {
  let processor: DynamicPackageInstallStatusProcessor;
  const logger = mockServices.logger.mock();

  beforeEach(() => {
    jest.clearAllMocks();
    processor = new DynamicPackageInstallStatusProcessor({
      logger,
      pluginProvider: mockPluginProvider,
    });
  });

  it('should return processor name', () => {
    expect(processor.getProcessorName()).toBe(
      'DynamicPackageInstallStatusProcessor',
    );
  });

  describe('getCachedPlugins', () => {
    it('should use cached data if not expired', async () => {
      const cachedData = {
        plugins: { plugin1: '1.1.0' },
        cachedTime: Date.now(),
      };
      (cache.get as jest.Mock).mockResolvedValue(cachedData);

      const result = await processor.getCachedPlugins(cache, 'some-entity-ref');
      expect(result).toEqual(cachedData);
      expect(cache.get).toHaveBeenCalledWith('some-entity-ref');
      expect(cache.set).not.toHaveBeenCalled();
    });

    it('should fetch and cache data if expired', async () => {
      const cachedData = {
        plugins: { plugin1: '1.1.0' },
        cachedTime: Date.now() - 120000, // Expired
      };
      (cache.get as jest.Mock).mockResolvedValue(cachedData);

      const result = await processor.getCachedPlugins(cache, 'some-entity-ref');
      expect(result.plugins).toEqual({ plugin1: '1.1.0', plugin2: '2.2.0' });
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
      expect(logger.debug).toHaveBeenCalledWith(
        "Entity package:default/testpackage is missing 'spec.packageName', unable to determine 'spec.installStatus'",
      );
    });

    it('should not process if the installStatus is already set', async () => {
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

    it.each([
      {
        description: 'frontend wrapper name',
        packageName: 'red-hat-developer-hub-backstage-plugin-extensions',
        entityPackageName: '@red-hat-developer-hub/backstage-plugin-extensions',
      },
      {
        description: 'backend wrapper name',
        packageName:
          'red-hat-developer-hub-backstage-plugin-extensions-backend-dynamic',
        entityPackageName:
          '@red-hat-developer-hub/backstage-plugin-extensions-backend',
      },
      {
        description: 'frontend export-dynamic-plugin name',
        packageName: '@backstage-community/plugin-playlist-dynamic',
        entityPackageName: '@backstage-community/plugin-playlist',
      },
      {
        description: 'backend export-dynamic-plugin name',
        packageName: '@backstage-community/plugin-playlist-backend-dynamic',
        entityPackageName: '@backstage-community/plugin-playlist-backend',
      },
    ])(
      'should return Installed if the package is installed for the $description',
      async ({ packageName, entityPackageName }) => {
        mockPluginProvider._plugins = [{ name: packageName }];

        const entity = await processor.preProcessEntity(
          {
            ...packageEntity,
            spec: {
              ...packageEntity.spec,
              packageName: entityPackageName,
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
      },
    );

    it("should return undefined if the package is not in installed packages and missing 'spec.dynamicArtifact'", async () => {
      mockPluginProvider._plugins = [
        { name: 'another-plugin', version: '3.3.0' },
      ];

      const result = await processor.preProcessEntity(
        packageEntity,
        locationSpec,
        jest.fn(),
        locationSpec,
        cache,
      );
      expect(result.spec?.installStatus).toBe(undefined);
      expect(logger.debug).toHaveBeenCalledWith(
        "Entity package:default/testpackage is missing 'spec.dynamicArtifact', unable to determine 'spec.installStatus'",
      );
    });

    it('should set NotInstalled if the package is not in installed packages and is not preinstalled', async () => {
      mockPluginProvider._plugins = [
        { name: 'another-plugin', version: '3.3.0' },
      ];
      const packageEntityWithDynamicArtifact = {
        ...packageEntity,
        spec: {
          ...packageEntity.spec,
          dynamicArtifact: '"@marketplace-demo/test-plugin@1.0.0"',
        },
      };
      const result = await processor.preProcessEntity(
        packageEntityWithDynamicArtifact,
        locationSpec,
        jest.fn(),
        locationSpec,
        cache,
      );
      expect(result.spec?.installStatus).toBe(
        MarketplacePackageInstallStatus.NotInstalled,
      );
    });

    it('should return Disabled if the package is not in installed packages and is preinstalled', async () => {
      mockPluginProvider._plugins = [
        { name: 'another-plugin', version: '3.3.0' },
      ];

      const packageEntityWithDynamicArtifact = {
        ...packageEntity,
        spec: {
          ...packageEntity.spec,
          dynamicArtifact: './dynamic-plugins/dist/test-package',
        },
      };

      const result = await processor.preProcessEntity(
        packageEntityWithDynamicArtifact,
        locationSpec,
        jest.fn(),
        locationSpec,
        cache,
      );
      expect(result.spec?.installStatus).toBe(
        MarketplacePackageInstallStatus.Disabled,
      );
    });

    it('should return UpdateAvailable if the entity has incorrect package installed', async () => {
      mockPluginProvider._plugins = [
        { name: 'backstage-plugin-search-backend-dynamic', version: '1.0.0' },
      ];
      const searchBackendPackage = {
        ...packageEntity,
        spec: {
          ...packageEntity.spec,
          packageName: '@backstage/plugin-search-backend',
          version: '^1.0.1',
        },
      };

      const result = await processor.preProcessEntity(
        searchBackendPackage,
        locationSpec,
        jest.fn(),
        locationSpec,
        cache,
      );
      expect(result.spec?.installStatus).toBe(
        MarketplacePackageInstallStatus.UpdateAvailable,
      );
    });

    it('should return the entity unchanged for non-package entities', async () => {
      const result = await processor.preProcessEntity(
        pluginEntity,
        locationSpec,
        jest.fn(),
        locationSpec,
        cache,
      );
      expect(result).toBe(pluginEntity);
    });
  });
});
