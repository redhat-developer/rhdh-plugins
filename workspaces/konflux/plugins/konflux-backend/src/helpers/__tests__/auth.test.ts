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

import { getAuthToken } from '../auth';
import { KonfluxConfig } from '@red-hat-developer-hub/backstage-plugin-konflux-common';
import { KonfluxLogger } from '../logger';

describe('auth', () => {
  let mockKonfluxLogger: jest.Mocked<KonfluxLogger>;

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

  const defaultContext = {
    cluster: 'cluster1',
    namespace: 'namespace1',
    resource: 'pipelineruns',
  };

  const expectAuthTokenToThrow = (
    konfluxConfig: KonfluxConfig,
    clusterConfig: any,
    oidcToken: string | undefined,
    userEmail: string,
    expectedError: string,
  ) => {
    expect(() => {
      getAuthToken(
        konfluxConfig,
        clusterConfig,
        oidcToken,
        userEmail,
        mockKonfluxLogger,
        defaultContext,
      );
    }).toThrow(expectedError);
  };

  beforeEach(() => {
    jest.clearAllMocks();

    mockKonfluxLogger = {
      error: jest.fn(),
      warn: jest.fn(),
      info: jest.fn(),
      debug: jest.fn(),
    } as unknown as jest.Mocked<KonfluxLogger>;
  });

  describe('getAuthToken', () => {
    describe('OIDC authentication', () => {
      it('should return OIDC token when provided', () => {
        const konfluxConfig = createMockKonfluxConfig({
          authProvider: 'oidc',
        });
        const oidcToken = 'oidc-token-123';
        const clusterConfig = konfluxConfig.clusters.cluster1;

        const result = getAuthToken(
          konfluxConfig,
          clusterConfig,
          oidcToken,
          'user@example.com',
          mockKonfluxLogger,
          defaultContext,
        );

        expect(result.token).toBe(oidcToken);
        expect(result.requiresImpersonation).toBe(false);
        expect(mockKonfluxLogger.debug).toHaveBeenCalledWith(
          'Using OIDC token for authentication',
          {
            cluster: 'cluster1',
            namespace: 'namespace1',
          },
        );
      });

      it('should throw error when OIDC authProvider is configured but no token provided', () => {
        const konfluxConfig = createMockKonfluxConfig({
          authProvider: 'oidc',
        });
        const clusterConfig = konfluxConfig.clusters.cluster1;

        expectAuthTokenToThrow(
          konfluxConfig,
          clusterConfig,
          undefined,
          'user@example.com',
          'OIDC authProvider configured for cluster cluster1 but no token available',
        );

        expect(mockKonfluxLogger.error).toHaveBeenCalledWith(
          'OIDC authProvider configured but no token available',
          undefined,
          {
            cluster: 'cluster1',
            namespace: 'namespace1',
            resource: 'pipelineruns',
          },
        );
      });

      it('should ignore userEmail for OIDC authentication', () => {
        const konfluxConfig = createMockKonfluxConfig({
          authProvider: 'oidc',
        });
        const oidcToken = 'oidc-token-123';
        const clusterConfig = konfluxConfig.clusters.cluster1;

        const result = getAuthToken(
          konfluxConfig,
          clusterConfig,
          oidcToken,
          '',
          mockKonfluxLogger,
          defaultContext,
        );

        expect(result.token).toBe(oidcToken);
        expect(result.requiresImpersonation).toBe(false);
      });
    });

    describe('serviceAccount authentication', () => {
      it('should return serviceAccountToken when authProvider is serviceAccount', () => {
        const konfluxConfig = createMockKonfluxConfig({
          authProvider: 'serviceAccount',
        });
        const clusterConfig = konfluxConfig.clusters.cluster1;

        const result = getAuthToken(
          konfluxConfig,
          clusterConfig,
          undefined,
          'user@example.com',
          mockKonfluxLogger,
          defaultContext,
        );

        expect(result.token).toBe('service-token-123');
        expect(result.requiresImpersonation).toBe(false);
        expect(mockKonfluxLogger.debug).not.toHaveBeenCalled();
      });

      it('should throw error when serviceAccountToken is missing', () => {
        const konfluxConfig = createMockKonfluxConfig({
          authProvider: 'serviceAccount',
        });
        const clusterConfig = { ...konfluxConfig.clusters.cluster1 };
        delete clusterConfig.serviceAccountToken;

        expectAuthTokenToThrow(
          konfluxConfig,
          clusterConfig,
          undefined,
          'user@example.com',
          'No authentication token available for cluster cluster1',
        );

        expect(mockKonfluxLogger.error).toHaveBeenCalledWith(
          'No authentication token available',
          undefined,
          {
            cluster: 'cluster1',
            namespace: 'namespace1',
            resource: 'pipelineruns',
            authProvider: 'serviceAccount',
          },
        );
      });

      // eslint-disable-next-line jest/expect-expect
      it('should throw error when clusterConfig is undefined', () => {
        const konfluxConfig = createMockKonfluxConfig({
          authProvider: 'serviceAccount',
        });

        expectAuthTokenToThrow(
          konfluxConfig,
          undefined,
          undefined,
          'user@example.com',
          'No authentication token available for cluster cluster1',
        );
      });
    });

    describe('impersonationHeaders authentication', () => {
      it('should return serviceAccountToken and require impersonation when authProvider is impersonationHeaders', () => {
        const konfluxConfig = createMockKonfluxConfig({
          authProvider: 'impersonationHeaders',
        });
        const clusterConfig = konfluxConfig.clusters.cluster1;

        const result = getAuthToken(
          konfluxConfig,
          clusterConfig,
          undefined,
          'user@example.com',
          mockKonfluxLogger,
          defaultContext,
        );

        expect(result.token).toBe('service-token-123');
        expect(result.requiresImpersonation).toBe(true);
      });

      it('should throw error when userEmail is missing for impersonationHeaders', () => {
        const konfluxConfig = createMockKonfluxConfig({
          authProvider: 'impersonationHeaders',
        });
        const clusterConfig = konfluxConfig.clusters.cluster1;

        expectAuthTokenToThrow(
          konfluxConfig,
          clusterConfig,
          undefined,
          '',
          'User email is required for impersonation but was not provided for cluster cluster1',
        );

        expect(mockKonfluxLogger.error).toHaveBeenCalledWith(
          'Impersonation headers required but user email is missing',
          undefined,
          {
            cluster: 'cluster1',
            namespace: 'namespace1',
            resource: 'pipelineruns',
            authProvider: 'impersonationHeaders',
          },
        );
      });

      // eslint-disable-next-line jest/expect-expect
      it('should throw error when userEmail is only whitespace for impersonationHeaders', () => {
        const konfluxConfig = createMockKonfluxConfig({
          authProvider: 'impersonationHeaders',
        });
        const clusterConfig = konfluxConfig.clusters.cluster1;

        expectAuthTokenToThrow(
          konfluxConfig,
          clusterConfig,
          undefined,
          '   ',
          'User email is required for impersonation but was not provided for cluster cluster1',
        );
      });

      it('should accept valid userEmail for impersonationHeaders', () => {
        const konfluxConfig = createMockKonfluxConfig({
          authProvider: 'impersonationHeaders',
        });
        const clusterConfig = konfluxConfig.clusters.cluster1;

        const result = getAuthToken(
          konfluxConfig,
          clusterConfig,
          undefined,
          'user@example.com',
          mockKonfluxLogger,
          defaultContext,
        );

        expect(result.token).toBe('service-token-123');
        expect(result.requiresImpersonation).toBe(true);
      });
    });
  });
});
