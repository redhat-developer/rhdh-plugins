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

import request from 'supertest';
import { rest } from 'msw';
import { setupServer, SetupServer } from 'msw/node';

import { BackendFeature } from '@backstage/backend-plugin-api';
import { mockServices, startTestBackend } from '@backstage/backend-test-utils';
import { ExtendedHttpServer } from '@backstage/backend-defaults/dist/rootHttpRouter';

import { marketplacePlugin } from './plugin';
import { mockCollections, mockPlugins } from '../__fixtures__/mockData';

import {
  MarketplacePlugin,
  MarketplaceCollection,
  MarketplaceKind,
} from '@red-hat-developer-hub/backstage-plugin-marketplace-common';

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
async function startBackendServer(): Promise<ExtendedHttpServer> {
  const features: (BackendFeature | Promise<{ default: BackendFeature }>)[] = [
    marketplacePlugin,
    mockServices.rootLogger.factory(),
    mockServices.rootConfig.factory({
      data: { ...BASE_CONFIG },
    }),
  ];

  return (await startTestBackend({ features })).server;
}

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
          req.url.pathname.startsWith('/api/marketplace')
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
    kind = 'plugin',
  }: {
    mockData: MarketplacePlugin[] | MarketplaceCollection[] | {} | null;
    name?: string;
    kind?: string;
  }): Promise<{ backendServer: ExtendedHttpServer }> => {
    const { server } = testSetup();
    const backendServer: ExtendedHttpServer = await startBackendServer();
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
        (_, res, ctx) =>
          res(
            ctx.status(name === 'invalid-plugin' ? 404 : 200),
            ctx.json(name === 'invalid-plugin' ? {} : mockData),
          ),
      ),
    );

    return { backendServer };
  };

  describe('collections', () => {
    it('should get all collections', async () => {
      const { backendServer } = await setupTestWithMockCatalog({
        mockData: mockCollections,
      });

      const response = await request(backendServer).get(
        '/api/marketplace/collections',
      );

      expect(response.status).toEqual(200);
      expect(response.body).toEqual({
        items: mockCollections,
      });
    });

    it('should get the collection by name', async () => {
      const { backendServer } = await setupTestWithMockCatalog({
        mockData: mockCollections[0],
        name: 'featured-plugins',
        kind: MarketplaceKind.Collection,
      });

      const response = await request(backendServer).get(
        '/api/marketplace/collection/default/featured-plugins',
      );

      expect(response.status).toEqual(200);
      expect(response.body.metadata.name).toEqual('test-featured-plugins');
      expect(response.body.spec.plugins).toEqual(['plugin1', 'plugin2']);
    });

    it('should throw error while fetching collection by name', async () => {
      const { backendServer } = await setupTestWithMockCatalog({
        mockData: null,
        name: 'not-found',
        kind: MarketplaceKind.Collection,
      });

      const response = await request(backendServer).get(
        '/api/marketplace/collection/default/not-found',
      );

      expect(response.status).toEqual(404);
      expect(response.body).toEqual({
        error: {
          message: 'Collection default/not-found not found',
          name: 'NotFoundError',
        },
        request: {
          method: 'GET',
          url: '/collection/default/not-found',
        },
        response: {
          statusCode: 404,
        },
      });
    });

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
        '/api/marketplace/collection/default/featured-plugins/plugins',
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
        '/api/marketplace/collection/default/featured-plugins/plugins',
      );

      expect(response.status).toEqual(200);
      expect(response.body).toEqual(mockPlugins);
    });

    it('should throw an error when the collection is not found', async () => {
      const { backendServer } = await setupTestWithMockCatalog({
        mockData: null,
        name: 'not-found',
        kind: MarketplaceKind.Collection,
      });

      const response = await request(backendServer).get(
        '/api/marketplace/collection/default/not-found/plugins',
      );

      expect(response.status).toEqual(404);
      expect(response.body).toEqual({
        error: {
          message: 'Collection default/not-found not found',
          name: 'NotFoundError',
        },
        request: {
          method: 'GET',
          url: '/collection/default/not-found/plugins',
        },
        response: {
          statusCode: 404,
        },
      });
    });

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
        '/api/marketplace/collections/facets?facet=spec.categories',
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

  describe('plugins', () => {
    it('should get the plugins', async () => {
      const { backendServer } = await setupTestWithMockCatalog({
        mockData: mockPlugins,
      });
      const response = await request(backendServer).get(
        '/api/marketplace/plugins',
      );
      expect(response.status).toEqual(200);
      expect(response.body.items).toHaveLength(2);
    });

    it('should get the plugin by name', async () => {
      const { backendServer } = await setupTestWithMockCatalog({
        mockData: mockPlugins[0],
        name: 'plugin1',
      });

      const response = await request(backendServer).get(
        '/api/marketplace/plugin/default/plugin1',
      );

      expect(response.status).toEqual(200);
      expect(response.body.metadata.name).toEqual('plugin1');
    });

    it('should throw error while fetching plugin by name', async () => {
      const { backendServer } = await setupTestWithMockCatalog({
        mockData: {},
        name: 'invalid-plugin',
      });
      const response = await request(backendServer).get(
        '/api/marketplace/plugin/default/invalid-plugin',
      );

      expect(response.status).toEqual(404);
      expect(response.body).toEqual({
        error: {
          message: 'Plugin default/invalid-plugin not found',
          name: 'NotFoundError',
        },
        request: {
          method: 'GET',
          url: '/plugin/default/invalid-plugin',
        },
        response: {
          statusCode: 404,
        },
      });
    });
  });
});
