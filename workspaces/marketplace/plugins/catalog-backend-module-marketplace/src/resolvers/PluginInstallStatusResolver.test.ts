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

import {
  MarketplacePackage,
  MarketplacePackageInstallStatus,
  MarketplacePlugin,
  MarketplacePluginInstallStatus,
} from '@red-hat-developer-hub/backstage-plugin-marketplace-common';
import { PluginInstallStatusResolver } from './PluginInstallStatusResolver';
import {
  pluginEntity,
  packageEntity,
  mockMarketplacePackage,
  mockMarketplaceBackendPackage,
  mockMarketplacePlugin,
} from '../../__fixtures__/mockData';
import { mockServices } from '@backstage/backend-test-utils';
import { stringifyEntityRef } from '@backstage/catalog-model';

describe('PluginInstallStatusResolver', () => {
  const logger = mockServices.logger.mock();
  let resolver: PluginInstallStatusResolver;

  beforeEach(() => {
    jest.clearAllMocks();
    resolver = new PluginInstallStatusResolver({
      logger,
    });
  });

  describe('getPluginInstallStatus', () => {
    it.each([
      {
        description: 'any package is Disabled',
        package1: MarketplacePackageInstallStatus.Installed,
        package2: MarketplacePackageInstallStatus.Disabled,
        package3: MarketplacePackageInstallStatus.UpdateAvailable,
        expected: MarketplacePluginInstallStatus.Disabled,
      },
      {
        description: 'all packages are NotInstalled',
        package1: MarketplacePackageInstallStatus.NotInstalled,
        package2: MarketplacePackageInstallStatus.NotInstalled,
        package3: MarketplacePackageInstallStatus.NotInstalled,
        expected: MarketplacePluginInstallStatus.NotInstalled,
      },
      {
        description:
          'any package is UpdateAvailable and all remaining packages are Installed',
        package1: MarketplacePackageInstallStatus.Installed,
        package2: MarketplacePackageInstallStatus.UpdateAvailable,
        package3: MarketplacePackageInstallStatus.Installed,
        expected: MarketplacePluginInstallStatus.UpdateAvailable,
      },
      {
        description: 'any package is NotInstalled',
        package1: MarketplacePackageInstallStatus.Installed,
        package2: MarketplacePackageInstallStatus.NotInstalled,
        package3: MarketplacePackageInstallStatus.UpdateAvailable,
        expected: MarketplacePluginInstallStatus.PartiallyInstalled,
      },
    ])(
      'should return $expected when $description',
      async ({ package1, package2, package3, expected }) => {
        const mockMarketplaceCatalogPackage = {
          ...packageEntity,
          metadata: {
            name: 'red-hat-developer-hub-backstage-plugin-catalog-backend-module-marketplace',
            namespace: 'marketplace-plugin-demo',
          },
          spec: {
            packageName:
              '@red-hat-developer-hub/backstage-plugin-catalog-backend-module-marketplace',
            dynamicArtifact:
              './dynamic-plugins/dist/red-hat-developer-hub-backstage-plugin-catalog-backend-module-marketplace-dynamic',
          },
        };

        const marketplacePackage = {
          ...mockMarketplacePackage,
          spec: { installStatus: package1 },
        };
        const marketplaceBackendPackage = {
          ...mockMarketplaceBackendPackage,
          spec: { installStatus: package2 },
        };
        const marketplaceCatalogPackage: MarketplacePackage = {
          ...mockMarketplaceCatalogPackage,
          spec: { installStatus: package3 },
        };
        const marketplacePlugin: MarketplacePlugin = {
          ...mockMarketplacePlugin,
          spec: {
            packages: [
              ...mockMarketplacePlugin.spec!.packages!,
              'marketplace-plugin-demo/red-hat-developer-hub-backstage-plugin-catalog-backend-module-marketplace',
            ],
          },
        };
        const packageMap = new Map<string, MarketplacePackage>([
          [stringifyEntityRef(marketplacePackage), marketplacePackage],
          [
            stringifyEntityRef(marketplaceBackendPackage),
            marketplaceBackendPackage,
          ],
          [
            stringifyEntityRef(marketplaceCatalogPackage),
            marketplaceCatalogPackage,
          ],
        ]);

        const installStatus = resolver.getPluginInstallStatus(
          marketplacePlugin,
          packageMap,
        );

        expect(installStatus).toBe(expected);
      },
    );

    it('should return undefined and log warning when some plugin packages are missing', async () => {
      const packagesMap = new Map<string, MarketplacePackage>([
        [stringifyEntityRef(mockMarketplacePackage), mockMarketplacePackage], // missing marketplace backend package
      ]);

      const installStatus = resolver.getPluginInstallStatus(
        mockMarketplacePlugin,
        packagesMap,
      );

      expect(installStatus).toBe(undefined);
      expect(logger.warn).toHaveBeenCalledWith(
        "Missing all definitions for plugin:marketplace-plugin-demo/marketplace packages installStatus, unable to determine 'spec.installStatus'",
      );
    });

    it('should return undefined and log warning when plugin has no packages', () => {
      const pluginWithoutPackages: MarketplacePlugin = {
        ...pluginEntity,
        spec: {},
      };

      const result = resolver.getPluginInstallStatus(
        pluginWithoutPackages,
        new Map(),
      );

      expect(result).toBeUndefined();
      expect(logger.warn).toHaveBeenCalledWith(
        "Entity plugin:default/plugin1 is missing packages, unable to determine 'spec.installStatus'",
      );
    });

    it('should return undefined and log warning when plugin packages are undefined', () => {
      const pluginWithoutPackages: MarketplacePlugin = {
        ...pluginEntity,
        spec: {
          packages: undefined,
        },
      };

      const result = resolver.getPluginInstallStatus(
        pluginWithoutPackages,
        new Map(),
      );

      expect(result).toBeUndefined();
      expect(logger.warn).toHaveBeenCalledWith(
        "Entity plugin:default/plugin1 is missing packages, unable to determine 'spec.installStatus'",
      );
    });

    it('should return undefined and log warning when some plugin packages have no installStatus', () => {
      const packagesMap = new Map<string, MarketplacePackage>([
        [stringifyEntityRef(mockMarketplacePackage), mockMarketplacePackage],
        [
          stringifyEntityRef(mockMarketplaceBackendPackage),
          mockMarketplaceBackendPackage,
        ],
      ]);

      const result = resolver.getPluginInstallStatus(
        mockMarketplacePlugin,
        packagesMap,
      );

      expect(result).toBeUndefined();
      expect(logger.warn).toHaveBeenCalledWith(
        "Missing all definitions for plugin:marketplace-plugin-demo/marketplace packages installStatus, unable to determine 'spec.installStatus'",
      );
    });
  });
});
