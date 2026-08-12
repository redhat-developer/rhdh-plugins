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
import type {
  HttpAuthService,
  LoggerService,
  PermissionsService,
} from '@backstage/backend-plugin-api';
import { AuthorizeResult } from '@backstage/plugin-permission-common';
import type { ConnectorHealthStatus } from '@red-hat-developer-hub/backstage-plugin-boost-common';
import { createIngestionHealthRoutes } from './routes';
import type { HealthStatusService } from './HealthStatusService';

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
      principal: { userEntityRef: 'user:default/testuser' },
    }),
    issueUserCookie: jest.fn(),
  };
}

function createMockPermissions(
  result: AuthorizeResult = AuthorizeResult.ALLOW,
): PermissionsService {
  return {
    authorize: jest.fn().mockResolvedValue([{ result }]),
    authorizeConditional: jest.fn().mockResolvedValue([{ result }]),
  };
}

function makeHealthStatus(
  overrides: Partial<ConnectorHealthStatus> = {},
): ConnectorHealthStatus {
  return {
    connectorId: 'github',
    connectorType: 'github',
    enabled: true,
    status: 'healthy',
    lastSyncAttempt: '2026-08-10T12:00:00Z',
    lastSuccessfulSync: '2026-08-10T12:00:00Z',
    errorSummary: null,
    metrics: { assetsAdded: 0, assetsUpdated: 0, assetsRemoved: 0 },
    ...overrides,
  };
}

interface TestApp {
  server: http.Server;
  url: string;
  close: () => Promise<void>;
}

async function createTestApp(options: {
  healthService?: Partial<HealthStatusService>;
  httpAuth?: HttpAuthService;
  permissions?: PermissionsService;
}): Promise<TestApp> {
  const app = express();
  app.use(express.json());

  const healthService = {
    getHealthStatuses: jest.fn().mockResolvedValue([]),
    ...options.healthService,
  } as unknown as HealthStatusService;

  const router = createIngestionHealthRoutes({
    healthService,
    permissions: options.permissions ?? createMockPermissions(),
    httpAuth: options.httpAuth ?? createMockHttpAuth(),
    logger: createMockLogger(),
  });
  app.use(router);

  // Error handler — map Backstage error types to HTTP status codes
  const errorStatusMap: Record<string, number> = {
    NotAllowedError: 403,
  };
  app.use(
    (
      err: Error,
      _req: express.Request,
      res: express.Response,
      _next: express.NextFunction,
    ) => {
      const statusCode = errorStatusMap[err.name] ?? 500;
      res.status(statusCode).json({ error: err.message });
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
): Promise<{ status: number; body: unknown }> {
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
        resolve({ status: res.statusCode ?? 0, body: parsed });
      });
    });
    req.on('error', reject);
    req.end();
  });
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('ingestion health routes', () => {
  let testApp: TestApp;

  afterEach(async () => {
    if (testApp) {
      await testApp.close();
    }
  });

  describe('GET /ingestion-health', () => {
    it('returns 200 with empty array when no connectors', async () => {
      const getHealthStatuses = jest.fn().mockResolvedValue([]);
      testApp = await createTestApp({
        healthService: { getHealthStatuses },
      });

      const res = await fetchJson(testApp.url, '/ingestion-health');
      expect(res.status).toBe(200);
      expect(res.body).toEqual([]);
    });

    it('returns connector health array', async () => {
      const health = [makeHealthStatus()];
      const getHealthStatuses = jest.fn().mockResolvedValue(health);
      testApp = await createTestApp({
        healthService: { getHealthStatuses },
      });

      const res = await fetchJson(testApp.url, '/ingestion-health');
      expect(res.status).toBe(200);
      const body = res.body as ConnectorHealthStatus[];
      expect(body).toHaveLength(1);
      expect(body[0].connectorId).toBe('github');
      expect(body[0].status).toBe('healthy');
    });

    it('passes includeDisabled=true to service', async () => {
      const getHealthStatuses = jest.fn().mockResolvedValue([]);
      testApp = await createTestApp({
        healthService: { getHealthStatuses },
      });

      await fetchJson(testApp.url, '/ingestion-health?includeDisabled=true');
      expect(getHealthStatuses).toHaveBeenCalledWith(true);
    });

    it('passes includeDisabled=false by default', async () => {
      const getHealthStatuses = jest.fn().mockResolvedValue([]);
      testApp = await createTestApp({
        healthService: { getHealthStatuses },
      });

      await fetchJson(testApp.url, '/ingestion-health');
      expect(getHealthStatuses).toHaveBeenCalledWith(false);
    });

    it('includes disabled connectors when includeDisabled=true', async () => {
      const health = [
        makeHealthStatus({ connectorId: 'github', enabled: true }),
        makeHealthStatus({
          connectorId: 'jira',
          enabled: false,
          status: 'unknown',
        }),
      ];
      const getHealthStatuses = jest.fn().mockResolvedValue(health);
      testApp = await createTestApp({
        healthService: { getHealthStatuses },
      });

      const res = await fetchJson(
        testApp.url,
        '/ingestion-health?includeDisabled=true',
      );
      expect(res.status).toBe(200);
      const body = res.body as ConnectorHealthStatus[];
      expect(body).toHaveLength(2);
    });

    it('returns 500 on service error', async () => {
      const getHealthStatuses = jest
        .fn()
        .mockRejectedValue(new Error('DB error'));
      testApp = await createTestApp({
        healthService: { getHealthStatuses },
      });

      const res = await fetchJson(testApp.url, '/ingestion-health');
      expect(res.status).toBe(500);
    });

    it('returns 403 when permission is denied', async () => {
      const permissions = createMockPermissions(AuthorizeResult.DENY);
      testApp = await createTestApp({ permissions });

      const res = await fetchJson(testApp.url, '/ingestion-health');
      expect(res.status).toBe(403);
    });

    it('calls permissions.authorize with aiCatalogAdminPermission', async () => {
      const permissions = createMockPermissions();
      testApp = await createTestApp({ permissions });

      await fetchJson(testApp.url, '/ingestion-health');
      expect(permissions.authorize).toHaveBeenCalledTimes(1);
      const authorizeArg = (permissions.authorize as jest.Mock).mock
        .calls[0][0];
      expect(authorizeArg[0].permission.name).toBe('ai-catalog.admin');
    });
  });
});
