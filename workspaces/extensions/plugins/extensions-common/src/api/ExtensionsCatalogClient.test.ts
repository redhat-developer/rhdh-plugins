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
import { CatalogClient } from '@backstage/catalog-client';

import {
  ExtensionsCollection,
  ExtensionsKind,
  ExtensionsPackage,
  ExtensionsPlugin,
} from '../types';

import { ExtensionsCatalogClient } from './ExtensionsCatalogClient';

const mockCollections: ExtensionsCollection[] = [
  {
    apiVersion: 'extensions.backstage.io/v1alpha1',
    kind: ExtensionsKind.Collection,
    metadata: { namespace: 'default', name: 'featured' },
    spec: {
      type: 'curated',
      plugins: ['plugin1', 'plugin2'],
    },
  },
];

const mockPackages: ExtensionsPackage[] = [
  {
    apiVersion: 'extensions.backstage.io/v1alpha1',
    kind: ExtensionsKind.Package,
    metadata: { namespace: 'default', name: 'package1' },
    spec: {},
  },
  {
    apiVersion: 'extensions.backstage.io/v1alpha1',
    kind: ExtensionsKind.Package,
    metadata: { namespace: 'default', name: 'package2' },
    spec: {},
  },
];

const mockPlugins: ExtensionsPlugin[] = [
  {
    apiVersion: 'extensions.backstage.io/v1alpha1',
    kind: ExtensionsKind.Plugin,
    metadata: { namespace: 'default', name: 'plugin1' },
    spec: {
      packages: ['package1'],
    },
  },
  {
    apiVersion: 'extensions.backstage.io/v1alpha1',
    kind: ExtensionsKind.Plugin,
    metadata: { namespace: 'default', name: 'plugin2' },
    spec: {
      packages: ['package2'],
    },
  },
  {
    apiVersion: 'extensions.backstage.io/v1alpha1',
    kind: ExtensionsKind.Plugin,
    metadata: { namespace: 'another-namespace', name: 'plugin3' },
    spec: {
      packages: ['package1', 'package2'],
    },
  },
];

const mockQueryEntities = jest.fn();
const mockEntityFacets = jest.fn();
const mockGetEntityByRef = jest.fn();
const mockQueryEntitiesByRefs = jest.fn();
const mockGetEntities = jest.fn();

const mockCatalogClient = {
  queryEntities: mockQueryEntities,
  getEntityFacets: mockEntityFacets,
  getEntityByRef: mockGetEntityByRef,
  getEntitiesByRefs: mockQueryEntitiesByRefs,
  getEntities: mockGetEntities,
} as unknown as CatalogClient;

beforeEach(() => {
  jest.clearAllMocks();
});

const options = {
  catalogApi: mockCatalogClient,
  auth: {
    getOwnServiceCredentials: jest
      .fn()
      .mockResolvedValue('mockedServiceCredentials'),
    getPluginRequestToken: jest
      .fn()
      .mockResolvedValue({ token: 'mockedToken' }),
  } as any,
};

describe('ExtensionsCatalogClient', () => {
  describe('getCollections', () => {
    beforeEach(() => {
      mockQueryEntities.mockReturnValue({
        items: mockCollections,
        totalItems: 3,
        pageInfo: {},
      });
    });

    it('should call catalog with right kind filter', async () => {
      const api = new ExtensionsCatalogClient(options);
      const response = await api.getCollections({});

      expect(mockQueryEntities).toHaveBeenCalledTimes(1);
      expect(mockQueryEntities).toHaveBeenCalledWith(
        {
          filter: {
            kind: 'PluginCollection',
          },
        },
        { token: 'mockedToken' },
      );

      expect(response).toEqual({
        items: mockCollections,
        totalItems: 3,
        pageInfo: {},
      });
    });

    it('should not allow another kind filter', async () => {
      const api = new ExtensionsCatalogClient(options);
      const response = await api.getCollections({
        filter: {
          kind: 'Component',
          'metadata.namespace': 'default',
        },
      });

      expect(mockQueryEntities).toHaveBeenCalledTimes(1);
      expect(mockQueryEntities).toHaveBeenCalledWith(
        {
          filter: {
            kind: 'PluginCollection',
            'metadata.namespace': 'default',
          },
        },
        { token: 'mockedToken' },
      );

      expect(response).toEqual({
        items: mockCollections,
        totalItems: 3,
        pageInfo: {},
      });
    });
  });

  describe('getCollectionsFacets', () => {
    beforeEach(() => {
      mockEntityFacets.mockReturnValue({
        facets: [
          {
            ['metadata.namespace']: 'default',
            count: 2,
          },
          {
            ['metadata.namespace']: 'another-namespace',
            count: 1,
          },
        ],
      });
    });

    it('should call catalog with right kind filter', async () => {
      const api = new ExtensionsCatalogClient(options);
      const response = await api.getCollectionsFacets({
        facets: ['metadata.namespace'],
      });

      expect(mockEntityFacets).toHaveBeenCalledTimes(1);
      expect(mockEntityFacets).toHaveBeenCalledWith(
        {
          facets: ['metadata.namespace'],
          filter: {
            kind: 'PluginCollection',
          },
        },
        { token: 'mockedToken' },
      );

      expect(response).toEqual({
        facets: [
          {
            ['metadata.namespace']: 'default',
            count: 2,
          },
          {
            ['metadata.namespace']: 'another-namespace',
            count: 1,
          },
        ],
      });
    });
  });

  describe('getCollectionByName', () => {
    it('should call catalog with right kind filter', async () => {
      mockGetEntityByRef.mockReturnValue(mockCollections[0]);

      const api = new ExtensionsCatalogClient(options);
      const plugin = await api.getCollectionByName('default', 'featured');

      expect(mockGetEntityByRef).toHaveBeenCalledTimes(1);
      expect(mockGetEntityByRef).toHaveBeenCalledWith(
        'plugincollection:default/featured',
        { token: 'mockedToken' },
      );

      expect(plugin).toEqual(mockCollections[0]);
    });

    it('should throw not found error for the non-existent collection name', async () => {
      mockGetEntityByRef.mockReturnValue(null);

      const api = new ExtensionsCatalogClient(options);
      await expect(
        api.getCollectionByName('default', 'not-found'),
      ).rejects.toThrow('Collection default/not-found not found');
    });
  });

  describe('getCollectionPlugins', () => {
    beforeEach(() => {
      mockGetEntityByRef.mockReturnValue(mockCollections[0]);
      mockQueryEntitiesByRefs.mockResolvedValue({
        items: mockPlugins,
      });
    });

    it('should call catalog with right kind filter', async () => {
      const api = new ExtensionsCatalogClient(options);
      const plugins = await api.getCollectionPlugins('default', 'featured');

      expect(mockGetEntityByRef).toHaveBeenCalledTimes(1);
      expect(mockGetEntityByRef).toHaveBeenCalledWith(
        'plugincollection:default/featured',
        { token: 'mockedToken' },
      );

      expect(plugins).toEqual(mockPlugins);
    });

    it('should throw not found error for the non-existent collection name', async () => {
      mockGetEntityByRef.mockReturnValue(null);

      const api = new ExtensionsCatalogClient(options);
      await expect(
        api.getCollectionPlugins('default', 'not-found'),
      ).rejects.toThrow('Collection default/not-found not found');
    });
  });

  describe('getPackages', () => {
    beforeEach(() => {
      mockQueryEntities.mockReturnValue({
        items: mockPackages,
        totalItems: 3,
        pageInfo: {},
      });
    });

    it('should call catalog with right kind filter', async () => {
      const api = new ExtensionsCatalogClient(options);
      const response = await api.getPackages({});

      expect(mockQueryEntities).toHaveBeenCalledTimes(1);
      expect(mockQueryEntities).toHaveBeenCalledWith(
        {
          filter: {
            kind: 'Package',
          },
        },
        { token: 'mockedToken' },
      );

      expect(response).toEqual({
        items: mockPackages,
        totalItems: 3,
        pageInfo: {},
      });
    });

    it('should not allow another kind filter', async () => {
      const api = new ExtensionsCatalogClient(options);
      const response = await api.getPackages({
        filter: {
          kind: 'Component',
          'metadata.namespace': 'default',
        },
      });

      expect(mockQueryEntities).toHaveBeenCalledTimes(1);
      expect(mockQueryEntities).toHaveBeenCalledWith(
        {
          filter: {
            kind: 'Package',
            'metadata.namespace': 'default',
          },
        },
        { token: 'mockedToken' },
      );

      expect(response).toEqual({
        items: mockPackages,
        totalItems: 3,
        pageInfo: {},
      });
    });
  });

  describe('getPackagesFacets', () => {
    beforeEach(() => {
      mockEntityFacets.mockReturnValue({
        facets: [
          {
            ['metadata.namespace']: 'default',
            count: 2,
          },
          {
            ['metadata.namespace']: 'another-namespace',
            count: 1,
          },
        ],
      });
    });

    it('should call catalog with right kind filter', async () => {
      const api = new ExtensionsCatalogClient(options);
      const response = await api.getPackagesFacets({
        facets: ['metadata.namespace'],
      });

      expect(mockEntityFacets).toHaveBeenCalledTimes(1);
      expect(mockEntityFacets).toHaveBeenCalledWith(
        {
          facets: ['metadata.namespace'],
          filter: {
            kind: 'Package',
          },
        },
        { token: 'mockedToken' },
      );

      expect(response).toEqual({
        facets: [
          {
            ['metadata.namespace']: 'default',
            count: 2,
          },
          {
            ['metadata.namespace']: 'another-namespace',
            count: 1,
          },
        ],
      });
    });
  });

  describe('getPackageByName', () => {
    it('should call catalog with right kind filter', async () => {
      mockGetEntityByRef.mockReturnValue(mockCollections[0]);

      const api = new ExtensionsCatalogClient(options);
      const plugin = await api.getPackageByName('default', 'featured');

      expect(mockGetEntityByRef).toHaveBeenCalledTimes(1);
      expect(mockGetEntityByRef).toHaveBeenCalledWith(
        'package:default/featured',
        { token: 'mockedToken' },
      );

      expect(plugin).toEqual(mockCollections[0]);
    });

    it('should throw not found error for the non-existent package name', async () => {
      mockGetEntityByRef.mockReturnValue(null);

      const api = new ExtensionsCatalogClient(options);
      await expect(
        api.getPackageByName('default', 'not-found'),
      ).rejects.toThrow('Package default/not-found not found');
    });
  });
  describe('getPlugins', () => {
    beforeEach(() => {
      mockQueryEntities.mockReturnValue({
        items: mockPlugins,
        totalItems: 3,
        pageInfo: {},
      });
    });

    it('should call catalog with right kind filter', async () => {
      const api = new ExtensionsCatalogClient(options);
      const response = await api.getPlugins({});

      expect(mockQueryEntities).toHaveBeenCalledTimes(1);
      expect(mockQueryEntities).toHaveBeenCalledWith(
        {
          filter: {
            kind: 'Plugin',
          },
        },
        { token: 'mockedToken' },
      );

      expect(response).toEqual({
        items: mockPlugins,
        totalItems: 3,
        pageInfo: {},
      });
    });

    it('should not allow another kind filter', async () => {
      const api = new ExtensionsCatalogClient(options);
      const response = await api.getPlugins({
        filter: {
          kind: 'Component',
          'metadata.namespace': 'default',
        },
      });

      expect(mockQueryEntities).toHaveBeenCalledTimes(1);
      expect(mockQueryEntities).toHaveBeenCalledWith(
        {
          filter: {
            kind: 'Plugin',
            'metadata.namespace': 'default',
          },
        },
        { token: 'mockedToken' },
      );

      expect(response).toEqual({
        items: mockPlugins,
        totalItems: 3,
        pageInfo: {},
      });
    });
  });

  describe('getPluginFacets', () => {
    beforeEach(() => {
      mockEntityFacets.mockReturnValue({
        facets: [
          {
            ['metadata.namespace']: 'default',
            count: 2,
          },
          {
            ['metadata.namespace']: 'another-namespace',
            count: 1,
          },
        ],
      });
    });

    it('should call catalog with right kind filter', async () => {
      const api = new ExtensionsCatalogClient(options);
      const response = await api.getPluginFacets({
        facets: ['metadata.namespace'],
      });

      expect(mockEntityFacets).toHaveBeenCalledTimes(1);
      expect(mockEntityFacets).toHaveBeenCalledWith(
        {
          facets: ['metadata.namespace'],
          filter: {
            kind: 'Plugin',
          },
        },
        { token: 'mockedToken' },
      );

      expect(response).toEqual({
        facets: [
          {
            ['metadata.namespace']: 'default',
            count: 2,
          },
          {
            ['metadata.namespace']: 'another-namespace',
            count: 1,
          },
        ],
      });
    });
  });

  describe('getPluginByName', () => {
    it('should call catalog with right kind filter', async () => {
      mockGetEntityByRef.mockReturnValue(mockCollections[0]);

      const api = new ExtensionsCatalogClient(options);
      const plugin = await api.getPluginByName('default', 'plugin1');

      expect(mockGetEntityByRef).toHaveBeenCalledTimes(1);
      expect(mockGetEntityByRef).toHaveBeenCalledWith(
        'plugin:default/plugin1',
        { token: 'mockedToken' },
      );

      expect(plugin).toEqual(mockCollections[0]);
    });

    it('should throw not found error for the non-existent plugin name', async () => {
      mockGetEntityByRef.mockReturnValue(null);

      const api = new ExtensionsCatalogClient(options);
      await expect(api.getPluginByName('default', 'not-found')).rejects.toThrow(
        'Plugin default/not-found not found',
      );
    });
  });

  describe('getPluginPackages', () => {
    beforeEach(() => {
      mockGetEntityByRef.mockReturnValue(mockPlugins[0]);
      mockQueryEntitiesByRefs.mockResolvedValue({
        items: mockPackages,
      });
    });

    it('should call catalog with right kind filter', async () => {
      const api = new ExtensionsCatalogClient(options);
      const packages = await api.getPluginPackages('default', 'plugin3');

      expect(mockGetEntityByRef).toHaveBeenCalledTimes(1);
      expect(mockGetEntityByRef).toHaveBeenCalledWith(
        'plugin:default/plugin3',
        { token: 'mockedToken' },
      );

      expect(packages).toEqual(mockPackages);
    });

    it('should throw not found error for the non-existent plugin name', async () => {
      mockGetEntityByRef.mockReturnValue(null);

      const api = new ExtensionsCatalogClient(options);
      await expect(
        api.getPluginPackages('default', 'not-found'),
      ).rejects.toThrow('Plugin default/not-found not found');
    });
  });

  describe('getPackagePlugins', () => {
    beforeEach(() => {
      mockGetEntities.mockResolvedValue({ items: [mockPlugins[0]] });
    });

    it('should call catalog with right kind filter', async () => {
      const api = new ExtensionsCatalogClient(options);
      const plugins = await api.getPackagePlugins('default', 'package1');

      expect(mockGetEntities).toHaveBeenCalledTimes(1);
      expect(mockGetEntities).toHaveBeenCalledWith(
        {
          filter: {
            kind: 'Plugin',
            'relations.hasPart': 'package:default/package1',
          },
        },
        {
          token: 'mockedToken',
        },
      );

      expect(plugins).toEqual([mockPlugins[0]]);
    });
  });
});
