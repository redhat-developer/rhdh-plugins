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

import { LocalPackageInstallStatusResolver } from './LocalPackageInstallStatusResolver';
import { mockServices } from '@backstage/backend-test-utils';
import { packageEntity } from '../../__fixtures__/mockData';

describe('LocalPackageInstallStatusResolver', () => {
  it('should return the workspace path', async () => {
    const resolver = new LocalPackageInstallStatusResolver({
      logger: mockServices.logger.mock(),
    });
    const result = resolver.getPackageInstallStatus(packageEntity);
    expect(result).toBe(MarketplacePackageInstallStatus.NotInstalled);
  });

  it('should return not installed status', async () => {
    const resolver = new LocalPackageInstallStatusResolver({
      logger: mockServices.logger.mock(),
    });
    const result = resolver.getPackageInstallStatus(packageEntity);
    expect(result).toBe(MarketplacePackageInstallStatus.NotInstalled);
  });

  it('should return empty string if the root folder does not have workspaces', async () => {
    const resolver = new LocalPackageInstallStatusResolver({
      logger: mockServices.logger.mock(),
    });
    const result = resolver.findWorkspacesPath('../../../../../../../');
    expect(result).toBe('');
  });

  it('should return NotInstalled status if the entity does not have package version information', async () => {
    const resolver = new LocalPackageInstallStatusResolver({
      logger: mockServices.logger.mock(),
    });
    const result = resolver.getPackageInstallStatus(packageEntity);
    expect(result).toBe(MarketplacePackageInstallStatus.NotInstalled);
  });

  it('should return UpdateAvailable status if the entity has incorrect package installed', async () => {
    const resolver = new LocalPackageInstallStatusResolver({
      logger: mockServices.logger.mock(),
    });
    const searchBackendPackage = {
      ...packageEntity,
      spec: {
        ...packageEntity.spec,
        packageName: '@backstage/plugin-search-backend',
        version: '^1.0.1',
      },
    };
    const result = resolver.getPackageInstallStatus(searchBackendPackage);
    expect(result).toBe(MarketplacePackageInstallStatus.UpdateAvailable);
  });

  it('should return Installed status if the entity has incorrect package version installed', async () => {
    const resolver = new LocalPackageInstallStatusResolver({
      logger: mockServices.logger.mock(),
    });
    const searchBackendPackage = {
      ...packageEntity,
      spec: {
        ...packageEntity.spec,
        packageName: '@backstage/plugin-search-backend',
        version: '^2.0.2',
      },
    };
    const result = resolver.getPackageInstallStatus(searchBackendPackage);
    expect(result).toBe(MarketplacePackageInstallStatus.Installed);
  });

  it('should return NotInstalled status when invalid workspaces paths', async () => {
    const resolver = new LocalPackageInstallStatusResolver(
      {
        logger: mockServices.logger.mock(),
      },
      { paths: ['packages/modules'] },
    );

    const searchPackage = {
      ...packageEntity,
      spec: {
        ...packageEntity.spec,
        packageName: '@backstage/plugin-search-backend',
        version: '^1.0.0 , ^1.0.0',
      },
    };
    const result = resolver.getPackageInstallStatus(searchPackage);
    expect(result).toBe(MarketplacePackageInstallStatus.NotInstalled);
  });

  it('should return Installed status when only package names are passed', async () => {
    const resolver = new LocalPackageInstallStatusResolver({
      logger: mockServices.logger.mock(),
    });
    const searchPackage = {
      ...packageEntity,
      spec: {
        ...packageEntity.spec,
        packageName: '@backstage/plugin-search',
      },
    };
    const result = resolver.getPackageInstallStatus(searchPackage);
    expect(result).toBe(MarketplacePackageInstallStatus.Installed);
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
      const resolver = new LocalPackageInstallStatusResolver({
        logger,
      });

      const result = resolver.getPackageInstallStatus(entity);
      expect(result).toBe(undefined);
      expect(logger.warn).toHaveBeenCalledWith(
        "Entity package:default/testpackage missing 'entity.spec.packageName', unable to determine 'spec.installStatus'",
      );
    },
  );
});
