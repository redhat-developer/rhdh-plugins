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
import { ConfigReader } from '@backstage/config';

import { InstallationDataService } from './InstallationDataService';
import {
  mockDynamicPackage11,
  mockDynamicPlugin1,
  mockFileInstallationStorage,
  mockMarketplaceApi,
  mockPackages,
  mockPlugins,
} from '../../__fixtures__/mockData';
import { stringify } from 'yaml';

jest.mock('./FileInstallationStorage', () => {
  return {
    FileInstallationStorage: jest
      .fn()
      .mockImplementation(() => mockFileInstallationStorage),
  };
});

describe('InstallationDataService', () => {
  let installationDataService: InstallationDataService;

  beforeEach(async () => {
    const mockConfig = new ConfigReader({
      extensions: {
        installation: {
          enabled: true,
          type: 'saveToSingleFile',
          saveToSingleFile: { file: 'dummy-file.yaml' },
        },
      },
    });
    installationDataService = InstallationDataService.fromConfig({
      config: mockConfig,
      marketplaceApi: mockMarketplaceApi,
    });
  });

  afterEach(async () => {
    jest.clearAllMocks();
  });

  describe('getPackageConfig', () => {
    it('should return package config', () => {
      const result = installationDataService.getPackageConfig(
        mockPackages[0].spec?.dynamicArtifact!,
      );
      expect(result).toEqual(stringify(mockDynamicPackage11));
    });
  });

  describe('getPluginConfig', () => {
    it('should return plugin config', async () => {
      const pluginToGet = mockPlugins[0];
      mockMarketplaceApi.getPluginPackages = jest.fn((namespace, name) => {
        const isMatch =
          name === pluginToGet.metadata.name &&
          namespace === pluginToGet.metadata.namespace;
        return Promise.resolve(
          isMatch ? [mockPackages[0], mockPackages[1]] : [],
        );
      });
      const result = await installationDataService.getPluginConfig(
        mockPlugins[0],
      );
      expect(result).toEqual(stringify(mockDynamicPlugin1));
    });
  });
});
