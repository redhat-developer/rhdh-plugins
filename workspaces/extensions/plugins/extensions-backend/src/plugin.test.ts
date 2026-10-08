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
import { setupServer } from 'msw/node';
import request from 'supertest';

import { createServiceFactory } from '@backstage/backend-plugin-api';
import { mockServices, startTestBackend } from '@backstage/backend-test-utils';
import {
  DynamicPluginProvider,
  dynamicPluginsServiceRef,
} from '@backstage/backend-dynamic-feature-service';

import { mockPlugins } from '../__fixtures__/mockData';
import { extensionsPlugin } from './plugin';

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

const mockDynamicPluginProvider: DynamicPluginProvider = {
  plugins: () => [],
  getScannedPackage: () => {
    throw new Error('getScannedPackage is not used in this test');
  },
  frontendPlugins: () => [],
  backendPlugins: () => [],
};

const mockDynamicPluginsServiceFactory = createServiceFactory({
  service: dynamicPluginsServiceRef,
  deps: {},
  factory: () => mockDynamicPluginProvider,
});

describe('extensionsPlugin', () => {
  const catalogServer = setupServer();

  beforeAll(() => {
    catalogServer.listen({
      onUnhandledRequest: (req, print) => {
        if (
          req.url.pathname === '/' ||
          req.url.pathname.startsWith('/api/extensions')
        ) {
          return;
        }
        print.warning();
      },
    });
  });

  afterAll(() => catalogServer.close());

  afterEach(() => {
    catalogServer.resetHandlers();
  });

  it('is a backend feature', () => {
    expect(extensionsPlugin).toEqual(
      expect.objectContaining({
        $$type: '@backstage/BackendFeature',
      }),
    );
  });

  it('mounts the router and serves GET /plugins', async () => {
    const backend = await startTestBackend({
      features: [
        extensionsPlugin,
        mockServices.rootLogger.factory(),
        mockServices.rootConfig.factory({ data: BASE_CONFIG }),
        mockDynamicPluginsServiceFactory,
      ],
    });

    try {
      catalogServer.use(
        rest.get(
          `http://localhost:${backend.server.port()}/api/catalog/entities/by-query`,
          (_req, res, ctx) =>
            res(ctx.status(200), ctx.json({ items: mockPlugins })),
        ),
      );

      const response = await request(backend.server).get(
        '/api/extensions/plugins',
      );

      expect(response.status).toEqual(200);
      expect(response.body).toEqual(
        expect.objectContaining({
          items: mockPlugins,
        }),
      );
    } finally {
      await backend.stop();
    }
  });
});
