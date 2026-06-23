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
} from '@backstage/backend-plugin-api';
import type { ConversationStore } from './ConversationStore';
import type {
  ConversationSummary,
  ConversationDetails,
  ConversationMessage,
  FeedbackRecord,
} from '@red-hat-developer-hub/backstage-plugin-boost-common';
import { createConversationRoutes } from './conversationRoutes';

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

function makeSummary(
  overrides: Partial<ConversationSummary> = {},
): ConversationSummary {
  return {
    id: 'sess-1',
    title: 'Test Session',
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
    ...overrides,
  };
}

function makeDetails(
  overrides: Partial<ConversationDetails> = {},
): ConversationDetails {
  return {
    id: 'sess-1',
    title: 'Test Session',
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
    messages: [],
    ...overrides,
  };
}

function makeMessage(
  overrides: Partial<ConversationMessage> = {},
): ConversationMessage {
  return {
    id: 'msg-1',
    role: 'user',
    content: 'Hello',
    createdAt: '2024-01-01T00:00:00Z',
    ...overrides,
  };
}

function makeFeedback(overrides: Partial<FeedbackRecord> = {}): FeedbackRecord {
  return {
    id: 'fb-1',
    sessionId: 'sess-1',
    messageId: 'msg-1',
    sentiment: 'positive',
    createdBy: 'user:default/testuser',
    createdAt: '2024-01-01T00:00:00Z',
    ...overrides,
  };
}

function createMockStore(
  overrides: Partial<ConversationStore> = {},
): ConversationStore {
  return {
    listSessions: jest.fn().mockResolvedValue([]),
    listAllSessions: jest.fn().mockResolvedValue([]),
    searchSessions: jest.fn().mockResolvedValue([]),
    getSession: jest.fn().mockResolvedValue(undefined),
    createSession: jest.fn().mockResolvedValue(makeSummary()),
    deleteSession: jest.fn().mockResolvedValue(false),
    addMessage: jest.fn().mockResolvedValue(makeMessage()),
    addFeedback: jest.fn().mockResolvedValue(makeFeedback()),
    listFeedback: jest.fn().mockResolvedValue([]),
    ...overrides,
  } as unknown as ConversationStore;
}

interface TestApp {
  server: http.Server;
  url: string;
  close: () => Promise<void>;
}

async function createTestApp(appOptions: {
  store: ConversationStore;
  permissions?: PermissionsService;
  httpAuth?: HttpAuthService;
}): Promise<TestApp> {
  const app = express();
  app.use(express.json());

  const router = createConversationRoutes({
    store: appOptions.store,
    permissions: appOptions.permissions ?? createMockPermissions(),
    httpAuth: appOptions.httpAuth ?? createMockHttpAuth(),
    logger: createMockLogger(),
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

async function doRequest(
  base: string,
  method: string,
  path: string,
  body?: unknown,
): Promise<{ status: number; body: unknown }> {
  const payload = body ? JSON.stringify(body) : undefined;
  return new Promise((resolve, reject) => {
    const req = http.request(
      `${base}${path}`,
      {
        method,
        headers: {
          'Content-Type': 'application/json',
          ...(payload
            ? { 'Content-Length': Buffer.byteLength(payload).toString() }
            : {}),
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
    if (payload) {
      req.write(payload);
    }
    req.end();
  });
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('conversation routes', () => {
  let testApp: TestApp;

  afterEach(async () => {
    if (testApp) {
      await testApp.close();
    }
  });

  describe('POST /conversations', () => {
    it('creates a new session', async () => {
      const store = createMockStore();
      testApp = await createTestApp({ store });

      const res = await doRequest(testApp.url, 'POST', '/conversations', {
        title: 'My Conversation',
        providerId: 'test-provider',
      });

      expect(res.status).toBe(201);
      expect(store.createSession).toHaveBeenCalledWith(
        expect.objectContaining({
          title: 'My Conversation',
          providerId: 'test-provider',
          createdBy: 'user:default/testuser',
        }),
      );
    });

    it('returns 400 for missing title', async () => {
      testApp = await createTestApp({ store: createMockStore() });

      const res = await doRequest(testApp.url, 'POST', '/conversations', {
        providerId: 'test-provider',
      });

      expect(res.status).toBe(400);
    });

    it('returns 400 for missing providerId', async () => {
      testApp = await createTestApp({ store: createMockStore() });

      const res = await doRequest(testApp.url, 'POST', '/conversations', {
        title: 'My Conversation',
      });

      expect(res.status).toBe(400);
    });

    it('returns 403 when permission denied', async () => {
      const permissions = createMockPermissions(AuthorizeResult.DENY);
      testApp = await createTestApp({
        store: createMockStore(),
        permissions,
      });

      const res = await doRequest(testApp.url, 'POST', '/conversations', {
        title: 'My Conversation',
        providerId: 'test-provider',
      });

      expect(res.status).toBe(403);
    });
  });

  describe('GET /conversations', () => {
    it('lists sessions for the current user', async () => {
      const store = createMockStore({
        listSessions: jest
          .fn()
          .mockResolvedValue([makeSummary({ title: 'Session 1' })]),
      });
      testApp = await createTestApp({ store });

      const res = await doRequest(testApp.url, 'GET', '/conversations');

      expect(res.status).toBe(200);
      const data = res.body as { sessions: ConversationSummary[] };
      expect(data.sessions).toHaveLength(1);
      expect(data.sessions[0].title).toBe('Session 1');
      expect(store.listSessions).toHaveBeenCalledWith(
        'user:default/testuser',
        undefined,
      );
    });

    it('passes providerId query param', async () => {
      const store = createMockStore();
      testApp = await createTestApp({ store });

      await doRequest(
        testApp.url,
        'GET',
        '/conversations?providerId=provider-a',
      );

      expect(store.listSessions).toHaveBeenCalledWith(
        'user:default/testuser',
        'provider-a',
      );
    });

    it('searches by keyword when q param is provided', async () => {
      const store = createMockStore();
      testApp = await createTestApp({ store });

      await doRequest(testApp.url, 'GET', '/conversations?q=kubernetes');

      expect(store.searchSessions).toHaveBeenCalledWith(
        'user:default/testuser',
        'kubernetes',
      );
    });

    it('returns 403 for allUsers without admin permission', async () => {
      const permissions = createMockPermissions(AuthorizeResult.DENY);
      testApp = await createTestApp({
        store: createMockStore(),
        permissions,
      });

      const res = await doRequest(
        testApp.url,
        'GET',
        '/conversations?allUsers=true',
      );

      // First authorize call fails (read), then admin fallback also fails,
      // so it returns 403 from the requireChatRead middleware
      expect(res.status).toBe(403);
    });
  });

  describe('GET /conversations/:id', () => {
    it('returns session with messages', async () => {
      const store = createMockStore({
        getSession: jest.fn().mockResolvedValue(
          makeDetails({
            messages: [makeMessage({ content: 'Hello' })],
          }),
        ),
      });
      testApp = await createTestApp({ store });

      const res = await doRequest(testApp.url, 'GET', '/conversations/sess-1');

      expect(res.status).toBe(200);
      const data = res.body as ConversationDetails;
      expect(data.messages).toHaveLength(1);
    });

    it('returns 404 for non-existent session', async () => {
      testApp = await createTestApp({ store: createMockStore() });

      const res = await doRequest(
        testApp.url,
        'GET',
        '/conversations/nonexistent',
      );

      expect(res.status).toBe(404);
    });
  });

  describe('DELETE /conversations/:id', () => {
    it('deletes an existing session', async () => {
      const store = createMockStore({
        deleteSession: jest.fn().mockResolvedValue(true),
      });
      testApp = await createTestApp({ store });

      const res = await doRequest(
        testApp.url,
        'DELETE',
        '/conversations/sess-1',
      );

      expect(res.status).toBe(204);
    });

    it('returns 404 for non-existent session', async () => {
      testApp = await createTestApp({ store: createMockStore() });

      const res = await doRequest(
        testApp.url,
        'DELETE',
        '/conversations/nonexistent',
      );

      expect(res.status).toBe(404);
    });
  });

  describe('POST /conversations/:id/messages', () => {
    it('adds a message to a session', async () => {
      testApp = await createTestApp({ store: createMockStore() });

      const res = await doRequest(
        testApp.url,
        'POST',
        '/conversations/sess-1/messages',
        { role: 'user', content: 'Hello AI' },
      );

      expect(res.status).toBe(201);
    });

    it('returns 400 for invalid role', async () => {
      testApp = await createTestApp({ store: createMockStore() });

      const res = await doRequest(
        testApp.url,
        'POST',
        '/conversations/sess-1/messages',
        { role: 'invalid', content: 'Hello' },
      );

      expect(res.status).toBe(400);
    });

    it('returns 400 for missing content', async () => {
      testApp = await createTestApp({ store: createMockStore() });

      const res = await doRequest(
        testApp.url,
        'POST',
        '/conversations/sess-1/messages',
        { role: 'user' },
      );

      expect(res.status).toBe(400);
    });
  });

  describe('POST /conversations/:id/feedback', () => {
    it('submits feedback on a message', async () => {
      testApp = await createTestApp({ store: createMockStore() });

      const res = await doRequest(
        testApp.url,
        'POST',
        '/conversations/sess-1/feedback',
        {
          messageId: 'msg-1',
          sentiment: 'positive',
          reason: 'Great answer!',
        },
      );

      expect(res.status).toBe(201);
    });

    it('returns 400 for invalid sentiment', async () => {
      testApp = await createTestApp({ store: createMockStore() });

      const res = await doRequest(
        testApp.url,
        'POST',
        '/conversations/sess-1/feedback',
        { messageId: 'msg-1', sentiment: 'neutral' },
      );

      expect(res.status).toBe(400);
    });

    it('returns 400 for missing messageId', async () => {
      testApp = await createTestApp({ store: createMockStore() });

      const res = await doRequest(
        testApp.url,
        'POST',
        '/conversations/sess-1/feedback',
        { sentiment: 'positive' },
      );

      expect(res.status).toBe(400);
    });
  });

  describe('GET /conversations/:id/feedback', () => {
    it('lists feedback for a session', async () => {
      const store = createMockStore({
        listFeedback: jest.fn().mockResolvedValue([makeFeedback()]),
      });
      testApp = await createTestApp({ store });

      const res = await doRequest(
        testApp.url,
        'GET',
        '/conversations/sess-1/feedback',
      );

      expect(res.status).toBe(200);
      const data = res.body as { feedback: FeedbackRecord[] };
      expect(data.feedback).toHaveLength(1);
    });
  });

  describe('GET /conversations/:id/export', () => {
    it('exports a conversation with messages and feedback', async () => {
      const store = createMockStore({
        getSession: jest
          .fn()
          .mockResolvedValue(makeDetails({ messages: [makeMessage()] })),
        listFeedback: jest.fn().mockResolvedValue([makeFeedback()]),
      });
      testApp = await createTestApp({ store });

      const res = await doRequest(
        testApp.url,
        'GET',
        '/conversations/sess-1/export',
      );

      expect(res.status).toBe(200);
      const data = res.body as {
        messages: unknown[];
        feedback: unknown[];
        exportedAt: string;
      };
      expect(data.messages).toHaveLength(1);
      expect(data.feedback).toHaveLength(1);
      expect(data.exportedAt).toBeDefined();
    });

    it('returns 404 for non-existent session', async () => {
      testApp = await createTestApp({ store: createMockStore() });

      const res = await doRequest(
        testApp.url,
        'GET',
        '/conversations/nonexistent/export',
      );

      expect(res.status).toBe(404);
    });
  });
});
