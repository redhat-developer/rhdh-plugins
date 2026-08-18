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

import { mockServices } from '@backstage/backend-test-utils';
import type { ReconcilerConfig } from './types';

/* eslint-disable no-var */
var mockLoadFromDefault: jest.Mock;
var mockLoadFromOptions: jest.Mock;
var mockGetCurrentUser: jest.Mock;
var mockGetUsers: jest.Mock;
var mockMakeApiClient: jest.Mock;
var mockInformerOn: jest.Mock;
var mockInformerStart: jest.Mock;
/* eslint-enable no-var */

jest.mock('@kubernetes/client-node', () => {
  const _loadFromDefault = jest.fn();
  const _loadFromOptions = jest.fn();
  const _getCurrentUser = jest.fn().mockReturnValue({ token: 'test-token' });
  const _getUsers = jest.fn().mockReturnValue([]);
  const _makeApiClient = jest.fn().mockReturnValue({
    listNamespacedCustomObject: jest
      .fn()
      .mockResolvedValue({ body: { items: [] } }),
    listClusterCustomObject: jest
      .fn()
      .mockResolvedValue({ body: { items: [] } }),
    listNamespacedServiceAccount: jest
      .fn()
      .mockResolvedValue({ body: { items: [] } }),
  });
  const _informerOn = jest.fn();
  const _informerStart = jest.fn().mockResolvedValue(undefined);

  mockLoadFromDefault = _loadFromDefault;
  mockLoadFromOptions = _loadFromOptions;
  mockGetCurrentUser = _getCurrentUser;
  mockGetUsers = _getUsers;
  mockMakeApiClient = _makeApiClient;
  mockInformerOn = _informerOn;
  mockInformerStart = _informerStart;

  return {
    KubeConfig: jest.fn().mockImplementation(() => ({
      loadFromDefault: _loadFromDefault,
      loadFromOptions: _loadFromOptions,
      makeApiClient: _makeApiClient,
      getCurrentUser: _getCurrentUser,
      getUsers: _getUsers,
    })),
    makeInformer: jest.fn().mockReturnValue({
      on: _informerOn,
      start: _informerStart,
      list: jest.fn().mockReturnValue([]),
    }),
    CustomObjectsApi: jest.fn(),
    CoreV1Api: jest.fn(),
  };
});

jest.mock('./Catalog', () => ({
  setupCatalogRoute: jest.fn().mockResolvedValue(undefined),
  createCatalogClient: jest.fn().mockReturnValue(undefined),
  CATALOG_MODEL_ANNOTATION: 'rhdh.io/catalog-model',
  CATALOG_SOURCE_ANNOTATION: 'rhdh.io/catalog-source',
}));

import {
  setupInformer,
  getDiscoveryUris,
  getModelCatalog,
  getModelCard,
} from './InformerService';

describe('InformerService', () => {
  const logger = mockServices.logger.mock();

  beforeEach(() => {
    jest.useFakeTimers();
    jest.clearAllMocks();
    mockGetCurrentUser.mockReturnValue({ token: 'test-token' });
    mockGetUsers.mockReturnValue([]);
    mockMakeApiClient.mockReturnValue({
      listNamespacedCustomObject: jest
        .fn()
        .mockResolvedValue({ body: { items: [] } }),
      listClusterCustomObject: jest
        .fn()
        .mockResolvedValue({ body: { items: [] } }),
      listNamespacedServiceAccount: jest
        .fn()
        .mockResolvedValue({ body: { items: [] } }),
    });
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  describe('getDiscoveryUris', () => {
    it('should return empty uris when no models are registered', () => {
      const result = getDiscoveryUris();
      expect(result).toEqual({ uris: [] });
    });
  });

  describe('getModelCatalog', () => {
    it('should return undefined for unknown key', () => {
      expect(getModelCatalog('nonexistent/key')).toBeUndefined();
    });
  });

  describe('getModelCard', () => {
    it('should return undefined for unknown key', () => {
      expect(getModelCard('nonexistent/key')).toBeUndefined();
    });
  });

  describe('setupInformer', () => {
    it('should use loadFromOptions when url and serviceAccountToken are provided', async () => {
      const config: ReconcilerConfig = {
        url: 'https://k8s.example.com',
        serviceAccountToken: 'sa-token-123',
        clusterName: 'test-cluster',
      };

      await setupInformer(config, logger);

      expect(mockLoadFromOptions).toHaveBeenCalledWith(
        expect.objectContaining({
          clusters: [
            expect.objectContaining({
              name: 'test-cluster',
              server: 'https://k8s.example.com',
              skipTLSVerify: false,
            }),
          ],
          users: [
            expect.objectContaining({
              name: 'backstage-sa',
              token: 'sa-token-123',
            }),
          ],
          currentContext: 'test-cluster',
        }),
      );
      expect(mockLoadFromDefault).not.toHaveBeenCalled();
    });

    it('should use loadFromDefault when no url or token is provided', async () => {
      const config: ReconcilerConfig = {};

      await setupInformer(config, logger);

      expect(mockLoadFromDefault).toHaveBeenCalled();
      expect(mockLoadFromOptions).not.toHaveBeenCalled();
    });

    it('should warn and fall back to loadFromDefault with partial config', async () => {
      const config: ReconcilerConfig = {
        url: 'https://k8s.example.com',
      };

      await setupInformer(config, logger);

      expect(mockLoadFromDefault).toHaveBeenCalled();
      expect(mockLoadFromOptions).not.toHaveBeenCalled();
    });

    it('should use default cluster name when not specified', async () => {
      const config: ReconcilerConfig = {
        url: 'https://k8s.example.com',
        serviceAccountToken: 'sa-token-123',
      };

      await setupInformer(config, logger);

      expect(mockLoadFromOptions).toHaveBeenCalledWith(
        expect.objectContaining({
          clusters: [
            expect.objectContaining({
              name: 'target-cluster',
            }),
          ],
          currentContext: 'target-cluster',
        }),
      );
    });

    it('should register add, update, delete, and error handlers on the informer', async () => {
      const config: ReconcilerConfig = {};

      await setupInformer(config, logger);

      const registeredEvents = mockInformerOn.mock.calls.map(
        (call: any[]) => call[0],
      );
      expect(registeredEvents).toContain('add');
      expect(registeredEvents).toContain('update');
      expect(registeredEvents).toContain('delete');
      expect(registeredEvents).toContain('error');
    });

    it('should start the informer', async () => {
      const config: ReconcilerConfig = {};

      await setupInformer(config, logger);

      expect(mockInformerStart).toHaveBeenCalled();
    });

    it('should set config.logger', async () => {
      const config: ReconcilerConfig = {};

      await setupInformer(config, logger);

      expect(config.logger).toBe(logger);
    });

    it('should set default lifecycle and owner from env or defaults', async () => {
      const config: ReconcilerConfig = {};

      await setupInformer(config, logger);

      expect(config.defaultLifecycle).toBe('production');
      expect(config.defaultOwner).toBe('default-owner');
    });

    it('should preserve explicitly set lifecycle and owner', async () => {
      const config: ReconcilerConfig = {
        defaultLifecycle: 'staging',
        defaultOwner: 'team-alpha',
      };

      await setupInformer(config, logger);

      expect(config.defaultLifecycle).toBe('staging');
      expect(config.defaultOwner).toBe('team-alpha');
    });

    it('should pass caData and skipTLSVerify to loadFromOptions', async () => {
      const config: ReconcilerConfig = {
        url: 'https://k8s.example.com',
        serviceAccountToken: 'sa-token',
        skipTLSVerify: true,
        caData: 'base64-ca-data',
      };

      await setupInformer(config, logger);

      expect(mockLoadFromOptions).toHaveBeenCalledWith(
        expect.objectContaining({
          clusters: [
            expect.objectContaining({
              skipTLSVerify: true,
              caData: 'base64-ca-data',
            }),
          ],
        }),
      );
    });

    it('should use K8S_TOKEN env var when available in loadFromDefault path', async () => {
      process.env.K8S_TOKEN = 'env-token-override';
      try {
        const config: ReconcilerConfig = {};

        await setupInformer(config, logger);

        expect(config.serviceAccountToken).toBe('env-token-override');
      } finally {
        delete process.env.K8S_TOKEN;
      }
    });

    it('should use token from getCurrentUser in loadFromDefault path', async () => {
      mockGetCurrentUser.mockReturnValue({ token: 'kubeconfig-token' });
      const config: ReconcilerConfig = {};

      await setupInformer(config, logger);

      expect(config.serviceAccountToken).toBe('kubeconfig-token');
    });

    it('should fall back to first user token when getCurrentUser returns null', async () => {
      mockGetCurrentUser.mockReturnValue(null);
      mockGetUsers.mockReturnValue([
        { token: null },
        { token: 'fallback-user-token' },
      ]);
      const config: ReconcilerConfig = {};

      await setupInformer(config, logger);

      expect(config.serviceAccountToken).toBe('fallback-user-token');
    });

    it('should set routeClient and coreClient on config', async () => {
      const config: ReconcilerConfig = {};

      await setupInformer(config, logger);

      expect(config.routeClient).toBeDefined();
      expect(config.coreClient).toBeDefined();
    });

    it('should return the informer', async () => {
      const config: ReconcilerConfig = {};

      const result = await setupInformer(config, logger);

      expect(result).toBeDefined();
      expect(result.on).toBeDefined();
      expect(result.start).toBeDefined();
    });
  });
});
