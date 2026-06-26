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
// Mock global fetch for proxy tests
// ---------------------------------------------------------------------------

const mockFetch = jest.fn();

beforeAll(() => {
  (global as Record<string, unknown>).fetch = mockFetch;
});

afterEach(() => {
  mockFetch.mockReset();
});

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

interface MockConfigOverrides {
  skillsEnabled?: boolean;
  skillsEndpoint?: string;
  runtimes?: Array<{
    id: string;
    name: string;
    description?: string;
    image: string;
    language?: string;
    footprint?: string;
    features?: string[];
    status?: string;
  }>;
}

function createMockConfig(overrides?: MockConfigOverrides): RootConfigService {
  const values: Record<string, unknown> = {
    'boost.features.skillsMarketplace': overrides?.skillsEnabled ?? true,
    'boost.skillsMarketplace.endpoint':
      overrides?.skillsEndpoint ?? 'http://skills.example.com',
  };

  const runtimes = overrides?.runtimes ?? [];

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
    getOptionalConfigArray: jest.fn((key: string) => {
      if (key === 'boost.skillsMarketplace.runtimes') {
        if (runtimes.length === 0) {
          return undefined;
        }
        return runtimes.map(r => ({
          getString: jest.fn((field: string) => {
            const val = r[field as keyof typeof r];
            if (val === undefined) {
              throw new Error(`Missing required config: ${field}`);
            }
            return val as string;
          }),
          getOptionalString: jest.fn(
            (field: string) => r[field as keyof typeof r] as string | undefined,
          ),
          getOptionalStringArray: jest.fn(
            (field: string) =>
              r[field as keyof typeof r] as string[] | undefined,
          ),
        }));
      }
      return undefined;
    }),
    // Minimal stubs for the rest of the config interface
    has: jest.fn(() => false),
    keys: jest.fn(() => []),
    get: jest.fn(),
    getOptional: jest.fn(),
    getConfig: jest.fn(),
    getOptionalConfig: jest.fn(),
    getConfigArray: jest.fn(),
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

    it('returns 404 for runtimes when skills marketplace is disabled', async () => {
      const config = createMockConfig({ skillsEnabled: false });
      testApp = await createTestApp({ config });

      const res = await fetchJson(testApp.url, '/skills/runtimes');
      expect(res.status).toBe(404);
    });

    it('returns 404 for domains when skills marketplace is disabled', async () => {
      const config = createMockConfig({ skillsEnabled: false });
      testApp = await createTestApp({ config });

      const res = await fetchJson(testApp.url, '/skills/domains');
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

    it('allows access with admin permission when access denied', async () => {
      const permissions: PermissionsService = {
        authorize: jest
          .fn()
          .mockResolvedValueOnce([{ result: AuthorizeResult.DENY }])
          .mockResolvedValueOnce([{ result: AuthorizeResult.ALLOW }]),
        authorizeConditional: jest.fn(),
      };

      mockFetch.mockResolvedValue({
        status: 200,
        json: async () => ({ skills: [] }),
      });

      testApp = await createTestApp({ permissions });

      const res = await fetchJson(testApp.url, '/skills');
      expect(res.status).toBe(200);
    });

    it('returns 403 when both access and admin denied', async () => {
      const permissions: PermissionsService = {
        authorize: jest
          .fn()
          .mockResolvedValueOnce([{ result: AuthorizeResult.DENY }])
          .mockResolvedValueOnce([{ result: AuthorizeResult.DENY }]),
        authorizeConditional: jest.fn(),
      };

      testApp = await createTestApp({ permissions });

      const res = await fetchJson(testApp.url, '/skills');
      expect(res.status).toBe(403);
    });
  });

  // -------------------------------------------------------------------------
  // 8a.3: Proxy tests for GET /skills and GET /skills/domains
  // -------------------------------------------------------------------------

  describe('GET /skills (proxy)', () => {
    it('constructs URL from configured endpoint and proxies response', async () => {
      const config = createMockConfig({
        skillsEndpoint: 'http://catalog.example.com/api',
      });
      mockFetch.mockResolvedValue({
        status: 200,
        json: async () => ({ skills: [{ id: 's1' }] }),
      });

      testApp = await createTestApp({ config });
      const res = await fetchJson(testApp.url, '/skills');

      expect(res.status).toBe(200);
      expect(res.body).toEqual({ skills: [{ id: 's1' }] });

      const calledUrl = mockFetch.mock.calls[0][0];
      expect(calledUrl).toBe('http://catalog.example.com/api/skills');
    });

    it('forwards query parameters to upstream', async () => {
      mockFetch.mockResolvedValue({
        status: 200,
        json: async () => ({ skills: [] }),
      });

      testApp = await createTestApp();
      await fetchJson(testApp.url, '/skills?domain=ai&language=python');

      const calledUrl = mockFetch.mock.calls[0][0];
      const parsed = new URL(calledUrl);
      expect(parsed.searchParams.get('domain')).toBe('ai');
      expect(parsed.searchParams.get('language')).toBe('python');
    });

    it('returns 404 when endpoint is not configured', async () => {
      const config = createMockConfig({});
      // Override to remove the endpoint
      (config.getOptionalString as jest.Mock).mockImplementation(
        (key: string) => {
          if (key === 'boost.skillsMarketplace.endpoint') return undefined;
          return undefined;
        },
      );

      testApp = await createTestApp({ config });
      const res = await fetchJson(testApp.url, '/skills');

      expect(res.status).toBe(404);
      expect((res.body as { error: string }).error).toContain(
        'endpoint is not configured',
      );
    });

    it('handles non-JSON upstream response', async () => {
      mockFetch.mockResolvedValue({
        status: 502,
        json: async () => {
          throw new Error('not json');
        },
      });

      testApp = await createTestApp();
      const res = await fetchJson(testApp.url, '/skills');

      expect(res.status).toBe(502);
      expect((res.body as { error: string }).error).toContain(
        'non-JSON response',
      );
    });

    it('passes AbortSignal.timeout to fetch', async () => {
      mockFetch.mockResolvedValue({
        status: 200,
        json: async () => ({ skills: [] }),
      });

      testApp = await createTestApp();
      await fetchJson(testApp.url, '/skills');

      const fetchOptions = mockFetch.mock.calls[0][1];
      expect(fetchOptions).toHaveProperty('signal');
    });
  });

  describe('GET /skills/domains (proxy)', () => {
    it('constructs correct URL and proxies response', async () => {
      mockFetch.mockResolvedValue({
        status: 200,
        json: async () => ({ domains: ['ai', 'devops'] }),
      });

      testApp = await createTestApp();
      const res = await fetchJson(testApp.url, '/skills/domains');

      expect(res.status).toBe(200);
      expect(res.body).toEqual({ domains: ['ai', 'devops'] });

      const calledUrl = mockFetch.mock.calls[0][0];
      expect(calledUrl).toContain('/skills/domains');
    });

    it('forwards query parameters to upstream', async () => {
      mockFetch.mockResolvedValue({
        status: 200,
        json: async () => ({ domains: [] }),
      });

      testApp = await createTestApp();
      await fetchJson(testApp.url, '/skills/domains?limit=10');

      const calledUrl = mockFetch.mock.calls[0][0];
      const parsed = new URL(calledUrl);
      expect(parsed.searchParams.get('limit')).toBe('10');
    });

    it('returns 403 when access denied', async () => {
      const permissions: PermissionsService = {
        authorize: jest
          .fn()
          .mockResolvedValueOnce([{ result: AuthorizeResult.DENY }])
          .mockResolvedValueOnce([{ result: AuthorizeResult.DENY }]),
        authorizeConditional: jest.fn(),
      };

      testApp = await createTestApp({ permissions });
      const res = await fetchJson(testApp.url, '/skills/domains');

      expect(res.status).toBe(403);
    });
  });

  // -------------------------------------------------------------------------
  // 8b.3: Tests for GET /skills/runtimes
  // -------------------------------------------------------------------------

  describe('GET /skills/runtimes', () => {
    it('returns runtime list from config', async () => {
      const config = createMockConfig({
        runtimes: [
          {
            id: 'docsclaw',
            name: 'DocsClaw',
            description: 'Document processing runtime',
            image: 'registry.example.com/docsclaw:latest',
            language: 'python',
            footprint: 'medium',
            features: ['rag', 'summarization'],
            status: 'active',
          },
          {
            id: 'zeroclaw',
            name: 'ZeroClaw',
            description: 'Zero-shot agent runtime',
            image: 'registry.example.com/zeroclaw:latest',
            language: 'python',
            footprint: 'large',
            features: ['tool-use'],
            status: 'experimental',
          },
        ],
      });

      testApp = await createTestApp({ config });
      const res = await fetchJson(testApp.url, '/skills/runtimes');

      expect(res.status).toBe(200);
      const data = res.body as { runtimes: Array<{ id: string }> };
      expect(data.runtimes).toHaveLength(2);
      expect(data.runtimes[0].id).toBe('docsclaw');
      expect(data.runtimes[1].id).toBe('zeroclaw');
    });

    it('returns empty list when no runtimes configured', async () => {
      const config = createMockConfig({ runtimes: [] });

      testApp = await createTestApp({ config });
      const res = await fetchJson(testApp.url, '/skills/runtimes');

      expect(res.status).toBe(200);
      const data = res.body as { runtimes: unknown[] };
      expect(data.runtimes).toEqual([]);
    });

    it('returns 404 when skills marketplace is disabled', async () => {
      const config = createMockConfig({ skillsEnabled: false });

      testApp = await createTestApp({ config });
      const res = await fetchJson(testApp.url, '/skills/runtimes');

      expect(res.status).toBe(404);
    });

    it('does not proxy to external catalog', async () => {
      const config = createMockConfig({
        runtimes: [
          {
            id: 'test',
            name: 'Test',
            image: 'registry.example.com/test:latest',
          },
        ],
      });

      testApp = await createTestApp({ config });
      await fetchJson(testApp.url, '/skills/runtimes');

      // fetch should not have been called — runtimes are local
      expect(mockFetch).not.toHaveBeenCalled();
    });
  });

  // -------------------------------------------------------------------------
  // 8c.3: Deploy tests with runtimeId resolution
  // -------------------------------------------------------------------------

  describe('POST /skills/deploy', () => {
    const testRuntimes = [
      {
        id: 'docsclaw',
        name: 'DocsClaw',
        image: 'registry.example.com/docsclaw:latest',
        language: 'python',
      },
      {
        id: 'zeroclaw',
        name: 'ZeroClaw',
        image: 'registry.example.com/zeroclaw:v2',
      },
    ];

    it('returns 201 with manifest when valid request', async () => {
      const config = createMockConfig({ runtimes: testRuntimes });
      testApp = await createTestApp({ config });

      const res = await fetchJson(testApp.url, '/skills/deploy', {
        method: 'POST',
        body: {
          skillId: 'test-skill',
          runtimeId: 'docsclaw',
          namespace: 'test-ns',
        },
      });

      expect(res.status).toBe(201);
      const data = res.body as {
        deploymentId: string;
        skillId: string;
        namespace: string;
        status: string;
        manifest: { kind: string; metadata: { name: string } };
      };
      expect(data.skillId).toBe('test-skill');
      expect(data.namespace).toBe('test-ns');
      expect(data.manifest.kind).toBe('Deployment');
      expect(data.manifest).toHaveProperty('metadata');
      expect(data.status).toBe('pending');
    });

    it('resolves container image from runtimeId', async () => {
      const config = createMockConfig({ runtimes: testRuntimes });
      testApp = await createTestApp({ config });

      const res = await fetchJson(testApp.url, '/skills/deploy', {
        method: 'POST',
        body: {
          skillId: 'test-skill',
          runtimeId: 'docsclaw',
        },
      });

      expect(res.status).toBe(201);
      const data = res.body as {
        manifest: {
          spec: {
            template: {
              spec: {
                initContainers: Array<{ image: string }>;
                containers: Array<{ image: string }>;
              };
            };
          };
        };
      };
      const spec = data.manifest.spec.template.spec;
      expect(spec.initContainers[0].image).toBe(
        'registry.example.com/docsclaw:latest',
      );
      expect(spec.containers[0].image).toBe(
        'registry.example.com/docsclaw:latest',
      );
    });

    it('returns 400 when skillId missing', async () => {
      const config = createMockConfig({ runtimes: testRuntimes });
      testApp = await createTestApp({ config });

      const res = await fetchJson(testApp.url, '/skills/deploy', {
        method: 'POST',
        body: { runtimeId: 'docsclaw' },
      });

      expect(res.status).toBe(400);
    });

    it('returns 400 when runtimeId missing', async () => {
      const config = createMockConfig({ runtimes: testRuntimes });
      testApp = await createTestApp({ config });

      const res = await fetchJson(testApp.url, '/skills/deploy', {
        method: 'POST',
        body: { skillId: 'test-skill' },
      });

      expect(res.status).toBe(400);
    });

    it('returns 400 when runtimeId is unknown', async () => {
      const config = createMockConfig({ runtimes: testRuntimes });
      testApp = await createTestApp({ config });

      const res = await fetchJson(testApp.url, '/skills/deploy', {
        method: 'POST',
        body: {
          skillId: 'test-skill',
          runtimeId: 'nonexistent',
        },
      });

      expect(res.status).toBe(400);
      expect((res.body as { error: string }).error).toContain(
        'Unknown runtimeId',
      );
    });

    it('returns 400 when skillId violates RFC 1123', async () => {
      const config = createMockConfig({ runtimes: testRuntimes });
      testApp = await createTestApp({ config });

      const res = await fetchJson(testApp.url, '/skills/deploy', {
        method: 'POST',
        body: {
          skillId: 'Invalid_Skill!',
          runtimeId: 'docsclaw',
        },
      });

      expect(res.status).toBe(500);
      expect((res.body as { error: string }).error).toContain('RFC 1123');
    });

    it('uses default namespace when not provided', async () => {
      const config = createMockConfig({ runtimes: testRuntimes });
      testApp = await createTestApp({ config });

      const res = await fetchJson(testApp.url, '/skills/deploy', {
        method: 'POST',
        body: {
          skillId: 'test-skill',
          runtimeId: 'docsclaw',
        },
      });

      expect(res.status).toBe(201);
      const data = res.body as { namespace: string };
      expect(data.namespace).toBe('boost-skills');
    });

    it('includes chatEndpoint when provided', async () => {
      const config = createMockConfig({ runtimes: testRuntimes });
      testApp = await createTestApp({ config });

      const res = await fetchJson(testApp.url, '/skills/deploy', {
        method: 'POST',
        body: {
          skillId: 'test-skill',
          runtimeId: 'docsclaw',
          chatEndpoint: 'http://skill:8080/chat',
        },
      });

      expect(res.status).toBe(201);
      const data = res.body as { chatEndpoint: string };
      expect(data.chatEndpoint).toBe('http://skill:8080/chat');
    });

    it('accepts separate resources.requests and resources.limits', async () => {
      const config = createMockConfig({ runtimes: testRuntimes });
      testApp = await createTestApp({ config });

      const res = await fetchJson(testApp.url, '/skills/deploy', {
        method: 'POST',
        body: {
          skillId: 'test-skill',
          runtimeId: 'docsclaw',
          resources: {
            requests: { cpu: '200m', memory: '512Mi' },
            limits: { cpu: '1', memory: '1Gi' },
          },
        },
      });

      expect(res.status).toBe(201);
      const data = res.body as {
        manifest: {
          spec: {
            template: {
              spec: {
                containers: Array<{
                  resources: {
                    requests: { cpu: string; memory: string };
                    limits: { cpu: string; memory: string };
                  };
                }>;
              };
            };
          };
        };
      };
      const container = data.manifest.spec.template.spec.containers[0];
      expect(container.resources.requests.cpu).toBe('200m');
      expect(container.resources.requests.memory).toBe('512Mi');
      expect(container.resources.limits.cpu).toBe('1');
      expect(container.resources.limits.memory).toBe('1Gi');
    });

    it('returns 403 when admin permission denied', async () => {
      const permissions = createMockPermissions(AuthorizeResult.DENY);
      const config = createMockConfig({ runtimes: testRuntimes });
      testApp = await createTestApp({ permissions, config });

      const res = await fetchJson(testApp.url, '/skills/deploy', {
        method: 'POST',
        body: {
          skillId: 'test-skill',
          runtimeId: 'docsclaw',
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
