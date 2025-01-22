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
import { Knex } from 'knex';
import { CatalogClient } from '@backstage/catalog-client';
import { MarketplaceCatalogClient } from './MarketplaceCatalogClient';
import {
  AggregationsRequest,
  MarketplaceApi,
  MarketplaceKinds,
} from '../types';

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
const mockGetEntityByRef = jest.fn();
const mockQueryEntitiesByRefs = jest.fn();

const mockCatalogClient = {
  getEntities: mockGetEntities,
  queryEntities: mockQueryEntities,
  getEntityByRef: mockGetEntityByRef,
  getEntitiesByRefs: mockQueryEntitiesByRefs,
} as unknown as CatalogClient;

beforeEach(() => {
  jest.clearAllMocks();
});

const getMockQueryBuilder = () => ({
  whereNotNull: jest.fn().mockReturnThis(),
  leftJoin: jest.fn().mockReturnThis(),
  count: jest.fn().mockReturnThis(),
  select: jest.fn().mockReturnThis(),
  andWhereRaw: jest.fn().mockReturnThis(),
  where: jest.fn().mockReturnThis(),
  groupBy: jest.fn().mockReturnThis(),
  having: jest.fn().mockReturnThis(),
  orderBy: jest.fn().mockReturnThis(),
});

const getMockKnexClient = () =>
  jest.fn(() => getMockQueryBuilder()) as unknown as jest.MockedFunction<Knex>;

const options = {
  catalogApi: mockCatalogClient,
  auth: {
    getOwnServiceCredentials: jest
      .fn()
      .mockResolvedValue('mockedServiceCredentials'),
    getPluginRequestToken: jest.fn().mockResolvedValue('mockedToken'),
  } as any,
  client: getMockKnexClient(),
};

describe('MarketplaceCatalogClient', () => {
  describe('getPlugins', () => {
    beforeEach(() => {
      mockQueryEntities.mockReturnValue({
        items: mockPlugins,
      });
    });

    it('should call queryEntities function', async () => {
      const api = new MarketplaceCatalogClient(options);

      await api.getPlugins();

      expect(mockQueryEntities).toHaveBeenCalledTimes(1);
      expect(mockQueryEntities).toHaveBeenCalledWith(
        {
          filter: { kind: 'plugin' },
        },
        'mockedToken',
      );
    });

    it('should return the plugins', async () => {
      const api = new MarketplaceCatalogClient(options);
      const plugins = await api.getPlugins();
      expect(plugins).toHaveLength(2);
    });

    it('should return the plugins when the auth options is not passed', async () => {
      const api = new MarketplaceCatalogClient({ ...options, auth: undefined });
      const plugins = await api.getPlugins();
      expect(plugins).toHaveLength(2);
    });
  });

  describe('getPluginByName', () => {
    beforeEach(() => {
      mockGetEntityByRef.mockReturnValue(mockPlugins[0]);
    });

    it('should return the plugin by name', async () => {
      const api = new MarketplaceCatalogClient(options);
      const plugin = await api.getPluginByName('plugin1');
      expect(plugin).toBeDefined();
      expect(plugin.metadata.name).toBe('plugin1');
    });
  });

  describe('getPluginListByName', () => {
    beforeEach(() => {
      mockGetEntityByRef.mockReturnValue(mockPluginList[0]);
    });

    it('should return the pluginlist by name', async () => {
      const api = new MarketplaceCatalogClient(options);
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
      const api = new MarketplaceCatalogClient(options);
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
      mockGetEntityByRef.mockImplementation(entityRef => {
        return entityRef.includes('test-featured-plugins')
          ? mockPluginList[0]
          : undefined;
      });

      mockQueryEntitiesByRefs.mockResolvedValue({
        items: mockPlugins,
      });
    });

    it('should return all the plugins for the pluginlist name', async () => {
      const api = new MarketplaceCatalogClient(options);
      const plugins = await api.getPluginsByPluginListName(
        'test-featured-plugins',
      );
      expect(plugins).toHaveLength(2);
      expect(plugins[0].metadata.name).toBe('plugin1');
      expect(plugins[1].metadata.name).toBe('plugin2');
    });

    it('should throw not found error for the non-existent pluginlist name', async () => {
      const api = new MarketplaceCatalogClient(options);

      await expect(
        api.getPluginsByPluginListName('non-existent-featured-plugins'),
      ).rejects.toThrow('PluginList:non-existent-featured-plugins not found');
    });
    it('should return empty array when the plugins are not set', async () => {
      jest.resetAllMocks();
      jest.clearAllMocks();

      mockGetEntityByRef.mockResolvedValue({
        ...mockPluginList,
        spec: { plugins: undefined },
      });

      const api = new MarketplaceCatalogClient(options);
      const plugins = await api.getPluginsByPluginListName(
        'non-existent-featured-plugins',
      );
      expect(plugins).toHaveLength(0);
    });
  });

  describe('getAggregateData', () => {
    let mockKnexClient: jest.MockedFunction<Knex>;
    let mockQueryBuilder: jest.Mocked<any>;
    let api: MarketplaceApi;
    beforeEach(() => {
      mockQueryBuilder = getMockQueryBuilder();

      mockKnexClient = jest.fn(() => ({
        ...mockQueryBuilder,
      })) as unknown as jest.MockedFunction<Knex>;

      const mockRaw = jest
        .fn()
        .mockImplementation((sql: string) => sql) as unknown as Knex.RawBuilder<
        any,
        any
      >;

      mockKnexClient.raw = mockRaw;
      api = new MarketplaceCatalogClient({
        catalogApi: mockCatalogClient,
        client: mockKnexClient,
      });
    });

    it('should throw error if the database client is not passed', async () => {
      const marketplaceCatalogApi = new MarketplaceCatalogClient({
        ...options,
        client: undefined as any,
      });
      await expect(marketplaceCatalogApi.getAggregateData([])).rejects.toThrow(
        'Database client is not configured. Please check the MarketplaceCatalogClient configuration.',
      );
    });

    it('should generate query for count aggregation', async () => {
      const aggregationsQuery: AggregationsRequest = [
        {
          field: 'category.id',
          type: 'count',
          orderFields: [{ field: 'value', order: 'desc' }],
        },
      ];

      await api.getAggregateData(aggregationsQuery);

      expect(mockQueryBuilder.whereNotNull).toHaveBeenCalledWith(
        'fe.final_entity',
      );

      expect(mockQueryBuilder.leftJoin).toHaveBeenCalledWith(
        'search as s1',
        'fe.entity_id',
        's1.entity_id',
      );

      expect(mockQueryBuilder.count).toHaveBeenCalledWith('* as count');

      expect(mockQueryBuilder.groupBy).toHaveBeenCalledWith(
        's1.key',
        's1.value',
      );

      expect(mockQueryBuilder.orderBy).toHaveBeenCalledWith('s1.value', 'desc');
    });

    it('should handle aggregations with filters and having clauses', async () => {
      const aggregationsRequest: AggregationsRequest = [
        {
          type: 'sum',
          field: 'amount',
          name: 'total_amount',
          filter: { category: 'electronics' },
          havingFilter: { field: 'total_amount', operator: '>', value: '1000' },
          orderFields: [{ field: 'value', order: 'asc' }],
        },
      ];

      await api.getAggregateData(aggregationsRequest);

      expect(mockQueryBuilder.leftJoin).toHaveBeenCalledWith(
        'search as s1',
        'fe.entity_id',
        's1.entity_id',
      );
      expect(mockQueryBuilder.where).toHaveBeenCalledWith('s1.key', 'amount');
      expect(mockQueryBuilder.leftJoin).toHaveBeenCalledWith(
        'search as f1',
        'fe.entity_id',
        'f1.entity_id',
      );
      expect(mockQueryBuilder.where).toHaveBeenCalledWith('f1.key', 'category');
      expect(mockQueryBuilder.where).toHaveBeenCalledWith(
        'f1.value',
        'electronics',
      );

      expect(mockQueryBuilder.select).toHaveBeenCalledWith(expect.anything());
      expect(mockQueryBuilder.having).toHaveBeenCalledWith(
        'total_amount',
        '>',
        '1000',
      );

      expect(mockQueryBuilder.orderBy).toHaveBeenCalledWith('s1.value', 'asc');
    });

    it('should handle having clauses with count', async () => {
      const customBaseQuery = mockKnexClient('custom_table');
      const aggregationsRequest: AggregationsRequest = [
        {
          field: 'kind',
          type: 'count',
          havingFilter: { field: 'count', operator: '>', value: '10' },
        },
      ];

      await api.getAggregateData(aggregationsRequest, customBaseQuery);
      expect(mockKnexClient).toHaveBeenCalledWith('custom_table');
      expect(mockQueryBuilder.having).toHaveBeenCalledWith(
        'COUNT(*)',
        '>',
        '10',
      );
    });

    it('should use a custom base query if provided', async () => {
      const customBaseQuery = mockKnexClient('custom_table');
      const aggregationsRequest: AggregationsRequest = [
        { type: 'count', field: 'custom_field' },
      ];

      await api.getAggregateData(aggregationsRequest, customBaseQuery);

      expect(mockKnexClient).toHaveBeenCalledWith('custom_table');
      expect(mockQueryBuilder.count).toHaveBeenCalledWith('* as count');
    });

    it('should handle orderFields', async () => {
      const customBaseQuery = mockKnexClient('custom_table');
      const aggregationsRequest: AggregationsRequest = [
        {
          field: 'kind',
          value: 'plugin',
          type: 'count',
          orderFields: [{ field: 'count', order: 'asc' }],
        },
        {
          field: 'label',
          type: 'min',
          orderFields: [{ field: 'value', order: 'desc' }],
        },

        {
          field: 'name',
          type: 'min',
          orderFields: [{ field: 'incorrect-value' as any, order: 'desc' }],
        },
      ];

      await api.getAggregateData(aggregationsRequest, customBaseQuery);

      expect(mockKnexClient).toHaveBeenCalledWith('custom_table');

      expect(mockQueryBuilder.orderBy).toHaveBeenCalledTimes(3);

      const [field, order] = mockQueryBuilder.orderBy.mock.calls[0];
      expect([field, order]).toEqual(['count', 'asc']);

      const [labelField, labelFieldOrder] =
        mockQueryBuilder.orderBy.mock.calls[1];
      expect([labelField, labelFieldOrder]).toEqual(['s2.value', 'desc']);

      const [nameField, nameFieldOrder] =
        mockQueryBuilder.orderBy.mock.calls[2];
      expect([nameField, nameFieldOrder]).toEqual(['s3.value', 'desc']);
    });
  });
});
