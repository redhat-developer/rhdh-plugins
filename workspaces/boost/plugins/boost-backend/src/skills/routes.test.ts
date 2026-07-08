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
  RootConfigService,
} from '@backstage/backend-plugin-api';
import { createSkillsRoutes } from './routes';

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

function createMockConfig(overrides?: {
  skillsEnabled?: boolean;
  skillsEndpoint?: string;
}): RootConfigService {
  const values: Record<string, unknown> = {
    'boost.features.skillsMarketplace': overrides?.skillsEnabled ?? true,
    'boost.skillsMarketplace.endpoint':
      overrides?.skillsEndpoint ?? 'http://skills.example.com',
  };

  return {
    getOptionalString: jest.fn(
      (key: string) => values[key] as string | undefined,
    ),
    getOptionalBoolean: jest.fn(
      (key: string) => values[key] as boolean | undefined,
    ),
    getString: jest.fn((key: string) => {
      const v = values[key];
      if (v === undefined) {
        throw new Error(`Missing required config: ${key}`);
      }
      return v as string;
    }),
    // Minimal stubs for the rest of the config interface
    has: jest.fn(() => false),
    keys: jest.fn(() => []),
    get: jest.fn(),
    getOptional: jest.fn(),
    getConfig: jest.fn(),
    getOptionalConfig: jest.fn(),
    getConfigArray: jest.fn(),
    getOptionalConfigArray: jest.fn(),
    getNumber: jest.fn(),
    getOptionalNumber: jest.fn(),
    getBoolean: jest.fn(),
    getOptionalStringArray: jest.fn(),
    getStringArray: jest.fn(),
  } as unknown as RootConfigService;
}

interface TestApp {
  server: http.Server;
  url: string;
  close: () => Promise<void>;
}

async function createTestApp(options?: {
  permissions?: PermissionsService;
  httpAuth?: HttpAuthService;
  config?: RootConfigService;
}): Promise<TestApp> {
  const app = express();
  app.use(express.json());
  const router = createSkillsRoutes({
    permissions: options?.permissions ?? createMockPermissions(),
    httpAuth: options?.httpAuth ?? createMockHttpAuth(),
    logger: createMockLogger(),
    config: options?.config ?? createMockConfig(),
  });
  app.use(router);
  const errorStatusMap: Record<string, number> = {
    InputError: 400,
    NotAllowedError: 403,
    NotFoundError: 404,
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
  options?: { method?: string; body?: unknown },
): Promise<{ status: number; body: unknown }> {
  return new Promise((resolve, reject) => {
    const method = options?.method ?? 'GET';
    const req = http.request(`${base}${path}`, { method }, res => {
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
    });
    req.on('error', reject);
    if (options?.body) {
      req.setHeader('Content-Type', 'application/json');
      req.write(JSON.stringify(options.body));
    }
    req.end();
  });
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('skills marketplace routes', () => {
  let testApp: TestApp;

  afterEach(async () => {
    if (testApp) {
      await testApp.close();
    }
  });

  describe('feature gating', () => {
    it('returns 404 when skills marketplace is disabled', async () => {
      const config = createMockConfig({ skillsEnabled: false });
      testApp = await createTestApp({ config });

      const res = await fetchJson(testApp.url, '/skills');
      expect(res.status).toBe(404);
    });
  });

  describe('permission checks', () => {
    it('returns 403 when access permission denied', async () => {
      const permissions = createMockPermissions(AuthorizeResult.DENY);
      testApp = await createTestApp({ permissions });

      const res = await fetchJson(testApp.url, '/skills');
      expect(res.status).toBe(403);
    });
  });

  describe('POST /skills/deploy', () => {
    it('returns 201 with manifest when valid request', async () => {
      testApp = await createTestApp({});

      const res = await fetchJson(testApp.url, '/skills/deploy', {
        method: 'POST',
        body: {
          skillId: 'test-skill',
          ociImage: 'registry.example.com/skill:latest',
          namespace: 'test-ns',
        },
      });

      expect(res.status).toBe(201);
      const data = res.body as {
        deploymentId: string;
        skillId: string;
        namespace: string;
        status: string;
        manifest: { kind: string };
      };
      expect(data.skillId).toBe('test-skill');
      expect(data.namespace).toBe('test-ns');
      expect(data.manifest.kind).toBe('Deployment');
      expect(data.manifest).toHaveProperty('metadata');
      expect(data.status).toBe('pending');
    });

    it('returns 400 when skillId missing', async () => {
      testApp = await createTestApp({});

      const res = await fetchJson(testApp.url, '/skills/deploy', {
        method: 'POST',
        body: { ociImage: 'registry.example.com/skill:latest' },
      });

      expect(res.status).toBe(400);
    });

    it('returns 400 when ociImage missing', async () => {
      testApp = await createTestApp({});

      const res = await fetchJson(testApp.url, '/skills/deploy', {
        method: 'POST',
        body: { skillId: 'test-skill' },
      });

      expect(res.status).toBe(400);
    });

    it('uses default namespace when not provided', async () => {
      testApp = await createTestApp({});

      const res = await fetchJson(testApp.url, '/skills/deploy', {
        method: 'POST',
        body: {
          skillId: 'test-skill',
          ociImage: 'registry.example.com/skill:latest',
        },
      });

      expect(res.status).toBe(201);
      const data = res.body as { namespace: string };
      expect(data.namespace).toBe('boost-skills');
    });

    it('includes chatEndpoint when provided', async () => {
      testApp = await createTestApp({});

      const res = await fetchJson(testApp.url, '/skills/deploy', {
        method: 'POST',
        body: {
          skillId: 'test-skill',
          ociImage: 'registry.example.com/skill:latest',
          chatEndpoint: 'http://skill:8080/chat',
        },
      });

      expect(res.status).toBe(201);
      const data = res.body as { chatEndpoint: string };
      expect(data.chatEndpoint).toBe('http://skill:8080/chat');
    });

    it('returns 403 when admin permission denied', async () => {
      const permissions = createMockPermissions(AuthorizeResult.DENY);
      testApp = await createTestApp({ permissions });

      const res = await fetchJson(testApp.url, '/skills/deploy', {
        method: 'POST',
        body: {
          skillId: 'test-skill',
          ociImage: 'registry.example.com/skill:latest',
        },
      });

      expect(res.status).toBe(403);
    });
  });

  describe('GET /skills/deployments/:id', () => {
    it('returns deployment status', async () => {
      testApp = await createTestApp({});

      const res = await fetchJson(
        testApp.url,
        '/skills/deployments/skill-test-123',
      );

      expect(res.status).toBe(200);
      const data = res.body as { deploymentId: string; status: string };
      expect(data.deploymentId).toBe('skill-test-123');
      expect(data.status).toBe('unknown');
    });
  });
});
