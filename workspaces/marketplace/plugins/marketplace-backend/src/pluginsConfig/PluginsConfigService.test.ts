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

import { PluginsConfigService } from './PluginsConfigService';
import {
  mockDynamicPackage11,
  mockDynamicPlugin1,
  mockMarketplaceApi,
  mockPackages,
  mockPlugins,
  mockPluginsConfigFileHandler,
} from '../../__fixtures__/mockData';

describe('PluginsConfigService', () => {
  let pluginsConfigService: PluginsConfigService;

  beforeEach(async () => {
    pluginsConfigService = new PluginsConfigService(
      mockPluginsConfigFileHandler,
      mockMarketplaceApi,
    );
  });

  afterEach(async () => {
    jest.clearAllMocks();
  });

  describe('getPackageConfig', () => {
    it('should return package config', () => {
      const result = pluginsConfigService.getPackageConfig(
        mockPackages[0].spec?.dynamicArtifact!,
      );
      expect(result).toEqual(mockDynamicPackage11);
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
      const result = await pluginsConfigService.getPluginConfig(mockPlugins[0]);
      expect(result).toEqual(mockDynamicPlugin1);
    });
  });
});
