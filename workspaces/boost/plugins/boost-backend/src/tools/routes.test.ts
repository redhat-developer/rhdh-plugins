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
import { createToolRoutes } from './routes';
import type { ToolLifecycleStore } from './ToolLifecycleStore';
import type { ToolRecord } from '@red-hat-developer-hub/backstage-plugin-boost-common';

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

function makeTool(overrides: Partial<ToolRecord> = {}): ToolRecord {
  return {
    id: 'tool-1',
    name: 'Test Tool',
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
  overrides: Partial<ToolLifecycleStore> = {},
): ToolLifecycleStore {
  return {
    list: jest.fn().mockResolvedValue([]),
    get: jest.fn().mockResolvedValue(undefined),
    register: jest
      .fn()
      .mockImplementation(
        async (tool: { id: string; name: string; createdBy: string }) =>
          makeTool({
            id: tool.id,
            name: tool.name,
            createdBy: tool.createdBy,
          }),
      ),
    updateStage: jest
      .fn()
      .mockImplementation(async (id: string, stage: string) =>
        makeTool({
          id,
          lifecycleStage: stage as ToolRecord['lifecycleStage'],
        }),
      ),
    delete: jest.fn().mockResolvedValue(true),
    ...overrides,
  } as ToolLifecycleStore;
}

interface TestApp {
  server: http.Server;
  url: string;
  close: () => Promise<void>;
}

async function createTestApp(options: {
  store?: ToolLifecycleStore;
  permissions?: PermissionsService;
  httpAuth?: HttpAuthService;
}): Promise<TestApp> {
  const app = express();
  app.use(express.json());
  const router = createToolRoutes({
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

describe('tool routes', () => {
  let testApp: TestApp;

  afterEach(async () => {
    if (testApp) {
      await testApp.close();
    }
  });

  describe('PUT /tools/:id/promote', () => {
    it('promotes a draft tool to pending', async () => {
      const tool = makeTool({ lifecycleStage: 'draft' });
      const store = createMockStore({
        get: jest.fn().mockResolvedValue(tool),
      });
      testApp = await createTestApp({ store });

      const res = await fetchJson(testApp.url, '/tools/tool-1/promote', {
        method: 'PUT',
      });

      expect(res.status).toBe(200);
      expect(store.updateStage).toHaveBeenCalledWith('tool-1', 'pending');
    });

    it('returns 400 when tool is not in draft stage (published)', async () => {
      const tool = makeTool({ lifecycleStage: 'published' });
      const store = createMockStore({
        get: jest.fn().mockResolvedValue(tool),
      });
      testApp = await createTestApp({ store });

      const res = await fetchJson(testApp.url, '/tools/tool-1/promote', {
        method: 'PUT',
      });

      expect(res.status).toBe(400);
    });

    it('returns 404 when tool not found', async () => {
      const store = createMockStore({
        get: jest.fn().mockResolvedValue(undefined),
      });
      testApp = await createTestApp({ store });

      const res = await fetchJson(testApp.url, '/tools/nonexistent/promote', {
        method: 'PUT',
      });

      expect(res.status).toBe(404);
    });

    it('returns 403 when permission denied', async () => {
      const tool = makeTool({ lifecycleStage: 'draft' });
      const store = createMockStore({
        get: jest.fn().mockResolvedValue(tool),
      });
      const permissions = createMockPermissions(AuthorizeResult.DENY);
      testApp = await createTestApp({ store, permissions });

      const res = await fetchJson(testApp.url, '/tools/tool-1/promote', {
        method: 'PUT',
      });

      expect(res.status).toBe(403);
    });
  });

  describe('PUT /tools/:id/demote', () => {
    it('demotes a pending tool to draft', async () => {
      const tool = makeTool({ lifecycleStage: 'pending' });
      const store = createMockStore({
        get: jest.fn().mockResolvedValue(tool),
      });
      testApp = await createTestApp({ store });

      const res = await fetchJson(testApp.url, '/tools/tool-1/demote', {
        method: 'PUT',
      });

      expect(res.status).toBe(200);
      expect(store.updateStage).toHaveBeenCalledWith('tool-1', 'draft');
    });

    it('demotes a published tool to pending', async () => {
      const tool = makeTool({ lifecycleStage: 'published' });
      const store = createMockStore({
        get: jest.fn().mockResolvedValue(tool),
      });
      testApp = await createTestApp({ store });

      const res = await fetchJson(testApp.url, '/tools/tool-1/demote', {
        method: 'PUT',
      });

      expect(res.status).toBe(200);
      expect(store.updateStage).toHaveBeenCalledWith('tool-1', 'pending');
    });

    it('returns 400 for invalid transition (draft → draft)', async () => {
      const tool = makeTool({ lifecycleStage: 'draft' });
      const store = createMockStore({
        get: jest.fn().mockResolvedValue(tool),
      });
      testApp = await createTestApp({ store });

      const res = await fetchJson(testApp.url, '/tools/tool-1/demote', {
        method: 'PUT',
      });

      expect(res.status).toBe(400);
    });

    it('returns 404 when tool not found', async () => {
      const store = createMockStore({
        get: jest.fn().mockResolvedValue(undefined),
      });
      testApp = await createTestApp({ store });

      const res = await fetchJson(testApp.url, '/tools/nonexistent/demote', {
        method: 'PUT',
      });

      expect(res.status).toBe(404);
    });
  });

  describe('PUT /tools/:id/publish', () => {
    it('publishes a pending tool', async () => {
      const tool = makeTool({ lifecycleStage: 'pending' });
      const store = createMockStore({
        get: jest.fn().mockResolvedValue(tool),
      });
      testApp = await createTestApp({ store });

      const res = await fetchJson(testApp.url, '/tools/tool-1/publish', {
        method: 'PUT',
      });

      expect(res.status).toBe(200);
      expect(store.updateStage).toHaveBeenCalledWith('tool-1', 'published');
    });

    it('returns 400 for invalid transition (draft → published)', async () => {
      const tool = makeTool({ lifecycleStage: 'draft' });
      const store = createMockStore({
        get: jest.fn().mockResolvedValue(tool),
      });
      testApp = await createTestApp({ store });

      const res = await fetchJson(testApp.url, '/tools/tool-1/publish', {
        method: 'PUT',
      });

      expect(res.status).toBe(400);
    });

    it('returns 404 when tool not found', async () => {
      const store = createMockStore({
        get: jest.fn().mockResolvedValue(undefined),
      });
      testApp = await createTestApp({ store });

      const res = await fetchJson(testApp.url, '/tools/nonexistent/publish', {
        method: 'PUT',
      });

      expect(res.status).toBe(404);
    });
  });

  describe('PUT /tools/:id/unpublish', () => {
    it('unpublishes a published tool', async () => {
      const tool = makeTool({ lifecycleStage: 'published' });
      const store = createMockStore({
        get: jest.fn().mockResolvedValue(tool),
      });
      testApp = await createTestApp({ store });

      const res = await fetchJson(testApp.url, '/tools/tool-1/unpublish', {
        method: 'PUT',
      });

      expect(res.status).toBe(200);
      expect(store.updateStage).toHaveBeenCalledWith('tool-1', 'archived');
    });

    it('returns 400 for invalid transition (draft → archived)', async () => {
      const tool = makeTool({ lifecycleStage: 'draft' });
      const store = createMockStore({
        get: jest.fn().mockResolvedValue(tool),
      });
      testApp = await createTestApp({ store });

      const res = await fetchJson(testApp.url, '/tools/tool-1/unpublish', {
        method: 'PUT',
      });

      expect(res.status).toBe(400);
    });

    it('returns 404 when tool not found', async () => {
      const store = createMockStore({
        get: jest.fn().mockResolvedValue(undefined),
      });
      testApp = await createTestApp({ store });

      const res = await fetchJson(testApp.url, '/tools/nonexistent/unpublish', {
        method: 'PUT',
      });

      expect(res.status).toBe(404);
    });
  });

  describe('permission integration', () => {
    it('allows via admin fallback when fine-grained denies', async () => {
      const tool = makeTool({ lifecycleStage: 'draft' });
      const store = createMockStore({
        get: jest.fn().mockResolvedValue(tool),
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

      const res = await fetchJson(testApp.url, '/tools/tool-1/promote', {
        method: 'PUT',
      });

      expect(res.status).toBe(200);
      expect(authorizeMock).toHaveBeenCalledTimes(2);
    });
  });
});
