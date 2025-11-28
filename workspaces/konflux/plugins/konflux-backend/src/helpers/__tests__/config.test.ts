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
  getKonfluxConfig,
  determineClusterNamespaceCombinations,
} from '../config';
import { Config } from '@backstage/config';
import { Entity } from '@backstage/catalog-model';
import { CatalogService } from '@backstage/plugin-catalog-node';
import { BackstageCredentials } from '@backstage/backend-plugin-api';
import { KonfluxLogger } from '../logger';
import {
  KonfluxConfig,
  KonfluxComponentClusterConfig,
  SubcomponentClusterConfig,
} from '@red-hat-developer-hub/backstage-plugin-konflux-common';
import * as konfluxCommon from '@red-hat-developer-hub/backstage-plugin-konflux-common';

jest.mock('@red-hat-developer-hub/backstage-plugin-konflux-common', () => ({
  ...jest.requireActual(
    '@red-hat-developer-hub/backstage-plugin-konflux-common',
  ),
  parseClusterConfigs: jest.fn(),
  parseAuthProviderConfig: jest.fn(),
  parseEntityKonfluxConfig: jest.fn(),
  parseSubcomponentClusterConfigurations: jest.fn(),
  getAllClusterNamespaceCombinations: jest.fn(),
}));

const mockParseClusterConfigs =
  konfluxCommon.parseClusterConfigs as jest.MockedFunction<
    typeof konfluxCommon.parseClusterConfigs
  >;
const mockParseAuthProviderConfig =
  konfluxCommon.parseAuthProviderConfig as jest.MockedFunction<
    typeof konfluxCommon.parseAuthProviderConfig
  >;
const mockParseEntityKonfluxConfig =
  konfluxCommon.parseEntityKonfluxConfig as jest.MockedFunction<
    typeof konfluxCommon.parseEntityKonfluxConfig
  >;
const mockParseSubcomponentClusterConfigurations =
  konfluxCommon.parseSubcomponentClusterConfigurations as jest.MockedFunction<
    typeof konfluxCommon.parseSubcomponentClusterConfigurations
  >;

describe('config', () => {
  let mockConfig: Config;
  let mockCatalog: CatalogService;
  let mockCredentials: BackstageCredentials;
  let mockLogger: KonfluxLogger;
  let mockError: jest.SpyInstance;
  let mockWarn: jest.SpyInstance;

  const createMockEntity = (
    name: string,
    annotations?: Record<string, string>,
    relations?: Array<{ type: string; targetRef: string }>,
  ): Entity => ({
    apiVersion: 'backstage.io/v1alpha1',
    kind: 'Component',
    metadata: {
      name,
      namespace: 'default',
      annotations: annotations || {},
    },
    relations: relations || [],
  });

  const createMockClusterConfig = (
    cluster: string,
    namespace: string,
    applications: string[],
  ): KonfluxComponentClusterConfig => ({
    cluster,
    namespace,
    applications,
  });

  const createMockSubcomponentClusterConfig = (
    subcomponent: string,
    cluster: string,
    namespace: string,
    applications: string[],
  ): SubcomponentClusterConfig => ({
    subcomponent,
    cluster,
    namespace,
    applications,
  });

  beforeEach(() => {
    jest.clearAllMocks();

    mockConfig = {
      getOptionalConfig: jest.fn(),
    } as unknown as Config;

    mockCatalog = {
      getEntities: jest.fn(),
      getEntityByRef: jest.fn(),
    } as unknown as CatalogService;

    mockCredentials = {} as BackstageCredentials;

    mockLogger = {
      error: jest.fn(),
      warn: jest.fn(),
      info: jest.fn(),
      debug: jest.fn(),
    } as unknown as KonfluxLogger;

    mockError = jest.spyOn(mockLogger, 'error');
    mockWarn = jest.spyOn(mockLogger, 'warn');

    mockParseClusterConfigs.mockReturnValue({});
    mockParseAuthProviderConfig.mockReturnValue('serviceAccount');
    mockParseEntityKonfluxConfig.mockReturnValue(null);
    mockParseSubcomponentClusterConfigurations.mockReturnValue([]);
  });

  describe('getKonfluxConfig', () => {
    it('should return undefined when konflux config is not found', async () => {
      (mockConfig.getOptionalConfig as jest.Mock).mockReturnValue(undefined);

      const entity = createMockEntity('test-entity');
      const result = await getKonfluxConfig(
        mockConfig,
        entity,
        mockCredentials,
        mockCatalog,
        mockLogger,
      );

      expect(result).toBeUndefined();
      expect(mockConfig.getOptionalConfig).toHaveBeenCalledWith('konflux');
    });

    it('should return config with clusters, components, and authProvider', async () => {
      const konfluxConfig = {
        getOptionalConfig: jest.fn(),
      };
      const clustersConfig = {};

      (mockConfig.getOptionalConfig as jest.Mock).mockReturnValue(
        konfluxConfig,
      );
      (konfluxConfig.getOptionalConfig as jest.Mock).mockReturnValue(
        clustersConfig,
      );

      mockParseClusterConfigs.mockReturnValue({
        cluster1: {
          apiUrl: 'https://api.cluster1.example.com',
          serviceAccountToken: 'token123',
        },
      });
      mockParseAuthProviderConfig.mockReturnValue('oidc');

      const entity = createMockEntity('test-entity');
      (mockCatalog.getEntities as jest.Mock).mockResolvedValue({
        items: [],
      });

      const result = await getKonfluxConfig(
        mockConfig,
        entity,
        mockCredentials,
        mockCatalog,
        mockLogger,
      );

      expect(result).toEqual({
        clusters: {
          cluster1: {
            apiUrl: 'https://api.cluster1.example.com',
            serviceAccountToken: 'token123',
          },
        },
        subcomponentConfigs: [],
        authProvider: 'oidc',
      });
    });

    it('should extract component configs from entity annotations', async () => {
      const konfluxConfig = {
        getOptionalConfig: jest.fn(),
      };
      const clustersConfig = {};

      (mockConfig.getOptionalConfig as jest.Mock).mockReturnValue(
        konfluxConfig,
      );
      (konfluxConfig.getOptionalConfig as jest.Mock).mockReturnValue(
        clustersConfig,
      );

      const clusterConfigs: KonfluxComponentClusterConfig[] = [
        createMockClusterConfig('cluster1', 'namespace1', ['app1']),
      ];

      mockParseEntityKonfluxConfig.mockReturnValue(clusterConfigs);

      const entity = createMockEntity('test-entity', {
        'konflux-ci.dev/clusters':
          '- cluster: cluster1\n  namespace: namespace1\n  applications: [app1]',
      });

      (mockCatalog.getEntities as jest.Mock).mockResolvedValue({
        items: [],
      });

      const result = await getKonfluxConfig(
        mockConfig,
        entity,
        mockCredentials,
        mockCatalog,
        mockLogger,
      );

      expect(result?.subcomponentConfigs).toEqual([
        createMockSubcomponentClusterConfig(
          'test-entity',
          'cluster1',
          'namespace1',
          ['app1'],
        ),
      ]);
    });

    it('should extract component configs from subcomponent entities', async () => {
      const konfluxConfig = {
        getOptionalConfig: jest.fn(),
      };
      const clustersConfig = {};

      (mockConfig.getOptionalConfig as jest.Mock).mockReturnValue(
        konfluxConfig,
      );
      (konfluxConfig.getOptionalConfig as jest.Mock).mockReturnValue(
        clustersConfig,
      );

      const subcomponent1 = createMockEntity(
        'subcomponent1',
        {
          'konflux-ci.dev/clusters': '- cluster: cluster1\n  namespace: ns1',
        },
        [{ type: 'partOf', targetRef: 'component:default/test-entity' }],
      );

      const clusterConfigs: KonfluxComponentClusterConfig[] = [
        createMockClusterConfig('cluster1', 'ns1', ['app1']),
      ];

      mockParseEntityKonfluxConfig.mockReturnValue(clusterConfigs);

      const entity = createMockEntity('test-entity');
      (mockCatalog.getEntities as jest.Mock).mockResolvedValue({
        items: [subcomponent1],
      });

      const result = await getKonfluxConfig(
        mockConfig,
        entity,
        mockCredentials,
        mockCatalog,
        mockLogger,
      );

      expect(result?.subcomponentConfigs).toEqual([
        createMockSubcomponentClusterConfig(
          'subcomponent1',
          'cluster1',
          'ns1',
          ['app1'],
        ),
      ]);
    });

    it('should fallback to main entity when no subcomponents found', async () => {
      const konfluxConfig = {
        getOptionalConfig: jest.fn(),
      };
      const clustersConfig = {};

      (mockConfig.getOptionalConfig as jest.Mock).mockReturnValue(
        konfluxConfig,
      );
      (konfluxConfig.getOptionalConfig as jest.Mock).mockReturnValue(
        clustersConfig,
      );

      const clusterConfigs: KonfluxComponentClusterConfig[] = [
        createMockClusterConfig('cluster1', 'ns1', ['app1']),
      ];

      mockParseEntityKonfluxConfig.mockReturnValue(clusterConfigs);

      const entity = createMockEntity('test-entity', {
        'konflux-ci.dev/clusters': '- cluster: cluster1\n  namespace: ns1',
      });

      (mockCatalog.getEntities as jest.Mock).mockResolvedValue({
        items: [],
      });

      const result = await getKonfluxConfig(
        mockConfig,
        entity,
        mockCredentials,
        mockCatalog,
        mockLogger,
      );

      expect(result?.subcomponentConfigs).toEqual([
        createMockSubcomponentClusterConfig('test-entity', 'cluster1', 'ns1', [
          'app1',
        ]),
      ]);
    });

    it('should return empty subcomponentConfigs when parseEntityKonfluxConfig returns null', async () => {
      const konfluxConfig = {
        getOptionalConfig: jest.fn(),
      };
      const clustersConfig = {};

      (mockConfig.getOptionalConfig as jest.Mock).mockReturnValue(
        konfluxConfig,
      );
      (konfluxConfig.getOptionalConfig as jest.Mock).mockReturnValue(
        clustersConfig,
      );

      mockParseEntityKonfluxConfig.mockReturnValue(null);

      const entity = createMockEntity('test-entity');
      (mockCatalog.getEntities as jest.Mock).mockResolvedValue({
        items: [],
      });

      const result = await getKonfluxConfig(
        mockConfig,
        entity,
        mockCredentials,
        mockCatalog,
        mockLogger,
      );

      expect(result?.subcomponentConfigs).toEqual([]);
    });

    it('should handle catalog service being null', async () => {
      const konfluxConfig = {
        getOptionalConfig: jest.fn(),
      };
      const clustersConfig = {};

      (mockConfig.getOptionalConfig as jest.Mock).mockReturnValue(
        konfluxConfig,
      );
      (konfluxConfig.getOptionalConfig as jest.Mock).mockReturnValue(
        clustersConfig,
      );

      const entity = createMockEntity('test-entity', {
        'konflux-ci.dev/clusters': '- cluster: cluster1',
      });

      const clusterConfigs: KonfluxComponentClusterConfig[] = [
        createMockClusterConfig('cluster1', 'ns1', ['app1']),
      ];

      mockParseEntityKonfluxConfig.mockReturnValue(clusterConfigs);

      const result = await getKonfluxConfig(
        mockConfig,
        entity,
        mockCredentials,
        null,
        mockLogger,
      );

      expect(result?.subcomponentConfigs).toEqual([
        createMockSubcomponentClusterConfig('test-entity', 'cluster1', 'ns1', [
          'app1',
        ]),
      ]);
    });

    it('should handle errors and log them', async () => {
      (mockConfig.getOptionalConfig as jest.Mock).mockImplementation(() => {
        throw new Error('Config error');
      });

      const entity = createMockEntity('test-entity');
      const result = await getKonfluxConfig(
        mockConfig,
        entity,
        mockCredentials,
        mockCatalog,
        mockLogger,
      );

      expect(result).toBeUndefined();
      expect(mockError).toHaveBeenCalledWith(
        'Error parsing Konflux configuration',
        expect.any(Error),
      );
    });
  });

  describe('determineClusterNamespaceCombinations', () => {
    it('should return empty array when konfluxConfig is undefined', async () => {
      const entity = createMockEntity('test-entity');
      const result = await determineClusterNamespaceCombinations(
        entity,
        mockCredentials,
        undefined,
        mockLogger,
        mockCatalog,
      );

      expect(result).toEqual([]);
      expect(mockWarn).toHaveBeenCalledWith(
        'No Konflux configuration found in app-config.yaml',
      );
    });

    it('should return combinations with applications', async () => {
      const konfluxConfig: KonfluxConfig = {
        clusters: {},
        subcomponentConfigs: [
          createMockSubcomponentClusterConfig(
            'test-entity',
            'cluster1',
            'ns1',
            ['app1', 'app2'],
          ),
          createMockSubcomponentClusterConfig(
            'test-entity',
            'cluster1',
            'ns1',
            ['app3'],
          ),
        ],
        authProvider: 'serviceAccount',
      };

      mockParseSubcomponentClusterConfigurations.mockReturnValue([
        createMockSubcomponentClusterConfig('test-entity', 'cluster1', 'ns1', [
          'app1',
          'app2',
        ]),
        createMockSubcomponentClusterConfig('test-entity', 'cluster1', 'ns1', [
          'app3',
        ]),
      ]);

      const entity = createMockEntity('test-entity');
      (mockCatalog.getEntities as jest.Mock).mockResolvedValue({
        items: [],
      });

      const result = await determineClusterNamespaceCombinations(
        entity,
        mockCredentials,
        konfluxConfig,
        mockLogger,
        mockCatalog,
      );

      expect(result).toEqual([
        {
          subcomponent: 'test-entity',
          cluster: 'cluster1',
          namespace: 'ns1',
          applications: ['app1', 'app2', 'app3'],
        },
      ]);
    });

    it('should use subcomponent names when related entities exist', async () => {
      const konfluxConfig: KonfluxConfig = {
        clusters: {},
        subcomponentConfigs: [],
        authProvider: 'serviceAccount',
      };

      const entity = createMockEntity('test-entity');
      const subcomponent1 = createMockEntity('sub1', {}, [
        { type: 'partOf', targetRef: 'component:default/test-entity' },
      ]);
      const subcomponent2 = createMockEntity('sub2', {}, [
        { type: 'partOf', targetRef: 'component:default/test-entity' },
      ]);

      mockParseSubcomponentClusterConfigurations.mockReturnValue([
        createMockSubcomponentClusterConfig('sub1', 'cluster1', 'ns1', [
          'app1',
        ]),
        createMockSubcomponentClusterConfig('sub2', 'cluster2', 'ns2', [
          'app2',
        ]),
      ]);

      (mockCatalog.getEntities as jest.Mock).mockResolvedValue({
        items: [subcomponent1, subcomponent2],
      });

      const result = await determineClusterNamespaceCombinations(
        entity,
        mockCredentials,
        konfluxConfig,
        mockLogger,
        mockCatalog,
      );

      expect(mockParseSubcomponentClusterConfigurations).toHaveBeenCalledWith(
        konfluxConfig,
        ['sub1', 'sub2'],
      );
      expect(result).toHaveLength(2);
    });

    it('should fallback to main entity name when no subcomponents', async () => {
      const konfluxConfig: KonfluxConfig = {
        clusters: {},
        subcomponentConfigs: [],
        authProvider: 'serviceAccount',
      };

      mockParseSubcomponentClusterConfigurations.mockReturnValue([
        createMockSubcomponentClusterConfig('test-entity', 'cluster1', 'ns1', [
          'app1',
        ]),
      ]);

      const entity = createMockEntity('test-entity');
      (mockCatalog.getEntities as jest.Mock).mockResolvedValue({
        items: [],
      });

      const result = await determineClusterNamespaceCombinations(
        entity,
        mockCredentials,
        konfluxConfig,
        mockLogger,
        mockCatalog,
      );

      expect(mockParseSubcomponentClusterConfigurations).toHaveBeenCalledWith(
        konfluxConfig,
        ['test-entity'],
      );
      expect(result).toHaveLength(1);
    });

    it('should handle empty related entities array', async () => {
      const konfluxConfig: KonfluxConfig = {
        clusters: {},
        subcomponentConfigs: [],
        authProvider: 'serviceAccount',
      };

      mockParseSubcomponentClusterConfigurations.mockReturnValue([
        createMockSubcomponentClusterConfig('test-entity', 'cluster1', 'ns1', [
          'app1',
        ]),
      ]);

      const entity = createMockEntity('test-entity');
      (mockCatalog.getEntities as jest.Mock).mockResolvedValue({
        items: [],
      });

      await determineClusterNamespaceCombinations(
        entity,
        mockCredentials,
        konfluxConfig,
        mockLogger,
        mockCatalog,
      );

      expect(mockParseSubcomponentClusterConfigurations).toHaveBeenCalledWith(
        konfluxConfig,
        ['test-entity'],
      );
    });

    it('should group and combine applications for matching subcomponent+cluster+namespace', async () => {
      const konfluxConfig: KonfluxConfig = {
        clusters: {},
        subcomponentConfigs: [],
        authProvider: 'serviceAccount',
      };

      mockParseSubcomponentClusterConfigurations.mockReturnValue([
        createMockSubcomponentClusterConfig('test-entity', 'cluster1', 'ns1', [
          'app1',
        ]),
        createMockSubcomponentClusterConfig('test-entity', 'cluster1', 'ns2', [
          'app2',
        ]),
        createMockSubcomponentClusterConfig('test-entity', 'cluster2', 'ns1', [
          'app3',
        ]),
      ]);

      const entity = createMockEntity('test-entity');
      (mockCatalog.getEntities as jest.Mock).mockResolvedValue({
        items: [],
      });

      const result = await determineClusterNamespaceCombinations(
        entity,
        mockCredentials,
        konfluxConfig,
        mockLogger,
        mockCatalog,
      );

      // Should return all unique combinations, grouped by subcomponent+cluster+namespace
      expect(result).toEqual([
        {
          subcomponent: 'test-entity',
          cluster: 'cluster1',
          namespace: 'ns1',
          applications: ['app1'],
        },
        {
          subcomponent: 'test-entity',
          cluster: 'cluster1',
          namespace: 'ns2',
          applications: ['app2'],
        },
        {
          subcomponent: 'test-entity',
          cluster: 'cluster2',
          namespace: 'ns1',
          applications: ['app3'],
        },
      ]);
    });
  });
});
