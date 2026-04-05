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

import * as http from 'http';
import { KagentiApiClient } from './KagentiApiClient';
import { createMockLogger } from '../../../test-utils/mocks';

describe('KagentiApiClient', () => {
  let server: http.Server;
  let port: number;

  const mockTokenManager = {
    getToken: jest.fn().mockResolvedValue('test-token'),
    clearCache: jest.fn(),
  };

  beforeAll(async () => {
    server = http.createServer((req, res) => {
      if (req.url === '/health') {
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ status: 'healthy' }));
      } else if (req.url === '/ready') {
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ status: 'ready' }));
      } else if (req.url === '/api/v1/config/features') {
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(
          JSON.stringify({
            sandbox: false,
            integrations: false,
            triggers: false,
          }),
        );
      } else if (req.url === '/api/v1/namespaces?enabled_only=true') {
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ namespaces: ['team1', 'team2'] }));
      } else if (req.url === '/api/v1/agents?namespace=team1') {
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(
          JSON.stringify({
            items: [
              {
                name: 'bot',
                namespace: 'team1',
                description: '',
                status: 'Running',
                labels: { protocol: 'a2a', framework: 'LangGraph' },
                workloadType: 'deployment',
              },
            ],
          }),
        );
      } else if (req.url === '/api/v1/chat/team1/bot/agent-card') {
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(
          JSON.stringify({
            name: 'bot',
            description: 'A bot',
            version: '1.0',
            url: 'http://bot:8000',
            streaming: true,
            skills: [],
          }),
        );
      } else if (
        req.url === '/api/v1/agents/parse-env' &&
        req.method === 'POST'
      ) {
        const chunks: Buffer[] = [];
        req.on('data', c => chunks.push(c));
        req.on('end', () => {
          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ envVars: [], warnings: [] }));
        });
      } else if (req.url === '/api/v1/tools?namespace=team1') {
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ items: [] }));
      } else if (
        req.url?.startsWith('/api/v1/tools/team1/my-tool/connect') &&
        req.method === 'POST'
      ) {
        const chunks: Buffer[] = [];
        req.on('data', c => chunks.push(c));
        req.on('end', () => {
          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end(
            JSON.stringify({
              tools: [{ name: 'search', description: 'Search tool' }],
            }),
          );
        });
      } else if (req.url === '/api/v1/shipwright/builds') {
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ items: [] }));
      } else {
        res.writeHead(404);
        res.end('Not found');
      }
    });
    await new Promise<void>(resolve => {
      server.listen(0, () => {
        const addr = server.address();
        port = typeof addr === 'object' && addr ? addr.port : 0;
        resolve();
      });
    });
  });

  afterAll(async () => {
    await new Promise<void>(resolve => server.close(() => resolve()));
  });

  function createClient() {
    return new KagentiApiClient({
      baseUrl: `http://localhost:${port}`,
      tokenManager: mockTokenManager as never,
      logger: createMockLogger(),
    });
  }

  it('checks health', async () => {
    const client = createClient();
    const result = await client.health();
    expect(result.status).toBe('healthy');
  });

  it('checks readiness', async () => {
    const client = createClient();
    const result = await client.ready();
    expect(result.status).toBe('ready');
  });

  it('gets feature flags', async () => {
    const client = createClient();
    const result = await client.getFeatureFlags();
    expect(result).toEqual({
      sandbox: false,
      integrations: false,
      triggers: false,
    });
  });

  it('lists namespaces', async () => {
    const client = createClient();
    const result = await client.listNamespaces();
    expect(result.namespaces).toEqual(['team1', 'team2']);
  });

  it('lists agents', async () => {
    const client = createClient();
    const result = await client.listAgents('team1');
    expect(result.items).toHaveLength(1);
    expect(result.items[0].name).toBe('bot');
  });

  it('gets agent card', async () => {
    const client = createClient();
    const result = await client.getAgentCard('team1', 'bot');
    expect(result.name).toBe('bot');
    expect(result.capabilities.streaming).toBe(true);
  });

  it('parses env content', async () => {
    const client = createClient();
    const result = await client.parseEnv('KEY=value');
    expect(result.envVars).toEqual([]);
  });

  it('lists tools', async () => {
    const client = createClient();
    const result = await client.listTools('team1');
    expect(result.items).toEqual([]);
  });

  it('connects to MCP tool', async () => {
    const client = createClient();
    const result = await client.connectTool('team1', 'my-tool');
    expect(result.tools).toHaveLength(1);
    expect(result.tools[0].name).toBe('search');
  });

  it('lists all Shipwright builds', async () => {
    const client = createClient();
    const result = await client.listAllBuilds();
    expect(result.items).toEqual([]);
  });

  it('throws on 404', async () => {
    const client = createClient();
    await expect(client.getAgent('nonexist', 'nope')).rejects.toThrow(
      /status 404/,
    );
  });
});
