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
} from '../../__fixtures__/mockData';
import { PluginsConfigFileHandler } from './PluginsConfigFileHandler';
import { resolve } from 'path';

describe('PluginsConfigFileHandler', () => {
  describe('parse', () => {
    it('should parse valid config', () => {
      const configFileName = resolve(
        __dirname,
        '../../__fixtures__/data/validPluginsConfig.yaml',
      );
      const pluginsConfigFileHandler = new PluginsConfigFileHandler(
        configFileName,
      );
      pluginsConfigFileHandler.parse();

      expect(pluginsConfigFileHandler.getAllPackages()).toEqual([
        mockDynamicPackage11,
        mockDynamicPackage12,
        mockDynamicPackage21,
      ]);
    });

    it('should throw on parse when bad plugins format', async () => {
      const configFileName = resolve(
        __dirname,
        '../../__fixtures__/data/invalidPluginsConfigBadPluginsFormat.yaml',
      );
      const pluginsConfigFileHandler = new PluginsConfigFileHandler(
        configFileName,
      );

      expect(() => {
        pluginsConfigFileHandler.parse();
      }).toThrow(
        "Failed to load 'dynamicPluginsConfig', content of the 'plugins' field must be a list",
      );
    });

    it('should throw on parse when bad package format', async () => {
      const configFileName = resolve(
        __dirname,
        '../../__fixtures__/data/invalidPluginsConfigBadPackageFormat.yaml',
      );
      const pluginsConfigFileHandler = new PluginsConfigFileHandler(
        configFileName,
      );

      expect(() => {
        pluginsConfigFileHandler.parse();
      }).toThrow('Invalid package config {"package":"","disabled":true}');
    });

    it('should throw on parse when bad package pluginConfig format', async () => {
      const configFileName = resolve(
        __dirname,
        '../../__fixtures__/data/invalidPluginsConfigBadPackagePluginConfigFormat.yaml',
      );
      const pluginsConfigFileHandler = new PluginsConfigFileHandler(
        configFileName,
      );

      expect(() => {
        pluginsConfigFileHandler.parse();
      }).toThrow(
        'Invalid package config {"package":"./dynamic-plugins/dist/package11-backend-dynamic","disabled":true,"pluginConfig":[]}',
      );
    });
  });

  describe('getPackage', () => {
    it('should get correct package', () => {
      const configFileName = resolve(
        __dirname,
        '../../__fixtures__/data/validPluginsConfig.yaml',
      );
      const pluginsConfigFileHandler = new PluginsConfigFileHandler(
        configFileName,
      );
      pluginsConfigFileHandler.parse();

      expect(
        pluginsConfigFileHandler.getPackage(mockDynamicPackage12.package),
      ).toEqual(mockDynamicPackage12);
    });
  });
});
