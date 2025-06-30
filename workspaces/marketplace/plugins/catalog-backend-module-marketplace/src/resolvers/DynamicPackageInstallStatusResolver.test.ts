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

import { MarketplacePackageInstallStatus } from '@red-hat-developer-hub/backstage-plugin-marketplace-common';
import { DynamicPluginManager } from '@backstage/backend-dynamic-feature-service';
import { mockServices } from '@backstage/backend-test-utils';
import {
  mockMarketplaceBackendPackage,
  mockMarketplacePackage,
  packageEntity,
} from '../../__fixtures__/mockData';
import { DynamicPackageInstallStatusResolver } from './DynamicPackageInstallStatusResolver';
import { DynamicPluginsService } from './DynamicPluginsService';

const mockPluginProvider = new (DynamicPluginManager as any)();
mockPluginProvider._plugins = [
  { name: 'plugin1', version: '1.1.0' },
  { name: 'plugin2', version: '2.2.0' },
];

const mockDynamicPluginsService = {
  isPackageDisabledViaConfig: jest.fn().mockReturnValue(false),
} as unknown as jest.Mocked<DynamicPluginsService>;

describe('DynamicPackageInstallStatusResolver', () => {
  describe('getCachedPlugins', () => {
    beforeEach(() => {
      jest.clearAllMocks();
      mockPluginProvider._plugins = [
        {
          name: '@red-hat-developer-hub/backstage-plugin-marketplace',
          version: '1.0.0',
        },
      ];
    });

    it('should use cached data if not expired', () => {
      const pluginsSpy = jest.spyOn(mockPluginProvider, 'plugins');

      const resolver = new DynamicPackageInstallStatusResolver({
        logger: mockServices.logger.mock(),
        pluginProvider: mockPluginProvider,
        dynamicPluginsService: mockDynamicPluginsService,
      });

      // First call - should cache
      const result1 = resolver.getPackageInstallStatus(mockMarketplacePackage);
      expect(result1).toBe(MarketplacePackageInstallStatus.Installed);
      expect(pluginsSpy).toHaveBeenCalledTimes(1);

      // Second call - should use cache
      const result2 = resolver.getPackageInstallStatus(mockMarketplacePackage);
      expect(result2).toBe(MarketplacePackageInstallStatus.Installed);
      expect(pluginsSpy).toHaveBeenCalledTimes(1);
    });

    it('should refresh cache plugins if expired', () => {
      const pluginsSpy = jest.spyOn(mockPluginProvider, 'plugins');
      const dateSpy = jest.spyOn(Date, 'now');
      const initialTime = Date.now();
      dateSpy.mockReturnValue(initialTime);

      const resolver = new DynamicPackageInstallStatusResolver({
        logger: mockServices.logger.mock(),
        pluginProvider: mockPluginProvider,
        dynamicPluginsService: mockDynamicPluginsService,
      });

      // First call - should cache
      resolver.getPackageInstallStatus(mockMarketplacePackage);
      expect(pluginsSpy).toHaveBeenCalledTimes(1);

      // Second call - should refresh cache
      dateSpy.mockReturnValue(initialTime + 70000);
      resolver.getPackageInstallStatus(mockMarketplacePackage);
      expect(pluginsSpy).toHaveBeenCalledTimes(2);
    });
  });

  describe('getPackageInstallStatus', () => {
    afterEach(() => {
      jest.clearAllMocks();
    });

    it('should not process without packageName', () => {
      const resolver = new DynamicPackageInstallStatusResolver({
        logger: mockServices.logger.mock(),
        pluginProvider: mockPluginProvider,
        dynamicPluginsService: mockDynamicPluginsService,
      });

      const installStatus = resolver.getPackageInstallStatus({
        ...packageEntity,
        spec: {
          ...packageEntity.spec,
          packageName: undefined,
        },
      });

      expect(installStatus).toBe(undefined);
    });

    it('should not process if the installStatus is already set', async () => {
      const resolver = new DynamicPackageInstallStatusResolver({
        logger: mockServices.logger.mock(),
        pluginProvider: mockPluginProvider,
        dynamicPluginsService: mockDynamicPluginsService,
      });

      const installStatus = resolver.getPackageInstallStatus({
        ...mockMarketplacePackage,
        spec: {
          ...mockMarketplacePackage.spec,
          installStatus: MarketplacePackageInstallStatus.Installed,
        },
      });

      expect(installStatus).toBe(MarketplacePackageInstallStatus.Installed);
    });

    it('should return Installed if the package is Installed for the backend package (wrappers)', async () => {
      const resolver = new DynamicPackageInstallStatusResolver({
        logger: mockServices.logger.mock(),
        pluginProvider: mockPluginProvider,
        dynamicPluginsService: mockDynamicPluginsService,
      });
      mockPluginProvider._plugins = [
        {
          name: 'red-hat-developer-hub-backstage-plugin-marketplace-backend-dynamic',
        },
      ];

      const installStatus = resolver.getPackageInstallStatus(
        mockMarketplaceBackendPackage,
      );

      expect(installStatus).toBe(MarketplacePackageInstallStatus.Installed);
    });

    it('should return Installed if the package is installed (wrappers)', async () => {
      mockPluginProvider._plugins = [
        { name: 'red-hat-developer-hub-backstage-plugin-marketplace' },
      ];
      const resolver = new DynamicPackageInstallStatusResolver({
        logger: mockServices.logger.mock(),
        pluginProvider: mockPluginProvider,
        dynamicPluginsService: mockDynamicPluginsService,
      });

      const installStatus = resolver.getPackageInstallStatus(
        mockMarketplacePackage,
      );

      expect(installStatus).toBe(MarketplacePackageInstallStatus.Installed);
    });

    it('should return Installed if the package is installed', async () => {
      mockPluginProvider._plugins = [
        { name: '@red-hat-developer-hub/backstage-plugin-marketplace' },
      ];
      const resolver = new DynamicPackageInstallStatusResolver({
        logger: mockServices.logger.mock(),
        pluginProvider: mockPluginProvider,
        dynamicPluginsService: mockDynamicPluginsService,
      });

      const installStatus = resolver.getPackageInstallStatus({
        ...mockMarketplacePackage,
        metadata: {
          ...mockMarketplacePackage.metadata,
          name: ' @red-hat-developer-hub/backstage-plugin-marketplace',
        },
      });

      expect(installStatus).toBe(MarketplacePackageInstallStatus.Installed);
    });

    it('should set NotInstalled if the package is not in installed packages', async () => {
      mockPluginProvider._plugins = [
        { name: 'another-plugin', version: '3.3.0' },
      ];
      const resolver = new DynamicPackageInstallStatusResolver({
        logger: mockServices.logger.mock(),
        pluginProvider: mockPluginProvider,
        dynamicPluginsService: mockDynamicPluginsService,
      });

      const installStatus = resolver.getPackageInstallStatus(
        mockMarketplacePackage,
      );
      expect(installStatus).toBe(MarketplacePackageInstallStatus.NotInstalled);
    });

    it('should return Disabled if the package is not in installed packages and disabled in config', async () => {
      mockPluginProvider._plugins = [
        { name: 'another-plugin', version: '3.3.0' },
      ];
      mockDynamicPluginsService.isPackageDisabledViaConfig.mockReturnValueOnce(
        true,
      );

      const resolver = new DynamicPackageInstallStatusResolver({
        logger: mockServices.logger.mock(),
        pluginProvider: mockPluginProvider,
        dynamicPluginsService: mockDynamicPluginsService,
      });

      const result = resolver.getPackageInstallStatus(packageEntity);
      expect(result).toBe(MarketplacePackageInstallStatus.Disabled);
    });

    it('should return UpdateAvailable if the entity has incorrect package installed', async () => {
      mockPluginProvider._plugins = [
        { name: 'backstage-plugin-search-backend-dynamic', version: '1.0.0' },
      ];
      mockDynamicPluginsService.isPackageDisabledViaConfig.mockReturnValueOnce(
        true,
      );
      const searchBackendPackage = {
        ...packageEntity,
        spec: {
          ...packageEntity.spec,
          packageName: '@backstage/plugin-search-backend',
          version: '^1.0.1',
        },
      };

      const resolver = new DynamicPackageInstallStatusResolver({
        logger: mockServices.logger.mock(),
        pluginProvider: mockPluginProvider,
        dynamicPluginsService: mockDynamicPluginsService,
      });

      const result = resolver.getPackageInstallStatus(searchBackendPackage);
      expect(result).toBe(MarketplacePackageInstallStatus.UpdateAvailable);
    });

    it.each([
      {
        description: 'spec missing',
        entity: {
          apiVersion: 'extensions.backstage.io/v1alpha1',
          kind: 'Package',
          metadata: {
            name: 'testpackage',
          },
        },
      },
      {
        description: 'spec.packageName missing',
        entity: {
          apiVersion: 'extensions.backstage.io/v1alpha1',
          kind: 'Package',
          metadata: {
            name: 'testpackage',
          },
          spec: {},
        },
      },
    ])(
      'should handle gracefully when $description and return undefined installStatus',
      ({ entity }) => {
        const logger = mockServices.logger.mock();
        const resolver = new DynamicPackageInstallStatusResolver({
          logger,
          pluginProvider: mockPluginProvider,
          dynamicPluginsService: mockDynamicPluginsService,
        });

        const result = resolver.getPackageInstallStatus(entity);
        expect(result).toBe(undefined);
        expect(logger.warn).toHaveBeenCalledWith(
          "Entity package:default/testpackage missing 'entity.spec.packageName', unable to determine 'spec.installStatus'",
        );
      },
    );
  });
});
