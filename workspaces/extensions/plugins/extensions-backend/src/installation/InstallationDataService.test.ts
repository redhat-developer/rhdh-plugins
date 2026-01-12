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
  mockExtensionsApi,
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

  const plugin = mockPlugins[0];
  mockExtensionsApi.getPluginPackages = jest.fn((namespace, name) => {
    const isMatch =
      name === plugin.metadata.name && namespace === plugin.metadata.namespace;
    return Promise.resolve(isMatch ? [mockPackages[0], mockPackages[1]] : []);
  });

  beforeEach(async () => {
    process.env.NODE_ENV = 'development';
    jest.clearAllMocks();
    mockFileInstallationStorage.initialize.mockReset();
  });

  describe('initialize', () => {
    it("should return service with 'INSTALLATION_DISABLED_IN_PRODUCTION' error when production environment", () => {
      process.env.NODE_ENV = 'production';
      installationDataService = InstallationDataService.fromConfig({
        config: validConfig,
        extensionsApi: mockExtensionsApi,
        logger: mockLogger,
      });

      expect(mockLogger.warn).toHaveBeenCalledWith(
        'Installation feature is disabled in production',
      );
      expect(installationDataService.getInitializationError()).toBeDefined();
      expect(installationDataService.getInitializationError()?.reason).toBe(
        InstallationInitErrorReason.INSTALLATION_DISABLED_IN_PRODUCTION,
      );
    });

    it("should return service with 'INSTALLATION_DISABLED' error when installation is disabled", () => {
      const disabledConfig = new ConfigReader({
        extensions: { installation: { enabled: false } },
      });

      installationDataService = InstallationDataService.fromConfig({
        config: disabledConfig,
        extensionsApi: mockExtensionsApi,
        logger: mockLogger,
      });

      expect(mockLogger.warn).toHaveBeenCalledWith(
        `Installation feature is disabled under 'extensions.installation.enabled'`,
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
        extensionsApi: mockExtensionsApi,
        logger: mockLogger,
      });

      expect(mockLogger.error).toHaveBeenCalledWith(
        "Installation feature is disabled. Error while loading data: The 'extensions.installation.saveToSingleFile.file' config value is not being specified in the extensions configuration",
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
          'The file is missing',
        );
      });

      installationDataService = InstallationDataService.fromConfig({
        config: fileNotFoundConfig,
        extensionsApi: mockExtensionsApi,
        logger: mockLogger,
      });

      expect(mockLogger.error).toHaveBeenCalledWith(
        'Installation feature is disabled. Error while loading data: The file is missing',
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
        extensionsApi: mockExtensionsApi,
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
        extensionsApi: mockExtensionsApi,
        logger: mockServices.logger.mock(),
      });
    });

    it('should return plugin config', async () => {
      const result = await installationDataService.getPluginConfig(plugin);
      expect(result).toEqual(stringify(mockDynamicPlugin1));
    });
  });

  describe('updatePackageConfig', () => {
    beforeEach(() => {
      installationDataService = InstallationDataService.fromConfig({
        config: validConfig,
        extensionsApi: mockExtensionsApi,
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
        extensionsApi: mockExtensionsApi,
        logger: mockLogger,
      });
    });

    it('should update plugin', async () => {
      const newConfig = stringify([mockDynamicPackage11]);

      await installationDataService.updatePluginConfig(plugin, newConfig);

      expect(mockFileInstallationStorage.updatePackages).toHaveBeenCalledWith(
        new Set([
          mockPackages[0].spec.dynamicArtifact,
          mockPackages[1].spec.dynamicArtifact,
        ]),
        newConfig,
      );
    });
  });

  describe('setPackageDisabled', () => {
    beforeEach(() => {
      installationDataService = InstallationDataService.fromConfig({
        config: validConfig,
        extensionsApi: mockExtensionsApi,
        logger: mockLogger,
      });
    });

    it('should set package with disabled', async () => {
      installationDataService.setPackageDisabled(
        mockDynamicPackage11.package,
        false,
      );

      expect(
        mockFileInstallationStorage.setPackageDisabled,
      ).toHaveBeenCalledWith(mockDynamicPackage11.package, false);
    });
  });

  describe('setPluginDisabled', () => {
    beforeEach(() => {
      installationDataService = InstallationDataService.fromConfig({
        config: validConfig,
        extensionsApi: mockExtensionsApi,
        logger: mockLogger,
      });
    });

    it('should set plugin disabled', async () => {
      await installationDataService.setPluginDisabled(plugin, true);

      expect(
        mockFileInstallationStorage.setPackagesDisabled,
      ).toHaveBeenCalled();

      expect(
        mockFileInstallationStorage.setPackagesDisabled,
      ).toHaveBeenCalledWith(
        new Set([
          mockPackages[0].spec.dynamicArtifact,
          mockPackages[1].spec.dynamicArtifact,
        ]),
        true,
      );
    });
  });
});
