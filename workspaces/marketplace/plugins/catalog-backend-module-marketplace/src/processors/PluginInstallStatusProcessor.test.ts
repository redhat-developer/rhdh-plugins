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
  MarketplacePackageInstallStatus,
  MarketplacePluginInstallStatus,
} from '@red-hat-developer-hub/backstage-plugin-marketplace-common';
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

const mockCatalogClient = {
  getEntitiesByRefs: jest.fn(),
} as unknown as CatalogClient;

describe('PluginInstallStatusProcessor', () => {
  it('should return processor name', () => {
    const processor = new PluginInstallStatusProcessor({
      auth: mockServices.auth.mock(),
      catalog: mockCatalogClient,
      logger: mockServices.logger.mock(),
    });
    expect(processor.getProcessorName()).toBe('PluginInstallStatusProcessor');
  });

  describe('preProcessEntity', () => {
    afterEach(() => {
      jest.clearAllMocks();
    });

    it('should not process without packages', async () => {
      const processor = new PluginInstallStatusProcessor({
        auth: mockServices.auth.mock(),
        catalog: mockCatalogClient,
        logger: mockServices.logger.mock(),
      });

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
    });

    it('should not process if the installStatus is already set', async () => {
      const processor = new PluginInstallStatusProcessor({
        auth: mockServices.auth.mock(),
        catalog: mockCatalogClient,
        logger: mockServices.logger.mock(),
      });

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
        const processor = new PluginInstallStatusProcessor({
          auth: mockServices.auth.mock(),
          catalog: mockCatalogClient,
          logger: mockServices.logger.mock(),
        });

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
        const marketplaceCatalogPackage = {
          ...mockMarketplaceCatalogPackage,
          spec: { installStatus: package3 },
        };
        const marketplacePlugin = {
          ...mockMarketplacePlugin,
          spec: {
            packages: [
              ...mockMarketplacePlugin.spec.packages,
              'marketplace-plugin-demo/red-hat-developer-hub-backstage-plugin-catalog-backend-module-marketplace',
            ],
          },
        };

        mockCatalogClient.getEntitiesByRefs = jest.fn().mockResolvedValue({
          items: [
            marketplaceBackendPackage,
            marketplacePackage,
            marketplaceCatalogPackage,
          ],
        });

        const entity = await processor.preProcessEntity(
          marketplacePlugin,
          locationSpec,
          jest.fn(),
          locationSpec,
        );

        expect(entity.spec?.installStatus).toBe(expected);
      },
    );

    it('should return undefined and log warning when not all packages', async () => {
      const logger = mockServices.logger.mock();
      const processor = new PluginInstallStatusProcessor({
        auth: mockServices.auth.mock(),
        catalog: mockCatalogClient,
        logger,
      });

      mockCatalogClient.getEntitiesByRefs = jest.fn().mockResolvedValue({
        items: [mockMarketplacePackage], // missing marketplaceBackendPackage
      });

      const entity = await processor.preProcessEntity(
        mockMarketplacePlugin,
        locationSpec,
        jest.fn(),
        locationSpec,
      );

      expect(entity.spec?.installStatus).toBe(undefined);
      expect(logger.warn).toHaveBeenCalledWith(
        "Did not fetch all plugin packages with 'spec.installStatus', unable to determine 'spec.installStatus'",
      );
    });

    it('should return the entity unchanged for non-plugin entities', async () => {
      const processor = new PluginInstallStatusProcessor({
        auth: mockServices.auth.mock(),
        catalog: mockCatalogClient,
        logger: mockServices.logger.mock(),
      });

      const result = await processor.preProcessEntity(
        packageEntity,
        locationSpec,
        jest.fn(),
        locationSpec,
      );
      expect(result).toBe(packageEntity);
    });
  });
});
