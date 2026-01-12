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

import fs from 'fs';
import { resolve } from 'path';
import { parse, stringify } from 'yaml';
import {
  mockDynamicPackage11,
  mockDynamicPackage12,
  mockDynamicPackage21,
  mockPackages,
} from '../../__fixtures__/mockData';
import { FileInstallationStorage } from './FileInstallationStorage';

describe('FileInstallationStorage', () => {
  const newPackageName = './dynamic-plugins/dist/package3-backend-dynamic';

  describe('initialize', () => {
    it('should initialize valid config', () => {
      const configFileName = resolve(
        __dirname,
        '../../__fixtures__/data/validPluginsConfig.yaml',
      );
      const fileInstallationStorage = new FileInstallationStorage(
        configFileName,
      );
      fileInstallationStorage.initialize();
      const expected = stringify({
        plugins: [
          mockDynamicPackage11,
          mockDynamicPackage12,
          mockDynamicPackage21,
        ],
      });

      expect(fileInstallationStorage.getConfigYaml()).toEqual(expected);
    });

    it('should throw on initialize when config file does not exist', () => {
      const configFileName = resolve(
        __dirname,
        '../../__fixtures__/data/nonExistentConfigFile.yaml',
      );
      const fileInstallationStorage = new FileInstallationStorage(
        configFileName,
      );

      expect(() => {
        fileInstallationStorage.initialize();
      }).toThrow(`The file ${configFileName} is missing`);
    });

    it('should throw on initialize when bad plugins format', async () => {
      const configFileName = resolve(
        __dirname,
        '../../__fixtures__/data/invalidPluginsConfigBadPluginsFormat.yaml',
      );
      const fileInstallationStorage = new FileInstallationStorage(
        configFileName,
      );

      expect(() => {
        fileInstallationStorage.initialize();
      }).toThrow(
        "Invalid installation configuration, 'plugins' field must be a list",
      );
    });

    it('should throw on initialize when bad package format', async () => {
      const configFileName = resolve(
        __dirname,
        '../../__fixtures__/data/invalidPluginsConfigBadPackageFormat.yaml',
      );
      const fileInstallationStorage = new FileInstallationStorage(
        configFileName,
      );

      expect(() => {
        fileInstallationStorage.initialize();
      }).toThrow(
        "Invalid installation configuration, 'package' field in package item must be a non-empty string",
      );
    });
  });

  describe('getPackage', () => {
    it('should get correct package', () => {
      const configFileName = resolve(
        __dirname,
        '../../__fixtures__/data/validPluginsConfig.yaml',
      );
      const fileInstallationStorage = new FileInstallationStorage(
        configFileName,
      );
      fileInstallationStorage.initialize();

      expect(
        fileInstallationStorage.getPackage(
          mockPackages[1].spec.dynamicArtifact,
        ),
      ).toEqual(stringify([mockDynamicPackage12]));
    });
  });

  describe('getPackages', () => {
    it('should get correct packages', () => {
      const configFileName = resolve(
        __dirname,
        '../../__fixtures__/data/validPluginsConfig.yaml',
      );
      const fileInstallationStorage = new FileInstallationStorage(
        configFileName,
      );
      fileInstallationStorage.initialize();

      expect(
        fileInstallationStorage.getPackages(
          new Set([
            mockPackages[0].spec.dynamicArtifact,
            mockPackages[1].spec.dynamicArtifact,
          ]),
        ),
      ).toEqual(stringify([mockDynamicPackage11, mockDynamicPackage12]));
    });
  });

  describe('updatePackage', () => {
    afterEach(() => {
      fs.writeFileSync(
        resolve(__dirname, '../../__fixtures__/data/validPluginsConfig.yaml'),
        stringify({
          plugins: [
            mockDynamicPackage11,
            mockDynamicPackage12,
            mockDynamicPackage21,
          ],
        }),
      );
    });

    it('should update existing package', () => {
      const configFileName = resolve(
        __dirname,
        '../../__fixtures__/data/validPluginsConfig.yaml',
      );
      const updatedPackage = {
        ...mockDynamicPackage21,
        disabled: false,
      };
      const fileInstallationStorage = new FileInstallationStorage(
        configFileName,
      );
      fileInstallationStorage.initialize();

      fileInstallationStorage.updatePackage(
        './dynamic-plugins/dist/package21-backend-dynamic',
        stringify(updatedPackage),
      );

      const updatedCatalogInfoYaml = fs.readFileSync(configFileName, 'utf8');
      const configYaml = parse(updatedCatalogInfoYaml);
      expect(configYaml.plugins).toEqual([
        mockDynamicPackage11,
        mockDynamicPackage12,
        updatedPackage,
      ]);
    });

    it('should add new package', () => {
      const configFileName = resolve(
        __dirname,
        '../../__fixtures__/data/validPluginsConfig.yaml',
      );
      const newPackage = {
        package: newPackageName,
        disabled: true,
      };
      const fileInstallationStorage = new FileInstallationStorage(
        configFileName,
      );
      fileInstallationStorage.initialize();

      fileInstallationStorage.updatePackage(
        newPackageName,
        stringify(newPackage),
      );

      const updatedCatalogInfoYaml = fs.readFileSync(configFileName, 'utf8');
      const configYaml = parse(updatedCatalogInfoYaml);
      expect(configYaml.plugins[0]).toEqual(mockDynamicPackage11);
      expect(configYaml.plugins[1]).toEqual(mockDynamicPackage12);
      expect(configYaml.plugins[2]).toEqual(mockDynamicPackage21);
      expect(configYaml.plugins[3]).toEqual(newPackage);
    });

    it('should throw on bad newConfig format', async () => {
      const configFileName = resolve(
        __dirname,
        '../../__fixtures__/data/validPluginsConfig.yaml',
      );
      const fileInstallationStorage = new FileInstallationStorage(
        configFileName,
      );
      fileInstallationStorage.initialize();

      expect(() => {
        fileInstallationStorage.updatePackage(
          mockDynamicPackage11.package,
          'badConfig',
        );
      }).toThrow(
        'Invalid installation configuration, package item must be a map',
      );
    });
  });

  describe('updatePackages', () => {
    afterEach(() => {
      fs.writeFileSync(
        resolve(__dirname, '../../__fixtures__/data/validPluginsConfig.yaml'),
        stringify({
          plugins: [
            mockDynamicPackage11,
            mockDynamicPackage12,
            mockDynamicPackage21,
          ],
        }),
      );
    });

    it('should update existing plugin', () => {
      const configFileName = resolve(
        __dirname,
        '../../__fixtures__/data/validPluginsConfig.yaml',
      );
      const addedPackage = {
        package: './dynamic-plugins/dist/package11-backend-module-dynamic',
        disabled: true,
      };
      const updatedPlugin = [
        {
          ...mockDynamicPackage11,
          disabled: false,
          pluginConfig: {
            plugin1: {
              setting: true,
            },
          },
        },
        {
          ...mockDynamicPackage12,
          disabled: false,
          pluginConfig: {
            dynamicPlugins: {
              frontend: {
                'default.package12': {
                  mountpoints: [
                    {
                      mountPoint: 'entity.page.image-registry/cards',
                      importName: 'Package12Page',
                    },
                  ],
                },
              },
            },
          },
        },
        addedPackage,
      ];
      const fileInstallationStorage = new FileInstallationStorage(
        configFileName,
      );
      fileInstallationStorage.initialize();

      fileInstallationStorage.updatePackages(
        new Set([
          mockDynamicPackage11.package,
          mockDynamicPackage12.package,
          addedPackage.package,
        ]),
        stringify(updatedPlugin),
      );

      const updatedCatalogInfoYaml = fs.readFileSync(configFileName, 'utf8');
      const configYaml = parse(updatedCatalogInfoYaml);
      expect(configYaml.plugins).toEqual([
        mockDynamicPackage21,
        ...updatedPlugin,
      ]);
    });

    it('should add new plugin', () => {
      const configFileName = resolve(
        __dirname,
        '../../__fixtures__/data/validPluginsConfig.yaml',
      );
      const newPlugin = [
        {
          package: newPackageName,
          disabled: true,
        },
      ];
      const fileInstallationStorage = new FileInstallationStorage(
        configFileName,
      );
      fileInstallationStorage.initialize();

      fileInstallationStorage.updatePackages(
        new Set([newPackageName]),
        stringify(newPlugin),
      );

      const updatedCatalogInfoYaml = fs.readFileSync(configFileName, 'utf8');
      const configYaml = parse(updatedCatalogInfoYaml);
      expect(configYaml.plugins[0]).toEqual(mockDynamicPackage11);
      expect(configYaml.plugins[1]).toEqual(mockDynamicPackage12);
      expect(configYaml.plugins[2]).toEqual(mockDynamicPackage21);
      expect(configYaml.plugins[3]).toEqual(newPlugin[0]);
    });

    it('should throw on bad newConfig format', async () => {
      const configFileName = resolve(
        __dirname,
        '../../__fixtures__/data/validPluginsConfig.yaml',
      );
      const fileInstallationStorage = new FileInstallationStorage(
        configFileName,
      );
      fileInstallationStorage.initialize();

      expect(() => {
        fileInstallationStorage.updatePackages(
          new Set(mockDynamicPackage11.package),
          'package: badFormat',
        );
      }).toThrow(
        'Invalid installation configuration, plugin packages must be a list',
      );
    });
  });

  describe('setPackageDisabled', () => {
    afterEach(() => {
      fs.writeFileSync(
        resolve(__dirname, '../../__fixtures__/data/validPluginsConfig.yaml'),
        stringify({
          plugins: [
            mockDynamicPackage11,
            mockDynamicPackage12,
            mockDynamicPackage21,
          ],
        }),
      );
    });

    it('should add new package with disabled status', () => {
      const configFileName = resolve(
        __dirname,
        '../../__fixtures__/data/validPluginsConfig.yaml',
      );
      const fileInstallationStorage = new FileInstallationStorage(
        configFileName,
      );
      fileInstallationStorage.initialize();

      fileInstallationStorage.setPackageDisabled(newPackageName, false);

      const updatedCatalogInfoYaml = fs.readFileSync(configFileName, 'utf8');
      const configYaml = parse(updatedCatalogInfoYaml);
      expect(configYaml.plugins).toEqual([
        mockDynamicPackage11,
        mockDynamicPackage12,
        mockDynamicPackage21,
        { package: newPackageName, disabled: false },
      ]);
    });

    it('should update existing package with disabled status', () => {
      const configFileName = resolve(
        __dirname,
        '../../__fixtures__/data/validPluginsConfig.yaml',
      );
      const fileInstallationStorage = new FileInstallationStorage(
        configFileName,
      );
      fileInstallationStorage.initialize();

      fileInstallationStorage.setPackageDisabled(
        mockDynamicPackage12.package,
        false,
      );

      const updatedCatalogInfoYaml = fs.readFileSync(configFileName, 'utf8');
      const configYaml = parse(updatedCatalogInfoYaml);
      expect(configYaml.plugins).toEqual([
        mockDynamicPackage11,
        { ...mockDynamicPackage12, disabled: false },
        mockDynamicPackage21,
      ]);
    });
  });

  describe('setPackagesDisabled', () => {
    afterEach(() => {
      fs.writeFileSync(
        resolve(__dirname, '../../__fixtures__/data/validPluginsConfig.yaml'),
        stringify({
          plugins: [
            mockDynamicPackage11,
            mockDynamicPackage12,
            mockDynamicPackage21,
          ],
        }),
      );
    });

    it('should set disabled for existing plugin in the config', () => {
      const configFileName = resolve(
        __dirname,
        '../../__fixtures__/data/validPluginsConfig.yaml',
      );
      const updatedPlugin = [
        {
          ...mockDynamicPackage11,
          disabled: false,
        },
        {
          ...mockDynamicPackage12,
          disabled: false,
        },
      ];
      const fileInstallationStorage = new FileInstallationStorage(
        configFileName,
      );
      fileInstallationStorage.initialize();

      fileInstallationStorage.setPackagesDisabled(
        new Set([mockDynamicPackage11.package, mockDynamicPackage12.package]),
        false,
      );

      const updatedCatalogInfoYaml = fs.readFileSync(configFileName, 'utf8');
      const configYaml = parse(updatedCatalogInfoYaml);
      expect(configYaml.plugins).toEqual([
        ...updatedPlugin,
        mockDynamicPackage21,
      ]);
    });

    it('should set disabled for new plugin in the config', () => {
      const configFileName = resolve(
        __dirname,
        '../../__fixtures__/data/validPluginsConfig.yaml',
      );
      const newPlugin = [
        {
          package: newPackageName,
          disabled: false,
        },
      ];
      const fileInstallationStorage = new FileInstallationStorage(
        configFileName,
      );
      fileInstallationStorage.initialize();

      fileInstallationStorage.setPackagesDisabled(
        new Set([newPackageName]),
        false,
      );

      const updatedCatalogInfoYaml = fs.readFileSync(configFileName, 'utf8');
      const configYaml = parse(updatedCatalogInfoYaml);
      expect(configYaml.plugins).toEqual([
        mockDynamicPackage11,
        mockDynamicPackage12,
        mockDynamicPackage21,
        newPlugin[0],
      ]);
    });
  });
});
