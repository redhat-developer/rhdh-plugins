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

import {
  ResourceFetcherService,
  FetchContext,
  FetchOptions,
} from '../resource-fetcher';
import { LoggerService } from '@backstage/backend-plugin-api';
import { KubeConfig, CustomObjectsApi } from '@kubernetes/client-node';
import { K8sResourceCommonWithClusterInfo } from '@red-hat-developer-hub/backstage-plugin-konflux-common';
import { KubearchiveService } from '../kubearchive-service';
import { createKubeConfig } from '../../helpers/client-factory';
import { KonfluxLogger } from '../../helpers/logger';

jest.mock('../kubearchive-service');
jest.mock('../../helpers/client-factory');
jest.mock('../../helpers/logger');
jest.mock('@kubernetes/client-node');

describe('ResourceFetcherService', () => {
  let mockLogger: jest.Mocked<LoggerService>;
  let mockKonfluxLogger: jest.Mocked<KonfluxLogger>;
  let mockKubearchiveService: jest.Mocked<KubearchiveService>;
  let mockKubeConfig: jest.Mocked<KubeConfig>;
  let mockCustomObjectsApi: jest.Mocked<CustomObjectsApi>;
  let service: ResourceFetcherService;

  const createMockFetchContext = (
    overrides?: Partial<FetchContext>,
  ): FetchContext => ({
    cluster: 'cluster1',
    namespace: 'namespace1',
    userEmail: 'user@example.com',
    konfluxConfig: {
      clusters: {
        cluster1: {
          apiUrl: 'https://api.cluster1.com',
          serviceAccountToken: 'service-token-123',
        },
      },
      subcomponentConfigs: [],
      authProvider: 'serviceAccount',
    },
    resourceModel: {
      apiGroup: 'appstudio.redhat.com',
      apiVersion: 'v1alpha1',
      plural: 'pipelineruns',
      kind: 'PipelineRun',
    },
    ...overrides,
  });

  const createMockResource = (
    name: string,
  ): K8sResourceCommonWithClusterInfo => ({
    apiVersion: 'v1alpha1',
    kind: 'PipelineRun',
    metadata: {
      name,
      namespace: 'namespace1',
    },
    cluster: { name: 'cluster1' },
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

    mockKubearchiveService = {
      fetchResources: jest.fn(),
    } as unknown as jest.Mocked<KubearchiveService>;

    mockCustomObjectsApi = {
      listNamespacedCustomObject: jest.fn(),
    } as unknown as jest.Mocked<CustomObjectsApi>;

    mockKubeConfig = {
      makeApiClient: jest.fn().mockReturnValue(mockCustomObjectsApi),
    } as unknown as jest.Mocked<KubeConfig>;

    (
      KonfluxLogger as jest.MockedClass<typeof KonfluxLogger>
    ).mockImplementation(() => mockKonfluxLogger);

    (
      KubearchiveService as jest.MockedClass<typeof KubearchiveService>
    ).mockImplementation(() => mockKubearchiveService);

    (
      createKubeConfig as jest.MockedFunction<typeof createKubeConfig>
    ).mockReturnValue(mockKubeConfig);

    service = new ResourceFetcherService(mockLogger);
  });

  describe('fetchFromKubernetes', () => {
    it('should fetch resources from Kubernetes with serviceAccount auth', async () => {
      const context = createMockFetchContext();
      const options: FetchOptions = { limit: 10 };
      const mockItems = [
        createMockResource('plr1'),
        createMockResource('plr2'),
      ];

      mockCustomObjectsApi.listNamespacedCustomObject.mockResolvedValue({
        body: {
          items: mockItems,
          metadata: {},
        },
      } as any);

      const result = await service.fetchFromKubernetes(context, options);

      expect(result.items).toEqual(mockItems);
      expect(result.continueToken).toBeUndefined();
      expect(createKubeConfig).toHaveBeenCalledWith(
        context.konfluxConfig,
        'cluster1',
        mockKonfluxLogger,
        'service-token-123',
      );
      expect(
        mockCustomObjectsApi.listNamespacedCustomObject,
      ).toHaveBeenCalledWith(
        'appstudio.redhat.com',
        'v1alpha1',
        'namespace1',
        'pipelineruns',
        undefined,
        undefined,
        undefined,
        undefined,
        undefined,
        10,
        undefined,
        undefined,
        undefined,
        undefined,
        {
          headers: {
            Authorization: 'Bearer service-token-123',
          },
        },
      );
    });

    it('should fetch resources with pagination token', async () => {
      const context = createMockFetchContext();
      const options: FetchOptions = { continue: 'continue-token-123' };
      const mockItems = [createMockResource('plr1')];

      mockCustomObjectsApi.listNamespacedCustomObject.mockResolvedValue({
        body: {
          items: mockItems,
          metadata: { continue: 'next-token-456' },
        },
      } as any);

      const result = await service.fetchFromKubernetes(context, options);

      expect(result.items).toEqual(mockItems);
      expect(result.continueToken).toBe('next-token-456');
      expect(
        mockCustomObjectsApi.listNamespacedCustomObject,
      ).toHaveBeenCalledWith(
        'appstudio.redhat.com',
        'v1alpha1',
        'namespace1',
        'pipelineruns',
        undefined,
        undefined,
        'continue-token-123',
        undefined,
        undefined,
        undefined,
        undefined,
        undefined,
        undefined,
        undefined,
        {
          headers: {
            Authorization: 'Bearer service-token-123',
          },
        },
      );
    });

    it('should fetch resources with labelSelector', async () => {
      const context = createMockFetchContext();
      const options: FetchOptions = {
        labelSelector: 'appstudio.openshift.io/application=app1',
      };

      mockCustomObjectsApi.listNamespacedCustomObject.mockResolvedValue({
        body: { items: [] },
      } as any);

      await service.fetchFromKubernetes(context, options);

      expect(
        mockCustomObjectsApi.listNamespacedCustomObject,
      ).toHaveBeenCalledWith(
        'appstudio.redhat.com',
        'v1alpha1',
        'namespace1',
        'pipelineruns',
        undefined,
        undefined,
        undefined,
        undefined,
        'appstudio.openshift.io/application=app1',
        undefined,
        undefined,
        undefined,
        undefined,
        undefined,
        {
          headers: {
            Authorization: 'Bearer service-token-123',
          },
        },
      );
    });

    it('should use OIDC token when authProvider is oidc', async () => {
      const context = createMockFetchContext({
        konfluxConfig: {
          clusters: {
            cluster1: {
              apiUrl: 'https://api.cluster1.com',
              serviceAccountToken: 'service-token-123',
            },
          },
          subcomponentConfigs: [],
          authProvider: 'oidc',
        },
        oidcToken: 'oidc-token-456',
      });

      mockCustomObjectsApi.listNamespacedCustomObject.mockResolvedValue({
        body: { items: [] },
      } as any);

      await service.fetchFromKubernetes(context);

      expect(createKubeConfig).toHaveBeenCalledWith(
        expect.anything(),
        expect.anything(),
        expect.anything(),
        'oidc-token-456',
      );
      expect(mockKonfluxLogger.debug).toHaveBeenCalledWith(
        'Using OIDC token for authentication',
        { cluster: 'cluster1', namespace: 'namespace1' },
      );
    });

    it('should throw error when OIDC authProvider configured but no token', async () => {
      const context = createMockFetchContext({
        konfluxConfig: {
          clusters: {
            cluster1: {
              apiUrl: 'https://api.cluster1.com',
              serviceAccountToken: 'service-token-123',
            },
          },
          subcomponentConfigs: [],
          authProvider: 'oidc',
        },
        oidcToken: undefined,
      });

      await expect(service.fetchFromKubernetes(context)).rejects.toThrow(
        'OIDC authProvider configured for cluster cluster1 but no token available',
      );
      expect(mockKonfluxLogger.error).toHaveBeenCalled();
    });

    it('should add impersonation headers when authProvider is impersonationHeaders', async () => {
      const context = createMockFetchContext({
        konfluxConfig: {
          clusters: {
            cluster1: {
              apiUrl: 'https://api.cluster1.com',
              serviceAccountToken: 'service-token-123',
            },
          },
          subcomponentConfigs: [],
          authProvider: 'impersonationHeaders',
        },
        userEmail: 'user@example.com',
      });

      mockCustomObjectsApi.listNamespacedCustomObject.mockResolvedValue({
        body: { items: [] },
      } as any);

      await service.fetchFromKubernetes(context);

      expect(
        mockCustomObjectsApi.listNamespacedCustomObject,
      ).toHaveBeenCalledWith(
        'appstudio.redhat.com',
        'v1alpha1',
        'namespace1',
        'pipelineruns',
        undefined,
        undefined,
        undefined,
        undefined,
        undefined,
        undefined,
        undefined,
        undefined,
        undefined,
        undefined,
        {
          headers: {
            'Impersonate-User': 'user@example.com',
            'Impersonate-Group': 'system:authenticated',
            Authorization: 'Bearer service-token-123',
          },
        },
      );
    });

    it('should throw error when impersonation required but userEmail is missing', async () => {
      const context = createMockFetchContext({
        konfluxConfig: {
          clusters: {
            cluster1: {
              apiUrl: 'https://api.cluster1.com',
              serviceAccountToken: 'service-token-123',
            },
          },
          subcomponentConfigs: [],
          authProvider: 'impersonationHeaders',
        },
        userEmail: '',
      });

      await expect(service.fetchFromKubernetes(context)).rejects.toThrow(
        'User email is required for impersonation but was not provided for cluster cluster1',
      );
    });

    it('should throw error when no token is available', async () => {
      const context = createMockFetchContext({
        konfluxConfig: {
          clusters: {
            cluster1: {
              apiUrl: 'https://api.cluster1.com',
              serviceAccountToken: undefined,
            },
          },
          subcomponentConfigs: [],
          authProvider: 'serviceAccount',
        },
      });

      await expect(service.fetchFromKubernetes(context)).rejects.toThrow(
        'No authentication token available for cluster cluster1',
      );
    });

    it('should throw error when cluster not found', async () => {
      const context = createMockFetchContext();
      (
        createKubeConfig as jest.MockedFunction<typeof createKubeConfig>
      ).mockReturnValue(null);

      await expect(service.fetchFromKubernetes(context)).rejects.toThrow(
        "Cluster 'cluster1' not found",
      );
    });

    it('should handle API errors and rethrow', async () => {
      const context = createMockFetchContext();
      const apiError = new Error('Kubernetes API error');
      mockCustomObjectsApi.listNamespacedCustomObject.mockRejectedValue(
        apiError,
      );

      await expect(service.fetchFromKubernetes(context)).rejects.toThrow(
        'Kubernetes API error',
      );
      expect(mockKonfluxLogger.error).toHaveBeenCalledWith(
        'Error fetching pipelineruns from cluster1/namespace1',
        apiError,
        expect.any(Object),
      );
    });

    it('should handle empty response body', async () => {
      const context = createMockFetchContext();
      mockCustomObjectsApi.listNamespacedCustomObject.mockResolvedValue({
        body: undefined,
      } as any);

      const result = await service.fetchFromKubernetes(context);

      expect(result.items).toEqual([]);
      expect(result.continueToken).toBeUndefined();
    });

    it('should log fetch success with item count', async () => {
      const context = createMockFetchContext();
      const mockItems = [
        createMockResource('plr1'),
        createMockResource('plr2'),
      ];

      mockCustomObjectsApi.listNamespacedCustomObject.mockResolvedValue({
        body: {
          items: mockItems,
          metadata: { continue: 'next-token' },
        },
      } as any);

      await service.fetchFromKubernetes(context);

      expect(mockKonfluxLogger.info).toHaveBeenCalledWith(
        'Fetched resources from Kubernetes',
        {
          cluster: 'cluster1',
          namespace: 'namespace1',
          resource: 'pipelineruns',
          itemCount: 2,
          hasMore: true,
          apiUrl: 'https://api.cluster1.com',
        },
      );
    });
  });

  describe('fetchFromKubearchive', () => {
    it('should fetch resources from Kubearchive', async () => {
      const context = createMockFetchContext();
      const mockItems = [
        createMockResource('plr1'),
        createMockResource('plr2'),
      ];

      mockKubearchiveService.fetchResources.mockResolvedValue({
        results: mockItems,
        nextPageToken: 'next-token-123',
      });

      const result = await service.fetchFromKubearchive(
        context,
        10,
        'page-token-456',
        'label-selector',
      );

      expect(result.items).toEqual(mockItems);
      expect(result.continueToken).toBe('next-token-123');
      expect(mockKubearchiveService.fetchResources).toHaveBeenCalledWith({
        konfluxConfig: context.konfluxConfig,
        userEmail: 'user@example.com',
        cluster: 'cluster1',
        apiGroup: 'appstudio.redhat.com',
        apiVersion: 'v1alpha1',
        resource: 'pipelineruns',
        namespace: 'namespace1',
        options: {
          pageSize: 10,
          pageToken: 'page-token-456',
          labelSelector: 'label-selector',
        },
        oidcToken: undefined,
      });
    });

    it('should handle empty results', async () => {
      const context = createMockFetchContext();
      mockKubearchiveService.fetchResources.mockResolvedValue({
        results: [],
        nextPageToken: undefined,
      });

      const result = await service.fetchFromKubearchive(context);

      expect(result.items).toEqual([]);
      expect(result.continueToken).toBeUndefined();
    });

    it('should pass OIDC token to KubearchiveService', async () => {
      const context = createMockFetchContext({
        oidcToken: 'oidc-token-789',
      });

      mockKubearchiveService.fetchResources.mockResolvedValue({
        results: [],
      });

      await service.fetchFromKubearchive(context);

      expect(mockKubearchiveService.fetchResources).toHaveBeenCalledWith({
        konfluxConfig: expect.anything(),
        userEmail: expect.anything(),
        cluster: expect.anything(),
        apiGroup: expect.anything(),
        apiVersion: expect.anything(),
        resource: expect.anything(),
        namespace: expect.anything(),
        options: expect.anything(),
        oidcToken: 'oidc-token-789',
      });
    });
  });

  describe('hasMoreData', () => {
    it('should return true when k8sToken exists', () => {
      expect(service.hasMoreData({ k8sToken: 'token-123' })).toBe(true);
    });

    it('should return true when kubearchiveToken exists', () => {
      expect(service.hasMoreData({ kubearchiveToken: 'token-456' })).toBe(true);
    });

    it('should return true when both tokens exist', () => {
      expect(
        service.hasMoreData({
          k8sToken: 'token-123',
          kubearchiveToken: 'token-456',
        }),
      ).toBe(true);
    });

    it('should return false when no tokens exist', () => {
      expect(service.hasMoreData({})).toBe(false);
    });

    it('should return false when paginationState is empty', () => {
      expect(service.hasMoreData({})).toBe(false);
    });
  });

  describe('fetchFromSource', () => {
    it('should fetch from K8s when no pagination state', async () => {
      const context = createMockFetchContext();
      const mockItems = [createMockResource('plr1')];

      mockCustomObjectsApi.listNamespacedCustomObject.mockResolvedValue({
        body: {
          items: mockItems,
          metadata: { continue: 'k8s-token-123' },
        },
      } as any);

      const result = await service.fetchFromSource(context);

      expect(result.items).toEqual(mockItems);
      expect(result.newPaginationState).toEqual({ k8sToken: 'k8s-token-123' });
    });

    it('should continue from K8s when k8sToken exists', async () => {
      const context = createMockFetchContext();
      const mockItems = [createMockResource('plr1')];

      mockCustomObjectsApi.listNamespacedCustomObject.mockResolvedValue({
        body: {
          items: mockItems,
          metadata: { continue: 'k8s-token-456' },
        },
      } as any);

      const result = await service.fetchFromSource(context, {
        k8sToken: 'k8s-token-123',
      });

      expect(result.items).toEqual(mockItems);
      expect(result.newPaginationState).toEqual({ k8sToken: 'k8s-token-456' });
      expect(
        mockCustomObjectsApi.listNamespacedCustomObject,
      ).toHaveBeenCalledWith(
        'appstudio.redhat.com',
        'v1alpha1',
        'namespace1',
        'pipelineruns',
        undefined,
        undefined,
        'k8s-token-123',
        undefined,
        undefined,
        undefined,
        undefined,
        undefined,
        undefined,
        undefined,
        {
          headers: {
            Authorization: 'Bearer service-token-123',
          },
        },
      );
    });

    it('should continue from Kubearchive when kubearchiveToken exists and no k8sToken', async () => {
      const context = createMockFetchContext({
        konfluxConfig: {
          clusters: {
            cluster1: {
              apiUrl: 'https://api.cluster1.com',
              serviceAccountToken: 'token-123',
              kubearchiveApiUrl: 'https://kubearchive.cluster1.com',
            },
          },
          subcomponentConfigs: [],
          authProvider: 'serviceAccount',
        },
        resourceModel: {
          apiGroup: 'appstudio.redhat.com',
          apiVersion: 'v1alpha1',
          plural: 'pipelineruns',
          kind: 'PipelineRun',
        },
      });

      const mockItems = [createMockResource('plr1')];
      mockKubearchiveService.fetchResources.mockResolvedValue({
        results: mockItems,
        nextPageToken: 'ka-token-456',
      });

      const result = await service.fetchFromSource(
        context,
        { kubearchiveToken: 'ka-token-123' },
        { limit: 10 },
      );

      expect(result.items).toEqual(mockItems);
      expect(result.newPaginationState).toEqual({
        kubearchiveToken: 'ka-token-456',
      });
      expect(mockKubearchiveService.fetchResources).toHaveBeenCalledWith({
        konfluxConfig: context.konfluxConfig,
        userEmail: 'user@example.com',
        cluster: 'cluster1',
        apiGroup: 'appstudio.redhat.com',
        apiVersion: 'v1alpha1',
        resource: 'pipelineruns',
        namespace: 'namespace1',
        options: {
          pageSize: 10,
          pageToken: 'ka-token-123',
          labelSelector: undefined,
        },
        oidcToken: undefined,
      });
    });

    it('should merge K8s and Kubearchive results when K8s exhausted on initial load', async () => {
      const context = createMockFetchContext({
        konfluxConfig: {
          clusters: {
            cluster1: {
              apiUrl: 'https://api.cluster1.com',
              serviceAccountToken: 'token-123',
              kubearchiveApiUrl: 'https://kubearchive.cluster1.com',
            },
          },
          subcomponentConfigs: [],
          authProvider: 'serviceAccount',
        },
        resourceModel: {
          apiGroup: 'appstudio.redhat.com',
          apiVersion: 'v1alpha1',
          plural: 'pipelineruns',
          kind: 'PipelineRun',
        },
      });

      const k8sItems = [createMockResource('plr1')];
      const kaItems = [createMockResource('plr2'), createMockResource('plr3')];

      mockCustomObjectsApi.listNamespacedCustomObject.mockResolvedValue({
        body: {
          items: k8sItems,
          metadata: {},
        },
      } as any);

      mockKubearchiveService.fetchResources.mockResolvedValue({
        results: kaItems,
        nextPageToken: 'ka-token-123',
      });

      const result = await service.fetchFromSource(context, {}, { limit: 10 });

      expect(result.items).toHaveLength(3);
      expect(result.items.map(i => i.metadata?.name)).toEqual([
        'plr1',
        'plr2',
        'plr3',
      ]);
      expect(result.newPaginationState).toEqual({
        kubearchiveToken: 'ka-token-123',
      });
      expect(mockKonfluxLogger.debug).toHaveBeenCalledWith(
        'k8s exhausted, fetching from Kubearchive',
        expect.objectContaining({
          cluster: 'cluster1',
          namespace: 'namespace1',
          resource: 'pipelineruns',
          k8sItemCount: 1,
        }),
      );
    });

    it('should deduplicate merged results by resource name', async () => {
      const context = createMockFetchContext({
        konfluxConfig: {
          clusters: {
            cluster1: {
              apiUrl: 'https://api.cluster1.com',
              serviceAccountToken: 'token-123',
              kubearchiveApiUrl: 'https://kubearchive.cluster1.com',
            },
          },
          subcomponentConfigs: [],
          authProvider: 'serviceAccount',
        },
        resourceModel: {
          apiGroup: 'appstudio.redhat.com',
          apiVersion: 'v1alpha1',
          plural: 'pipelineruns',
          kind: 'PipelineRun',
        },
      });

      const k8sItems = [createMockResource('plr1')];
      const kaItems = [createMockResource('plr1'), createMockResource('plr2')];

      mockCustomObjectsApi.listNamespacedCustomObject.mockResolvedValue({
        body: {
          items: k8sItems,
          metadata: {},
        },
      } as any);

      mockKubearchiveService.fetchResources.mockResolvedValue({
        results: kaItems,
        nextPageToken: undefined,
      });

      const result = await service.fetchFromSource(context, {}, { limit: 10 });

      expect(result.items).toHaveLength(2);
      expect(result.items.map(i => i.metadata?.name)).toEqual(['plr1', 'plr2']);
      expect(mockKonfluxLogger.debug).toHaveBeenCalledWith(
        'Merged k8s and Kubearchive results',
        expect.objectContaining({
          k8sItemCount: 1,
          kubearchiveItemCount: 2,
          mergedItemCount: 2,
          duplicatesRemoved: 1,
        }),
      );
    });

    it('should calculate remaining limit when merging results', async () => {
      const context = createMockFetchContext({
        konfluxConfig: {
          clusters: {
            cluster1: {
              apiUrl: 'https://api.cluster1.com',
              serviceAccountToken: 'token-123',
              kubearchiveApiUrl: 'https://kubearchive.cluster1.com',
            },
          },
          subcomponentConfigs: [],
          authProvider: 'serviceAccount',
        },
        resourceModel: {
          apiGroup: 'appstudio.redhat.com',
          apiVersion: 'v1alpha1',
          plural: 'pipelineruns',
          kind: 'PipelineRun',
        },
      });

      const k8sItems = [createMockResource('plr1'), createMockResource('plr2')];

      mockCustomObjectsApi.listNamespacedCustomObject.mockResolvedValue({
        body: {
          items: k8sItems,
          metadata: {},
        },
      } as any);

      mockKubearchiveService.fetchResources.mockResolvedValue({
        results: [],
      });

      await service.fetchFromSource(context, {}, { limit: 10 });

      expect(mockKubearchiveService.fetchResources).toHaveBeenCalledWith({
        konfluxConfig: context.konfluxConfig,
        userEmail: 'user@example.com',
        cluster: 'cluster1',
        apiGroup: 'appstudio.redhat.com',
        apiVersion: 'v1alpha1',
        resource: 'pipelineruns',
        namespace: 'namespace1',
        options: {
          pageSize: 8, // 10 - 2
          pageToken: undefined,
          labelSelector: undefined,
        },
        oidcToken: undefined,
      });
    });

    it('should not fetch from Kubearchive when limit is reached', async () => {
      const context = createMockFetchContext({
        konfluxConfig: {
          clusters: {
            cluster1: {
              apiUrl: 'https://api.cluster1.com',
              serviceAccountToken: 'token-123',
              kubearchiveApiUrl: 'https://kubearchive.cluster1.com',
            },
          },
          subcomponentConfigs: [],
          authProvider: 'serviceAccount',
        },
        resourceModel: {
          apiGroup: 'appstudio.redhat.com',
          apiVersion: 'v1alpha1',
          plural: 'pipelineruns',
          kind: 'PipelineRun',
        },
      });

      const k8sItems = [
        createMockResource('plr1'),
        createMockResource('plr2'),
        createMockResource('plr3'),
      ];

      mockCustomObjectsApi.listNamespacedCustomObject.mockResolvedValue({
        body: {
          items: k8sItems,
          metadata: {},
        },
      } as any);

      const result = await service.fetchFromSource(context, {}, { limit: 3 });

      expect(result.items).toEqual(k8sItems);
      expect(mockKubearchiveService.fetchResources).not.toHaveBeenCalled();
    });

    it('should not fetch from Kubearchive when K8s has more pages', async () => {
      const context = createMockFetchContext({
        konfluxConfig: {
          clusters: {
            cluster1: {
              apiUrl: 'https://api.cluster1.com',
              serviceAccountToken: 'token-123',
              kubearchiveApiUrl: 'https://kubearchive.cluster1.com',
            },
          },
          subcomponentConfigs: [],
          authProvider: 'serviceAccount',
        },
        resourceModel: {
          apiGroup: 'appstudio.redhat.com',
          apiVersion: 'v1alpha1',
          plural: 'pipelineruns',
          kind: 'PipelineRun',
        },
      });

      const k8sItems = [createMockResource('plr1')];

      mockCustomObjectsApi.listNamespacedCustomObject.mockResolvedValue({
        body: {
          items: k8sItems,
          metadata: { continue: 'k8s-token-123' },
        },
      } as any);

      const result = await service.fetchFromSource(context);

      expect(result.items).toEqual(k8sItems);
      expect(result.newPaginationState).toEqual({ k8sToken: 'k8s-token-123' });
      expect(mockKubearchiveService.fetchResources).not.toHaveBeenCalled();
    });

    it('should not fetch from Kubearchive when resource type is not supported', async () => {
      const context = createMockFetchContext({
        konfluxConfig: {
          clusters: {
            cluster1: {
              apiUrl: 'https://api.cluster1.com',
              serviceAccountToken: 'token-123',
              kubearchiveApiUrl: 'https://kubearchive.cluster1.com',
            },
          },
          subcomponentConfigs: [],
          authProvider: 'serviceAccount',
        },
        resourceModel: {
          apiGroup: 'appstudio.redhat.com',
          apiVersion: 'v1alpha1',
          plural: 'applications', // Not in AVAILABLE_KUBEARCHIVE_RESOURCES_TO_FETCH,
          kind: 'PipelineRun',
        },
      });

      const k8sItems = [createMockResource('app1')];

      mockCustomObjectsApi.listNamespacedCustomObject.mockResolvedValue({
        body: {
          items: k8sItems,
          metadata: {},
        },
      } as any);

      const result = await service.fetchFromSource(context);

      expect(result.items).toEqual(k8sItems);
      expect(mockKubearchiveService.fetchResources).not.toHaveBeenCalled();
    });

    it('should not fetch from Kubearchive when namespace is empty', async () => {
      const context = createMockFetchContext({
        namespace: '',
        konfluxConfig: {
          clusters: {
            cluster1: {
              apiUrl: 'https://api.cluster1.com',
              serviceAccountToken: 'token-123',
              kubearchiveApiUrl: 'https://kubearchive.cluster1.com',
            },
          },
          subcomponentConfigs: [],
          authProvider: 'serviceAccount',
        },
      });

      const k8sItems = [createMockResource('plr1')];

      mockCustomObjectsApi.listNamespacedCustomObject.mockResolvedValue({
        body: {
          items: k8sItems,
          metadata: {},
        },
      } as any);

      const result = await service.fetchFromSource(context);

      expect(result.items).toEqual(k8sItems);
      expect(mockKubearchiveService.fetchResources).not.toHaveBeenCalled();
    });

    it('should not fetch from Kubearchive when kubearchiveApiUrl is not configured', async () => {
      const context = createMockFetchContext({
        konfluxConfig: {
          clusters: {
            cluster1: {
              apiUrl: 'https://api.cluster1.com',
              serviceAccountToken: 'token-123',
              // kubearchiveApiUrl not set
            },
          },
          subcomponentConfigs: [],
          authProvider: 'serviceAccount',
        },
      });

      const k8sItems = [createMockResource('plr1')];

      mockCustomObjectsApi.listNamespacedCustomObject.mockResolvedValue({
        body: {
          items: k8sItems,
          metadata: {},
        },
      } as any);

      const result = await service.fetchFromSource(context);

      expect(result.items).toEqual(k8sItems);
      expect(mockKubearchiveService.fetchResources).not.toHaveBeenCalled();
    });

    it('should pass labelSelector to both K8s and Kubearchive', async () => {
      const context = createMockFetchContext({
        konfluxConfig: {
          clusters: {
            cluster1: {
              apiUrl: 'https://api.cluster1.com',
              serviceAccountToken: 'token-123',
              kubearchiveApiUrl: 'https://kubearchive.cluster1.com',
            },
          },
          subcomponentConfigs: [],
          authProvider: 'serviceAccount',
        },
        resourceModel: {
          apiGroup: 'appstudio.redhat.com',
          apiVersion: 'v1alpha1',
          plural: 'pipelineruns',
          kind: 'PipelineRun',
        },
      });

      mockCustomObjectsApi.listNamespacedCustomObject.mockResolvedValue({
        body: {
          items: [],
          metadata: {},
        },
      } as any);

      mockKubearchiveService.fetchResources.mockResolvedValue({
        results: [],
      });

      await service.fetchFromSource(
        context,
        {},
        { labelSelector: 'app=myapp' },
      );

      expect(
        mockCustomObjectsApi.listNamespacedCustomObject,
      ).toHaveBeenCalledWith(
        'appstudio.redhat.com',
        'v1alpha1',
        'namespace1',
        'pipelineruns',
        undefined,
        undefined,
        undefined,
        undefined,
        'app=myapp',
        undefined,
        undefined,
        undefined,
        undefined,
        undefined,
        {
          headers: {
            Authorization: 'Bearer token-123',
          },
        },
      );

      expect(mockKubearchiveService.fetchResources).toHaveBeenCalledWith({
        konfluxConfig: context.konfluxConfig,
        userEmail: 'user@example.com',
        cluster: 'cluster1',
        apiGroup: 'appstudio.redhat.com',
        apiVersion: 'v1alpha1',
        resource: 'pipelineruns',
        namespace: 'namespace1',
        options: {
          pageSize: undefined,
          pageToken: undefined,
          labelSelector: 'app=myapp',
        },
        oidcToken: undefined,
      });
    });

    it('should return empty pagination state when Kubearchive returns no items', async () => {
      const context = createMockFetchContext({
        konfluxConfig: {
          clusters: {
            cluster1: {
              apiUrl: 'https://api.cluster1.com',
              serviceAccountToken: 'token-123',
              kubearchiveApiUrl: 'https://kubearchive.cluster1.com',
            },
          },
          subcomponentConfigs: [],
          authProvider: 'serviceAccount',
        },
        resourceModel: {
          apiGroup: 'appstudio.redhat.com',
          apiVersion: 'v1alpha1',
          plural: 'pipelineruns',
          kind: 'PipelineRun',
        },
      });

      const k8sItems = [createMockResource('plr1')];

      mockCustomObjectsApi.listNamespacedCustomObject.mockResolvedValue({
        body: {
          items: k8sItems,
          metadata: {},
        },
      } as any);

      mockKubearchiveService.fetchResources.mockResolvedValue({
        results: [],
        nextPageToken: undefined,
      });

      const result = await service.fetchFromSource(context);

      expect(result.items).toEqual(k8sItems);
      expect(result.newPaginationState).toEqual({});
    });
  });
});
