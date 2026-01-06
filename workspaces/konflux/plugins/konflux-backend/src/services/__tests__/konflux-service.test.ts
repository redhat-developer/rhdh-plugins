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

import { KonfluxService } from '../konflux-service';
import {
  LoggerService,
  BackstageCredentials,
} from '@backstage/backend-plugin-api';
import { Config } from '@backstage/config';
import { CatalogService } from '@backstage/plugin-catalog-node';
import {
  SubcomponentClusterConfig,
  K8sResourceCommonWithClusterInfo,
  KonfluxConfig,
} from '@red-hat-developer-hub/backstage-plugin-konflux-common';
import { Entity } from '@backstage/catalog-model';
import {
  createResourceWithClusterInfo,
  filterResourcesByApplication,
} from '../../helpers/kubernetes';
import {
  determineClusterNamespaceCombinations,
  getKonfluxConfig,
} from '../../helpers/config';
import {
  decodeContinuationToken,
  encodeContinuationToken,
  PaginationState,
} from '../../helpers/pagination';
import { buildLabelSelector } from '../../helpers/label-selector';

import { KonfluxLogger } from '../../helpers/logger';
import { validateUserEmailForImpersonation } from '../../helpers/validation';
import { ResourceFetcherService } from '../resource-fetcher';

jest.mock('../../helpers/kubernetes');
jest.mock('../../helpers/config');
jest.mock('../../helpers/pagination');
jest.mock('../../helpers/label-selector');
jest.mock('../resource-fetcher');
jest.mock('../../helpers/logger');
jest.mock('../../helpers/validation');

const mockCreateResourceWithClusterInfo =
  createResourceWithClusterInfo as jest.MockedFunction<
    typeof createResourceWithClusterInfo
  >;
const mockFilterResourcesByApplication =
  filterResourcesByApplication as jest.MockedFunction<
    typeof filterResourcesByApplication
  >;
const mockDetermineClusterNamespaceCombinations =
  determineClusterNamespaceCombinations as jest.MockedFunction<
    typeof determineClusterNamespaceCombinations
  >;
const mockGetKonfluxConfig = getKonfluxConfig as jest.MockedFunction<
  typeof getKonfluxConfig
>;
const mockDecodeContinuationToken =
  decodeContinuationToken as jest.MockedFunction<
    typeof decodeContinuationToken
  >;
const mockEncodeContinuationToken =
  encodeContinuationToken as jest.MockedFunction<
    typeof encodeContinuationToken
  >;
const mockBuildLabelSelector = buildLabelSelector as jest.MockedFunction<
  typeof buildLabelSelector
>;
const mockValidateUserEmailForImpersonation =
  validateUserEmailForImpersonation as jest.MockedFunction<
    typeof validateUserEmailForImpersonation
  >;

describe('KonfluxService', () => {
  let mockLogger: jest.Mocked<LoggerService>;
  let mockConfig: Config;
  let mockCatalog: CatalogService;
  let mockCredentials: BackstageCredentials;
  let mockResourceFetcher: jest.Mocked<ResourceFetcherService>;
  let mockKonfluxLogger: jest.Mocked<KonfluxLogger>;
  let service: KonfluxService;

  const createMockEntity = (name: string): Entity => ({
    apiVersion: 'backstage.io/v1alpha1',
    kind: 'Component',
    metadata: {
      name,
      namespace: 'default',
    },
  });

  const createMockKonfluxConfig = (
    overrides?: Partial<KonfluxConfig>,
  ): KonfluxConfig => ({
    clusters: {
      cluster1: {
        apiUrl: 'https://api.cluster1.com',
        serviceAccountToken: 'token1',
        uiUrl: 'https://ui.cluster1.com',
      },
    },
    subcomponentConfigs: [],
    authProvider: 'serviceAccount',
    ...overrides,
  });

  const createMockCombination = (
    overrides?: Partial<SubcomponentClusterConfig>,
  ): SubcomponentClusterConfig => ({
    subcomponent: 'sub1',
    cluster: 'cluster1',
    namespace: 'namespace1',
    applications: ['app1'],
    ...overrides,
  });

  const createMockResource = (
    name: string,
    creationTimestamp?: string,
  ): K8sResourceCommonWithClusterInfo => ({
    apiVersion: 'v1',
    kind: 'Application',
    metadata: {
      name,
      namespace: 'namespace1',
      creationTimestamp: creationTimestamp || '2024-01-01T00:00:00Z',
    },
    cluster: { name: 'cluster1', konfluxUI: 'www.ui.konflux.com' },
    subcomponent: { name: 'sub1' },
  });

  beforeEach(() => {
    jest.clearAllMocks();

    mockLogger = {
      error: jest.fn(),
      warn: jest.fn(),
      info: jest.fn(),
      debug: jest.fn(),
    } as unknown as jest.Mocked<LoggerService>;

    mockKonfluxLogger = {
      error: jest.fn(),
      warn: jest.fn(),
      info: jest.fn(),
      debug: jest.fn(),
    } as unknown as jest.Mocked<KonfluxLogger>;

    mockConfig = {} as Config;

    mockCatalog = {
      getEntityByRef: jest.fn(),
    } as unknown as CatalogService;

    mockCredentials = {} as BackstageCredentials;

    mockResourceFetcher = {
      fetchFromSource: jest.fn(),
      hasMoreData: jest.fn(),
    } as unknown as jest.Mocked<ResourceFetcherService>;

    (
      KonfluxLogger as jest.MockedClass<typeof KonfluxLogger>
    ).mockImplementation(() => mockKonfluxLogger);

    (
      ResourceFetcherService as jest.MockedClass<typeof ResourceFetcherService>
    ).mockImplementation(() => mockResourceFetcher);

    mockValidateUserEmailForImpersonation.mockImplementation(
      email => email || '',
    );

    // Use mockImplementation to call the actual function to avoid type issues
    // We need to use jest.requireActual to get the real implementation
    mockCreateResourceWithClusterInfo.mockImplementation(
      jest.requireActual('../../helpers/kubernetes')
        .createResourceWithClusterInfo,
    );

    service = new KonfluxService(mockConfig, mockLogger, mockCatalog);
  });

  describe('constructor', () => {
    it('should initialize with config, logger, and catalog', () => {
      const newService = new KonfluxService(
        mockConfig,
        mockLogger,
        mockCatalog,
      );
      expect(newService).toBeInstanceOf(KonfluxService);
      expect(KonfluxLogger).toHaveBeenCalledWith(mockLogger);
      expect(ResourceFetcherService).toHaveBeenCalledWith(mockLogger);
    });
  });

  describe('fromConfig', () => {
    it('should create KonfluxService instance', () => {
      const instance = KonfluxService.fromConfig(
        mockConfig,
        mockLogger,
        mockCatalog,
      );
      expect(instance).toBeInstanceOf(KonfluxService);
    });
  });

  describe('aggregateResources', () => {
    const entityRef = 'component:default/test-entity';
    const resource = 'applications';
    const userEmail = 'user@example.com';

    it('should throw error when catalog service is not available', async () => {
      const serviceWithoutCatalog = new KonfluxService(
        mockConfig,
        mockLogger,
        undefined as unknown as CatalogService,
      );

      await expect(
        serviceWithoutCatalog.aggregateResources(
          entityRef,
          resource,
          mockCredentials,
          userEmail,
        ),
      ).rejects.toThrow('Catalog service not available');

      expect(mockKonfluxLogger.error).toHaveBeenCalledWith(
        'Catalog service not available',
        undefined,
        { entityRef, resource },
      );
    });

    it('should throw error when entity is not found', async () => {
      (mockCatalog.getEntityByRef as jest.Mock).mockResolvedValue(null);

      await expect(
        service.aggregateResources(
          entityRef,
          resource,
          mockCredentials,
          userEmail,
        ),
      ).rejects.toThrow(`Entity not found: ${entityRef}`);

      expect(mockKonfluxLogger.error).toHaveBeenCalledWith(
        'Entity not found',
        undefined,
        { entityRef, resource },
      );
    });

    it('should return empty data when no cluster-namespace combinations found', async () => {
      const entity = createMockEntity('test-entity');
      (mockCatalog.getEntityByRef as jest.Mock).mockResolvedValue(entity);
      mockGetKonfluxConfig.mockResolvedValue(createMockKonfluxConfig());
      mockDetermineClusterNamespaceCombinations.mockResolvedValue([]);

      const result = await service.aggregateResources(
        entityRef,
        resource,
        mockCredentials,
        userEmail,
      );

      expect(result).toEqual({ data: [] });
      expect(mockKonfluxLogger.warn).toHaveBeenCalledWith(
        'No cluster-namespace combinations found',
        { entityRef, resource },
      );
    });

    it('should throw error when resource type is invalid', async () => {
      const entity = createMockEntity('test-entity');
      (mockCatalog.getEntityByRef as jest.Mock).mockResolvedValue(entity);
      mockGetKonfluxConfig.mockResolvedValue(createMockKonfluxConfig());
      mockDetermineClusterNamespaceCombinations.mockResolvedValue([
        createMockCombination(),
      ]);

      await expect(
        service.aggregateResources(
          entityRef,
          'invalid-resource',
          mockCredentials,
          userEmail,
        ),
      ).rejects.toThrow('Invalid resource type: invalid-resource');

      expect(mockKonfluxLogger.error).toHaveBeenCalledWith(
        'Invalid resource type',
        undefined,
        expect.objectContaining({
          entityRef,
          resource: 'invalid-resource',
        }),
      );
    });

    it('should successfully aggregate resources', async () => {
      const entity = createMockEntity('test-entity');
      const konfluxConfig = createMockKonfluxConfig();
      const combination = createMockCombination();
      const resource1 = createMockResource('app1', '2024-01-01T10:00:00Z');
      const resource2 = createMockResource('app2', '2024-01-01T09:00:00Z');

      (mockCatalog.getEntityByRef as jest.Mock).mockResolvedValue(entity);
      mockGetKonfluxConfig.mockResolvedValue(konfluxConfig);
      mockDetermineClusterNamespaceCombinations.mockResolvedValue([
        combination,
      ]);
      mockBuildLabelSelector.mockReturnValue(undefined);
      mockResourceFetcher.fetchFromSource.mockResolvedValue({
        items: [resource1, resource2],
        newPaginationState: {},
      });
      mockResourceFetcher.hasMoreData.mockReturnValue(false);
      mockCreateResourceWithClusterInfo
        .mockReturnValueOnce(resource1)
        .mockReturnValueOnce(resource2);
      mockFilterResourcesByApplication.mockImplementation(items => items);

      const result = await service.aggregateResources(
        entityRef,
        resource,
        mockCredentials,
        userEmail,
      );

      expect(result.data).toHaveLength(2);
      expect(result.data[0].metadata?.name).toBe('app1');
      expect(result.data[1].metadata?.name).toBe('app2');
      expect(result.metadata?.totalLoaded).toBe(2);
      expect(result.metadata?.clustersQueried).toEqual(['cluster1']);
      expect(result.continuationToken).toBeUndefined();
      expect(mockKonfluxLogger.info).toHaveBeenCalledWith(
        'Aggregation completed',
        expect.objectContaining({
          entityRef,
          resource,
          totalItems: 2,
        }),
      );
    });

    it('should filter by subcomponent when filter is provided', async () => {
      const entity = createMockEntity('test-entity');
      const konfluxConfig = createMockKonfluxConfig();
      const combination1 = createMockCombination({ subcomponent: 'sub1' });
      const combination2 = createMockCombination({ subcomponent: 'sub2' });

      (mockCatalog.getEntityByRef as jest.Mock).mockResolvedValue(entity);
      mockGetKonfluxConfig.mockResolvedValue(konfluxConfig);
      mockDetermineClusterNamespaceCombinations.mockResolvedValue([
        combination1,
        combination2,
      ]);
      mockBuildLabelSelector.mockReturnValue(undefined);
      mockResourceFetcher.fetchFromSource.mockResolvedValue({
        items: [],
        newPaginationState: {},
      });
      mockResourceFetcher.hasMoreData.mockReturnValue(false);

      await service.aggregateResources(
        entityRef,
        resource,
        mockCredentials,
        userEmail,
        { subcomponent: 'sub1' },
      );

      expect(mockKonfluxLogger.debug).toHaveBeenCalledWith(
        'Applied filters',
        expect.objectContaining({
          subcomponent: 'sub1',
          clusters: undefined,
          beforeCount: 2,
          afterCount: 1,
        }),
      );
    });

    it('should filter by clusters when filter is provided', async () => {
      const entity = createMockEntity('test-entity');
      const konfluxConfig = createMockKonfluxConfig();
      const combination1 = createMockCombination({ cluster: 'cluster1' });
      const combination2 = createMockCombination({ cluster: 'cluster2' });

      (mockCatalog.getEntityByRef as jest.Mock).mockResolvedValue(entity);
      mockGetKonfluxConfig.mockResolvedValue(konfluxConfig);
      mockDetermineClusterNamespaceCombinations.mockResolvedValue([
        combination1,
        combination2,
      ]);
      mockBuildLabelSelector.mockReturnValue(undefined);
      mockResourceFetcher.fetchFromSource.mockResolvedValue({
        items: [],
        newPaginationState: {},
      });
      mockResourceFetcher.hasMoreData.mockReturnValue(false);

      await service.aggregateResources(
        entityRef,
        resource,
        mockCredentials,
        userEmail,
        { clusters: ['cluster1'] },
      );

      expect(mockKonfluxLogger.debug).toHaveBeenCalledWith(
        'Applied filters',
        expect.objectContaining({
          clusters: ['cluster1'],
          subcomponent: undefined,
          beforeCount: 2,
          afterCount: 1,
        }),
      );
    });

    it('should decode continuation token when provided', async () => {
      const entity = createMockEntity('test-entity');
      const konfluxConfig = createMockKonfluxConfig();
      const combination = createMockCombination();
      const paginationState: PaginationState = {
        'cluster1:namespace1': { k8sToken: 'token123' },
      };

      (mockCatalog.getEntityByRef as jest.Mock).mockResolvedValue(entity);
      mockGetKonfluxConfig.mockResolvedValue(konfluxConfig);
      mockDetermineClusterNamespaceCombinations.mockResolvedValue([
        combination,
      ]);
      mockDecodeContinuationToken.mockReturnValue(paginationState);
      mockBuildLabelSelector.mockReturnValue(undefined);
      mockResourceFetcher.fetchFromSource.mockResolvedValue({
        items: [],
        newPaginationState: {},
      });
      mockResourceFetcher.hasMoreData.mockReturnValue(false);

      await service.aggregateResources(
        entityRef,
        resource,
        mockCredentials,
        userEmail,
        { continuationToken: 'encoded-token' },
        undefined,
        'user:default/user1',
      );

      expect(mockDecodeContinuationToken).toHaveBeenCalledWith(
        'encoded-token',
        'user:default/user1',
      );
    });

    it('should throw error when continuation token is invalid', async () => {
      const entity = createMockEntity('test-entity');
      const konfluxConfig = createMockKonfluxConfig();
      const combination = createMockCombination();
      const error = new Error('Invalid token');

      (mockCatalog.getEntityByRef as jest.Mock).mockResolvedValue(entity);
      mockGetKonfluxConfig.mockResolvedValue(konfluxConfig);
      mockDetermineClusterNamespaceCombinations.mockResolvedValue([
        combination,
      ]);
      mockDecodeContinuationToken.mockImplementation(() => {
        throw error;
      });

      await expect(
        service.aggregateResources(
          entityRef,
          resource,
          mockCredentials,
          userEmail,
          { continuationToken: 'invalid-token' },
        ),
      ).rejects.toThrow('Invalid token');

      expect(mockKonfluxLogger.error).toHaveBeenCalledWith(
        'Failed to decode continuation token',
        error,
        expect.objectContaining({ entityRef, resource }),
      );
    });

    it('should skip exhausted sources in load more requests', async () => {
      const entity = createMockEntity('test-entity');
      const konfluxConfig = createMockKonfluxConfig();
      const combination1 = createMockCombination({
        cluster: 'cluster1',
        namespace: 'namespace1',
      });
      const combination2 = createMockCombination({
        cluster: 'cluster2',
        namespace: 'namespace2',
      });
      const paginationState: PaginationState = {
        'cluster1:namespace1': { k8sToken: 'token123' },
        // cluster2:namespace2 has no token, so it should be skipped
      };

      (mockCatalog.getEntityByRef as jest.Mock).mockResolvedValue(entity);
      mockGetKonfluxConfig.mockResolvedValue(konfluxConfig);
      mockDetermineClusterNamespaceCombinations.mockResolvedValue([
        combination1,
        combination2,
      ]);
      mockDecodeContinuationToken.mockReturnValue(paginationState);
      mockBuildLabelSelector.mockReturnValue(undefined);
      mockResourceFetcher.fetchFromSource.mockResolvedValue({
        items: [],
        newPaginationState: {},
      });
      mockResourceFetcher.hasMoreData.mockReturnValue(false);

      await service.aggregateResources(
        entityRef,
        resource,
        mockCredentials,
        userEmail,
        { continuationToken: 'encoded-token' },
      );

      // sould only fetch from cluster1:namespace1 (has token)
      expect(mockResourceFetcher.fetchFromSource).toHaveBeenCalledTimes(1);
    });

    it('should return empty data when konflux config is missing', async () => {
      const entity = createMockEntity('test-entity');

      (mockCatalog.getEntityByRef as jest.Mock).mockResolvedValue(entity);
      mockGetKonfluxConfig.mockResolvedValue(undefined);

      const result = await service.aggregateResources(
        entityRef,
        resource,
        mockCredentials,
        userEmail,
      );

      expect(result.data).toEqual([]);
      expect(mockKonfluxLogger.warn).toHaveBeenCalledWith(
        'No Konflux configuration found',
        expect.objectContaining({
          entityRef,
          resource,
        }),
      );
      expect(mockDetermineClusterNamespaceCombinations).not.toHaveBeenCalled();
    });

    it('should handle cluster errors gracefully', async () => {
      const entity = createMockEntity('test-entity');
      const konfluxConfig = createMockKonfluxConfig();
      const combination1 = createMockCombination({
        cluster: 'cluster1',
        namespace: 'namespace1',
      });
      const combination2 = createMockCombination({
        cluster: 'cluster2',
        namespace: 'namespace2',
      });
      const resource1 = createMockResource('app1');

      (mockCatalog.getEntityByRef as jest.Mock).mockResolvedValue(entity);
      mockGetKonfluxConfig.mockResolvedValue(konfluxConfig);
      mockDetermineClusterNamespaceCombinations.mockResolvedValue([
        combination1,
        combination2,
      ]);
      mockBuildLabelSelector.mockReturnValue(undefined);
      mockResourceFetcher.fetchFromSource
        .mockResolvedValueOnce({
          items: [resource1],
          newPaginationState: {},
        })
        .mockRejectedValueOnce(new Error('Cluster error'));
      mockResourceFetcher.hasMoreData.mockReturnValue(false);
      mockCreateResourceWithClusterInfo.mockReturnValue(resource1);
      mockFilterResourcesByApplication.mockImplementation(items => items);

      const result = await service.aggregateResources(
        entityRef,
        resource,
        mockCredentials,
        userEmail,
      );

      expect(result.data).toHaveLength(1);
      expect(result.clusterErrors).toHaveLength(1);
      expect(result.clusterErrors?.[0]).toMatchObject({
        cluster: 'cluster2',
        namespace: 'namespace2',
        message: 'Cluster error',
        source: 'kubernetes',
        resourceType: resource,
      });

      expect(result.clusterErrors?.[0]).toHaveProperty('resourcePath');
      expect(mockKonfluxLogger.error).toHaveBeenCalledWith(
        'Error fetching applications from cluster2/namespace2',
        expect.any(Error),
        expect.objectContaining({
          cluster: 'cluster2',
          namespace: 'namespace2',
          resource: 'applications',
          source: 'kubernetes',
        }),
      );
    });

    it('should generate continuation token when there is more data', async () => {
      const entity = createMockEntity('test-entity');
      const konfluxConfig = createMockKonfluxConfig();
      const combination = createMockCombination();
      const resource1 = createMockResource('app1');
      const newPaginationState: PaginationState = {
        'cluster1:namespace1': { k8sToken: 'next-token' },
      };

      (mockCatalog.getEntityByRef as jest.Mock).mockResolvedValue(entity);
      mockGetKonfluxConfig.mockResolvedValue(konfluxConfig);
      mockDetermineClusterNamespaceCombinations.mockResolvedValue([
        combination,
      ]);
      mockBuildLabelSelector.mockReturnValue(undefined);
      mockResourceFetcher.fetchFromSource.mockResolvedValue({
        items: [resource1],
        newPaginationState: newPaginationState['cluster1:namespace1'],
      });
      mockResourceFetcher.hasMoreData.mockReturnValue(true);
      mockEncodeContinuationToken.mockReturnValue('encoded-next-token');
      mockCreateResourceWithClusterInfo.mockReturnValue(resource1);
      mockFilterResourcesByApplication.mockImplementation(items => items);

      const result = await service.aggregateResources(
        entityRef,
        resource,
        mockCredentials,
        userEmail,
      );

      expect(result.continuationToken).toBe('encoded-next-token');
      expect(mockEncodeContinuationToken).toHaveBeenCalledWith(
        newPaginationState,
        userEmail,
      );
      expect(mockKonfluxLogger.debug).toHaveBeenCalledWith(
        'Returning continuation token',
        expect.objectContaining({
          sourceCount: 1,
        }),
      );
    });

    it('should use userEntityRef for continuation token when provided', async () => {
      const entity = createMockEntity('test-entity');
      const konfluxConfig = createMockKonfluxConfig();
      const combination = createMockCombination();
      const newPaginationState: PaginationState = {
        'cluster1:namespace1': { k8sToken: 'next-token' },
      };

      (mockCatalog.getEntityByRef as jest.Mock).mockResolvedValue(entity);
      mockGetKonfluxConfig.mockResolvedValue(konfluxConfig);
      mockDetermineClusterNamespaceCombinations.mockResolvedValue([
        combination,
      ]);
      mockBuildLabelSelector.mockReturnValue(undefined);
      mockResourceFetcher.fetchFromSource.mockResolvedValue({
        items: [],
        newPaginationState: newPaginationState['cluster1:namespace1'],
      });
      mockResourceFetcher.hasMoreData.mockReturnValue(true);
      mockEncodeContinuationToken.mockReturnValue('encoded-token');

      await service.aggregateResources(
        entityRef,
        resource,
        mockCredentials,
        userEmail,
        undefined,
        undefined,
        'user:default/user1',
      );

      expect(mockEncodeContinuationToken).toHaveBeenCalledWith(
        newPaginationState,
        'user:default/user1',
      );
    });

    it('should fallback to userEmail when userEntityRef is not provided', async () => {
      const entity = createMockEntity('test-entity');
      const konfluxConfig = createMockKonfluxConfig();
      const combination = createMockCombination();
      const newPaginationState: PaginationState = {
        'cluster1:namespace1': { k8sToken: 'next-token' },
      };

      (mockCatalog.getEntityByRef as jest.Mock).mockResolvedValue(entity);
      mockGetKonfluxConfig.mockResolvedValue(konfluxConfig);
      mockDetermineClusterNamespaceCombinations.mockResolvedValue([
        combination,
      ]);
      mockBuildLabelSelector.mockReturnValue(undefined);
      mockResourceFetcher.fetchFromSource.mockResolvedValue({
        items: [],
        newPaginationState: newPaginationState['cluster1:namespace1'],
      });
      mockResourceFetcher.hasMoreData.mockReturnValue(true);
      mockEncodeContinuationToken.mockReturnValue('encoded-token');

      await service.aggregateResources(
        entityRef,
        resource,
        mockCredentials,
        userEmail,
      );

      expect(mockEncodeContinuationToken).toHaveBeenCalledWith(
        newPaginationState,
        userEmail,
      );
    });

    it('should sort resources by creation timestamp (newest first)', async () => {
      const entity = createMockEntity('test-entity');
      const konfluxConfig = createMockKonfluxConfig();
      const combination = createMockCombination();
      const resource1 = createMockResource('app1', '2024-01-01T10:00:00Z');
      const resource2 = createMockResource('app2', '2024-01-01T09:00:00Z');
      const resource3 = createMockResource('app3', '2024-01-01T11:00:00Z');

      (mockCatalog.getEntityByRef as jest.Mock).mockResolvedValue(entity);
      mockGetKonfluxConfig.mockResolvedValue(konfluxConfig);
      mockDetermineClusterNamespaceCombinations.mockResolvedValue([
        combination,
      ]);
      mockBuildLabelSelector.mockReturnValue(undefined);
      mockResourceFetcher.fetchFromSource.mockResolvedValue({
        items: [resource1, resource2, resource3],
        newPaginationState: {},
      });
      mockResourceFetcher.hasMoreData.mockReturnValue(false);
      mockCreateResourceWithClusterInfo
        .mockReturnValueOnce(resource1)
        .mockReturnValueOnce(resource2)
        .mockReturnValueOnce(resource3);
      mockFilterResourcesByApplication.mockImplementation(items => items);

      const result = await service.aggregateResources(
        entityRef,
        resource,
        mockCredentials,
        userEmail,
      );

      expect(result.data).toHaveLength(3);
      expect(result.data[0].metadata?.name).toBe('app3'); // Newest
      expect(result.data[1].metadata?.name).toBe('app1');
      expect(result.data[2].metadata?.name).toBe('app2'); // Oldest
    });

    it('should handle resources without creation timestamp', async () => {
      const entity = createMockEntity('test-entity');
      const konfluxConfig = createMockKonfluxConfig();
      const combination = createMockCombination();
      const resource1 = createMockResource('app1');
      const resource2 = createMockResource('app2');
      delete resource1.metadata?.creationTimestamp;
      delete resource2.metadata?.creationTimestamp;

      (mockCatalog.getEntityByRef as jest.Mock).mockResolvedValue(entity);
      mockGetKonfluxConfig.mockResolvedValue(konfluxConfig);
      mockDetermineClusterNamespaceCombinations.mockResolvedValue([
        combination,
      ]);
      mockBuildLabelSelector.mockReturnValue(undefined);
      mockResourceFetcher.fetchFromSource.mockResolvedValue({
        items: [resource1, resource2],
        newPaginationState: {},
      });
      mockResourceFetcher.hasMoreData.mockReturnValue(false);
      mockCreateResourceWithClusterInfo
        .mockReturnValueOnce(resource1)
        .mockReturnValueOnce(resource2);
      mockFilterResourcesByApplication.mockImplementation(items => items);

      const result = await service.aggregateResources(
        entityRef,
        resource,
        mockCredentials,
        userEmail,
      );

      expect(result.data).toHaveLength(2);
    });

    it('should apply in-memory filtering when label selector is not available', async () => {
      const entity = createMockEntity('test-entity');
      const konfluxConfig = createMockKonfluxConfig();
      const combination = createMockCombination({
        applications: ['app1', 'app2'],
      });
      const resource1 = createMockResource('app1');
      const resource2 = createMockResource('app2');
      const resource3 = createMockResource('app3');

      (mockCatalog.getEntityByRef as jest.Mock).mockResolvedValue(entity);
      mockGetKonfluxConfig.mockResolvedValue(konfluxConfig);
      mockDetermineClusterNamespaceCombinations.mockResolvedValue([
        combination,
      ]);
      mockBuildLabelSelector.mockReturnValue(undefined);
      mockResourceFetcher.fetchFromSource.mockResolvedValue({
        items: [resource1, resource2, resource3],
        newPaginationState: {},
      });
      mockResourceFetcher.hasMoreData.mockReturnValue(false);
      mockCreateResourceWithClusterInfo
        .mockReturnValueOnce(resource1)
        .mockReturnValueOnce(resource2)
        .mockReturnValueOnce(resource3);
      mockFilterResourcesByApplication.mockReturnValue([resource1, resource2]);

      const result = await service.aggregateResources(
        entityRef,
        resource,
        mockCredentials,
        userEmail,
      );

      expect(mockFilterResourcesByApplication).toHaveBeenCalledWith(
        [resource1, resource2, resource3],
        resource,
        ['app1', 'app2'],
      );
      expect(result.data).toHaveLength(2);
      expect(mockKonfluxLogger.debug).toHaveBeenCalledWith(
        'In-memory filtered resources',
        expect.objectContaining({
          filteredCount: 2,
          totalCount: 3,
        }),
      );
    });

    it('should apply application filter in in-memory filtering', async () => {
      const entity = createMockEntity('test-entity');
      const konfluxConfig = createMockKonfluxConfig();
      const combination = createMockCombination({
        applications: ['app1', 'app2'],
      });
      const resource1 = createMockResource('app1');
      const resource2 = createMockResource('app2');

      (mockCatalog.getEntityByRef as jest.Mock).mockResolvedValue(entity);
      mockGetKonfluxConfig.mockResolvedValue(konfluxConfig);
      mockDetermineClusterNamespaceCombinations.mockResolvedValue([
        combination,
      ]);
      mockBuildLabelSelector.mockReturnValue(undefined);
      mockResourceFetcher.fetchFromSource.mockResolvedValue({
        items: [resource1, resource2],
        newPaginationState: {},
      });
      mockResourceFetcher.hasMoreData.mockReturnValue(false);
      mockCreateResourceWithClusterInfo
        .mockReturnValueOnce(resource1)
        .mockReturnValueOnce(resource2);
      mockFilterResourcesByApplication.mockReturnValue([resource1]);

      await service.aggregateResources(
        entityRef,
        resource,
        mockCredentials,
        userEmail,
        { application: 'app1' },
      );

      expect(mockFilterResourcesByApplication).toHaveBeenCalledWith(
        [resource1, resource2],
        resource,
        ['app1'], // filtered to only app1
      );
    });

    it('should return empty array when filtered applications list is empty', async () => {
      const entity = createMockEntity('test-entity');
      const konfluxConfig = createMockKonfluxConfig();
      const combination = createMockCombination({ applications: ['app1'] });
      const resource1 = createMockResource('app1');

      (mockCatalog.getEntityByRef as jest.Mock).mockResolvedValue(entity);
      mockGetKonfluxConfig.mockResolvedValue(konfluxConfig);
      mockDetermineClusterNamespaceCombinations.mockResolvedValue([
        combination,
      ]);
      mockBuildLabelSelector.mockReturnValue(undefined);
      mockResourceFetcher.fetchFromSource.mockResolvedValue({
        items: [resource1],
        newPaginationState: {},
      });
      mockResourceFetcher.hasMoreData.mockReturnValue(false);
      mockCreateResourceWithClusterInfo.mockReturnValue(resource1);

      // Filter for app2, but combination only has app1
      await service.aggregateResources(
        entityRef,
        resource,
        mockCredentials,
        userEmail,
        { application: 'app2' },
      );

      expect(mockFilterResourcesByApplication).not.toHaveBeenCalled();
    });

    it('should skip in-memory filtering when label selector is available', async () => {
      const entity = createMockEntity('test-entity');
      const konfluxConfig = createMockKonfluxConfig();
      const combination = createMockCombination({ applications: ['app1'] });
      const resource1 = createMockResource('app1');

      (mockCatalog.getEntityByRef as jest.Mock).mockResolvedValue(entity);
      mockGetKonfluxConfig.mockResolvedValue(konfluxConfig);
      mockDetermineClusterNamespaceCombinations.mockResolvedValue([
        combination,
      ]);
      mockBuildLabelSelector.mockReturnValue('app=app1'); // label selector available
      mockResourceFetcher.fetchFromSource.mockResolvedValue({
        items: [resource1],
        newPaginationState: {},
      });
      mockResourceFetcher.hasMoreData.mockReturnValue(false);
      mockCreateResourceWithClusterInfo.mockReturnValue(resource1);
      mockFilterResourcesByApplication.mockImplementation(items => items);

      await service.aggregateResources(
        entityRef,
        resource,
        mockCredentials,
        userEmail,
      );

      expect(mockFilterResourcesByApplication).not.toHaveBeenCalled();
    });

    it('should set possiblyMoreData when items length equals limitPerCluster', async () => {
      const entity = createMockEntity('test-entity');
      const konfluxConfig = createMockKonfluxConfig();
      const combination = createMockCombination();
      // DEFAULT_PAGE_SIZE is 25, so we need 25 items to trigger possiblyMoreData
      const resources = Array.from({ length: 25 }, (_, i) =>
        createMockResource(`app${i}`),
      );

      (mockCatalog.getEntityByRef as jest.Mock).mockResolvedValue(entity);
      mockGetKonfluxConfig.mockResolvedValue(konfluxConfig);
      mockDetermineClusterNamespaceCombinations.mockResolvedValue([
        combination,
      ]);
      mockBuildLabelSelector.mockReturnValue(undefined);
      mockResourceFetcher.fetchFromSource.mockResolvedValue({
        items: resources,
        newPaginationState: {},
      });
      mockResourceFetcher.hasMoreData.mockReturnValue(false);
      mockCreateResourceWithClusterInfo.mockImplementation(item => item);
      mockFilterResourcesByApplication.mockImplementation(items => items);

      const result = await service.aggregateResources(
        entityRef,
        resource,
        mockCredentials,
        userEmail,
      );

      expect(result.metadata?.possiblyMoreData).toBe(true);
      expect(result.data).toHaveLength(25);
    });

    it('should validate user email for impersonation', async () => {
      const entity = createMockEntity('test-entity');
      const konfluxConfig = createMockKonfluxConfig({
        authProvider: 'impersonationHeaders',
      });
      const combination = createMockCombination();

      (mockCatalog.getEntityByRef as jest.Mock).mockResolvedValue(entity);
      mockGetKonfluxConfig.mockResolvedValue(konfluxConfig);
      mockDetermineClusterNamespaceCombinations.mockResolvedValue([
        combination,
      ]);
      mockBuildLabelSelector.mockReturnValue(undefined);
      mockResourceFetcher.fetchFromSource.mockResolvedValue({
        items: [],
        newPaginationState: {},
      });
      mockResourceFetcher.hasMoreData.mockReturnValue(false);
      mockValidateUserEmailForImpersonation.mockReturnValue(
        'validated@example.com',
      );

      await service.aggregateResources(
        entityRef,
        resource,
        mockCredentials,
        'user@example.com',
      );

      expect(mockValidateUserEmailForImpersonation).toHaveBeenCalledWith(
        'user@example.com',
        'impersonationHeaders',
      );
    });

    it('should include cluster UI URL when enriching resources', async () => {
      const entity = createMockEntity('test-entity');
      const konfluxConfig = createMockKonfluxConfig({
        clusters: {
          cluster1: {
            apiUrl: 'https://api.cluster1.com',
            serviceAccountToken: 'token1',
            uiUrl: 'https://ui.cluster1.com',
          },
        },
      });
      const combination = createMockCombination();
      const resource1 = createMockResource('app1');
      const enrichedResource = {
        ...resource1,
        cluster: { name: 'cluster1', konfluxUI: 'https://ui.cluster1.com' },
      };

      (mockCatalog.getEntityByRef as jest.Mock).mockResolvedValue(entity);
      mockGetKonfluxConfig.mockResolvedValue(konfluxConfig);
      mockDetermineClusterNamespaceCombinations.mockResolvedValue([
        combination,
      ]);
      mockBuildLabelSelector.mockReturnValue(undefined);
      mockResourceFetcher.fetchFromSource.mockResolvedValue({
        items: [resource1],
        newPaginationState: {},
      });
      mockResourceFetcher.hasMoreData.mockReturnValue(false);
      mockCreateResourceWithClusterInfo.mockReturnValue(enrichedResource);
      mockFilterResourcesByApplication.mockImplementation(items => items);

      await service.aggregateResources(
        entityRef,
        resource,
        mockCredentials,
        userEmail,
      );

      expect(mockCreateResourceWithClusterInfo).toHaveBeenCalledWith(
        resource1,
        'cluster1',
        'sub1',
        'https://ui.cluster1.com',
      );
    });
  });
});
