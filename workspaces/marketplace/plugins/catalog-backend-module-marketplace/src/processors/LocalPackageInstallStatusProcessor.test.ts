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

import { MarketplacePackageInstallStatus } from '@red-hat-developer-hub/backstage-plugin-extensions-common';
import { packageEntity } from '../../__fixtures__/mockData';

import { LocalPackageInstallStatusProcessor } from './LocalPackageInstallStatusProcessor';

describe('LocalPackageInstallStatusProcessor', () => {
  it('should return processor name', () => {
    const processor = new LocalPackageInstallStatusProcessor();
    expect(processor.getProcessorName()).toBe(
      'LocalPackageInstallStatusProcessor',
    );
  });

  it('should return the workspace path', async () => {
    const processor = new LocalPackageInstallStatusProcessor();

    const result = await processor.preProcessEntity(packageEntity);
    expect(result?.spec?.installStatus).toBe(
      MarketplacePackageInstallStatus.NotInstalled,
    );
  });

  it('should return not installed status', async () => {
    const processor = new LocalPackageInstallStatusProcessor();

    const result = await processor.preProcessEntity(packageEntity);
    expect(result?.spec?.installStatus).toBe(
      MarketplacePackageInstallStatus.NotInstalled,
    );
  });

  it('should return empty string if the root folder does not have workspaces', async () => {
    const processor = new LocalPackageInstallStatusProcessor();

    const result = processor.findWorkspacesPath('../../../../../../../');
    expect(result).toBe('');
  });

  it('should return NotInstalled status if the entity does not have package version information', async () => {
    const processor = new LocalPackageInstallStatusProcessor();

    const result = await processor.preProcessEntity(packageEntity);
    expect(result.spec?.installStatus).toBe(
      MarketplacePackageInstallStatus.NotInstalled,
    );
  });

  it('should return UpdateAvailable status if the entity has incorrect package installed', async () => {
    const processor = new LocalPackageInstallStatusProcessor();

    const searchBackendPackage = {
      ...packageEntity,
      spec: {
        ...packageEntity.spec,
        packageName: '@backstage/plugin-search-backend',
        version: '^1.0.1',
      },
    };
    const result = await processor.preProcessEntity(searchBackendPackage);
    expect(result?.spec?.installStatus).toBe(
      MarketplacePackageInstallStatus.UpdateAvailable,
    );
  });

  it('should return Installed status if the entity has incorrect package version installed', async () => {
    const processor = new LocalPackageInstallStatusProcessor();

    const searchBackendPackage = {
      ...packageEntity,
      spec: {
        ...packageEntity.spec,
        packageName: '@backstage/plugin-search-backend',
        version: '^2.0.2',
      },
    };
    const result = await processor.preProcessEntity(searchBackendPackage);
    expect(result?.spec?.installStatus).toBe(
      MarketplacePackageInstallStatus.Installed,
    );
  });

  it('should return NotInstalled status when invalid workspaces paths', async () => {
    const processor = new LocalPackageInstallStatusProcessor([
      'packages/modules',
    ]);

    const searchPackage = {
      ...packageEntity,
      spec: {
        ...packageEntity.spec,
        packageName: '@backstage/plugin-search-backend',
        version: '^1.0.0 , ^1.0.0',
      },
    };
    const result = await processor.preProcessEntity(searchPackage);
    expect(result?.spec?.installStatus).toBe(
      MarketplacePackageInstallStatus.NotInstalled,
    );
  });

  it('should return Installed status when only package names are passed', async () => {
    const processor = new LocalPackageInstallStatusProcessor();

    const searchPackage = {
      ...packageEntity,
      spec: {
        ...packageEntity.spec,
        packageName: '@backstage/plugin-search',
      },
    };
    const result = await processor.preProcessEntity(searchPackage);
    expect(result?.spec?.installStatus).toBe(
      MarketplacePackageInstallStatus.Installed,
    );
  });

  it('should not process any other kind other than package', async () => {
    const processor = new LocalPackageInstallStatusProcessor();

    const testEntity = {
      ...packageEntity,
      kind: 'TestKind',
    };
    const result = await processor.preProcessEntity(testEntity);
    expect(result).toBe(testEntity);
  });
});
