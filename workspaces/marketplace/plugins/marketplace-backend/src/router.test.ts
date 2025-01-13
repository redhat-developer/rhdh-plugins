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

import { mockServices, startTestBackend } from '@backstage/backend-test-utils';
import request from 'supertest';
import { rest } from 'msw';
import { setupServer, SetupServer } from 'msw/node';

import { BackendFeature } from '@backstage/backend-plugin-api';
import { marketplacePlugin } from './plugin';
import { mockPluginList, mockPlugins } from '../__fixtures__/mockData';
import { ExtendedHttpServer } from '@backstage/backend-defaults/dist/rootHttpRouter';
import {
  MarketplacePlugin,
  MarketplacePluginList,
} from '@red-hat-developer-hub/backstage-plugin-marketplace-common';

async function startBackendServer(): Promise<ExtendedHttpServer> {
  const features: (BackendFeature | Promise<{ default: BackendFeature }>)[] = [
    marketplacePlugin,
    mockServices.rootLogger.factory(),
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
        if (req.url.pathname.startsWith('/api/marketplace')) {
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

const testSetup = setupTest();

const setupTestWithMockCatalog = async ({
  mockData,
  name,
  kind = 'plugin',
}: {
  mockData: MarketplacePlugin[] | MarketplacePluginList[] | {} | null;
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
      `http://localhost:${backendServer.port()}/api/catalog/entities/by-name/${kind}/default/${name}`,
      (_, res, ctx) => res(ctx.status(200), ctx.json(mockData)),
    ),
  );

  return { backendServer };
};

describe('createRouter', () => {
  it('should get the plugins', async () => {
    const { backendServer } = await setupTestWithMockCatalog({
      mockData: mockPlugins,
    });
    const response = await request(backendServer).get(
      '/api/marketplace/plugins',
    );
    expect(response.status).toEqual(200);
    expect(response.body).toHaveLength(2);
  });

  it('should get the plugin by name', async () => {
    const { backendServer } = await setupTestWithMockCatalog({
      mockData: mockPlugins[0],
      name: 'plugin1',
    });

    const response = await request(backendServer).get(
      '/api/marketplace/plugins/plugin1',
    );

    expect(response.status).toEqual(200);
    expect(response.body.metadata.name).toEqual('plugin1');
  });

  it('should throw error while fetching plugin by name', async () => {
    const { backendServer } = await setupTestWithMockCatalog({
      mockData: {},
    });
    const response = await request(backendServer).get(
      '/api/marketplace/plugins/test-plugin',
    );

    expect(response.status).toEqual(404);
    expect(response.body).toEqual({ error: 'Plugin:test-plugin not found' });
  });

  it('should get all the pluginlist entities', async () => {
    const { backendServer } = await setupTestWithMockCatalog({
      mockData: mockPluginList,
    });

    const response = await request(backendServer).get(
      '/api/marketplace/pluginlists',
    );

    expect(response.status).toEqual(200);
    expect(response.body).toHaveLength(1);
  });

  it('should get the pluginlist by name', async () => {
    const { backendServer } = await setupTestWithMockCatalog({
      mockData: mockPluginList[0],
      name: 'featured-plugins',
      kind: 'pluginlist',
    });

    const response = await request(backendServer).get(
      '/api/marketplace/pluginlists/featured-plugins',
    );

    expect(response.status).toEqual(200);
    expect(response.body.metadata.name).toEqual('test-featured-plugins');
    expect(response.body.spec.plugins).toEqual(['plugin1', 'plugin2']);
  });

  it('should throw error while fetching pluginlist by name', async () => {
    const { backendServer } = await setupTestWithMockCatalog({
      mockData: null,
      name: 'invalid-pluginlist',
      kind: 'pluginlist',
    });

    const response = await request(backendServer).get(
      '/api/marketplace/pluginlists/invalid-pluginlist',
    );

    expect(response.status).toEqual(404);
    expect(response.body).toEqual({
      error: 'PluginList:invalid-pluginlist not found',
    });
  });

  it('should return empty array when plugins is not set in the pluginList entity', async () => {
    const { backendServer } = await setupTestWithMockCatalog({
      mockData: { ...mockPluginList[0], spec: {} },
      name: 'featured-plugins',
      kind: 'pluginlist',
    });

    const response = await request(backendServer).get(
      '/api/marketplace/pluginlists/featured-plugins/plugins',
    );

    expect(response.status).toEqual(200);
    expect(response.body).toEqual([]);
  });

  it('should return all the plugins by the pluginlist name', async () => {
    const { server } = testSetup();
    const backendServer = await startBackendServer();
    server.use(
      rest.get(
        `http://localhost:${backendServer.port()}/api/catalog/entities/by-name/pluginlist/default/featured-plugins`,
        (_, res, ctx) => res(ctx.status(200), ctx.json(mockPluginList[0])),
      ),
      rest.post(
        `http://localhost:${backendServer.port()}/api/catalog/entities/by-refs`,
        (_, res, ctx) => res(ctx.status(200), ctx.json({ items: mockPlugins })),
      ),
    );

    const response = await request(backendServer).get(
      '/api/marketplace/pluginlists/featured-plugins/plugins',
    );

    expect(response.status).toEqual(200);
    expect(response.body).toHaveLength(2);
    expect(response.body[0].metadata.name).toBe('plugin1');
    expect(response.body[1].metadata.name).toBe('plugin2');
  });

  it('should throw an error when the pluginlist is not available', async () => {
    const { backendServer } = await setupTestWithMockCatalog({
      mockData: null,
      name: 'featured-plugins',
      kind: 'pluginlist',
    });

    const response = await request(backendServer).get(
      '/api/marketplace/pluginlists/featured-plugins/plugins',
    );

    expect(response.status).toEqual(404);
    expect(response.body).toEqual({
      error: 'PluginList:featured-plugins not found',
    });
  });
});
