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
import { createKagentiAdminRoutes } from './routes';

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

interface TestApp {
  server: http.Server;
  url: string;
  close: () => Promise<void>;
}

async function createTestApp(options: {
  permissions?: PermissionsService;
  httpAuth?: HttpAuthService;
}): Promise<TestApp> {
  const app = express();
  app.use(express.json());
  const router = createKagentiAdminRoutes({
    permissions: options.permissions ?? createMockPermissions(),
    httpAuth: options.httpAuth ?? createMockHttpAuth(),
    logger: createMockLogger(),
  });
  app.use(router);
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

describe('kagenti admin routes', () => {
  let testApp: TestApp;

  afterEach(async () => {
    if (testApp) {
      await testApp.close();
    }
  });

  describe('GET /kagenti/status', () => {
    it('returns status when permission allowed', async () => {
      testApp = await createTestApp({});

      const res = await fetchJson(testApp.url, '/kagenti/status');
      expect(res.status).toBe(200);
      const data = res.body as { status: string };
      expect(data.status).toBe('ok');
    });

    it('returns 403 when permission denied', async () => {
      const permissions = createMockPermissions(AuthorizeResult.DENY);
      testApp = await createTestApp({ permissions });

      const res = await fetchJson(testApp.url, '/kagenti/status');
      expect(res.status).toBe(403);
    });

    it('allows via admin fallback when fine-grained denies', async () => {
      const authorizeMock = jest
        .fn()
        .mockResolvedValueOnce([{ result: AuthorizeResult.DENY }])
        .mockResolvedValueOnce([{ result: AuthorizeResult.ALLOW }]);

      const permissions: PermissionsService = {
        authorize: authorizeMock,
        authorizeConditional: jest.fn(),
      };
      testApp = await createTestApp({ permissions });

      const res = await fetchJson(testApp.url, '/kagenti/status');
      expect(res.status).toBe(200);
      expect(authorizeMock).toHaveBeenCalledTimes(2);
    });
  });
});
