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
  MarketplaceKind,
  MarketplacePackage,
  MarketplacePackageInstallStatus,
  MarketplacePluginInstallStatus,
} from '@red-hat-developer-hub/backstage-plugin-extensions-common';
import {
  pluginEntity,
  locationSpec,
  mockMarketplaceBackendPackage,
  mockMarketplacePackage,
  mockMarketplacePlugin,
  packageEntity,
} from '../../__fixtures__/mockData';

import { PluginInstallStatusProcessor } from './PluginInstallStatusProcessor';
import { mockServices } from '@backstage/backend-test-utils';
import { CatalogClient } from '@backstage/catalog-client';
import { stringifyEntityRef } from '@backstage/catalog-model';

const mockCatalogClient = {
  getEntitiesByRefs: jest.fn(),
} as unknown as CatalogClient;

describe('PluginInstallStatusProcessor', () => {
  let processor: PluginInstallStatusProcessor;
  const logger = mockServices.logger.mock();
  const runner = jest.fn();
  const scheduler = mockServices.scheduler.mock({
    createScheduledTaskRunner(_) {
      return { run: runner };
    },
  });
  const cache = mockServices.cache.mock();

  const marketplacePackageRef = stringifyEntityRef(mockMarketplacePackage);
  const marketplaceBackendPackageRef = stringifyEntityRef(
    mockMarketplaceBackendPackage,
  );

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
  const marketplacePluginExtended = {
    ...mockMarketplacePlugin,
    spec: {
      packages: [
        ...mockMarketplacePlugin.spec.packages,
        'marketplace-plugin-demo/red-hat-developer-hub-backstage-plugin-catalog-backend-module-marketplace',
      ],
    },
  };

  const getWithInstallStatus = (
    pkg: MarketplacePackage,
    installStatus: MarketplacePackageInstallStatus,
  ) => {
    return {
      ...pkg,
      spec: { ...pkg.spec, installStatus },
    };
  };

  beforeEach(() => {
    jest.clearAllMocks();

    processor = new PluginInstallStatusProcessor({
      auth: mockServices.auth.mock(),
      catalog: mockCatalogClient,
      logger,
      cache,
      scheduler,
    });
  });

  it('should return processor name', () => {
    expect(processor.getProcessorName()).toBe('PluginInstallStatusProcessor');
  });

  it('should set up scheduled task runner for refreshing packages', () => {
    expect(scheduler.createScheduledTaskRunner).toHaveBeenCalledWith({
      frequency: { minutes: 30 },
      timeout: { minutes: 10 },
      initialDelay: { seconds: 10 },
      scope: 'global',
    });
    expect(runner).toHaveBeenCalledWith({
      id: 'PluginInstallStatusProcessor:refresh-packages',
      fn: expect.any(Function),
    });
  });

  describe('refreshPackages', () => {
    it('should fetch marketplace packages and cache defined install statuses', async () => {
      const marketplacePackage = getWithInstallStatus(
        mockMarketplacePackage,
        MarketplacePackageInstallStatus.Installed,
      );
      const marketplaceBackendPackage = getWithInstallStatus(
        mockMarketplaceBackendPackage,
        MarketplacePackageInstallStatus.UpdateAvailable,
      );
      mockCatalogClient.getEntities = jest.fn().mockResolvedValue({
        items: [
          marketplacePackage,
          marketplaceBackendPackage,
          mockMarketplaceCatalogPackage,
        ],
      });

      const refreshTaskRun = runner.mock.calls[0][0];
      await refreshTaskRun.fn(); // call refreshPackages
      expect(mockCatalogClient.getEntities).toHaveBeenCalledWith(
        {
          filter: {
            kind: MarketplaceKind.Package,
          },
        },
        undefined,
      );

      expect(cache.set).toHaveBeenCalledTimes(2); // mockMarketplaceCatalogPackage not cached because missing installStatus
      expect(cache.set).toHaveBeenCalledWith(
        marketplacePackageRef,
        MarketplacePackageInstallStatus.Installed,
        { ttl: { seconds: 30 } },
      );
      expect(cache.set).toHaveBeenCalledWith(
        marketplaceBackendPackageRef,
        MarketplacePackageInstallStatus.UpdateAvailable,
        { ttl: { seconds: 30 } },
      );
      expect(logger.info).toHaveBeenCalledWith(
        'Refreshing package install statuses for PluginInstallStatusProcessor',
      );
      expect(logger.info).toHaveBeenCalledWith(
        'PluginInstallStatusProcessor:refresh-packages cached 2 marketplace package install statuses',
      );
    });
  });

  describe('preProcessEntity', () => {
    it('should not process without packages', async () => {
      const entity = await processor.preProcessEntity(
        {
          ...pluginEntity,
          spec: {
            ...pluginEntity.spec,
            packages: [],
          },
        },
        locationSpec,
        jest.fn(),
        locationSpec,
      );

      expect(entity.spec?.installStatus).toBe(undefined);
      expect(logger.debug).toHaveBeenCalledWith(
        "Entity plugin:default/plugin1 is missing packages, unable to determine 'spec.installStatus'",
      );
    });

    it('should not process if the installStatus is already set', async () => {
      const entity = await processor.preProcessEntity(
        {
          ...pluginEntity,
          spec: {
            ...pluginEntity.spec,
            installStatus: MarketplacePluginInstallStatus.Installed,
          },
        },
        locationSpec,
        jest.fn(),
        locationSpec,
      );

      expect(entity.spec?.installStatus).toBe(
        MarketplacePluginInstallStatus.Installed,
      );
      expect(mockCatalogClient.getEntitiesByRefs).not.toHaveBeenCalled();
    });

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
        const marketplacePackage = getWithInstallStatus(
          mockMarketplacePackage,
          package1,
        );
        const marketplaceBackendPackage = getWithInstallStatus(
          mockMarketplaceBackendPackage,
          package2,
        );
        const marketplaceCatalogPackage = getWithInstallStatus(
          mockMarketplaceCatalogPackage,
          package3,
        );

        mockCatalogClient.getEntitiesByRefs = jest.fn().mockResolvedValue({
          items: [
            marketplaceBackendPackage,
            marketplacePackage,
            marketplaceCatalogPackage,
          ],
        });

        const entity = await processor.preProcessEntity(
          marketplacePluginExtended,
          locationSpec,
          jest.fn(),
          locationSpec,
        );

        expect(entity.spec?.installStatus).toBe(expected);
      },
    );

    it('should return undefined and log warning when some packages are missing', async () => {
      mockCatalogClient.getEntitiesByRefs = jest.fn().mockResolvedValue({
        items: [
          // missing marketplaceBackendPackage
          getWithInstallStatus(
            mockMarketplacePackage,
            MarketplacePackageInstallStatus.Installed,
          ),
        ],
      });

      const entity = await processor.preProcessEntity(
        mockMarketplacePlugin,
        locationSpec,
        jest.fn(),
        locationSpec,
      );

      expect(entity.spec?.installStatus).toBe(undefined);
      expect(logger.debug).toHaveBeenCalledWith(
        "Entity plugin:marketplace-plugin-demo/marketplace is missing all definitions of 'spec.installStatus' in its packages, unable to determine 'spec.installStatus'",
      );
    });

    it('should return undefined and log warning when some packages are missing installStatus', async () => {
      mockCatalogClient.getEntitiesByRefs = jest.fn().mockResolvedValue({
        items: [
          mockMarketplaceBackendPackage,
          getWithInstallStatus(
            mockMarketplacePackage,
            MarketplacePackageInstallStatus.Installed,
          ),
        ],
      });

      const entity = await processor.preProcessEntity(
        mockMarketplacePlugin,
        locationSpec,
        jest.fn(),
        locationSpec,
      );

      expect(entity.spec?.installStatus).toBe(undefined);
      expect(logger.debug).toHaveBeenCalledWith(
        "Entity plugin:marketplace-plugin-demo/marketplace is missing all definitions of 'spec.installStatus' in its packages, unable to determine 'spec.installStatus'",
      );
    });

    it('should return the entity unchanged for non-plugin entities', async () => {
      const result = await processor.preProcessEntity(
        packageEntity,
        locationSpec,
        jest.fn(),
        locationSpec,
      );
      expect(result).toBe(packageEntity);
    });

    it('should use cached packages if available', async () => {
      cache.get.mockImplementation(async (ref: string) => {
        if (
          ref === marketplacePackageRef ||
          ref === marketplaceBackendPackageRef
        ) {
          return MarketplacePackageInstallStatus.Installed;
        }
        return undefined;
      });

      const result = await processor.preProcessEntity(
        mockMarketplacePlugin,
        locationSpec,
        jest.fn(),
        locationSpec,
      );

      expect(cache.get).toHaveBeenCalledWith(marketplacePackageRef);
      expect(cache.get).toHaveBeenCalledWith(marketplaceBackendPackageRef);
      expect(mockCatalogClient.getEntitiesByRefs).not.toHaveBeenCalled();
      expect(result.spec?.installStatus).toBe(
        MarketplacePluginInstallStatus.Installed,
      );
    });

    it('should cache fetched packages', async () => {
      cache.get.mockImplementation(async (key: string) => {
        if (key === marketplacePackageRef) {
          return MarketplacePackageInstallStatus.Installed;
        }
        return undefined; // marketplaceBackendPackageRef not cached
      });

      const mockMarketplaceBackendPackageWithStatus = {
        ...mockMarketplaceBackendPackage,
        spec: {
          ...mockMarketplaceBackendPackage.spec,
          installStatus: MarketplacePackageInstallStatus.UpdateAvailable,
        },
      };
      mockCatalogClient.getEntitiesByRefs = jest.fn().mockResolvedValue({
        items: [mockMarketplaceBackendPackageWithStatus],
      });

      const result = await processor.preProcessEntity(
        mockMarketplacePlugin,
        locationSpec,
        jest.fn(),
        locationSpec,
      );

      expect(cache.get).toHaveBeenCalledWith(marketplacePackageRef);
      expect(cache.get).toHaveBeenCalledWith(marketplaceBackendPackageRef);
      expect(mockCatalogClient.getEntitiesByRefs).toHaveBeenCalledWith(
        { entityRefs: [marketplaceBackendPackageRef] },
        undefined,
      );
      expect(cache.set).toHaveBeenCalledWith(
        marketplaceBackendPackageRef,
        MarketplacePackageInstallStatus.UpdateAvailable,
        { ttl: { seconds: 30 } },
      );

      expect(result.spec?.installStatus).toBe(
        MarketplacePluginInstallStatus.UpdateAvailable,
      );
    });
  });
});
