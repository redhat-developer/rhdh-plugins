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
import { createAgentRoutes } from './routes';
import type { AgentLifecycleStore } from './AgentLifecycleStore';
import type { AgentRecord } from '@red-hat-developer-hub/backstage-plugin-boost-common';

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

function makeAgent(overrides: Partial<AgentRecord> = {}): AgentRecord {
  return {
    id: 'agent-1',
    name: 'Test Agent',
    lifecycleStage: 'draft',
    createdBy: 'user:default/testuser',
    governanceRegistered: true,
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
  overrides: Partial<AgentLifecycleStore> = {},
): AgentLifecycleStore {
  return {
    list: jest.fn().mockResolvedValue([]),
    get: jest.fn().mockResolvedValue(undefined),
    register: jest
      .fn()
      .mockImplementation(
        async (agent: { id: string; name: string; createdBy: string }) =>
          makeAgent({
            id: agent.id,
            name: agent.name,
            createdBy: agent.createdBy,
          }),
      ),
    updateStage: jest
      .fn()
      .mockImplementation(async (id: string, stage: string) =>
        makeAgent({
          id,
          lifecycleStage: stage as AgentRecord['lifecycleStage'],
        }),
      ),
    delete: jest.fn().mockResolvedValue(true),
    ...overrides,
  } as AgentLifecycleStore;
}

interface TestApp {
  server: http.Server;
  url: string;
  close: () => Promise<void>;
}

async function createTestApp(options: {
  store?: AgentLifecycleStore;
  permissions?: PermissionsService;
  httpAuth?: HttpAuthService;
}): Promise<TestApp> {
  const app = express();
  app.use(express.json());
  const router = createAgentRoutes({
    store: options.store ?? createMockStore(),
    permissions: options.permissions ?? createMockPermissions(),
    httpAuth: options.httpAuth ?? createMockHttpAuth(),
    logger: createMockLogger(),
  });
  app.use(router);
  // Error handler: map Backstage error names to HTTP status codes
  const errorStatusMap: Record<string, number> = {
    InputError: 400,
    NotFoundError: 404,
    NotAllowedError: 403,
    AuthenticationError: 401,
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

describe('agent routes', () => {
  let testApp: TestApp;

  afterEach(async () => {
    if (testApp) {
      await testApp.close();
    }
  });

  describe('GET /agents', () => {
    it('returns a list of agents', async () => {
      const agents = [
        makeAgent(),
        makeAgent({ id: 'agent-2', name: 'Agent 2' }),
      ];
      const store = createMockStore({
        list: jest.fn().mockResolvedValue(agents),
      });
      testApp = await createTestApp({ store });

      const res = await fetchJson(testApp.url, '/agents');
      expect(res.status).toBe(200);
      const data = res.body as { agents: AgentRecord[] };
      expect(data.agents).toHaveLength(2);
      expect(data.agents[0].id).toBe('agent-1');
    });

    it('returns 403 when permission denied', async () => {
      const permissions = createMockPermissions(AuthorizeResult.DENY);
      testApp = await createTestApp({ permissions });

      const res = await fetchJson(testApp.url, '/agents');
      expect(res.status).toBe(403);
    });
  });

  describe('PUT /agents/:id/register', () => {
    it('registers a new agent in draft stage', async () => {
      const store = createMockStore({
        get: jest.fn().mockResolvedValue(undefined),
      });
      testApp = await createTestApp({ store });

      const res = await fetchJson(testApp.url, '/agents/new-agent/register', {
        method: 'PUT',
        body: { name: 'New Agent', description: 'A test agent' },
      });

      expect(res.status).toBe(201);
      const data = res.body as AgentRecord;
      expect(data.id).toBe('new-agent');
      expect(data.lifecycleStage).toBe('draft');
      expect(store.register).toHaveBeenCalledWith(
        expect.objectContaining({
          id: 'new-agent',
          name: 'New Agent',
          description: 'A test agent',
        }),
      );
    });

    it('returns 400 when name is missing', async () => {
      testApp = await createTestApp({});

      const res = await fetchJson(testApp.url, '/agents/new-agent/register', {
        method: 'PUT',
        body: {},
      });

      expect(res.status).toBe(400);
    });

    it('returns 400 when agent already exists', async () => {
      const store = createMockStore({
        get: jest.fn().mockResolvedValue(makeAgent()),
      });
      testApp = await createTestApp({ store });

      const res = await fetchJson(testApp.url, '/agents/agent-1/register', {
        method: 'PUT',
        body: { name: 'Existing Agent' },
      });

      expect(res.status).toBe(400);
    });
  });

  describe('PUT /agents/:id/promote', () => {
    it('promotes a draft agent to pending', async () => {
      const agent = makeAgent({ lifecycleStage: 'draft' });
      const store = createMockStore({
        get: jest.fn().mockResolvedValue(agent),
      });
      testApp = await createTestApp({ store });

      const res = await fetchJson(testApp.url, '/agents/agent-1/promote', {
        method: 'PUT',
      });

      expect(res.status).toBe(200);
      expect(store.updateStage).toHaveBeenCalledWith('agent-1', 'pending');
    });

    it('returns 400 for invalid transition (published → pending)', async () => {
      const agent = makeAgent({ lifecycleStage: 'published' });
      const store = createMockStore({
        get: jest.fn().mockResolvedValue(agent),
      });
      testApp = await createTestApp({ store });

      const res = await fetchJson(testApp.url, '/agents/agent-1/promote', {
        method: 'PUT',
      });

      expect(res.status).toBe(400);
    });

    it('returns 404 when agent not found', async () => {
      const store = createMockStore({
        get: jest.fn().mockResolvedValue(undefined),
      });
      testApp = await createTestApp({ store });

      const res = await fetchJson(testApp.url, '/agents/nonexistent/promote', {
        method: 'PUT',
      });

      expect(res.status).toBe(404);
    });
  });

  describe('PUT /agents/:id/approve', () => {
    it('approves a pending agent to published', async () => {
      const agent = makeAgent({ lifecycleStage: 'pending' });
      const store = createMockStore({
        get: jest.fn().mockResolvedValue(agent),
      });
      testApp = await createTestApp({ store });

      const res = await fetchJson(testApp.url, '/agents/agent-1/approve', {
        method: 'PUT',
      });

      expect(res.status).toBe(200);
      expect(store.updateStage).toHaveBeenCalledWith('agent-1', 'published');
    });

    it('returns 400 for invalid transition (draft → published)', async () => {
      const agent = makeAgent({ lifecycleStage: 'draft' });
      const store = createMockStore({
        get: jest.fn().mockResolvedValue(agent),
      });
      testApp = await createTestApp({ store });

      const res = await fetchJson(testApp.url, '/agents/agent-1/approve', {
        method: 'PUT',
      });

      expect(res.status).toBe(400);
    });
  });

  describe('PUT /agents/:id/request-unpublish', () => {
    it('moves a published agent to archived', async () => {
      const agent = makeAgent({ lifecycleStage: 'published' });
      const store = createMockStore({
        get: jest.fn().mockResolvedValue(agent),
      });
      testApp = await createTestApp({ store });

      const res = await fetchJson(
        testApp.url,
        '/agents/agent-1/request-unpublish',
        { method: 'PUT' },
      );

      expect(res.status).toBe(200);
      expect(store.updateStage).toHaveBeenCalledWith('agent-1', 'archived');
    });

    it('returns 400 for invalid transition (draft → archived)', async () => {
      const agent = makeAgent({ lifecycleStage: 'draft' });
      const store = createMockStore({
        get: jest.fn().mockResolvedValue(agent),
      });
      testApp = await createTestApp({ store });

      const res = await fetchJson(
        testApp.url,
        '/agents/agent-1/request-unpublish',
        { method: 'PUT' },
      );

      expect(res.status).toBe(400);
    });
  });

  describe('PUT /agents/:id/withdraw', () => {
    it('withdraws a pending agent back to draft', async () => {
      const agent = makeAgent({ lifecycleStage: 'pending' });
      const store = createMockStore({
        get: jest.fn().mockResolvedValue(agent),
      });
      testApp = await createTestApp({ store });

      const res = await fetchJson(testApp.url, '/agents/agent-1/withdraw', {
        method: 'PUT',
      });

      expect(res.status).toBe(200);
      expect(store.updateStage).toHaveBeenCalledWith('agent-1', 'draft');
    });

    it('returns 400 for invalid transition (published → draft)', async () => {
      const agent = makeAgent({ lifecycleStage: 'published' });
      const store = createMockStore({
        get: jest.fn().mockResolvedValue(agent),
      });
      testApp = await createTestApp({ store });

      const res = await fetchJson(testApp.url, '/agents/agent-1/withdraw', {
        method: 'PUT',
      });

      expect(res.status).toBe(400);
    });
  });

  describe('DELETE /agents/:id', () => {
    it('deletes a draft agent', async () => {
      const agent = makeAgent({ lifecycleStage: 'draft' });
      const store = createMockStore({
        get: jest.fn().mockResolvedValue(agent),
      });
      testApp = await createTestApp({ store });

      const res = await fetchJson(testApp.url, '/agents/agent-1', {
        method: 'DELETE',
      });

      expect(res.status).toBe(204);
      expect(store.delete).toHaveBeenCalledWith('agent-1');
    });

    it('deletes an archived agent', async () => {
      const agent = makeAgent({ lifecycleStage: 'archived' });
      const store = createMockStore({
        get: jest.fn().mockResolvedValue(agent),
      });
      testApp = await createTestApp({ store });

      const res = await fetchJson(testApp.url, '/agents/agent-1', {
        method: 'DELETE',
      });

      expect(res.status).toBe(204);
    });

    it('returns 400 when deleting a pending agent', async () => {
      const agent = makeAgent({ lifecycleStage: 'pending' });
      const store = createMockStore({
        get: jest.fn().mockResolvedValue(agent),
      });
      testApp = await createTestApp({ store });

      const res = await fetchJson(testApp.url, '/agents/agent-1', {
        method: 'DELETE',
      });

      expect(res.status).toBe(400);
    });

    it('returns 400 when deleting a published agent', async () => {
      const agent = makeAgent({ lifecycleStage: 'published' });
      const store = createMockStore({
        get: jest.fn().mockResolvedValue(agent),
      });
      testApp = await createTestApp({ store });

      const res = await fetchJson(testApp.url, '/agents/agent-1', {
        method: 'DELETE',
      });

      expect(res.status).toBe(400);
    });

    it('returns 404 when agent not found', async () => {
      const store = createMockStore({
        get: jest.fn().mockResolvedValue(undefined),
      });
      testApp = await createTestApp({ store });

      const res = await fetchJson(testApp.url, '/agents/nonexistent', {
        method: 'DELETE',
      });

      expect(res.status).toBe(404);
    });
  });

  describe('permission integration', () => {
    it('denies lifecycle route when both fine-grained and admin deny', async () => {
      const store = createMockStore({
        list: jest.fn().mockResolvedValue([]),
      });
      const permissions = createMockPermissions(AuthorizeResult.DENY);
      testApp = await createTestApp({ store, permissions });

      const res = await fetchJson(testApp.url, '/agents');
      expect(res.status).toBe(403);
    });

    it('allows via admin fallback when fine-grained denies', async () => {
      const agents = [makeAgent()];
      const store = createMockStore({
        list: jest.fn().mockResolvedValue(agents),
      });

      const authorizeMock = jest
        .fn()
        // First call: fine-grained → DENY
        .mockResolvedValueOnce([{ result: AuthorizeResult.DENY }])
        // Second call: admin → ALLOW
        .mockResolvedValueOnce([{ result: AuthorizeResult.ALLOW }]);

      const permissions: PermissionsService = {
        authorize: authorizeMock,
        authorizeConditional: jest.fn(),
      };
      testApp = await createTestApp({ store, permissions });

      const res = await fetchJson(testApp.url, '/agents');
      expect(res.status).toBe(200);
      expect(authorizeMock).toHaveBeenCalledTimes(2);
    });
  });
});
