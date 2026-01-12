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
  ExtensionsKind,
  ExtensionsPackage,
  ExtensionsPackageInstallStatus,
  ExtensionsPluginInstallStatus,
} from '@red-hat-developer-hub/backstage-plugin-extensions-common';
import {
  pluginEntity,
  locationSpec,
  mockExtensionsBackendPackage,
  mockExtensionsPackage,
  mockExtensionsPlugin,
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

  const extensionsPackageRef = stringifyEntityRef(mockExtensionsPackage);
  const extensionsBackendPackageRef = stringifyEntityRef(
    mockExtensionsBackendPackage,
  );

  const mockExtensionsCatalogPackage = {
    ...packageEntity,
    metadata: {
      name: 'red-hat-developer-hub-backstage-plugin-catalog-backend-module-extensions',
      namespace: 'extensions-plugin-demo',
    },
    spec: {
      packageName:
        '@red-hat-developer-hub/backstage-plugin-catalog-backend-module-extensions',
      dynamicArtifact:
        './dynamic-plugins/dist/red-hat-developer-hub-backstage-plugin-catalog-backend-module-extensions-dynamic',
    },
  };
  const extensionsPluginExtended = {
    ...mockExtensionsPlugin,
    spec: {
      packages: [
        ...mockExtensionsPlugin.spec.packages,
        'extensions-plugin-demo/red-hat-developer-hub-backstage-plugin-catalog-backend-module-extensions',
      ],
    },
  };

  const getWithInstallStatus = (
    pkg: ExtensionsPackage,
    installStatus: ExtensionsPackageInstallStatus,
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
    it('should fetch extensions packages and cache defined install statuses', async () => {
      const extensionsPackage = getWithInstallStatus(
        mockExtensionsPackage,
        ExtensionsPackageInstallStatus.Installed,
      );
      const extensionsBackendPackage = getWithInstallStatus(
        mockExtensionsBackendPackage,
        ExtensionsPackageInstallStatus.UpdateAvailable,
      );
      mockCatalogClient.getEntities = jest.fn().mockResolvedValue({
        items: [
          extensionsPackage,
          extensionsBackendPackage,
          mockExtensionsCatalogPackage,
        ],
      });

      const refreshTaskRun = runner.mock.calls[0][0];
      await refreshTaskRun.fn(); // call refreshPackages
      expect(mockCatalogClient.getEntities).toHaveBeenCalledWith(
        {
          filter: {
            kind: ExtensionsKind.Package,
          },
        },
        undefined,
      );

      expect(cache.set).toHaveBeenCalledTimes(2); // mockExtensionsCatalogPackage not cached because missing installStatus
      expect(cache.set).toHaveBeenCalledWith(
        extensionsPackageRef,
        ExtensionsPackageInstallStatus.Installed,
        { ttl: { seconds: 30 } },
      );
      expect(cache.set).toHaveBeenCalledWith(
        extensionsBackendPackageRef,
        ExtensionsPackageInstallStatus.UpdateAvailable,
        { ttl: { seconds: 30 } },
      );
      expect(logger.info).toHaveBeenCalledWith(
        'Refreshing package install statuses for PluginInstallStatusProcessor',
      );
      expect(logger.info).toHaveBeenCalledWith(
        'PluginInstallStatusProcessor:refresh-packages cached 2 extensions package install statuses',
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
            installStatus: ExtensionsPluginInstallStatus.Installed,
          },
        },
        locationSpec,
        jest.fn(),
        locationSpec,
      );

      expect(entity.spec?.installStatus).toBe(
        ExtensionsPluginInstallStatus.Installed,
      );
      expect(mockCatalogClient.getEntitiesByRefs).not.toHaveBeenCalled();
    });

    it.each([
      {
        description: 'any package is Disabled',
        package1: ExtensionsPackageInstallStatus.Installed,
        package2: ExtensionsPackageInstallStatus.Disabled,
        package3: ExtensionsPackageInstallStatus.UpdateAvailable,
        expected: ExtensionsPluginInstallStatus.Disabled,
      },
      {
        description: 'all packages are NotInstalled',
        package1: ExtensionsPackageInstallStatus.NotInstalled,
        package2: ExtensionsPackageInstallStatus.NotInstalled,
        package3: ExtensionsPackageInstallStatus.NotInstalled,
        expected: ExtensionsPluginInstallStatus.NotInstalled,
      },
      {
        description:
          'any package is UpdateAvailable and all remaining packages are Installed',
        package1: ExtensionsPackageInstallStatus.Installed,
        package2: ExtensionsPackageInstallStatus.UpdateAvailable,
        package3: ExtensionsPackageInstallStatus.Installed,
        expected: ExtensionsPluginInstallStatus.UpdateAvailable,
      },
      {
        description: 'any package is NotInstalled',
        package1: ExtensionsPackageInstallStatus.Installed,
        package2: ExtensionsPackageInstallStatus.NotInstalled,
        package3: ExtensionsPackageInstallStatus.UpdateAvailable,
        expected: ExtensionsPluginInstallStatus.PartiallyInstalled,
      },
    ])(
      'should return $expected when $description',
      async ({ package1, package2, package3, expected }) => {
        const extensionsPackage = getWithInstallStatus(
          mockExtensionsPackage,
          package1,
        );
        const extensionsBackendPackage = getWithInstallStatus(
          mockExtensionsBackendPackage,
          package2,
        );
        const extensionsCatalogPackage = getWithInstallStatus(
          mockExtensionsCatalogPackage,
          package3,
        );

        mockCatalogClient.getEntitiesByRefs = jest.fn().mockResolvedValue({
          items: [
            extensionsBackendPackage,
            extensionsPackage,
            extensionsCatalogPackage,
          ],
        });

        const entity = await processor.preProcessEntity(
          extensionsPluginExtended,
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
          // missing extensionsBackendPackage
          getWithInstallStatus(
            mockExtensionsPackage,
            ExtensionsPackageInstallStatus.Installed,
          ),
        ],
      });

      const entity = await processor.preProcessEntity(
        mockExtensionsPlugin,
        locationSpec,
        jest.fn(),
        locationSpec,
      );

      expect(entity.spec?.installStatus).toBe(undefined);
      expect(logger.debug).toHaveBeenCalledWith(
        "Entity plugin:extensions-plugin-demo/extensions is missing all definitions of 'spec.installStatus' in its packages, unable to determine 'spec.installStatus'",
      );
    });

    it('should return undefined and log warning when some packages are missing installStatus', async () => {
      mockCatalogClient.getEntitiesByRefs = jest.fn().mockResolvedValue({
        items: [
          mockExtensionsBackendPackage,
          getWithInstallStatus(
            mockExtensionsPackage,
            ExtensionsPackageInstallStatus.Installed,
          ),
        ],
      });

      const entity = await processor.preProcessEntity(
        mockExtensionsPlugin,
        locationSpec,
        jest.fn(),
        locationSpec,
      );

      expect(entity.spec?.installStatus).toBe(undefined);
      expect(logger.debug).toHaveBeenCalledWith(
        "Entity plugin:extensions-plugin-demo/extensions is missing all definitions of 'spec.installStatus' in its packages, unable to determine 'spec.installStatus'",
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
          ref === extensionsPackageRef ||
          ref === extensionsBackendPackageRef
        ) {
          return ExtensionsPackageInstallStatus.Installed;
        }
        return undefined;
      });

      const result = await processor.preProcessEntity(
        mockExtensionsPlugin,
        locationSpec,
        jest.fn(),
        locationSpec,
      );

      expect(cache.get).toHaveBeenCalledWith(extensionsPackageRef);
      expect(cache.get).toHaveBeenCalledWith(extensionsBackendPackageRef);
      expect(mockCatalogClient.getEntitiesByRefs).not.toHaveBeenCalled();
      expect(result.spec?.installStatus).toBe(
        ExtensionsPluginInstallStatus.Installed,
      );
    });

    it('should cache fetched packages', async () => {
      cache.get.mockImplementation(async (key: string) => {
        if (key === extensionsPackageRef) {
          return ExtensionsPackageInstallStatus.Installed;
        }
        return undefined; // extensionsBackendPackageRef not cached
      });

      const mockExtensionsBackendPackageWithStatus = {
        ...mockExtensionsBackendPackage,
        spec: {
          ...mockExtensionsBackendPackage.spec,
          installStatus: ExtensionsPackageInstallStatus.UpdateAvailable,
        },
      };
      mockCatalogClient.getEntitiesByRefs = jest.fn().mockResolvedValue({
        items: [mockExtensionsBackendPackageWithStatus],
      });

      const result = await processor.preProcessEntity(
        mockExtensionsPlugin,
        locationSpec,
        jest.fn(),
        locationSpec,
      );

      expect(cache.get).toHaveBeenCalledWith(extensionsPackageRef);
      expect(cache.get).toHaveBeenCalledWith(extensionsBackendPackageRef);
      expect(mockCatalogClient.getEntitiesByRefs).toHaveBeenCalledWith(
        { entityRefs: [extensionsBackendPackageRef] },
        undefined,
      );
      expect(cache.set).toHaveBeenCalledWith(
        extensionsBackendPackageRef,
        ExtensionsPackageInstallStatus.UpdateAvailable,
        { ttl: { seconds: 30 } },
      );

      expect(result.spec?.installStatus).toBe(
        ExtensionsPluginInstallStatus.UpdateAvailable,
      );
    });
  });
});
