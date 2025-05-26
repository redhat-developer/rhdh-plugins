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
  mockDynamicPackage11,
  mockDynamicPackage12,
  mockDynamicPackage21,
  mockPackages,
} from '../../__fixtures__/mockData';
import { FileInstallationStorage } from './FileInstallationStorage';
import { resolve } from 'path';
import { stringify } from 'yaml';

describe('FileInstallationStorage', () => {
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
      }).toThrow(`Installation config file does not exist: ${configFileName}`);
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
        "Failed to load 'extensions.installation.saveToSingleFile.file'. Invalid installation configuration, 'plugins' field must be a list",
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
        "Invalid installation configuration, 'package' field in each package item must be a non-empty string",
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
});
