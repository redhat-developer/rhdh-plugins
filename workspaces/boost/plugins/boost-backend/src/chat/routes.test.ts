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
  LoggerService,
  PermissionsService,
  CacheService,
} from '@backstage/backend-plugin-api';
import type {
  AgenticProvider,
  NormalizedStreamEvent,
} from '@red-hat-developer-hub/backstage-plugin-boost-common';
import { ProviderManager } from '../provider/ProviderManager';
import { ConversationAgentCache } from './ConversationAgentCache';
import { RateLimiter } from './RateLimiter';
import { createChatRoutes } from './routes';

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

function createMockCache(): CacheService {
  const store = new Map<string, unknown>();
  return {
    get: jest.fn(async (key: string) => store.get(key)) as CacheService['get'],
    set: jest.fn(async (key: string, value: unknown) => {
      store.set(key, value);
    }),
    delete: jest.fn(async (key: string) => {
      store.delete(key);
    }),
    withOptions: jest.fn().mockReturnThis(),
  };
}

function createMockProvider(
  overrides?: Partial<AgenticProvider>,
): AgenticProvider {
  return {
    descriptor: {
      id: 'test-provider',
      name: 'Test Provider',
      capabilities: {},
    },
    chat: jest.fn().mockResolvedValue('Hello from AI'),
    chatStream: jest
      .fn()
      .mockImplementation(
        async function* generateEvents(): AsyncIterable<NormalizedStreamEvent> {
          yield { type: 'text', text: 'Hello ' };
          yield { type: 'text', text: 'World' };
          yield { type: 'done' };
        },
      ),
    ...overrides,
  };
}

interface TestApp {
  server: http.Server;
  url: string;
  close: () => Promise<void>;
}

async function createTestApp(appOptions: {
  permissions?: PermissionsService;
  httpAuth?: HttpAuthService;
  provider?: AgenticProvider;
}): Promise<TestApp> {
  const app = express();
  app.use(express.json());

  const providerManager = new ProviderManager();
  if (appOptions.provider) {
    providerManager.registerProvider(appOptions.provider);
  }

  const mockCache = createMockCache();
  const logger = createMockLogger();

  const router = createChatRoutes({
    providerManager,
    permissions: appOptions.permissions ?? createMockPermissions(),
    httpAuth: appOptions.httpAuth ?? createMockHttpAuth(),
    logger,
    conversationAgentCache: new ConversationAgentCache({
      cache: mockCache,
      logger,
    }),
    rateLimiter: new RateLimiter({
      cache: mockCache,
      logger,
      maxRequests: 100,
      windowMs: 60_000,
    }),
  });
  app.use(router);

  const errorStatusMap: Record<string, number> = {
    NotAllowedError: 403,
    InputError: 400,
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

async function postJson(
  base: string,
  path: string,
  body: unknown,
): Promise<{ status: number; body: unknown }> {
  const payload = JSON.stringify(body);
  return new Promise((resolve, reject) => {
    const req = http.request(
      `${base}${path}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Content-Length': Buffer.byteLength(payload),
        },
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
    req.write(payload);
    req.end();
  });
}

async function postSse(
  base: string,
  path: string,
  body: unknown,
): Promise<{ status: number; events: NormalizedStreamEvent[] }> {
  const payload = JSON.stringify(body);
  return new Promise((resolve, reject) => {
    const req = http.request(
      `${base}${path}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Content-Length': Buffer.byteLength(payload),
        },
      },
      res => {
        const chunks: Buffer[] = [];
        res.on('data', c => chunks.push(c));
        res.on('end', () => {
          const raw = Buffer.concat(chunks).toString();
          const events: NormalizedStreamEvent[] = [];

          // Parse SSE events
          const lines = raw.split('\n');
          for (const line of lines) {
            if (line.startsWith('data: ')) {
              try {
                events.push(JSON.parse(line.slice(6)));
              } catch {
                // skip non-JSON lines
              }
            }
          }

          resolve({ status: res.statusCode ?? 0, events });
        });
      },
    );
    req.on('error', reject);
    req.write(payload);
    req.end();
  });
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('chat routes', () => {
  let testApp: TestApp;

  afterEach(async () => {
    if (testApp) {
      await testApp.close();
    }
  });

  describe('POST /chat', () => {
    it('returns a chat response from the provider', async () => {
      testApp = await createTestApp({ provider: createMockProvider() });

      const res = await postJson(testApp.url, '/chat', {
        messages: [{ type: 'text', text: 'Hello' }],
      });

      expect(res.status).toBe(200);
      const data = res.body as { response: string; providerId: string };
      expect(data.response).toBe('Hello from AI');
      expect(data.providerId).toBe('test-provider');
    });

    it('returns 400 for missing messages', async () => {
      testApp = await createTestApp({ provider: createMockProvider() });

      const res = await postJson(testApp.url, '/chat', {});

      expect(res.status).toBe(400);
    });

    it('returns 400 for empty messages array', async () => {
      testApp = await createTestApp({ provider: createMockProvider() });

      const res = await postJson(testApp.url, '/chat', { messages: [] });

      expect(res.status).toBe(400);
    });

    it('returns 400 for invalid message type', async () => {
      testApp = await createTestApp({ provider: createMockProvider() });

      const res = await postJson(testApp.url, '/chat', {
        messages: [{ type: 'video', url: 'http://example.com/v.mp4' }],
      });

      expect(res.status).toBe(400);
    });

    it('returns 404 when no provider is registered', async () => {
      testApp = await createTestApp({});

      const res = await postJson(testApp.url, '/chat', {
        messages: [{ type: 'text', text: 'Hello' }],
      });

      expect(res.status).toBe(404);
    });

    it('returns 403 when permission denied', async () => {
      const permissions = createMockPermissions(AuthorizeResult.DENY);
      testApp = await createTestApp({
        provider: createMockProvider(),
        permissions,
      });

      const res = await postJson(testApp.url, '/chat', {
        messages: [{ type: 'text', text: 'Hello' }],
      });

      expect(res.status).toBe(403);
    });

    it('allows via admin fallback when fine-grained denies', async () => {
      const authorizeMock = jest
        .fn()
        .mockResolvedValueOnce([{ result: AuthorizeResult.DENY }])
        .mockResolvedValueOnce([{ result: AuthorizeResult.ALLOW }])
        // For rate limiter credentials call
        .mockResolvedValue([{ result: AuthorizeResult.ALLOW }]);

      const permissions: PermissionsService = {
        authorize: authorizeMock,
        authorizeConditional: jest.fn(),
      };
      testApp = await createTestApp({
        provider: createMockProvider(),
        permissions,
      });

      const res = await postJson(testApp.url, '/chat', {
        messages: [{ type: 'text', text: 'Hello' }],
      });

      expect(res.status).toBe(200);
    });

    it('includes conversationId when provided', async () => {
      testApp = await createTestApp({ provider: createMockProvider() });

      const res = await postJson(testApp.url, '/chat', {
        messages: [{ type: 'text', text: 'Hello' }],
        conversationId: 'conv-123',
      });

      expect(res.status).toBe(200);
      const data = res.body as { conversationId: string };
      expect(data.conversationId).toBe('conv-123');
    });
  });

  describe('POST /chat/stream', () => {
    it('returns SSE events from the provider', async () => {
      testApp = await createTestApp({ provider: createMockProvider() });

      const res = await postSse(testApp.url, '/chat/stream', {
        messages: [{ type: 'text', text: 'Hello' }],
      });

      expect(res.status).toBe(200);
      // Should have text events + done (the provider yields done, then the route adds another)
      const textEvents = res.events.filter(e => e.type === 'text');
      expect(textEvents.length).toBe(2);
      expect((textEvents[0] as { text: string }).text).toBe('Hello ');
      expect((textEvents[1] as { text: string }).text).toBe('World');

      const doneEvents = res.events.filter(e => e.type === 'done');
      expect(doneEvents.length).toBe(1);
    });

    it('returns 400 for missing messages', async () => {
      testApp = await createTestApp({ provider: createMockProvider() });

      const res = await postJson(testApp.url, '/chat/stream', {});

      expect(res.status).toBe(400);
    });

    it('returns 404 when no provider is registered', async () => {
      testApp = await createTestApp({});

      const res = await postJson(testApp.url, '/chat/stream', {
        messages: [{ type: 'text', text: 'Hello' }],
      });

      expect(res.status).toBe(404);
    });

    it('returns 403 when permission denied', async () => {
      const permissions = createMockPermissions(AuthorizeResult.DENY);
      testApp = await createTestApp({
        provider: createMockProvider(),
        permissions,
      });

      const res = await postJson(testApp.url, '/chat/stream', {
        messages: [{ type: 'text', text: 'Hello' }],
      });

      expect(res.status).toBe(403);
    });

    it('sends error event when provider stream throws', async () => {
      const errorProvider = createMockProvider({
        chatStream: jest
          .fn()
          .mockImplementation(
            async function* generateEvents(): AsyncIterable<NormalizedStreamEvent> {
              yield { type: 'text', text: 'Partial...' };
              throw new Error('Provider connection lost');
            },
          ),
      });

      testApp = await createTestApp({ provider: errorProvider });

      const res = await postSse(testApp.url, '/chat/stream', {
        messages: [{ type: 'text', text: 'Hello' }],
      });

      expect(res.status).toBe(200);
      const errorEvents = res.events.filter(e => e.type === 'error');
      expect(errorEvents.length).toBe(1);
      expect((errorEvents[0] as { message: string }).message).toBe(
        'Provider connection lost',
      );
    });

    it('validates file messages require url', async () => {
      testApp = await createTestApp({ provider: createMockProvider() });

      const res = await postJson(testApp.url, '/chat/stream', {
        messages: [{ type: 'file' }],
      });

      expect(res.status).toBe(400);
    });
  });
});
