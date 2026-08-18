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
import {
  AuthorizeResult,
  type PolicyDecision,
} from '@backstage/plugin-permission-common';
import type {
  HttpAuthService,
  LoggerService,
  PermissionsService,
} from '@backstage/backend-plugin-api';
import {
  aiCatalogAssetAccessPermission,
  aiCatalogAssetAccessUsageDocsPermission,
  aiCatalogAdminPermission,
} from '@red-hat-developer-hub/backstage-plugin-boost-common';
import { createAiCatalogRoutes, stripTier2Fields } from './routes';
import type { AiCatalogAsset, AiCatalogAssetLoader } from './routes';
import type { AiCatalogAssetResource } from './rules';

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

function createMockHttpAuth(): HttpAuthService {
  return {
    credentials: jest.fn().mockResolvedValue({
      $$type: '@backstage/BackstageCredentials',
      principal: { userEntityRef: 'user:default/testuser' },
    }),
    issueUserCookie: jest.fn(),
  };
}

function createMockPermissions(overrides?: {
  authorize?: jest.Mock;
  authorizeConditional?: jest.Mock;
}): PermissionsService {
  return {
    authorize:
      overrides?.authorize ??
      jest.fn().mockResolvedValue([{ result: AuthorizeResult.ALLOW }]),
    authorizeConditional:
      overrides?.authorizeConditional ??
      jest.fn().mockResolvedValue([{ result: AuthorizeResult.ALLOW }]),
  };
}

const fullAsset: AiCatalogAsset = {
  id: 'resource:default/granite-model',
  name: 'Granite Model',
  description: 'IBM Granite foundation model',
  category: 'ai-model',
  lifecycleStage: 'published',
  versionCount: 2,
  tags: ['nlp'],
  usageDocs: '# Usage\nCall the inference endpoint',
  connectionEndpoints: { inference: 'https://api.example.com/v1' },
  config: { temperature: 0.7 },
  deploymentParameters: { replicas: 3 },
};

const minimalAsset: AiCatalogAsset = {
  id: 'airesource:default/code-review-skill',
  name: 'Code Review Skill',
  category: 'skill',
};

function createMockAssetLoader(
  overrides: Partial<AiCatalogAssetLoader> = {},
): AiCatalogAssetLoader {
  return {
    findById: jest.fn().mockResolvedValue(undefined),
    list: jest.fn().mockResolvedValue([]),
    ...overrides,
  };
}

interface TestApp {
  server: http.Server;
  url: string;
  close: () => Promise<void>;
}

async function createTestApp(options: {
  permissions?: PermissionsService;
  httpAuth?: HttpAuthService;
  assetLoader?: AiCatalogAssetLoader;
  isResourceAuthorized?: (
    decision: PolicyDecision,
    resource: AiCatalogAssetResource,
  ) => boolean;
}): Promise<TestApp> {
  const app = express();
  app.use(express.json());
  const router = createAiCatalogRoutes({
    permissions: options.permissions ?? createMockPermissions(),
    httpAuth: options.httpAuth ?? createMockHttpAuth(),
    logger: createMockLogger(),
    assetLoader: options.assetLoader ?? createMockAssetLoader(),
    // Default: DENY everything under CONDITIONAL, matching the
    // conservative default previously hard-coded before F1's fix — tests
    // that need partial/full authorization override this explicitly.
    isResourceAuthorized: options.isResourceAuthorized ?? (() => false),
  });
  app.use(router);
  // Error handler: map Backstage error names to HTTP status codes
  const errorStatusMap: Record<string, number> = {
    InputError: 400,
    NotFoundError: 404,
    NotAllowedError: 403,
    AuthenticationError: 401,
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
): Promise<{ status: number; body: Record<string, unknown> }> {
  return new Promise((resolve, reject) => {
    const req = http.request(`${base}${path}`, { method: 'GET' }, res => {
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
        resolve({
          status: res.statusCode ?? 0,
          body: parsed as Record<string, unknown>,
        });
      });
    });
    req.on('error', reject);
    req.end();
  });
}

// ---------------------------------------------------------------------------
// stripTier2Fields unit tests (task 2.4)
// ---------------------------------------------------------------------------

describe('stripTier2Fields', () => {
  it('omits Tier 2 fields (usage-docs, connection endpoints, config, deployment parameters)', () => {
    const filtered = stripTier2Fields(fullAsset);
    expect(filtered.usageDocs).toBeUndefined();
    expect(filtered.connectionEndpoints).toBeUndefined();
    expect(filtered.config).toBeUndefined();
    expect(filtered.deploymentParameters).toBeUndefined();
  });

  it('preserves Tier 1 fields (name, description, category, lifecycle, versions, tags)', () => {
    const filtered = stripTier2Fields(fullAsset);
    expect(filtered.id).toBe('resource:default/granite-model');
    expect(filtered.name).toBe('Granite Model');
    expect(filtered.description).toBe('IBM Granite foundation model');
    expect(filtered.category).toBe('ai-model');
    expect(filtered.lifecycleStage).toBe('published');
    expect(filtered.versionCount).toBe(2);
    expect(filtered.tags).toEqual(['nlp']);
  });

  it('does not mutate the original asset', () => {
    const original = { ...fullAsset };
    stripTier2Fields(fullAsset);
    expect(fullAsset).toEqual(original);
  });

  it('handles asset with no Tier 2 fields set', () => {
    const tier1Only: AiCatalogAsset = {
      id: 'asset-2',
      name: 'Minimal Asset',
    };
    const filtered = stripTier2Fields(tier1Only);
    expect(filtered.id).toBe('asset-2');
    expect(filtered.name).toBe('Minimal Asset');
    expect(filtered.usageDocs).toBeUndefined();
    expect(filtered.connectionEndpoints).toBeUndefined();
    expect(filtered.config).toBeUndefined();
    expect(filtered.deploymentParameters).toBeUndefined();
  });
});

// ---------------------------------------------------------------------------
// AiCatalogAssetLoader interface contract tests
// ---------------------------------------------------------------------------

describe('AiCatalogAssetLoader', () => {
  it('supports findById returning an asset', async () => {
    const loader: AiCatalogAssetLoader = {
      findById: async (id: string) => ({
        id,
        name: 'Test',
        usageDocs: 'docs',
      }),
      list: async () => [],
    };
    const result = await loader.findById('asset-1');
    expect(result?.id).toBe('asset-1');
    expect(result?.usageDocs).toBe('docs');
  });

  it('supports findById returning undefined for missing asset', async () => {
    const loader: AiCatalogAssetLoader = {
      findById: async () => undefined,
      list: async () => [],
    };
    const result = await loader.findById('missing');
    expect(result).toBeUndefined();
  });

  it('supports list returning all assets', async () => {
    const assets: AiCatalogAsset[] = [
      { id: '1', name: 'Asset 1', category: 'agent' },
      { id: '2', name: 'Asset 2', category: 'ai-model' },
    ];
    const loader: AiCatalogAssetLoader = {
      findById: async () => undefined,
      list: async () => assets,
    };
    const result = await loader.list();
    expect(result).toHaveLength(2);
    expect(result[0].category).toBe('agent');
  });
});

// ---------------------------------------------------------------------------
// Route integration tests
// ---------------------------------------------------------------------------

describe('AI catalog routes', () => {
  let testApp: TestApp;

  afterEach(async () => {
    if (testApp) {
      await testApp.close();
    }
  });

  // -------------------------------------------------------------------------
  // GET /ai-catalog/assets
  // -------------------------------------------------------------------------

  describe('GET /ai-catalog/assets', () => {
    it('returns all assets with Tier 2 fields when both permissions are ALLOW', async () => {
      const assetLoader = createMockAssetLoader({
        list: jest.fn().mockResolvedValue([fullAsset, minimalAsset]),
      });
      testApp = await createTestApp({ assetLoader });

      const { status, body } = await fetchJson(
        testApp.url,
        '/ai-catalog/assets',
      );

      expect(status).toBe(200);
      const assets = body.assets as AiCatalogAsset[];
      expect(assets).toHaveLength(2);
      // Tier 2 fields present
      expect(assets[0].usageDocs).toBe('# Usage\nCall the inference endpoint');
      expect(assets[0].config).toEqual({ temperature: 0.7 });
    });

    it('strips Tier 2 fields when Tier 2 permission is DENY', async () => {
      const authorizeConditional = jest
        .fn()
        // First call: entity-level (Tier 1) → ALLOW
        .mockResolvedValueOnce([{ result: AuthorizeResult.ALLOW }])
        // Second call: field-level (Tier 2) → DENY
        .mockResolvedValueOnce([{ result: AuthorizeResult.DENY }]);

      const assetLoader = createMockAssetLoader({
        list: jest.fn().mockResolvedValue([fullAsset]),
      });
      testApp = await createTestApp({
        permissions: createMockPermissions({ authorizeConditional }),
        assetLoader,
      });

      const { status, body } = await fetchJson(
        testApp.url,
        '/ai-catalog/assets',
      );

      expect(status).toBe(200);
      const assets = body.assets as AiCatalogAsset[];
      expect(assets).toHaveLength(1);
      expect(assets[0].name).toBe('Granite Model');
      // Tier 2 fields stripped
      expect(assets[0].usageDocs).toBeUndefined();
      expect(assets[0].connectionEndpoints).toBeUndefined();
      expect(assets[0].config).toBeUndefined();
      expect(assets[0].deploymentParameters).toBeUndefined();
    });

    it('returns no assets when entity-level (Tier 1) is CONDITIONAL and isResourceAuthorized denies all (fails closed)', async () => {
      const conditionalDecision = {
        result: AuthorizeResult.CONDITIONAL,
        conditions: { rule: 'isInTenant', params: { tenant: 'acme' } },
      } as const;
      const authorizeConditional = jest
        .fn()
        // First call: entity-level (Tier 1) → CONDITIONAL
        .mockResolvedValueOnce([conditionalDecision])
        // Second call: field-level (Tier 2) → ALLOW
        .mockResolvedValueOnce([{ result: AuthorizeResult.ALLOW }]);

      // Loader applies whatever `isAuthorized` predicate the route passes
      // in — mirrors CatalogAssetLoader.list()'s real filtering behavior.
      const list = jest
        .fn()
        .mockImplementation(
          async (opts?: {
            isAuthorized?: (r: AiCatalogAssetResource) => boolean;
          }) =>
            [fullAsset, minimalAsset].filter(() =>
              opts?.isAuthorized ? opts.isAuthorized({ metadata: {} }) : true,
            ),
        );
      const assetLoader = createMockAssetLoader({ list });
      testApp = await createTestApp({
        permissions: createMockPermissions({ authorizeConditional }),
        assetLoader,
        isResourceAuthorized: () => false,
      });

      const { status, body } = await fetchJson(
        testApp.url,
        '/ai-catalog/assets',
      );

      expect(status).toBe(200);
      expect(body.assets).toEqual([]);
      expect(list).toHaveBeenCalledWith({ isAuthorized: expect.any(Function) });
    });

    it('returns only assets isResourceAuthorized allows when entity-level (Tier 1) is CONDITIONAL', async () => {
      const conditionalDecision = {
        result: AuthorizeResult.CONDITIONAL,
        conditions: {
          rule: 'isAiAssetCategory',
          params: { category: 'ai-model' },
        },
      } as const;
      const authorizeConditional = jest
        .fn()
        .mockResolvedValueOnce([conditionalDecision])
        .mockResolvedValueOnce([{ result: AuthorizeResult.ALLOW }]);

      // Simulates a real CatalogAssetLoader: only `fullAsset` (id contains
      // "granite-model") is "authorized" by this fixture's predicate.
      const list = jest
        .fn()
        .mockImplementation(
          async (opts?: {
            isAuthorized?: (r: AiCatalogAssetResource) => boolean;
          }) =>
            [fullAsset, minimalAsset].filter(asset =>
              opts?.isAuthorized
                ? opts.isAuthorized({
                    metadata: {
                      annotations: {
                        'rhdh.io/ai-asset-category':
                          asset === fullAsset ? 'ai-model' : 'skill',
                      },
                    },
                  })
                : true,
            ),
        );
      const assetLoader = createMockAssetLoader({ list });

      // Real isResourceAuthorized-shaped predicate: only category ai-model.
      const isResourceAuthorized = (
        _decision: PolicyDecision,
        resource: AiCatalogAssetResource,
      ) =>
        resource.metadata.annotations?.['rhdh.io/ai-asset-category'] ===
        'ai-model';

      testApp = await createTestApp({
        permissions: createMockPermissions({ authorizeConditional }),
        assetLoader,
        isResourceAuthorized,
      });

      const { status, body } = await fetchJson(
        testApp.url,
        '/ai-catalog/assets',
      );

      expect(status).toBe(200);
      const assets = body.assets as AiCatalogAsset[];
      expect(assets).toHaveLength(1);
      expect(assets[0].name).toBe('Granite Model');
    });

    it('strips Tier 2 fields when Tier 2 permission is CONDITIONAL (conservative default)', async () => {
      const authorizeConditional = jest
        .fn()
        .mockResolvedValueOnce([{ result: AuthorizeResult.ALLOW }])
        .mockResolvedValueOnce([
          {
            result: AuthorizeResult.CONDITIONAL,
            conditions: {
              rule: 'isAiAssetCategory',
              params: { category: 'ai-model' },
            },
          },
        ]);

      const assetLoader = createMockAssetLoader({
        list: jest.fn().mockResolvedValue([fullAsset]),
      });
      testApp = await createTestApp({
        permissions: createMockPermissions({ authorizeConditional }),
        assetLoader,
      });

      const { status, body } = await fetchJson(
        testApp.url,
        '/ai-catalog/assets',
      );

      expect(status).toBe(200);
      const assets = body.assets as AiCatalogAsset[];
      // CONDITIONAL treated as DENY for Tier 2 (conservative approach)
      expect(assets[0].usageDocs).toBeUndefined();
    });

    it('returns 403 when entity-level is DENY and admin check also DENY', async () => {
      const authorizeConditional = jest
        .fn()
        .mockResolvedValue([{ result: AuthorizeResult.DENY }]);
      const authorize = jest
        .fn()
        .mockResolvedValue([{ result: AuthorizeResult.DENY }]);

      testApp = await createTestApp({
        permissions: createMockPermissions({ authorize, authorizeConditional }),
        assetLoader: createMockAssetLoader({
          list: jest.fn().mockResolvedValue([fullAsset]),
        }),
      });

      const { status } = await fetchJson(testApp.url, '/ai-catalog/assets');
      expect(status).toBe(403);
    });

    it('allows admin fallback when entity-level is DENY but admin is ALLOW', async () => {
      const authorizeConditional = jest
        .fn()
        // Tier 1 entity-level → DENY
        .mockResolvedValueOnce([{ result: AuthorizeResult.DENY }])
        // Tier 2 field-level → ALLOW (after admin fallback succeeds)
        .mockResolvedValueOnce([{ result: AuthorizeResult.ALLOW }]);
      const authorize = jest
        .fn()
        // Admin fallback → ALLOW
        .mockResolvedValue([{ result: AuthorizeResult.ALLOW }]);

      const assetLoader = createMockAssetLoader({
        list: jest.fn().mockResolvedValue([fullAsset]),
      });
      testApp = await createTestApp({
        permissions: createMockPermissions({ authorize, authorizeConditional }),
        assetLoader,
      });

      const { status, body } = await fetchJson(
        testApp.url,
        '/ai-catalog/assets',
      );

      expect(status).toBe(200);
      const assets = body.assets as AiCatalogAsset[];
      expect(assets).toHaveLength(1);
    });

    it('checks exactly aiCatalogAssetAccessPermission then aiCatalogAssetAccessUsageDocsPermission via authorizeConditional', async () => {
      const authorizeConditional = jest
        .fn()
        .mockResolvedValue([{ result: AuthorizeResult.ALLOW }]);
      testApp = await createTestApp({
        permissions: createMockPermissions({ authorizeConditional }),
        assetLoader: createMockAssetLoader({
          list: jest.fn().mockResolvedValue([fullAsset]),
        }),
      });

      await fetchJson(testApp.url, '/ai-catalog/assets');

      expect(authorizeConditional).toHaveBeenCalledTimes(2);
      expect(authorizeConditional).toHaveBeenNthCalledWith(
        1,
        [{ permission: aiCatalogAssetAccessPermission }],
        expect.anything(),
      );
      expect(authorizeConditional).toHaveBeenNthCalledWith(
        2,
        [{ permission: aiCatalogAssetAccessUsageDocsPermission }],
        expect.anything(),
      );
    });
  });

  // -------------------------------------------------------------------------
  // GET /ai-catalog/assets/:kind/:namespace/:name
  // -------------------------------------------------------------------------

  describe('GET /ai-catalog/assets/:kind/:namespace/:name', () => {
    it('returns full asset (including Tier 2) when both permissions are ALLOW', async () => {
      const assetLoader = createMockAssetLoader({
        findById: jest.fn().mockResolvedValue(fullAsset),
      });
      testApp = await createTestApp({ assetLoader });

      const { status, body } = await fetchJson(
        testApp.url,
        '/ai-catalog/assets/resource/default/granite-model',
      );

      expect(status).toBe(200);
      expect((body as unknown as AiCatalogAsset).usageDocs).toBe(
        '# Usage\nCall the inference endpoint',
      );
      expect((body as unknown as AiCatalogAsset).config).toEqual({
        temperature: 0.7,
      });
    });

    it('strips Tier 2 fields when usage-docs permission is DENY', async () => {
      const authorize = jest
        .fn()
        // Tier 1 read → ALLOW
        .mockResolvedValueOnce([{ result: AuthorizeResult.ALLOW }])
        // Tier 2 usage-docs → DENY
        .mockResolvedValueOnce([{ result: AuthorizeResult.DENY }]);

      const assetLoader = createMockAssetLoader({
        findById: jest.fn().mockResolvedValue(fullAsset),
      });
      testApp = await createTestApp({
        permissions: createMockPermissions({ authorize }),
        assetLoader,
      });

      const { status, body } = await fetchJson(
        testApp.url,
        '/ai-catalog/assets/resource/default/granite-model',
      );

      expect(status).toBe(200);
      expect((body as unknown as AiCatalogAsset).name).toBe('Granite Model');
      expect((body as unknown as AiCatalogAsset).usageDocs).toBeUndefined();
      expect((body as unknown as AiCatalogAsset).config).toBeUndefined();
    });

    it('returns 404 when asset does not exist', async () => {
      const assetLoader = createMockAssetLoader({
        findById: jest.fn().mockResolvedValue(undefined),
      });
      testApp = await createTestApp({ assetLoader });

      const { status } = await fetchJson(
        testApp.url,
        '/ai-catalog/assets/resource/default/missing',
      );

      expect(status).toBe(404);
    });

    it('returns 403 when Tier 1 is DENY and admin is also DENY', async () => {
      const authorize = jest
        .fn()
        .mockResolvedValue([{ result: AuthorizeResult.DENY }]);

      const assetLoader = createMockAssetLoader({
        findById: jest.fn().mockResolvedValue(fullAsset),
      });
      testApp = await createTestApp({
        permissions: createMockPermissions({ authorize }),
        assetLoader,
      });

      const { status } = await fetchJson(
        testApp.url,
        '/ai-catalog/assets/resource/default/granite-model',
      );

      expect(status).toBe(403);
    });

    it('allows admin fallback when Tier 1 is DENY but admin is ALLOW', async () => {
      const authorize = jest
        .fn()
        // Tier 1 → DENY
        .mockResolvedValueOnce([{ result: AuthorizeResult.DENY }])
        // Admin fallback → ALLOW
        .mockResolvedValueOnce([{ result: AuthorizeResult.ALLOW }])
        // Tier 2 → ALLOW
        .mockResolvedValueOnce([{ result: AuthorizeResult.ALLOW }]);

      const assetLoader = createMockAssetLoader({
        findById: jest.fn().mockResolvedValue(fullAsset),
      });
      testApp = await createTestApp({
        permissions: createMockPermissions({ authorize }),
        assetLoader,
      });

      const { status, body } = await fetchJson(
        testApp.url,
        '/ai-catalog/assets/resource/default/granite-model',
      );

      expect(status).toBe(200);
      expect((body as unknown as AiCatalogAsset).usageDocs).toBe(
        '# Usage\nCall the inference endpoint',
      );
    });

    it('checks exactly aiCatalogAssetAccessPermission then aiCatalogAssetAccessUsageDocsPermission, both with the entity resourceRef, via authorize', async () => {
      const authorize = jest
        .fn()
        .mockResolvedValue([{ result: AuthorizeResult.ALLOW }]);
      testApp = await createTestApp({
        permissions: createMockPermissions({ authorize }),
        assetLoader: createMockAssetLoader({
          findById: jest.fn().mockResolvedValue(fullAsset),
        }),
      });

      await fetchJson(
        testApp.url,
        '/ai-catalog/assets/resource/default/granite-model',
      );

      const expectedResourceRef = 'resource:default/granite-model';
      expect(authorize).toHaveBeenCalledTimes(2);
      expect(authorize).toHaveBeenNthCalledWith(
        1,
        [
          {
            permission: aiCatalogAssetAccessPermission,
            resourceRef: expectedResourceRef,
          },
        ],
        expect.anything(),
      );
      expect(authorize).toHaveBeenNthCalledWith(
        2,
        [
          {
            permission: aiCatalogAssetAccessUsageDocsPermission,
            resourceRef: expectedResourceRef,
          },
        ],
        expect.anything(),
      );
    });

    it('checks aiCatalogAdminPermission (no resourceRef) for the admin fallback', async () => {
      const authorize = jest
        .fn()
        .mockResolvedValueOnce([{ result: AuthorizeResult.DENY }])
        .mockResolvedValueOnce([{ result: AuthorizeResult.ALLOW }])
        .mockResolvedValueOnce([{ result: AuthorizeResult.ALLOW }]);
      testApp = await createTestApp({
        permissions: createMockPermissions({ authorize }),
        assetLoader: createMockAssetLoader({
          findById: jest.fn().mockResolvedValue(fullAsset),
        }),
      });

      await fetchJson(
        testApp.url,
        '/ai-catalog/assets/resource/default/granite-model',
      );

      expect(authorize).toHaveBeenNthCalledWith(
        2,
        [{ permission: aiCatalogAdminPermission }],
        expect.anything(),
      );
    });
  });
});
