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

import { rest } from 'msw';
import { setupServer, SetupServer } from 'msw/node';
import request from 'supertest';
import { stringify } from 'yaml';

import { ExtendedHttpServer } from '@backstage/backend-defaults/rootHttpRouter';
import {
  BackendFeature,
  createServiceFactory,
} from '@backstage/backend-plugin-api';
import { mockServices, startTestBackend } from '@backstage/backend-test-utils';
import {
  DynamicPluginProvider,
  BaseDynamicPlugin,
  dynamicPluginsServiceRef,
} from '@backstage/backend-dynamic-feature-service';
import type { JsonObject } from '@backstage/types';
import {
  AuthorizeResult,
  PolicyDecision,
} from '@backstage/plugin-permission-common';
import {
  MarketplaceCollection,
  MarketplaceKind,
  MarketplacePackage,
  MarketplacePlugin,
} from '@red-hat-developer-hub/backstage-plugin-marketplace-common';
import {
  mockCollections,
  mockDynamicPackage11,
  mockDynamicPlugin1,
  mockInstallationDataService,
  mockPackages,
  mockPlugins,
} from '../__fixtures__/mockData';
import { ConfigFormatError } from './errors/ConfigFormatError';
import { InstallationDataService } from './installation/InstallationDataService';
import { marketplacePlugin } from './plugin';
import {
  InstallationInitError,
  InstallationInitErrorReason,
} from './errors/InstallationInitError';

type MockMarketplaceEntity =
  | Partial<MarketplacePlugin>
  | Partial<MarketplaceCollection>
  | Partial<MarketplacePackage>;

const BASE_CONFIG = {
  app: {
    baseUrl: 'https://my-backstage-app.example.com',
  },
  backend: {
    baseUrl: 'http://localhost:7007',
    database: {
      client: 'better-sqlite3',
      connection: ':memory:',
    },
  },
};

// Mock dynamic plugins data for testing
const mockDynamicPluginsData: BaseDynamicPlugin[] = [
  {
    name: '@backstage/plugin-catalog-backend',
    version: '1.0.0',
    role: 'backend',
    platform: 'node',
  },
  {
    name: '@backstage/plugin-catalog',
    version: '1.0.0',
    role: 'frontend',
    platform: 'web',
  },
  {
    name: '@red-hat-developer-hub/backstage-plugin-marketplace',
    version: '1.0.0',
    role: 'frontend',
    platform: 'web',
  },
];

// Mock DynamicPluginProvider
const mockDynamicPluginProvider: DynamicPluginProvider = {
  plugins: () => mockDynamicPluginsData as any,
  getScannedPackage: () => ({}) as any,
  frontendPlugins: () => [],
  backendPlugins: () => [],
};

// Create mock service factory for dynamicPluginsServiceRef
const mockDynamicPluginsServiceFactory = createServiceFactory({
  service: dynamicPluginsServiceRef,
  deps: {},
  factory: () => mockDynamicPluginProvider,
});

const FILE_INSTALL_CONFIG = {
  extensions: {
    installation: {
      enabled: true,
      saveToSingleFile: { file: 'dummy-config.yaml' },
    },
  },
};

const PLUGIN_SETUP = {
  mockData: mockPlugins,
  name: 'plugin1',
  config: FILE_INSTALL_CONFIG,
};

const PACKAGE_SETUP = {
  mockData: [...mockPackages, ...mockPlugins],
  name: 'package11',
  kind: MarketplaceKind.Package,
  config: FILE_INSTALL_CONFIG,
  relationName: 'plugin1',
};

const configurationEndpointsTestCases = [
  {
    description: 'GET /package/:namespace/:name/configuration',
    reqBuilder: (req: request.SuperTest<request.Test>) =>
      req.get('/api/extensions/package/default/package11/configuration'),
    body: undefined,
  },
  {
    description: 'POST /package/:namespace/:name/configuration',
    reqBuilder: (req: request.SuperTest<request.Test>) =>
      req.post('/api/extensions/package/default/package11/configuration'),
    body: { configYaml: stringify(mockDynamicPackage11) },
  },
  {
    description: 'PATCH /package/:namespace/:name/configuration/disable',
    reqBuilder: (req: request.SuperTest<request.Test>) =>
      req.patch(
        '/api/extensions/package/default/package11/configuration/disable',
      ),
    body: { disabled: true },
  },
  {
    description: 'GET /plugin/:namespace/:name/configuration',
    reqBuilder: (req: request.SuperTest<request.Test>) =>
      req.get('/api/extensions/plugin/default/plugin1/configuration'),
    body: undefined,
  },
  {
    description: 'POST /plugin/:namespace/:name/configuration',
    reqBuilder: (req: request.SuperTest<request.Test>) =>
      req.post('/api/extensions/package/default/plugin1/configuration'),
    body: { configYaml: stringify(mockDynamicPlugin1) },
  },
  {
    description: 'PATCH /plugin/:namespace/:name/configuration/disable',
    reqBuilder: (req: request.SuperTest<request.Test>) =>
      req.patch('/api/extensions/plugin/default/plugin1/configuration/disable'),
    body: { disabled: true },
  },
];

async function startBackendServer(
  config?: JsonObject,
  authorizeResult?: PolicyDecision,
): Promise<ExtendedHttpServer> {
  const features: (BackendFeature | Promise<{ default: BackendFeature }>)[] = [
    marketplacePlugin,
    mockServices.rootLogger.factory(),
    mockServices.rootConfig.factory({
      data: { ...BASE_CONFIG, ...(config ?? {}) },
    }),
    mockDynamicPluginsServiceFactory,
  ];

  if (authorizeResult) {
    features.push(
      mockServices.permissions.mock({
        authorizeConditional: async () => [authorizeResult],
      }).factory,
    );
  }

  return (await startTestBackend({ features })).server;
}

const expectNotFoundError = async (
  response: request.Response,
  kind: string,
) => {
  expect(response.status).toEqual(404);
  expect(response.body.error).toEqual({
    message: `${kind} default/not-found not found`,
    name: 'NotFoundError',
  });
};

const expectInputError = async (
  response: request.Response,
  errorMessage: string,
) => {
  expect(response.status).toEqual(400);
  expect(response.body.error).toEqual({
    message: errorMessage,
    name: 'InputError',
  });
};

const expectPermissionError = async (
  response: request.Response,
  action: string,
  namespace: string,
  name: string,
) => {
  expect(response.status).toEqual(403);
  expect(response.body.error).toEqual({
    message: `Not allowed to ${action} the configuration of ${namespace}:${name}`,
    name: 'NotAllowedError',
  });
};

const setupTest = () => {
  let server: SetupServer;

  beforeAll(() => {
    server = setupServer();
    server.listen({
      /*
       *  This is required so that msw doesn't throw
       *  warnings when the backend is requesting an endpoint
       */
      onUnhandledRequest: (req, print) => {
        if (
          req.url.pathname === '/' ||
          req.url.pathname.startsWith('/api/extensions')
        ) {
          // bypass
          return;
        }
        print.warning();
      },
    });
  });

  afterAll(() => server.close());

  beforeEach(() => {});

  afterEach(() => {
    jest.resetAllMocks();
    jest.restoreAllMocks();
    server.resetHandlers();
  });

  return () => {
    return { server };
  };
};

describe('createRouter', () => {
  const testSetup = setupTest();

  const setupTestWithMockCatalog = async ({
    mockData,
    name,
    kind = MarketplaceKind.Plugin,
    config,
    policyDecision,
  }: {
    mockData: MockMarketplaceEntity[] | {};
    name?: string;
    kind?: string;
    config?: JsonObject;
    policyDecision?: PolicyDecision;
  }): Promise<{
    backendServer: ExtendedHttpServer;
  }> => {
    const { server } = testSetup();
    const backendServer: ExtendedHttpServer = await startBackendServer(
      config,
      policyDecision,
    );
    server.use(
      rest.get(
        `http://localhost:${backendServer.port()}/api/catalog/entities/by-query`,
        (_, res, ctx) => res(ctx.status(200), ctx.json({ items: mockData })),
      ),
      rest.get(
        `http://localhost:${backendServer.port()}/api/catalog/entity-facets`,
        (_, res, ctx) => {
          if (!mockData) {
            throw new Error('Internal server error');
          }

          return res(ctx.status(200), ctx.json({ facets: mockData }));
        },
      ),
      rest.get(
        `http://localhost:${backendServer.port()}/api/catalog/entities/by-name/${kind}/default/${name}`,
        (_, res, ctx) => {
          if (!Array.isArray(mockData)) {
            throw new Error('Internal server error');
          }
          const foundEntity = mockData.find(
            e => e.kind === kind && e.metadata?.name === name,
          );
          return res(
            ctx.status(foundEntity ? 200 : 404),
            ctx.json(foundEntity),
          );
        },
      ),
      rest.get(
        `http://localhost:${backendServer.port()}/api/catalog/entities`,
        (_, res, ctx) => {
          if (!Array.isArray(mockData)) {
            throw new Error('Internal server error');
          }
          const hasPackage = (r: { type: string; targetRef: string }) =>
            r.type === 'hasPart' && r.targetRef === `package:${name}`;
          const foundEntities = mockData.filter(
            e => e.kind === 'Plugin' && e.relations.some(hasPackage),
          );
          return res(ctx.json(foundEntities));
        },
      ),
    );

    return { backendServer };
  };

  beforeEach(() => {
    jest
      .spyOn(InstallationDataService, 'fromConfig')
      .mockReturnValue(mockInstallationDataService);
  });

  describe('GET /collections', () => {
    it('should get all collections', async () => {
      const { backendServer } = await setupTestWithMockCatalog({
        mockData: mockCollections,
      });

      const response = await request(backendServer).get(
        '/api/extensions/collections',
      );

      expect(response.status).toEqual(200);
      expect(response.body).toEqual({
        items: mockCollections,
      });
    });
  });

  describe('GET /collection/:namespace/:name', () => {
    it('should get the collection by name', async () => {
      const { backendServer } = await setupTestWithMockCatalog({
        mockData: mockCollections,
        name: 'featured-plugins',
        kind: MarketplaceKind.Collection,
      });

      const response = await request(backendServer).get(
        '/api/extensions/collection/default/featured-plugins',
      );

      expect(response.status).toEqual(200);
      expect(response.body.metadata.name).toEqual('featured-plugins');
      expect(response.body.spec.plugins).toEqual(['plugin1', 'plugin2']);
    });

    it('should fail when collection not found with NotFoundError 404 error', async () => {
      const { backendServer } = await setupTestWithMockCatalog({
        mockData: [],
        name: 'not-found',
        kind: MarketplaceKind.Collection,
      });

      const response = await request(backendServer).get(
        '/api/extensions/collection/default/not-found',
      );
      expectNotFoundError(response, 'Collection');
    });
  });

  describe('GET /collection/:namespace/:name/plugins', () => {
    it('should return empty array when plugins is not set in the collection entity', async () => {
      const { server } = testSetup();
      const backendServer = await startBackendServer();
      server.use(
        rest.get(
          `http://localhost:${backendServer.port()}/api/catalog/entities/by-name/plugincollection/default/featured-plugins`,
          (_, res, ctx) =>
            res(
              ctx.status(200),
              ctx.json({ ...mockCollections[0], relations: [] }),
            ),
        ),
        rest.post(
          `http://localhost:${backendServer.port()}/api/catalog/entities/by-refs`,
          (_, res, ctx) =>
            res(ctx.status(200), ctx.json({ items: mockPlugins })),
        ),
      );

      const response = await request(backendServer).get(
        '/api/extensions/collection/default/featured-plugins/plugins',
      );

      expect(response.status).toEqual(200);
      expect(response.body).toEqual([]);
    });

    it('should return all the plugins by the collection name', async () => {
      const { server } = testSetup();
      const backendServer = await startBackendServer();
      server.use(
        rest.get(
          `http://localhost:${backendServer.port()}/api/catalog/entities/by-name/plugincollection/default/featured-plugins`,
          (_, res, ctx) => res(ctx.status(200), ctx.json(mockCollections[0])),
        ),
        rest.post(
          `http://localhost:${backendServer.port()}/api/catalog/entities/by-refs`,
          (_, res, ctx) =>
            res(ctx.status(200), ctx.json({ items: mockPlugins })),
        ),
      );

      const response = await request(backendServer).get(
        '/api/extensions/collection/default/featured-plugins/plugins',
      );

      expect(response.status).toEqual(200);
      expect(response.body).toEqual(mockPlugins);
    });

    it('should fail when plugins collection not found with NotFoundError 404 error', async () => {
      const { backendServer } = await setupTestWithMockCatalog({
        mockData: [],
        name: 'not-found',
        kind: MarketplaceKind.Collection,
      });

      const response = await request(backendServer).get(
        '/api/extensions/collection/default/not-found/plugins',
      );

      expectNotFoundError(response, 'Collection');
    });
  });

  describe('GET /collections/facets', () => {
    it('should return facets data', async () => {
      const { backendServer } = await setupTestWithMockCatalog({
        mockData: {
          'spec.categories': [
            {
              value: 'CI/CD',
              count: 8,
            },
            {
              value: 'Discovery',
              count: 1,
            },
          ],
        },
      });

      const response = await request(backendServer).get(
        '/api/extensions/collections/facets?facet=spec.categories',
      );

      expect(response.status).toEqual(200);
      expect(response.body).toEqual({
        facets: {
          'spec.categories': [
            {
              value: 'CI/CD',
              count: 8,
            },
            {
              value: 'Discovery',
              count: 1,
            },
          ],
        },
      });
    });
  });

  describe('GET /plugins', () => {
    it('should get the plugins', async () => {
      const { backendServer } = await setupTestWithMockCatalog({
        mockData: mockPlugins,
      });
      const response = await request(backendServer).get(
        '/api/extensions/plugins',
      );
      expect(response.status).toEqual(200);
      expect(response.body.items).toHaveLength(2);
    });
  });

  describe('GET /plugin/:namespace/:name', () => {
    it('should get the plugin by name', async () => {
      const { backendServer } = await setupTestWithMockCatalog({
        mockData: mockPlugins,
        name: 'plugin1',
      });

      const response = await request(backendServer).get(
        '/api/extensions/plugin/default/plugin1',
      );

      expect(response.status).toEqual(200);
      expect(response.body.metadata.name).toEqual('plugin1');
    });

    it('should fail to get plugin by name when plugin not found with NotFoundError 404', async () => {
      const { backendServer } = await setupTestWithMockCatalog({
        mockData: [],
        name: 'not-found',
      });
      const response = await request(backendServer).get(
        '/api/extensions/plugin/default/not-found',
      );
      expectNotFoundError(response, MarketplaceKind.Plugin);
    });
  });

  describe('GET /plugin/:namespace/:name/configuration', () => {
    it('should fail when plugin not found with NotFoundError 404', async () => {
      const { backendServer } = await setupTestWithMockCatalog({
        mockData: [],
        name: 'not-found',
        config: FILE_INSTALL_CONFIG,
      });

      const response = await request(backendServer).get(
        '/api/extensions/plugin/default/not-found/configuration',
      );
      expectNotFoundError(response, MarketplaceKind.Plugin);
    });

    it('should get the plugin configuration', async () => {
      const { backendServer } = await setupTestWithMockCatalog({
        mockData: [...mockPlugins, ...mockPackages],
        name: 'plugin1',
        config: FILE_INSTALL_CONFIG,
      });
      const pluginToGet = stringify(mockDynamicPlugin1);

      mockInstallationDataService.getPluginConfig.mockResolvedValue(
        pluginToGet,
      );

      const response = await request(backendServer).get(
        '/api/extensions/plugin/default/plugin1/configuration',
      );
      expect(response.status).toEqual(200);
      expect(response.body.configYaml).toEqual(pluginToGet);
    });
  });

  describe('POST /plugin/:namespace/:name/configuration', () => {
    it('should fail when config missing with InputError 400', async () => {
      const { backendServer } = await setupTestWithMockCatalog(PLUGIN_SETUP);

      const response = await request(backendServer).post(
        '/api/extensions/plugin/default/plugin1/configuration',
      );
      expectInputError(response, "'configYaml' object must be present");
    });

    it('should fail when bad config format with InputError 400', async () => {
      const { backendServer } = await setupTestWithMockCatalog(PLUGIN_SETUP);

      const errorMessage =
        'Invalid installation configuration, plugin packages must be a list';
      mockInstallationDataService.updatePluginConfig.mockImplementationOnce(
        () => {
          throw new ConfigFormatError(errorMessage);
        },
      );

      const response = await request(backendServer)
        .post('/api/extensions/plugin/default/plugin1/configuration')
        .send({ configYaml: 'invalid-plugin' });
      expectInputError(response, errorMessage);
    });

    it('should fail when plugin not found with NotFoundError 404', async () => {
      const { backendServer } = await setupTestWithMockCatalog({
        mockData: [],
        name: 'not-found',
        config: FILE_INSTALL_CONFIG,
      });

      const response = await request(backendServer)
        .post('/api/extensions/plugin/default/not-found/configuration')
        .send({ configYaml: stringify(mockDynamicPlugin1) });
      expectNotFoundError(response, MarketplaceKind.Plugin);
    });

    it('should install the plugin configuration', async () => {
      const { backendServer } = await setupTestWithMockCatalog(PLUGIN_SETUP);

      const response = await request(backendServer)
        .post('/api/extensions/plugin/default/plugin1/configuration')
        .send({ configYaml: stringify(mockDynamicPlugin1) });
      expect(
        mockInstallationDataService.updatePluginConfig,
      ).toHaveBeenCalledWith(mockPlugins[0], stringify(mockDynamicPlugin1));
      expect(response.status).toEqual(200);
      expect(response.body).toEqual({ status: 'OK' });
    });
  });

  describe('PATCH /plugin/:namespace/:name/configuration/disable', () => {
    it('should fail when disabled missing with InputError 400', async () => {
      const { backendServer } = await setupTestWithMockCatalog(PLUGIN_SETUP);

      const response = await request(backendServer).patch(
        '/api/extensions/plugin/default/plugin1/configuration/disable',
      );
      expectInputError(response, "'disabled' must be present boolean");
    });

    it('should fail when bad disabled format with InputError 400', async () => {
      const { backendServer } = await setupTestWithMockCatalog(PLUGIN_SETUP);

      const response = await request(backendServer)
        .patch('/api/extensions/plugin/default/plugin1/configuration/disable')
        .send({ disabled: 'invalid' });
      expectInputError(response, "'disabled' must be present boolean");
    });

    it('should fail when plugin not found with NotFoundError 404', async () => {
      const { backendServer } = await setupTestWithMockCatalog({
        mockData: [],
        name: 'not-found',
        config: FILE_INSTALL_CONFIG,
      });

      const response = await request(backendServer)
        .patch('/api/extensions/plugin/default/not-found/configuration/disable')
        .send({ disabled: true });
      expectNotFoundError(response, MarketplaceKind.Plugin);
    });

    it.each([
      ['enable', false],
      ['disable', true],
    ])('should %s the plugin configuration', async (_, disabled) => {
      const { backendServer } = await setupTestWithMockCatalog(PLUGIN_SETUP);

      const response = await request(backendServer)
        .patch('/api/extensions/plugin/default/plugin1/configuration/disable')
        .send({ disabled });
      expect(
        mockInstallationDataService.setPluginDisabled,
      ).toHaveBeenCalledWith(mockPlugins[0], disabled);
      expect(response.status).toEqual(200);
      expect(response.body).toEqual({ status: 'OK' });
    });
  });

  describe('GET /package/:namespace/:name/configuration', () => {
    it('should fail when package not found with NotFoundError 404', async () => {
      const { backendServer } = await setupTestWithMockCatalog({
        mockData: [],
        name: 'not-found',
        kind: MarketplaceKind.Package,
        config: FILE_INSTALL_CONFIG,
      });
      const response = await request(backendServer).get(
        '/api/extensions/package/default/not-found/configuration',
      );
      expectNotFoundError(response, MarketplaceKind.Package);
    });

    it('should get the package configuration', async () => {
      const { backendServer } = await setupTestWithMockCatalog({
        mockData: [...mockPackages, ...mockPlugins],
        name: 'package11',
        kind: MarketplaceKind.Package,
        config: FILE_INSTALL_CONFIG,
      });
      const packageToGet = stringify(mockDynamicPackage11);

      mockInstallationDataService.getPackageConfig.mockReturnValue(
        packageToGet,
      );

      const response = await request(backendServer).get(
        '/api/extensions/package/default/package11/configuration',
      );
      expect(response.status).toEqual(200);
      expect(response.body.configYaml).toEqual(packageToGet);
    });
  });

  describe('POST /package/:namespace/:name/configuration', () => {
    it('should fail when config missing with InputError 400', async () => {
      const { backendServer } = await setupTestWithMockCatalog(PACKAGE_SETUP);
      const response = await request(backendServer).post(
        '/api/extensions/package/default/package11/configuration',
      );
      expectInputError(response, "'configYaml' object must be present");
    });

    it('should fail when bad config format with InputError 400', async () => {
      const { backendServer } = await setupTestWithMockCatalog(PACKAGE_SETUP);

      const errorMessage =
        'Invalid installation configuration, package item must be a map';
      mockInstallationDataService.updatePackageConfig.mockImplementationOnce(
        () => {
          throw new ConfigFormatError(errorMessage);
        },
      );

      const response = await request(backendServer)
        .post('/api/extensions/package/default/package11/configuration')
        .send({ configYaml: 'invalid-package' });
      expectInputError(response, errorMessage);
    });

    it('should fail when package not found with NotFoundError 404', async () => {
      const { backendServer } = await setupTestWithMockCatalog({
        mockData: [],
        name: 'not-found',
        kind: MarketplaceKind.Package,
        config: FILE_INSTALL_CONFIG,
      });

      const response = await request(backendServer)
        .post('/api/extensions/package/default/not-found/configuration')
        .send({ configYaml: stringify(mockDynamicPackage11) });
      expectNotFoundError(response, MarketplaceKind.Package);
    });

    it('should install the package configuration', async () => {
      const { backendServer } = await setupTestWithMockCatalog(PACKAGE_SETUP);

      const response = await request(backendServer)
        .post('/api/extensions/package/default/package11/configuration')
        .send({ configYaml: stringify(mockDynamicPackage11) });
      expect(
        mockInstallationDataService.updatePackageConfig,
      ).toHaveBeenCalledWith(
        mockDynamicPackage11.package,
        stringify(mockDynamicPackage11),
      );
      expect(response.status).toEqual(200);
      expect(response.body).toEqual({ status: 'OK' });
    });
  });

  describe('PATCH /package/:namespace/:name/configuration/disable', () => {
    it('should fail when disabled missing with InputError 400', async () => {
      const { backendServer } = await setupTestWithMockCatalog(PACKAGE_SETUP);

      const response = await request(backendServer).patch(
        '/api/extensions/package/default/package11/configuration/disable',
      );
      expectInputError(response, "'disabled' must be present boolean");
    });

    it('should fail when bad disabled format with InputError 400', async () => {
      const { backendServer } = await setupTestWithMockCatalog(PACKAGE_SETUP);

      const response = await request(backendServer)
        .patch(
          '/api/extensions/package/default/package11/configuration/disable',
        )
        .send({ disabled: 'invalid' });
      expectInputError(response, "'disabled' must be present boolean");
    });

    it('should fail when package not found with NotFoundError 404', async () => {
      const { backendServer } = await setupTestWithMockCatalog({
        mockData: [],
        name: 'not-found',
        kind: MarketplaceKind.Package,
        config: FILE_INSTALL_CONFIG,
      });

      const response = await request(backendServer)
        .patch(
          '/api/extensions/package/default/not-found/configuration/disable',
        )
        .send({ disabled: true });
      expectNotFoundError(response, MarketplaceKind.Package);
    });

    it.each([
      ['enable', false],
      ['disable', true],
    ])('should %s the package configuration', async (_, disabled) => {
      const { backendServer } = await setupTestWithMockCatalog(PACKAGE_SETUP);

      const response = await request(backendServer)
        .patch(
          '/api/extensions/package/default/package11/configuration/disable',
        )
        .send({ disabled });
      expect(
        mockInstallationDataService.setPackageDisabled,
      ).toHaveBeenCalledWith(mockDynamicPackage11.package, disabled);
      expect(response.status).toEqual(200);
      expect(response.body).toEqual({ status: 'OK' });
    });
  });

  describe('Denial when missing permissions', () => {
    const policyDecisions: {
      policyDecision: PolicyDecision;
      denyAction: string;
    }[] = [
      {
        policyDecision: {
          result: AuthorizeResult.DENY,
        },
        denyAction: 'outright denied',
      },
      {
        policyDecision: {
          result: AuthorizeResult.CONDITIONAL,
          pluginId: 'extensions',
          resourceType: 'extensions-plugin',
          conditions: {
            anyOf: [
              {
                rule: 'HAS_NAME',
                resourceType: 'extensions-plugin',
                params: { pluginNames: ['other-plugin'] },
              },
            ],
          },
        },
        denyAction: 'conditionally denied',
      },
    ];

    const allTestCases = policyDecisions.flatMap(
      ({ policyDecision, denyAction }) =>
        configurationEndpointsTestCases.map(testCase => ({
          ...testCase,
          denyAction,
          policyDecision,
        })),
    );

    it.each(allTestCases)(
      '$description: returns 403 when $denyAction by permission framework',
      async ({ description, reqBuilder, body, policyDecision }) => {
        const isPackage = description.includes('/package');
        const name = isPackage ? 'package11' : 'plugin1';
        const { backendServer } = await setupTestWithMockCatalog({
          mockData: [...mockPackages, ...mockPlugins],
          name,
          kind: isPackage ? MarketplaceKind.Package : MarketplaceKind.Plugin,
          config: FILE_INSTALL_CONFIG,
          policyDecision,
        });

        const requestBuilder = reqBuilder(request(backendServer));
        const response = body
          ? await requestBuilder.send(body)
          : await requestBuilder;

        expect(response.status).toEqual(403);
        const action = description.includes('GET') ? 'read' : 'create';
        expectPermissionError(response, action, 'default', name);
      },
    );
  });

  describe('Returns 5xx when InstallationDataService not initialized', () => {
    const originalFromConfig = InstallationDataService.fromConfig;

    beforeEach(() => {
      InstallationDataService.fromConfig = jest.fn().mockReturnValue({
        getInitializationError: () =>
          new InstallationInitError(
            InstallationInitErrorReason.INSTALLATION_DISABLED,
            "Installation feature is disabled under 'extensions.installation.enabled'",
          ),
      });
    });

    afterAll(() => {
      InstallationDataService.fromConfig = originalFromConfig;
    });

    it.each(configurationEndpointsTestCases)(
      '$description: returns 5xx InstallationDataService not initialized',
      async ({ reqBuilder, body }) => {
        const { backendServer } = await setupTestWithMockCatalog({
          mockData: [],
        });

        const requestBuilder = reqBuilder(request(backendServer));
        const response = body
          ? await requestBuilder.send(body)
          : await requestBuilder;

        expect(response.status).toEqual(503);
        expect(response.body.error).toEqual({
          message:
            "Installation feature is disabled under 'extensions.installation.enabled'",
          name: 'InstallationInitError',
          reason: 'INSTALLATION_DISABLED',
          statusCode: 503,
        });
      },
    );
  });

  describe('GET /loaded-plugins', () => {
    it('should return the list of loaded dynamic plugins', async () => {
      const { backendServer } = await setupTestWithMockCatalog({
        mockData: {},
      });

      const response = await request(backendServer).get(
        '/api/extensions/loaded-plugins',
      );

      expect(response.status).toBe(200);
      expect(Array.isArray(response.body)).toBe(true);
      // The response should be an array of dynamic plugin info objects
      // Each plugin should have the expected structure
      response.body.forEach((plugin: any) => {
        expect(plugin).toEqual(
          expect.objectContaining({
            name: expect.any(String),
            version: expect.any(String),
            role: expect.any(String),
            platform: expect.any(String),
          }),
        );
      });
    });
  });
});
