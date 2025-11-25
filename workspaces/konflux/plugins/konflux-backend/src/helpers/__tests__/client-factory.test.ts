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

import { createKubeConfig } from '../client-factory';
import { KonfluxConfig } from '@red-hat-developer-hub/backstage-plugin-konflux-common';
import { KubeConfig } from '@kubernetes/client-node';
import { KonfluxLogger } from '../logger';

jest.mock('@kubernetes/client-node', () => {
  const mockLoadFromOptions = jest.fn();
  const mockKubeConfig = jest.fn().mockImplementation(() => ({
    loadFromOptions: mockLoadFromOptions,
  }));

  return {
    KubeConfig: mockKubeConfig,
  };
});

describe('client-factory', () => {
  let mockLogger: KonfluxLogger;
  let mockError: jest.SpyInstance;

  beforeEach(() => {
    mockLogger = {
      error: jest.fn(),
      warn: jest.fn(),
      info: jest.fn(),
      debug: jest.fn(),
    } as unknown as KonfluxLogger;
    mockError = jest.spyOn(mockLogger, 'error');
    jest.clearAllMocks();
  });

  const createMockKonfluxConfig = (
    overrides?: Partial<KonfluxConfig>,
  ): KonfluxConfig => ({
    clusters: {
      cluster1: {
        apiUrl: 'https://api.cluster1.example.com',
        serviceAccountToken: 'token123',
      },
      cluster2: {
        apiUrl: 'https://api.cluster2.example.com',
        serviceAccountToken: 'token456',
      },
    },
    subcomponentConfigs: [],
    authProvider: 'serviceAccount',
    ...overrides,
  });

  describe('createKubeConfig', () => {
    it('should return null when konfluxConfig is undefined', () => {
      const result = createKubeConfig(undefined, 'cluster1', mockLogger);
      expect(result).toBeNull();
      expect(mockError).not.toHaveBeenCalled();
    });

    it('should return null when cluster config is not found', () => {
      const config = createMockKonfluxConfig();
      const result = createKubeConfig(
        config,
        'nonexistent-cluster',
        mockLogger,
      );
      expect(result).toBeNull();
      expect(mockError).toHaveBeenCalledWith(
        'Error creating Kube Config',
        expect.any(Error),
        { cluster: 'nonexistent-cluster' },
      );
    });

    it('should return null when apiUrl is missing', () => {
      const config = createMockKonfluxConfig({
        clusters: {
          cluster1: {
            serviceAccountToken: 'token123',
          },
        },
      });
      const result = createKubeConfig(config, 'cluster1', mockLogger);
      expect(result).toBeNull();
      expect(mockError).toHaveBeenCalledWith(
        'Error creating Kube Config',
        expect.any(Error),
        { cluster: 'cluster1' },
      );
    });

    it('should create KubeConfig with serviceAccountToken when token is not provided', () => {
      const config = createMockKonfluxConfig();
      const MockedKubeConfig = KubeConfig as jest.MockedClass<
        typeof KubeConfig
      >;
      const mockLoadFromOptions = jest.fn();
      MockedKubeConfig.mockImplementation(
        () =>
          ({
            loadFromOptions: mockLoadFromOptions,
          } as any),
      );

      const result = createKubeConfig(config, 'cluster1', mockLogger);

      expect(result).not.toBeNull();
      expect(MockedKubeConfig).toHaveBeenCalled();
      expect(mockLoadFromOptions).toHaveBeenCalledWith({
        clusters: [
          {
            server: 'https://api.cluster1.example.com',
            name: 'cluster1',
          },
        ],
        users: [
          {
            name: 'backstage',
            token: 'token123',
          },
        ],
        contexts: [
          {
            name: 'cluster1',
            user: 'backstage',
            cluster: 'cluster1',
          },
        ],
        currentContext: 'cluster1',
      });
      expect(mockError).not.toHaveBeenCalled();
    });

    it('should create KubeConfig with provided token when token is provided', () => {
      const config = createMockKonfluxConfig();
      const MockedKubeConfig = KubeConfig as jest.MockedClass<
        typeof KubeConfig
      >;
      const mockLoadFromOptions = jest.fn();
      MockedKubeConfig.mockImplementation(
        () =>
          ({
            loadFromOptions: mockLoadFromOptions,
          } as any),
      );

      const result = createKubeConfig(
        config,
        'cluster1',
        mockLogger,
        'custom-token',
      );

      expect(result).not.toBeNull();
      expect(mockLoadFromOptions).toHaveBeenCalledWith({
        clusters: [
          {
            server: 'https://api.cluster1.example.com',
            name: 'cluster1',
          },
        ],
        users: [
          {
            name: 'backstage',
            token: 'custom-token',
          },
        ],
        contexts: [
          {
            name: 'cluster1',
            user: 'backstage',
            cluster: 'cluster1',
          },
        ],
        currentContext: 'cluster1',
      });
    });

    it('should use serviceAccountToken when token is undefined', () => {
      const config = createMockKonfluxConfig();
      const MockedKubeConfig = KubeConfig as jest.MockedClass<
        typeof KubeConfig
      >;
      const mockLoadFromOptions = jest.fn();
      MockedKubeConfig.mockImplementation(
        () =>
          ({
            loadFromOptions: mockLoadFromOptions,
          } as any),
      );

      createKubeConfig(config, 'cluster1', mockLogger);

      expect(mockLoadFromOptions).toHaveBeenCalledWith(
        expect.objectContaining({
          users: [
            {
              name: 'backstage',
              token: 'token123',
            },
          ],
        }),
      );
    });

    it('should handle different cluster names', () => {
      const config = createMockKonfluxConfig();
      const MockedKubeConfig = KubeConfig as jest.MockedClass<
        typeof KubeConfig
      >;
      const mockLoadFromOptions = jest.fn();
      MockedKubeConfig.mockImplementation(
        () =>
          ({
            loadFromOptions: mockLoadFromOptions,
          } as any),
      );

      const result = createKubeConfig(config, 'cluster2', mockLogger);

      expect(result).not.toBeNull();
      expect(mockLoadFromOptions).toHaveBeenCalledWith({
        clusters: [
          {
            server: 'https://api.cluster2.example.com',
            name: 'cluster2',
          },
        ],
        users: [
          {
            name: 'backstage',
            token: 'token456',
          },
        ],
        contexts: [
          {
            name: 'cluster2',
            user: 'backstage',
            cluster: 'cluster2',
          },
        ],
        currentContext: 'cluster2',
      });
    });

    it('should handle empty serviceAccountToken', () => {
      const config = createMockKonfluxConfig({
        clusters: {
          cluster1: {
            apiUrl: 'https://api.cluster1.example.com',
            serviceAccountToken: '',
          },
        },
      });
      const MockedKubeConfig = KubeConfig as jest.MockedClass<
        typeof KubeConfig
      >;
      const mockLoadFromOptions = jest.fn();
      MockedKubeConfig.mockImplementation(
        () =>
          ({
            loadFromOptions: mockLoadFromOptions,
          } as any),
      );

      const result = createKubeConfig(config, 'cluster1', mockLogger);

      expect(result).not.toBeNull();
      expect(mockLoadFromOptions).toHaveBeenCalledWith(
        expect.objectContaining({
          users: [
            {
              name: 'backstage',
              token: '',
            },
          ],
        }),
      );
    });

    it('should handle undefined serviceAccountToken', () => {
      const config = createMockKonfluxConfig({
        clusters: {
          cluster1: {
            apiUrl: 'https://api.cluster1.example.com',
          },
        },
      });
      const MockedKubeConfig = KubeConfig as jest.MockedClass<
        typeof KubeConfig
      >;
      const mockLoadFromOptions = jest.fn();
      MockedKubeConfig.mockImplementation(
        () =>
          ({
            loadFromOptions: mockLoadFromOptions,
          } as any),
      );

      const result = createKubeConfig(config, 'cluster1', mockLogger);

      expect(result).not.toBeNull();
      expect(mockLoadFromOptions).toHaveBeenCalledWith(
        expect.objectContaining({
          users: [
            {
              name: 'backstage',
              token: undefined,
            },
          ],
        }),
      );
    });

    it('should return null and log error when KubeConfig throws an error', () => {
      const config = createMockKonfluxConfig();
      const MockedKubeConfig = KubeConfig as jest.MockedClass<
        typeof KubeConfig
      >;
      const mockLoadFromOptions = jest.fn().mockImplementation(() => {
        throw new Error('KubeConfig initialization failed');
      });
      MockedKubeConfig.mockImplementation(
        () =>
          ({
            loadFromOptions: mockLoadFromOptions,
          } as any),
      );

      const result = createKubeConfig(config, 'cluster1', mockLogger);

      expect(result).toBeNull();
      expect(mockError).toHaveBeenCalledWith(
        'Error creating Kube Config',
        expect.any(Error),
        { cluster: 'cluster1' },
      );
    });

    it('should return null and log error when loadFromOptions throws an error', () => {
      const config = createMockKonfluxConfig();
      const MockedKubeConfig = KubeConfig as jest.MockedClass<
        typeof KubeConfig
      >;
      MockedKubeConfig.mockImplementation(() => {
        throw new Error('Failed to create KubeConfig');
      });

      const result = createKubeConfig(config, 'cluster1', mockLogger);

      expect(result).toBeNull();
      expect(mockError).toHaveBeenCalledWith(
        'Error creating Kube Config',
        expect.any(Error),
        { cluster: 'cluster1' },
      );
    });
  });
});
