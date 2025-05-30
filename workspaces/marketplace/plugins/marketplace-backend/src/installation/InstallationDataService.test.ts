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
import { mockServices } from '@backstage/backend-test-utils';
import {
  InstallationInitError,
  InstallationInitErrorReason,
} from '../errors/InstallationInitError';

jest.mock('./FileInstallationStorage', () => {
  return {
    FileInstallationStorage: jest
      .fn()
      .mockImplementation(() => mockFileInstallationStorage),
  };
});

describe('InstallationDataService', () => {
  let installationDataService: InstallationDataService;

  const validConfig = new ConfigReader({
    extensions: {
      installation: {
        enabled: true,
        saveToSingleFile: { file: 'dummy-file.yaml' },
      },
    },
  });

  const mockLogger = mockServices.logger.mock();

  afterEach(async () => {
    jest.clearAllMocks();
    mockFileInstallationStorage.initialize.mockReset();
  });

  describe('initialize', () => {
    it("should return service with 'INSTALLATION_DISABLED' error when installation is disabled", () => {
      const disabledConfig = new ConfigReader({
        extensions: { installation: { enabled: false } },
      });

      installationDataService = InstallationDataService.fromConfig({
        config: disabledConfig,
        marketplaceApi: mockMarketplaceApi,
        logger: mockLogger,
      });

      expect(mockLogger.info).toHaveBeenCalledWith(
        'Installation feature is disabled',
      );
      expect(installationDataService.getInitializationError()).toBeDefined();
      expect(installationDataService.getInitializationError()?.reason).toBe(
        InstallationInitErrorReason.INSTALLATION_DISABLED,
      );
    });

    it("should return service with 'FILE_CONFIG_VALUE_MISSING' error when file is missing", () => {
      const missingFileConfig = new ConfigReader({
        extensions: { installation: { enabled: true } },
      });

      installationDataService = InstallationDataService.fromConfig({
        config: missingFileConfig,
        marketplaceApi: mockMarketplaceApi,
        logger: mockLogger,
      });

      expect(mockLogger.error).toHaveBeenCalledWith(
        "Installation feature is disabled. Error while loading data: Missing required config value at 'extensions.installation.saveToSingleFile.file'",
      );
      expect(installationDataService.getInitializationError()).toBeDefined();
      expect(installationDataService.getInitializationError()?.reason).toBe(
        InstallationInitErrorReason.FILE_CONFIG_VALUE_MISSING,
      );
    });

    it("should return service with an error thrown by 'FileInstallationStorage.initialize'", () => {
      const fileNotFoundConfig = new ConfigReader({
        extensions: {
          installation: {
            enabled: true,
            saveToSingleFile: {
              file: 'non-existent-file.yaml',
            },
          },
        },
      });
      mockFileInstallationStorage.initialize.mockImplementationOnce(() => {
        throw new InstallationInitError(
          InstallationInitErrorReason.FILE_NOT_EXISTS,
          'Installation config file does not exist',
        );
      });

      installationDataService = InstallationDataService.fromConfig({
        config: fileNotFoundConfig,
        marketplaceApi: mockMarketplaceApi,
        logger: mockLogger,
      });

      expect(mockLogger.error).toHaveBeenCalledWith(
        'Installation feature is disabled. Error while loading data: Installation config file does not exist',
      );
      expect(installationDataService.getInitializationError()).toBeDefined();
      expect(installationDataService.getInitializationError()?.reason).toBe(
        InstallationInitErrorReason.FILE_NOT_EXISTS,
      );
    });
  });

  describe('getPackageConfig', () => {
    beforeEach(async () => {
      installationDataService = InstallationDataService.fromConfig({
        config: validConfig,
        marketplaceApi: mockMarketplaceApi,
        logger: mockServices.logger.mock(),
      });
    });

    it('should return package config', () => {
      const result = installationDataService.getPackageConfig(
        mockPackages[0].spec.dynamicArtifact,
      );
      expect(result).toEqual(stringify(mockDynamicPackage11));
    });
  });

  describe('getPluginConfig', () => {
    beforeEach(async () => {
      installationDataService = InstallationDataService.fromConfig({
        config: validConfig,
        marketplaceApi: mockMarketplaceApi,
        logger: mockServices.logger.mock(),
      });
    });

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

  describe('updatePackageConfig', () => {
    beforeEach(() => {
      installationDataService = InstallationDataService.fromConfig({
        config: validConfig,
        marketplaceApi: mockMarketplaceApi,
        logger: mockLogger,
      });
    });

    it('should update package', () => {
      const newConfig = stringify({ ...mockDynamicPackage11, disabled: false });
      installationDataService.updatePackageConfig(
        mockDynamicPackage11.package,
        newConfig,
      );

      expect(mockFileInstallationStorage.updatePackage).toHaveBeenCalledWith(
        mockDynamicPackage11.package,
        newConfig,
      );
    });
  });

  describe('updatePluginConfig', () => {
    beforeEach(() => {
      installationDataService = InstallationDataService.fromConfig({
        config: validConfig,
        marketplaceApi: mockMarketplaceApi,
        logger: mockLogger,
      });
    });

    it('should update plugin', async () => {
      const newConfig = stringify([mockDynamicPackage11]);

      await installationDataService.updatePluginConfig(
        mockPlugins[0],
        newConfig,
      );

      expect(mockFileInstallationStorage.updatePackages).toHaveBeenCalledWith(
        new Set([
          mockPackages[0].spec?.dynamicArtifact,
          mockPackages[1].spec?.dynamicArtifact,
        ]),
        newConfig,
      );
    });
  });
});
