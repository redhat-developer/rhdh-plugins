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

import request from 'supertest';
import { ExtendedHttpServer } from '@backstage/backend-defaults/rootHttpRouter';
import { mockServices, startTestBackend } from '@backstage/backend-test-utils';
import type { Entity } from '@backstage/catalog-model';
import catalogPlugin from '@backstage/plugin-catalog-backend';
import catalogModuleAiModel from '@backstage/plugin-catalog-backend-module-ai-model';
import { catalogModuleMcpRegistryProvider } from './module';

const REGISTRY_BODY = {
  servers: [
    {
      server: {
        $schema:
          'https://static.modelcontextprotocol.io/schemas/2025-12-11/server.schema.json',
        name: 'io.example/weather',
        description: 'Weather',
        version: '1.0.0',
        remotes: [{ type: 'streamable-http', url: 'https://example.com/mcp' }],
      },
    },
  ],
  metadata: { count: 1 },
};

async function waitForApiEntities(
  server: ExtendedHttpServer,
  timeoutMs = 40_000,
): Promise<Entity[]> {
  const start = Date.now();
  let lastBody: unknown;
  while (Date.now() - start < timeoutMs) {
    const response = await request(server).get(
      '/api/catalog/entities?filter=kind=API,spec.type=mcp-server',
    );
    lastBody = response.body;
    if (
      response.status === 200 &&
      Array.isArray(response.body) &&
      response.body.length > 0
    ) {
      return response.body as Entity[];
    }
    await new Promise(resolve => setTimeout(resolve, 500));
  }
  throw new Error(
    `Timed out waiting for mcp-server API entities (last body ${JSON.stringify(
      lastBody,
    )})`,
  );
}

describe('mcp-server catalog processing', () => {
  jest.setTimeout(60_000);

  const originalFetch = global.fetch;
  let server: ExtendedHttpServer;

  beforeAll(async () => {
    global.fetch = jest.fn(async () => {
      return new Response(JSON.stringify(REGISTRY_BODY), {
        status: 200,
        headers: { 'content-type': 'application/json' },
      });
    }) as typeof fetch;

    const backend = await startTestBackend({
      features: [
        catalogPlugin,
        catalogModuleAiModel,
        catalogModuleMcpRegistryProvider,
        mockServices.rootConfig.factory({
          data: {
            app: { baseUrl: 'http://localhost:3000' },
            backend: {
              baseUrl: 'http://localhost:7007',
              database: {
                client: 'better-sqlite3',
                connection: ':memory:',
              },
            },
            catalog: {
              processingInterval: { seconds: 1 },
              rules: [{ allow: ['API'] }],
              providers: {
                mcpRegistry: {
                  baseUrl: 'https://registry.example.com',
                  apiVersion: 'v0.1',
                  defaultOwner: 'user:default/guest',
                  schedule: {
                    frequency: { seconds: 1 },
                    timeout: { seconds: 10 },
                  },
                },
              },
            },
          },
        }),
        mockServices.auth.factory(),
        mockServices.httpAuth.factory(),
      ],
    });
    server = backend.server;
  });

  afterAll(() => {
    global.fetch = originalFetch;
  });

  it('lists a committed mcp-server API that omits spec.definition', async () => {
    const entities = await waitForApiEntities(server);
    expect(entities).toHaveLength(1);
    expect(entities[0].kind).toBe('API');
    expect(entities[0].spec).toEqual(
      expect.objectContaining({
        type: 'mcp-server',
        owner: 'user:default/guest',
      }),
    );
    expect(entities[0].spec).not.toHaveProperty('definition');
  });
});
