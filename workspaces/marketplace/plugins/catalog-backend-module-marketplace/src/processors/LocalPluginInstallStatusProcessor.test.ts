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

import {
  InstallStatus,
  MarketplacePlugin,
} from '@red-hat-developer-hub/backstage-plugin-marketplace-common';

import { LocalPluginInstallStatusProcessor } from './LocalPluginInstallStatusProcessor';

const pluginEntity: MarketplacePlugin = {
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

describe('LocalPluginInstallStatusProcessor', () => {
  it('should return processor name', () => {
    const processor = new LocalPluginInstallStatusProcessor();
    expect(processor.getProcessorName()).toBe(
      'LocalPluginInstallStatusProcessor',
    );
  });

  it('should return the workspace path', async () => {
    const processor = new LocalPluginInstallStatusProcessor();

    const result = await processor.preProcessEntity(pluginEntity);
    expect(result?.spec?.installStatus).toBe(InstallStatus.NotInstalled);
  });

  it('should return not installed status', async () => {
    const processor = new LocalPluginInstallStatusProcessor();

    const result = await processor.preProcessEntity(pluginEntity);
    expect(result?.spec?.installStatus).toBe(InstallStatus.NotInstalled);
  });

  it('should return empty string if the root folder does not have workspaces', async () => {
    const processor = new LocalPluginInstallStatusProcessor();

    const result = processor.findWorkspacesPath('../../../../../../../');
    expect(result).toBe('');
  });

  it('should return notInstalled status if the entity does not have package version information', async () => {
    const processor = new LocalPluginInstallStatusProcessor();

    const result = await processor.preProcessEntity(pluginEntity);
    expect(result?.spec?.installStatus).toBe(InstallStatus.NotInstalled);
  });

  it('should return NotInstalled status if the entity has incorrect package installed', async () => {
    const processor = new LocalPluginInstallStatusProcessor();

    const searchBackendPlugin = {
      ...pluginEntity,
      spec: {
        ...pluginEntity.spec,
        packages: [
          {
            name: '@backstage/plugin-search-backend',
            version: '^2.0.1',
          },
        ],
      },
    };
    const result = await processor.preProcessEntity(searchBackendPlugin);
    expect(result?.spec?.installStatus).toBe(InstallStatus.NotInstalled);
  });

  it('should return Installed status if the entity has incorrect package version installed', async () => {
    const processor = new LocalPluginInstallStatusProcessor();

    const searchBackendPlugin = {
      ...pluginEntity,
      spec: {
        ...pluginEntity.spec,
        packages: [
          {
            name: '@backstage/plugin-search-backend',
            version: '^1.0.1',
          },
        ],
      },
    };
    const result = await processor.preProcessEntity(searchBackendPlugin);
    expect(result?.spec?.installStatus).toBe(InstallStatus.Installed);
  });

  it('should return NotInstalled status when invalid workspaces paths', async () => {
    const processor = new LocalPluginInstallStatusProcessor([
      'packages/modules',
    ]);

    const searchPlugin = {
      ...pluginEntity,
      spec: {
        ...pluginEntity.spec,
        packages: [
          {
            name: '@backstage/plugin-search-backend',
            version: '^1.0.0 , ^1.0.0',
          },
        ],
      },
    };
    const result = await processor.preProcessEntity(searchPlugin);
    expect(result?.spec?.installStatus).toBe(InstallStatus.NotInstalled);
  });

  it('should return Installed status when only package names are passed', async () => {
    const processor = new LocalPluginInstallStatusProcessor();

    const searchPlugin = {
      ...pluginEntity,
      spec: {
        ...pluginEntity.spec,
        packages: [
          '@backstage/plugin-search',
          '@backstage/plugin-search-backend',
        ],
      },
    };
    const result = await processor.preProcessEntity(searchPlugin);
    expect(result?.spec?.installStatus).toBe(InstallStatus.Installed);
  });

  it('should not process any other kind other than plugin', async () => {
    const processor = new LocalPluginInstallStatusProcessor();

    const testEntity = {
      ...pluginEntity,
      kind: 'TestKind',
    };
    const result = await processor.preProcessEntity(testEntity);
    expect(result).toEqual(testEntity);
  });

  it('should return correct values when isJson method is called', async () => {
    const processor = new LocalPluginInstallStatusProcessor();
    expect(processor.isJSON(null as any)).toBe(false);
    expect(processor.isJSON(undefined as any)).toBe(false);
    expect(processor.isJSON(123 as any)).toBe(false);
    expect(processor.isJSON('@backstage/plugin-search')).toBe(false);
    expect(processor.isJSON('{ "name": "@backstage/plugin-search" }')).toBe(
      true,
    );
  });
});
