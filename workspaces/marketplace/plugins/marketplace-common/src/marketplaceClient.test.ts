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
import { CatalogClient } from '@backstage/catalog-client';
import { MarketplaceClient } from './marketplaceClient';
import { MarketplaceKinds } from './types';
import { mockServices } from '@backstage/backend-test-utils';

const mockPlugins = [
  {
    apiVersion: 'marketplace.backstage.io/v1alpha1',
    kind: MarketplaceKinds.plugin,
    metadata: { name: 'plugin1' },
  },
  {
    apiVersion: 'marketplace.backstage.io/v1alpha1',
    kind: MarketplaceKinds.plugin,
    metadata: { name: 'plugin2' },
  },
];

const mockPluginList = [
  {
    apiVersion: 'marketplace.backstage.io/v1alpha1',
    kind: MarketplaceKinds.pluginList,
    metadata: { name: 'test-featured-plugins' },
    spec: {
      plugins: ['plugin1', 'plugin2'],
    },
  },
];

const mockQueryEntities = jest.fn();
const mockGetEntities = jest.fn();
const mockQueryEntitiesByRefs = jest.fn();

const mockCatalogClient = {
  getEntities: mockGetEntities,
  queryEntities: mockQueryEntities,
  getEntitiesByRefs: mockQueryEntitiesByRefs,
} as unknown as CatalogClient;

const options = {
  logger: mockServices.logger.mock(),
  auth: mockServices.auth.mock(),
  config: mockServices.rootConfig.mock(),
  catalogApi: mockCatalogClient,
};

describe('MarketplaceClient', () => {
  describe('getPlugins', () => {
    beforeEach(() => {
      mockQueryEntities.mockReturnValue({
        items: mockPlugins,
      });
    });

    it('should call queryEntities function', async () => {
      const api = new MarketplaceClient(options);

      await api.getPlugins();

      expect(mockQueryEntities).toHaveBeenCalledTimes(1);
      expect(mockQueryEntities).toHaveBeenCalledWith(
        {
          filter: { kind: 'plugin' },
        },
        undefined,
      );
    });

    it('should return the plugins', async () => {
      const api = new MarketplaceClient(options);
      const plugins = await api.getPlugins();
      expect(plugins).toHaveLength(2);
    });
  });

  describe('getPluginByName', () => {
    beforeEach(() => {
      mockQueryEntities.mockReturnValue({
        items: mockPlugins,
      });
    });

    it('should return the plugin by name', async () => {
      const api = new MarketplaceClient(options);
      const plugin = await api.getPluginByName('plugin1');
      expect(plugin).toBeDefined();
      expect(plugin.metadata.name).toBe('plugin1');
    });
  });

  describe('getPluginListByName', () => {
    beforeEach(() => {
      mockQueryEntities.mockReturnValue({
        items: mockPluginList,
      });
    });

    it('should return the pluginlist by name', async () => {
      const api = new MarketplaceClient(options);
      const featuredPluginList = await api.getPluginListByName(
        'test-featured-plugins',
      );
      expect(featuredPluginList).toBeDefined();
      expect(featuredPluginList.metadata.name).toBe('test-featured-plugins');
    });
  });

  describe('getPluginLists', () => {
    beforeEach(() => {
      mockQueryEntities.mockReturnValue({
        items: mockPluginList,
      });
    });

    it('should return the pluginlist', async () => {
      const api = new MarketplaceClient(options);
      const featuredPluginsList = await api.getPluginLists();

      expect(featuredPluginsList).toHaveLength(1);
      expect(featuredPluginsList[0].spec?.plugins).toEqual([
        'plugin1',
        'plugin2',
      ]);
    });
  });

  describe('getPluginsByPluginListName', () => {
    beforeEach(() => {
      mockQueryEntities.mockImplementation(({ filter }) => {
        return filter['metadata.name'] === 'test-featured-plugins'
          ? {
              items: mockPluginList,
            }
          : {};
      });

      mockQueryEntitiesByRefs.mockResolvedValue({
        items: mockPlugins,
      });
    });

    it('should return all the plugins for the pluginlist name', async () => {
      const api = new MarketplaceClient(options);
      const plugins = await api.getPluginsByPluginListName(
        'test-featured-plugins',
      );
      expect(plugins).toHaveLength(2);
      expect(plugins[0].metadata.name).toBe('plugin1');
      expect(plugins[1].metadata.name).toBe('plugin2');
    });

    it('should throw not found error for the non-existent pluginlist name', async () => {
      const api = new MarketplaceClient(options);

      await expect(
        api.getPluginsByPluginListName('non-existent-featured-plugins'),
      ).rejects.toThrow('PluginList:non-existent-featured-plugins not found');
    });
    it('should return empty array when the plugins are not set', async () => {
      jest.resetAllMocks();
      jest.clearAllMocks();

      mockQueryEntities.mockResolvedValue({
        items: [{ ...mockPluginList, spec: { plugins: undefined } }],
      });

      const api = new MarketplaceClient(options);
      const plugins = await api.getPluginsByPluginListName(
        'non-existent-featured-plugins',
      );
      expect(plugins).toHaveLength(0);
    });
  });
});
