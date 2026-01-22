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

import { KubearchiveService } from '../kubearchive-service';
import { LoggerService } from '@backstage/backend-plugin-api';
import type { KubeConfig, CustomObjectsApi } from '@kubernetes/client-node';
import {
  KonfluxConfig,
  K8sResourceCommonWithClusterInfo,
} from '@red-hat-developer-hub/backstage-plugin-konflux-common';
import { KonfluxLogger } from '../../helpers/logger';
import { createKubeConfig } from '../../helpers/client-factory';
import { getKubeClient } from '../../helpers/kube-client';

jest.mock('../../helpers/logger');
jest.mock('../../helpers/client-factory');
jest.mock('../../helpers/kube-client');

describe('KubearchiveService', () => {
  let mockLogger: jest.Mocked<LoggerService>;
  let mockKonfluxLogger: jest.Mocked<KonfluxLogger>;
  let mockKubeConfig: jest.Mocked<KubeConfig>;
  let mockCustomObjectsApi: jest.Mocked<CustomObjectsApi>;
  let service: KubearchiveService;

  const createMockKonfluxConfig = (
    overrides?: Partial<KonfluxConfig>,
  ): KonfluxConfig => ({
    clusters: {
      cluster1: {
        apiUrl: 'https://api.cluster1.com',
        serviceAccountToken: 'service-token-123',
        kubearchiveApiUrl: 'https://kubearchive.cluster1.com',
      },
    },
    subcomponentConfigs: [],
    authProvider: 'serviceAccount',
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

  const expectHeaderMiddleware = (
    requestOptions: any,
    expectedHeaders: Record<string, string>,
  ) => {
    expect(requestOptions).toEqual(
      expect.objectContaining({
        middlewareMergeStrategy: 'append',
        middleware: [expect.any(Object)],
      }),
    );

    const context = { setHeaderParam: jest.fn() };
    requestOptions.middleware[0].pre(context);

    Object.entries(expectedHeaders).forEach(([key, value]) => {
      expect(context.setHeaderParam).toHaveBeenCalledWith(key, value);
    });
  };

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

    mockCustomObjectsApi = {
      listNamespacedCustomObjectWithHttpInfo: jest.fn(),
    } as unknown as jest.Mocked<CustomObjectsApi>;

    mockKubeConfig = {
      makeApiClient: jest.fn().mockReturnValue(mockCustomObjectsApi),
      loadFromOptions: jest.fn(),
    } as unknown as jest.Mocked<KubeConfig>;

    (
      KonfluxLogger as jest.MockedClass<typeof KonfluxLogger>
    ).mockImplementation(() => mockKonfluxLogger);

    (
      createKubeConfig as jest.MockedFunction<typeof createKubeConfig>
    ).mockResolvedValue(mockKubeConfig);

    class MockObservable<T> {
      constructor(public value: T) {
        return value as any;
      }
    }

    (
      getKubeClient as jest.MockedFunction<typeof getKubeClient>
    ).mockResolvedValue({
      CustomObjectsApi: jest.fn(),
      Observable: MockObservable,
    } as any);

    service = new KubearchiveService(mockLogger);
  });

  describe('constructor', () => {
    it('should initialize with logger', () => {
      const newService = new KubearchiveService(mockLogger);
      expect(newService).toBeInstanceOf(KubearchiveService);
      expect(KonfluxLogger).toHaveBeenCalledWith(mockLogger);
    });
  });

  describe('fetchResources', () => {
    const cluster = 'cluster1';
    const apiGroup = 'appstudio.redhat.com';
    const apiVersion = 'v1alpha1';
    const resource = 'pipelineruns';
    const namespace = 'namespace1';
    const userEmail = 'user@example.com';

    it('should fetch resources successfully with serviceAccount auth', async () => {
      const konfluxConfig = createMockKonfluxConfig();
      const mockItems = [
        createMockResource('plr1'),
        createMockResource('plr2'),
      ];

      mockCustomObjectsApi.listNamespacedCustomObjectWithHttpInfo.mockResolvedValue(
        {
          data: {
            items: mockItems,
            metadata: {},
          },
        } as any,
      );

      const result = await service.fetchResources({
        konfluxConfig,
        userEmail,
        cluster,
        apiGroup,
        apiVersion,
        resource,
        namespace,
      });

      expect(result.results).toEqual(mockItems);
      expect(result.nextPageToken).toBeUndefined();
      expect(
        mockCustomObjectsApi.listNamespacedCustomObjectWithHttpInfo,
      ).toHaveBeenCalledWith(
        {
          group: apiGroup,
          version: apiVersion,
          namespace,
          plural: resource,
          _continue: undefined,
          labelSelector: undefined,
          limit: undefined,
        },
        expect.any(Object),
      );
      const requestOptions =
        mockCustomObjectsApi.listNamespacedCustomObjectWithHttpInfo.mock
          .calls[0][1];
      expectHeaderMiddleware(requestOptions, {
        Authorization: 'Bearer service-token-123',
      });
      expect(mockKonfluxLogger.debug).toHaveBeenCalledWith(
        'Fetched items from Kubearchive',
        expect.objectContaining({
          cluster,
          namespace,
          resource,
          itemCount: 2,
          hasNextPageToken: false,
        }),
      );
    });

    it('should fetch resources with pagination', async () => {
      const konfluxConfig = createMockKonfluxConfig();
      const mockItems = [createMockResource('plr1')];
      const pageToken = 'next-page-token';

      mockCustomObjectsApi.listNamespacedCustomObjectWithHttpInfo.mockResolvedValue(
        {
          data: {
            items: mockItems,
            metadata: {
              continue: pageToken,
            },
          },
        } as any,
      );

      const result = await service.fetchResources({
        konfluxConfig,
        userEmail,
        cluster,
        apiGroup,
        apiVersion,
        resource,
        namespace,
        options: {
          pageSize: 25,
          pageToken: 'current-page-token',
        },
      });

      expect(result.results).toEqual(mockItems);
      expect(result.nextPageToken).toBe(pageToken);
      expect(
        mockCustomObjectsApi.listNamespacedCustomObjectWithHttpInfo,
      ).toHaveBeenCalledWith(
        {
          group: apiGroup,
          version: apiVersion,
          namespace,
          plural: resource,
          _continue: 'current-page-token',
          labelSelector: undefined,
          limit: 25,
        },
        expect.any(Object),
      );
      const requestOptions =
        mockCustomObjectsApi.listNamespacedCustomObjectWithHttpInfo.mock
          .calls[0][1];
      expectHeaderMiddleware(requestOptions, {
        Authorization: 'Bearer service-token-123',
      });
    });

    it('should fetch resources with labelSelector', async () => {
      const konfluxConfig = createMockKonfluxConfig();
      const mockItems = [createMockResource('plr1')];
      const labelSelector = 'app=my-app';

      mockCustomObjectsApi.listNamespacedCustomObjectWithHttpInfo.mockResolvedValue(
        {
          data: {
            items: mockItems,
            metadata: {},
          },
        } as any,
      );

      const result = await service.fetchResources({
        konfluxConfig,
        userEmail,
        cluster,
        apiGroup,
        apiVersion,
        resource,
        namespace,
        options: {
          labelSelector,
        },
      });

      expect(result.results).toEqual(mockItems);
      expect(
        mockCustomObjectsApi.listNamespacedCustomObjectWithHttpInfo,
      ).toHaveBeenCalledWith(
        {
          group: apiGroup,
          version: apiVersion,
          namespace,
          plural: resource,
          _continue: undefined,
          labelSelector,
          limit: undefined,
        },
        expect.any(Object),
      );
      const requestOptions =
        mockCustomObjectsApi.listNamespacedCustomObjectWithHttpInfo.mock
          .calls[0][1];
      expectHeaderMiddleware(requestOptions, {
        Authorization: 'Bearer service-token-123',
      });
    });

    it('should use OIDC token when authProvider is oidc', async () => {
      const konfluxConfig = createMockKonfluxConfig({
        authProvider: 'oidc',
      });
      const oidcToken = 'oidc-token-123';
      const mockItems = [createMockResource('plr1')];

      mockCustomObjectsApi.listNamespacedCustomObjectWithHttpInfo.mockResolvedValue(
        {
          data: {
            items: mockItems,
            metadata: {},
          },
        } as any,
      );

      const result = await service.fetchResources({
        konfluxConfig,
        userEmail,
        cluster,
        apiGroup,
        apiVersion,
        resource,
        namespace,
        options: {},
        oidcToken,
      });

      expect(result.results).toEqual(mockItems);
      expect(
        mockCustomObjectsApi.listNamespacedCustomObjectWithHttpInfo,
      ).toHaveBeenCalledWith(
        {
          group: apiGroup,
          version: apiVersion,
          namespace,
          plural: resource,
          _continue: undefined,
          labelSelector: undefined,
          limit: undefined,
        },
        expect.any(Object),
      );
      const requestOptions =
        mockCustomObjectsApi.listNamespacedCustomObjectWithHttpInfo.mock
          .calls[0][1];
      expectHeaderMiddleware(requestOptions, {
        Authorization: `Bearer ${oidcToken}`,
      });
      expect(mockKonfluxLogger.debug).toHaveBeenCalledWith(
        'Using OIDC token for authentication',
        expect.objectContaining({
          cluster,
          namespace,
        }),
      );
    });

    it('should throw error when OIDC authProvider is configured but no token provided', async () => {
      const konfluxConfig = createMockKonfluxConfig({
        authProvider: 'oidc',
      });

      await expect(
        service.fetchResources({
          konfluxConfig,
          userEmail,
          cluster,
          apiGroup,
          apiVersion,
          resource,
          namespace,
        }),
      ).rejects.toThrow(
        `OIDC authProvider configured for cluster ${cluster} but no token available`,
      );

      expect(mockKonfluxLogger.error).toHaveBeenCalledWith(
        'OIDC authProvider configured but no token available',
        undefined,
        expect.objectContaining({
          cluster,
          namespace,
          resource,
        }),
      );
    });

    it('should use impersonation headers when authProvider is impersonationHeaders', async () => {
      const konfluxConfig = createMockKonfluxConfig({
        authProvider: 'impersonationHeaders',
      });
      const mockItems = [createMockResource('plr1')];

      mockCustomObjectsApi.listNamespacedCustomObjectWithHttpInfo.mockResolvedValue(
        {
          data: {
            items: mockItems,
            metadata: {},
          },
        } as any,
      );

      const result = await service.fetchResources({
        konfluxConfig,
        userEmail,
        cluster,
        apiGroup,
        apiVersion,
        resource,
        namespace,
      });

      expect(result.results).toEqual(mockItems);
      expect(
        mockCustomObjectsApi.listNamespacedCustomObjectWithHttpInfo,
      ).toHaveBeenCalledWith(
        {
          group: apiGroup,
          version: apiVersion,
          namespace,
          plural: resource,
          _continue: undefined,
          labelSelector: undefined,
          limit: undefined,
        },
        expect.any(Object),
      );
      const requestOptions =
        mockCustomObjectsApi.listNamespacedCustomObjectWithHttpInfo.mock
          .calls[0][1];
      expectHeaderMiddleware(requestOptions, {
        'Impersonate-User': userEmail,
        'Impersonate-Group': 'system:authenticated',
        Authorization: 'Bearer service-token-123',
      });
    });

    it('should throw error when impersonationHeaders is configured but userEmail is missing', async () => {
      const konfluxConfig = createMockKonfluxConfig({
        authProvider: 'impersonationHeaders',
      });

      await expect(
        service.fetchResources({
          konfluxConfig,
          userEmail: '',
          cluster,
          apiGroup,
          apiVersion,
          resource,
          namespace,
        }),
      ).rejects.toThrow(
        `User email is required for impersonation but was not provided for cluster ${cluster}`,
      );

      expect(mockKonfluxLogger.error).toHaveBeenCalledWith(
        'Impersonation headers required but user email is missing',
        undefined,
        expect.objectContaining({
          cluster,
          namespace,
          resource,
          authProvider: 'impersonationHeaders',
        }),
      );
    });

    it('should throw error when impersonationHeaders is configured but userEmail is whitespace only', async () => {
      const konfluxConfig = createMockKonfluxConfig({
        authProvider: 'impersonationHeaders',
      });

      await expect(
        service.fetchResources({
          konfluxConfig,
          userEmail: '   ',
          cluster,
          apiGroup,
          apiVersion,
          resource,
          namespace,
        }),
      ).rejects.toThrow(
        `User email is required for impersonation but was not provided for cluster ${cluster}`,
      );
    });

    it('should throw error when no token is available', async () => {
      const konfluxConfig = createMockKonfluxConfig({
        clusters: {
          cluster1: {
            apiUrl: 'https://api.cluster1.com',
            kubearchiveApiUrl: 'https://kubearchive.cluster1.com',
            // no serviceAccountToken
          },
        },
        authProvider: 'serviceAccount',
      });

      await expect(
        service.fetchResources({
          konfluxConfig,
          userEmail,
          cluster,
          apiGroup,
          apiVersion,
          resource,
          namespace,
        }),
      ).rejects.toThrow(
        `No authentication token available for cluster ${cluster}`,
      );

      expect(mockKonfluxLogger.error).toHaveBeenCalledWith(
        'No authentication token available',
        undefined,
        expect.objectContaining({
          cluster,
          namespace,
          resource,
          authProvider: 'serviceAccount',
        }),
      );
    });

    it('should throw error when cluster config is missing', async () => {
      const konfluxConfig = createMockKonfluxConfig({
        clusters: {},
        authProvider: 'oidc',
      });

      (
        createKubeConfig as jest.MockedFunction<typeof createKubeConfig>
      ).mockResolvedValue(null);

      // provide OIDC token so it passes token check and reaches createKubeConfig
      await expect(
        service.fetchResources({
          konfluxConfig,
          userEmail,
          cluster,
          apiGroup,
          apiVersion,
          resource,
          namespace,
          options: {},
          oidcToken: 'oidc-token-123',
        }),
      ).rejects.toThrow(`Cluster '${cluster}' not found`);

      expect(mockKonfluxLogger.error).toHaveBeenCalledWith(
        'Failed to create KubeConfig - cluster not found',
        undefined,
        expect.objectContaining({
          cluster,
          namespace,
          resource,
        }),
      );
    });

    it('should throw error when kubearchiveApiUrl is missing', async () => {
      const konfluxConfig = createMockKonfluxConfig({
        clusters: {
          cluster1: {
            apiUrl: 'https://api.cluster1.com',
            serviceAccountToken: 'token-123',
            // no kubearchiveApiUrl
          },
        },
      });

      (
        createKubeConfig as jest.MockedFunction<typeof createKubeConfig>
      ).mockResolvedValue(null);

      await expect(
        service.fetchResources({
          konfluxConfig,
          userEmail,
          cluster,
          apiGroup,
          apiVersion,
          resource,
          namespace,
        }),
      ).rejects.toThrow(`Cluster '${cluster}' not found`);

      expect(mockKonfluxLogger.error).toHaveBeenCalledWith(
        'Failed to create KubeConfig - cluster not found',
        undefined,
        expect.objectContaining({
          cluster,
          namespace,
          resource,
        }),
      );
    });

    it('should handle API errors and rethrow them', async () => {
      const konfluxConfig = createMockKonfluxConfig();
      const apiError = new Error('API request failed');

      mockCustomObjectsApi.listNamespacedCustomObjectWithHttpInfo.mockRejectedValue(
        apiError,
      );

      await expect(
        service.fetchResources({
          konfluxConfig,
          userEmail,
          cluster,
          apiGroup,
          apiVersion,
          resource,
          namespace,
        }),
      ).rejects.toThrow('API request failed');

      expect(mockKonfluxLogger.error).toHaveBeenCalledWith(
        'Error fetching from Kubearchive',
        apiError,
        expect.objectContaining({
          cluster,
          namespace,
          resource,
          apiGroup,
          apiVersion,
        }),
      );
    });

    it('should return empty results when response has no items', async () => {
      const konfluxConfig = createMockKonfluxConfig();

      mockCustomObjectsApi.listNamespacedCustomObjectWithHttpInfo.mockResolvedValue(
        {
          data: {
            items: [],
            metadata: {},
          },
        } as any,
      );

      const result = await service.fetchResources({
        konfluxConfig,
        userEmail,
        cluster,
        apiGroup,
        apiVersion,
        resource,
        namespace,
      });

      expect(result.results).toEqual([]);
      expect(result.nextPageToken).toBeUndefined();
      expect(mockKonfluxLogger.debug).toHaveBeenCalledWith(
        'Fetched items from Kubearchive',
        expect.objectContaining({
          itemCount: 0,
          hasNextPageToken: false,
        }),
      );
    });

    it('should handle response with undefined body gracefully', async () => {
      const konfluxConfig = createMockKonfluxConfig();

      mockCustomObjectsApi.listNamespacedCustomObjectWithHttpInfo.mockResolvedValue(
        {
          data: undefined,
        } as any,
      );

      const result = await service.fetchResources({
        konfluxConfig,
        userEmail,
        cluster,
        apiGroup,
        apiVersion,
        resource,
        namespace,
      });

      expect(result.results).toEqual([]);
      expect(result.nextPageToken).toBeUndefined();
    });

    it('should combine pagination and labelSelector options', async () => {
      const konfluxConfig = createMockKonfluxConfig();
      const mockItems = [createMockResource('plr1')];
      const labelSelector = 'app=my-app';
      const pageSize = 50;
      const pageToken = 'token-123';

      mockCustomObjectsApi.listNamespacedCustomObjectWithHttpInfo.mockResolvedValue(
        {
          data: {
            items: mockItems,
            metadata: {},
          },
        } as any,
      );

      await service.fetchResources({
        konfluxConfig,
        userEmail,
        cluster,
        apiGroup,
        apiVersion,
        resource,
        namespace,
        options: {
          pageSize,
          pageToken,
          labelSelector,
        },
      });

      expect(
        mockCustomObjectsApi.listNamespacedCustomObjectWithHttpInfo,
      ).toHaveBeenCalledWith(
        {
          group: apiGroup,
          version: apiVersion,
          namespace,
          plural: resource,
          _continue: pageToken,
          labelSelector,
          limit: pageSize,
        },
        expect.any(Object),
      );
      const requestOptions =
        mockCustomObjectsApi.listNamespacedCustomObjectWithHttpInfo.mock
          .calls[0][1];
      expectHeaderMiddleware(requestOptions, {
        Authorization: 'Bearer service-token-123',
      });
    });

    it('should use provided token parameter when creating KubeConfig', async () => {
      const konfluxConfig = createMockKonfluxConfig({
        authProvider: 'oidc',
      });
      const oidcToken = 'custom-oidc-token';
      const mockItems = [createMockResource('plr1')];

      mockCustomObjectsApi.listNamespacedCustomObjectWithHttpInfo.mockResolvedValue(
        {
          data: {
            items: mockItems,
            metadata: {},
          },
        } as any,
      );

      await service.fetchResources({
        konfluxConfig,
        userEmail,
        cluster,
        apiGroup,
        apiVersion,
        resource,
        namespace,
        options: {},
        oidcToken,
      });

      // verify that the custom token is used in the Authorization header
      expect(
        mockCustomObjectsApi.listNamespacedCustomObjectWithHttpInfo,
      ).toHaveBeenCalledWith(
        {
          group: apiGroup,
          version: apiVersion,
          namespace,
          plural: resource,
          _continue: undefined,
          labelSelector: undefined,
          limit: undefined,
        },
        expect.any(Object),
      );
      const requestOptions =
        mockCustomObjectsApi.listNamespacedCustomObjectWithHttpInfo.mock
          .calls[0][1];
      expectHeaderMiddleware(requestOptions, {
        Authorization: `Bearer ${oidcToken}`,
      });
    });
  });
});
