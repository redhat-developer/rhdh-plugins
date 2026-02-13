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
import { KonfluxLogger } from '../logger';
import type { KubeConfig } from '@kubernetes/client-node';
import { getKubeClient } from '../kube-client';

jest.mock('../kube-client');

describe('client-factory', () => {
  let mockLogger: KonfluxLogger;
  let mockError: jest.SpyInstance;
  let mockKubeConfigClass: jest.MockedClass<typeof KubeConfig>;

  beforeEach(() => {
    mockLogger = {
      error: jest.fn(),
      warn: jest.fn(),
      info: jest.fn(),
      debug: jest.fn(),
    } as unknown as KonfluxLogger;
    mockError = jest.spyOn(mockLogger, 'error');
    jest.clearAllMocks();

    mockKubeConfigClass = jest.fn() as unknown as jest.MockedClass<
      typeof KubeConfig
    >;
    (
      getKubeClient as jest.MockedFunction<typeof getKubeClient>
    ).mockResolvedValue({
      KubeConfig: mockKubeConfigClass,
    } as any);
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
    it('should return null when konfluxConfig is undefined', async () => {
      const result = await createKubeConfig(undefined, 'cluster1', mockLogger);
      expect(result).toBeNull();
      expect(mockError).not.toHaveBeenCalled();
    });

    it('should return null when cluster config is not found', async () => {
      const config = createMockKonfluxConfig();
      const result = await createKubeConfig(
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

    it('should return null when apiUrl is missing', async () => {
      const config = createMockKonfluxConfig({
        clusters: {
          cluster1: {
            serviceAccountToken: 'token123',
          },
        },
      });
      const result = await createKubeConfig(config, 'cluster1', mockLogger);
      expect(result).toBeNull();
      expect(mockError).toHaveBeenCalledWith(
        'Error creating Kube Config',
        expect.any(Error),
        { cluster: 'cluster1' },
      );
    });

    it('should create KubeConfig with serviceAccountToken when token is not provided', async () => {
      const config = createMockKonfluxConfig();
      const MockedKubeConfig = mockKubeConfigClass;
      const mockLoadFromOptions = jest.fn();
      MockedKubeConfig.mockImplementation(
        () =>
          ({
            loadFromOptions: mockLoadFromOptions,
          } as any),
      );

      const result = await createKubeConfig(config, 'cluster1', mockLogger);

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

    it('should create KubeConfig with provided token when token is provided', async () => {
      const config = createMockKonfluxConfig();
      const MockedKubeConfig = mockKubeConfigClass;
      const mockLoadFromOptions = jest.fn();
      MockedKubeConfig.mockImplementation(
        () =>
          ({
            loadFromOptions: mockLoadFromOptions,
          } as any),
      );

      const result = await createKubeConfig(
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

    it('should use serviceAccountToken when token is undefined', async () => {
      const config = createMockKonfluxConfig();
      const MockedKubeConfig = mockKubeConfigClass;
      const mockLoadFromOptions = jest.fn();
      MockedKubeConfig.mockImplementation(
        () =>
          ({
            loadFromOptions: mockLoadFromOptions,
          } as any),
      );

      await createKubeConfig(config, 'cluster1', mockLogger);

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

    it('should handle different cluster names', async () => {
      const config = createMockKonfluxConfig();
      const MockedKubeConfig = mockKubeConfigClass;
      const mockLoadFromOptions = jest.fn();
      MockedKubeConfig.mockImplementation(
        () =>
          ({
            loadFromOptions: mockLoadFromOptions,
          } as any),
      );

      const result = await createKubeConfig(config, 'cluster2', mockLogger);

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

    it('should handle empty serviceAccountToken', async () => {
      const config = createMockKonfluxConfig({
        clusters: {
          cluster1: {
            apiUrl: 'https://api.cluster1.example.com',
            serviceAccountToken: '',
          },
        },
      });
      const MockedKubeConfig = mockKubeConfigClass;
      const mockLoadFromOptions = jest.fn();
      MockedKubeConfig.mockImplementation(
        () =>
          ({
            loadFromOptions: mockLoadFromOptions,
          } as any),
      );

      const result = await createKubeConfig(config, 'cluster1', mockLogger);

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

    it('should handle undefined serviceAccountToken', async () => {
      const config = createMockKonfluxConfig({
        clusters: {
          cluster1: {
            apiUrl: 'https://api.cluster1.example.com',
          },
        },
      });
      const MockedKubeConfig = mockKubeConfigClass;
      const mockLoadFromOptions = jest.fn();
      MockedKubeConfig.mockImplementation(
        () =>
          ({
            loadFromOptions: mockLoadFromOptions,
          } as any),
      );

      const result = await createKubeConfig(config, 'cluster1', mockLogger);

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

    it('should return null and log error when KubeConfig throws an error', async () => {
      const config = createMockKonfluxConfig();
      const MockedKubeConfig = mockKubeConfigClass;
      const mockLoadFromOptions = jest.fn().mockImplementation(() => {
        throw new Error('KubeConfig initialization failed');
      });
      MockedKubeConfig.mockImplementation(
        () =>
          ({
            loadFromOptions: mockLoadFromOptions,
          } as any),
      );

      const result = await createKubeConfig(config, 'cluster1', mockLogger);

      expect(result).toBeNull();
      expect(mockError).toHaveBeenCalledWith(
        'Error creating Kube Config',
        expect.any(Error),
        { cluster: 'cluster1' },
      );
    });

    it('should return null and log error when loadFromOptions throws an error', async () => {
      const config = createMockKonfluxConfig();
      const MockedKubeConfig = mockKubeConfigClass;
      MockedKubeConfig.mockImplementation(() => {
        throw new Error('Failed to create KubeConfig');
      });

      const result = await createKubeConfig(config, 'cluster1', mockLogger);

      expect(result).toBeNull();
      expect(mockError).toHaveBeenCalledWith(
        'Error creating Kube Config',
        expect.any(Error),
        { cluster: 'cluster1' },
      );
    });
  });
});
