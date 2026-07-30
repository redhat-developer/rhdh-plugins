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

import http from 'http';
import express from 'express';
import { AuthorizeResult } from '@backstage/plugin-permission-common';
import type {
  HttpAuthService,
  PermissionsService,
  LoggerService,
} from '@backstage/backend-plugin-api';
import { createMcpServerRoutes } from './routes';
import type { McpServerStore } from './McpServerStore';
import type { McpServerRecord } from '@red-hat-developer-hub/backstage-plugin-boost-common';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function createMockLogger(): LoggerService {
  return {
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
    debug: jest.fn(),
    child: jest.fn().mockReturnThis(),
  };
}

function makeServer(overrides: Partial<McpServerRecord> = {}): McpServerRecord {
  return {
    id: 'mcp-1',
    name: 'Test MCP Server',
    url: 'https://mcp.example.com/api',
    transport: 'streamable-http',
    authType: 'none',
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
    ...overrides,
  };
}

function createMockPermissions(
  result: AuthorizeResult = AuthorizeResult.ALLOW,
): PermissionsService {
  return {
    authorize: jest.fn().mockResolvedValue([{ result }]),
    authorizeConditional: jest.fn(),
  };
}

function createMockHttpAuth(): HttpAuthService {
  return {
    credentials: jest.fn().mockResolvedValue({
      $$type: '@backstage/BackstageCredentials',
      principal: { userEntityRef: 'user:default/testuser' },
    }),
    issueUserCookie: jest.fn(),
  };
}

function createMockStore(
  overrides: Partial<McpServerStore> = {},
): McpServerStore {
  return {
    list: jest.fn().mockResolvedValue([]),
    get: jest.fn().mockResolvedValue(undefined),
    create: jest
      .fn()
      .mockImplementation(
        async (server: { id: string; name: string; url: string }) =>
          makeServer({
            id: server.id,
            name: server.name,
            url: server.url,
          }),
      ),
    update: jest
      .fn()
      .mockImplementation(async (id: string, fields: { name?: string }) =>
        makeServer({ id, name: fields.name }),
      ),
    delete: jest.fn().mockResolvedValue(true),
    ...overrides,
  } as McpServerStore;
}

interface TestApp {
  server: http.Server;
  url: string;
  close: () => Promise<void>;
}

async function createTestApp(options: {
  store?: McpServerStore;
  permissions?: PermissionsService;
  httpAuth?: HttpAuthService;
}): Promise<TestApp> {
  const app = express();
  app.use(express.json());
  const router = createMcpServerRoutes({
    store: options.store ?? createMockStore(),
    permissions: options.permissions ?? createMockPermissions(),
    httpAuth: options.httpAuth ?? createMockHttpAuth(),
    logger: createMockLogger(),
  });
  app.use(router);
  const errorStatusMap: Record<string, number> = {
    InputError: 400,
    NotFoundError: 404,
    NotAllowedError: 403,
    ConflictError: 409,
  };
  app.use(
    (
      err: Error,
      _req: express.Request,
      res: express.Response,
      _next: express.NextFunction,
    ) => {
      const status = errorStatusMap[err.name] ?? 500;
      res.status(status).json({ error: err.message });
    },
  );

  return new Promise(resolve => {
    const server = app.listen(0, '127.0.0.1', () => {
      const addr = server.address() as { port: number };
      resolve({
        server,
        url: `http://127.0.0.1:${addr.port}`,
        close: () =>
          new Promise<void>((res2, rej) =>
            server.close(err => (err ? rej(err) : res2())),
          ),
      });
    });
  });
}

async function fetchJson(
  base: string,
  path: string,
  options: { method?: string; body?: unknown } = {},
): Promise<{ status: number; body: unknown }> {
  const { method = 'GET', body } = options;
  const payload = body ? JSON.stringify(body) : undefined;
  return new Promise((resolve, reject) => {
    const req = http.request(
      `${base}${path}`,
      {
        method,
        headers: payload ? { 'Content-Type': 'application/json' } : undefined,
      },
      res => {
        const chunks: Buffer[] = [];
        res.on('data', c => chunks.push(c));
        res.on('end', () => {
          const raw = Buffer.concat(chunks).toString();
          let parsed: unknown;
          try {
            parsed = JSON.parse(raw);
          } catch {
            parsed = raw;
          }
          resolve({ status: res.statusCode ?? 0, body: parsed });
        });
      },
    );
    req.on('error', reject);
    if (payload) {
      req.write(payload);
    }
    req.end();
  });
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('MCP server routes', () => {
  let testApp: TestApp;

  afterEach(async () => {
    if (testApp) {
      await testApp.close();
    }
  });

  describe('GET /mcp/servers', () => {
    it('returns a list of MCP servers', async () => {
      const servers = [
        makeServer(),
        makeServer({ id: 'mcp-2', name: 'Server 2' }),
      ];
      const store = createMockStore({
        list: jest.fn().mockResolvedValue(servers),
      });
      testApp = await createTestApp({ store });

      const res = await fetchJson(testApp.url, '/mcp/servers');
      expect(res.status).toBe(200);
      const data = res.body as { servers: McpServerRecord[] };
      expect(data.servers).toHaveLength(2);
    });

    it('returns 403 when permission denied', async () => {
      const permissions = createMockPermissions(AuthorizeResult.DENY);
      testApp = await createTestApp({ permissions });

      const res = await fetchJson(testApp.url, '/mcp/servers');
      expect(res.status).toBe(403);
    });
  });

  describe('GET /mcp/servers/:id', () => {
    it('returns a single MCP server', async () => {
      const server = makeServer();
      const store = createMockStore({
        get: jest.fn().mockResolvedValue(server),
      });
      testApp = await createTestApp({ store });

      const res = await fetchJson(testApp.url, '/mcp/servers/mcp-1');
      expect(res.status).toBe(200);
      const data = res.body as McpServerRecord;
      expect(data.id).toBe('mcp-1');
    });

    it('returns 404 when not found', async () => {
      testApp = await createTestApp({});

      const res = await fetchJson(testApp.url, '/mcp/servers/nonexistent');
      expect(res.status).toBe(404);
    });
  });

  describe('POST /mcp/servers', () => {
    it('creates a new MCP server', async () => {
      const store = createMockStore();
      testApp = await createTestApp({ store });

      const res = await fetchJson(testApp.url, '/mcp/servers', {
        method: 'POST',
        body: {
          id: 'new-mcp',
          name: 'New Server',
          url: 'https://mcp.example.com',
          transport: 'streamable-http',
          authType: 'none',
        },
      });

      expect(res.status).toBe(201);
      expect(store.create).toHaveBeenCalledWith(
        expect.objectContaining({
          id: 'new-mcp',
          name: 'New Server',
          url: 'https://mcp.example.com',
          transport: 'streamable-http',
        }),
      );
    });

    it('returns 400 when name is missing', async () => {
      testApp = await createTestApp({});

      const res = await fetchJson(testApp.url, '/mcp/servers', {
        method: 'POST',
        body: { id: 'mcp-1', url: 'https://mcp.example.com', transport: 'sse' },
      });

      expect(res.status).toBe(400);
    });

    it('returns 400 for invalid transport', async () => {
      testApp = await createTestApp({});

      const res = await fetchJson(testApp.url, '/mcp/servers', {
        method: 'POST',
        body: {
          id: 'mcp-1',
          name: 'Server',
          url: 'https://mcp.example.com',
          transport: 'invalid',
        },
      });

      expect(res.status).toBe(400);
    });

    it('returns 409 when server already exists', async () => {
      const store = createMockStore({
        get: jest.fn().mockResolvedValue(makeServer()),
      });
      testApp = await createTestApp({ store });

      const res = await fetchJson(testApp.url, '/mcp/servers', {
        method: 'POST',
        body: {
          id: 'mcp-1',
          name: 'Server',
          url: 'https://mcp.example.com',
          transport: 'sse',
        },
      });

      expect(res.status).toBe(409);
    });
  });

  describe('PUT /mcp/servers/:id', () => {
    it('updates an existing MCP server', async () => {
      const server = makeServer();
      const store = createMockStore({
        get: jest.fn().mockResolvedValue(server),
      });
      testApp = await createTestApp({ store });

      const res = await fetchJson(testApp.url, '/mcp/servers/mcp-1', {
        method: 'PUT',
        body: { name: 'Updated Name' },
      });

      expect(res.status).toBe(200);
      expect(store.update).toHaveBeenCalledWith(
        'mcp-1',
        expect.objectContaining({ name: 'Updated Name' }),
      );
    });

    it('returns 404 when server not found', async () => {
      testApp = await createTestApp({});

      const res = await fetchJson(testApp.url, '/mcp/servers/nonexistent', {
        method: 'PUT',
        body: { name: 'Updated' },
      });

      expect(res.status).toBe(404);
    });
  });

  describe('DELETE /mcp/servers/:id', () => {
    it('deletes an MCP server', async () => {
      const server = makeServer();
      const store = createMockStore({
        get: jest.fn().mockResolvedValue(server),
      });
      testApp = await createTestApp({ store });

      const res = await fetchJson(testApp.url, '/mcp/servers/mcp-1', {
        method: 'DELETE',
      });

      expect(res.status).toBe(204);
      expect(store.delete).toHaveBeenCalledWith('mcp-1');
    });

    it('returns 404 when server not found', async () => {
      testApp = await createTestApp({});

      const res = await fetchJson(testApp.url, '/mcp/servers/nonexistent', {
        method: 'DELETE',
      });

      expect(res.status).toBe(404);
    });
  });

  describe('POST /mcp/servers/:id/test', () => {
    it('returns test result for registered server', async () => {
      const server = makeServer();
      const store = createMockStore({
        get: jest.fn().mockResolvedValue(server),
      });
      testApp = await createTestApp({ store });

      const res = await fetchJson(testApp.url, '/mcp/servers/mcp-1/test', {
        method: 'POST',
      });

      expect(res.status).toBe(200);
      const data = res.body as { status: string; serverId: string };
      expect(data.status).toBe('ok');
      expect(data.serverId).toBe('mcp-1');
    });

    it('returns 404 when server not found', async () => {
      testApp = await createTestApp({});

      const res = await fetchJson(
        testApp.url,
        '/mcp/servers/nonexistent/test',
        {
          method: 'POST',
        },
      );

      expect(res.status).toBe(404);
    });
  });

  describe('permission integration', () => {
    it('allows via admin fallback when fine-grained denies', async () => {
      const servers = [makeServer()];
      const store = createMockStore({
        list: jest.fn().mockResolvedValue(servers),
      });

      const authorizeMock = jest
        .fn()
        .mockResolvedValueOnce([{ result: AuthorizeResult.DENY }])
        .mockResolvedValueOnce([{ result: AuthorizeResult.ALLOW }]);

      const permissions: PermissionsService = {
        authorize: authorizeMock,
        authorizeConditional: jest.fn(),
      };
      testApp = await createTestApp({ store, permissions });

      const res = await fetchJson(testApp.url, '/mcp/servers');
      expect(res.status).toBe(200);
      expect(authorizeMock).toHaveBeenCalledTimes(2);
    });
  });
});
