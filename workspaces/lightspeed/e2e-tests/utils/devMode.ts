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

import { randomUUID } from 'node:crypto';

import { Page, Route } from '@playwright/test';
import {
  contentsWithRedactedThinking,
  E2E_MCP_VALID_TOKEN,
  generateQueryResponse,
  mockedMcpServersResponse,
  modelBaseUrl,
  type McpServersListMock,
} from '../fixtures/responses';

let mcpServersMockState: McpServersListMock;

export type MockMcpServersOptions = {
  failServerValidateFor?: string;
  /** Shown as `validation.error` when POST validate fails for `failServerValidateFor` (use product i18n, e.g. `mcp.settings.token.validationFailed`). */
  failServerValidateError?: string;
};

let mcpMockOptions: MockMcpServersOptions = {};

function cloneMcpServersMock(json: McpServersListMock): McpServersListMock {
  return JSON.parse(JSON.stringify(json)) as McpServersListMock;
}

export async function mockModels(page: Page, models: any[]) {
  await page.route(`${modelBaseUrl}/v1/models`, async route => {
    const json = { models };
    await route.fulfill({ json });
  });
}

export async function mockConversations(
  page: Page,
  conversations?: any[],
  allowPost = false,
) {
  await page.route(`${modelBaseUrl}/v2/conversations`, async route => {
    if (route.request().method() === 'GET') {
      const json = conversations ? { conversations: conversations } : [];
      await route.fulfill({ json });
    } else if (allowPost) {
      await route.fulfill();
    }
  });
}

export async function mockShields(page: Page, shields: any[] = []) {
  await page.route(`${modelBaseUrl}/v1/shields`, async route => {
    const json = { shields };
    await route.fulfill({ json });
  });
}

export async function mockChatHistory(page: Page, contents?: any[]) {
  await page.route(`${modelBaseUrl}/v2/conversations/*`, async route => {
    const json = contents ? { chat_history: contents } : [];
    await route.fulfill({ json });
  });
}

/**
 * Applies chat history that contains `redacted_thinking` so the reasoning block is shown.
 * Call then reload (or re-open the conversation) so the client refetches history.
 */
export async function mockChatHistoryWithRedactedThinking(page: Page) {
  await mockChatHistory(page, contentsWithRedactedThinking);
}

const notebookLightspeedV1RouteMatches = (url: URL): boolean =>
  url.pathname.includes('/api/lightspeed/notebooks/v1/');

const notebookConversationSeedByPage = new WeakMap<Page, string>();

/** Per-page seed for {@link mockNotebookLightspeedBackend} (`metadata.conversation_id` on sessions). */
export function notebookE2eSetConversationSeed(
  page: Page,
  conversationId: string,
) {
  notebookConversationSeedByPage.set(page, conversationId);
}

export function notebookE2eClearConversationSeed(page: Page) {
  notebookConversationSeedByPage.delete(page);
}

const E2E_NB_USER = 'user:development/guest';

function stripTrailingSlashes(path: string): string {
  let result = path;
  while (result.endsWith('/')) {
    result = result.slice(0, -1);
  }
  return result;
}

/** Session list path tail after `/v1/sessions`, or `null` if URL is not notebooks v1 sessions. */
function notebookV1SessionsPathTail(pathname: string): string[] | null {
  const normalized = stripTrailingSlashes(pathname);
  const parts = normalized.split('/').filter(Boolean);
  const i = parts.indexOf('sessions');
  if (i < 1 || parts[i - 1] !== 'v1') return null;
  return parts.slice(i + 1);
}

/** `name` from JSON body when present and a string (`POST` creates, `PUT` renames); otherwise `undefined`. */
function notebookRouteJsonName(route: Route): string | undefined {
  try {
    const body: unknown = route.request().postDataJSON();
    if (typeof body !== 'object' || body === null) return undefined;
    const name = (body as { name?: unknown }).name;
    return typeof name === 'string' ? name : undefined;
  } catch {
    return undefined;
  }
}

/**
 * Stateful handler for `/api/lightspeed/notebooks/v1/**` (sessions + documents).
 * Same idea as {@link mockMcpServers}: closure holds maps; one `page.route` callback.
 */
function createNotebookLightspeedRouteHandler(page: Page) {
  const sessionsOrder: string[] = [];
  const sessions = new Map<string, Record<string, unknown>>();
  const documents = new Map<string, Map<string, Record<string, unknown>>>();
  let sessionIdSeq = 0;

  const nextSessionId = () => {
    sessionIdSeq += 1;
    return `vs_e2e_${Date.now()}_${sessionIdSeq}`;
  };

  const docCount = (sessionId: string) => documents.get(sessionId)?.size ?? 0;

  const docsFor = (sessionId: string): Map<string, Record<string, unknown>> => {
    let m = documents.get(sessionId);
    if (!m) {
      m = new Map();
      documents.set(sessionId, m);
    }
    return m;
  };

  /** Rough `source_type` for uploaded titles (fixture JSON etc.). */
  const inferSourceType = (fileName: string): string => {
    const ext = fileName.split('.').pop()?.toLowerCase() ?? '';
    if (ext === 'yml') return 'yaml';
    if (
      ext === 'json' ||
      ext === 'yaml' ||
      ext === 'md' ||
      ext === 'txt' ||
      ext === 'log'
    )
      return ext;
    return 'text';
  };

  const decorateSession = (
    base: Record<string, unknown>,
  ): Record<string, unknown> => {
    const cid = notebookConversationSeedByPage.get(page);
    if (!cid) return base;
    const meta =
      (base.metadata as Record<string, unknown> | undefined) ??
      ({} as Record<string, unknown>);
    return {
      ...base,
      metadata: { ...meta, conversation_id: cid },
    };
  };

  const readSessionForApi = (sessionId: string): Record<string, unknown> => {
    const s = sessions.get(sessionId);
    if (!s) {
      throw new Error(`mock notebook: missing session ${sessionId}`);
    }
    return decorateSession({
      ...s,
      document_count: docCount(sessionId),
    });
  };

  const touchSessionAfterDocChange = (sid: string, updatedAt: string) => {
    const prev = sessions.get(sid);
    if (!prev) return;
    sessions.set(sid, {
      ...prev,
      updated_at: updatedAt,
      document_count: docCount(sid),
    });
  };

  const fulfillSessionsCollection = async (
    route: Route,
    method: string,
  ): Promise<boolean> => {
    if (method === 'GET') {
      const list = sessionsOrder.map(id => readSessionForApi(id));
      await route.fulfill({
        json: { status: 'success', sessions: list, count: list.length },
      });
      return true;
    }
    if (method !== 'POST') return false;

    const name = notebookRouteJsonName(route) ?? 'Untitled Notebook';
    const id = nextSessionId();
    const now = new Date().toISOString();
    const session: Record<string, unknown> = {
      session_id: id,
      user_id: E2E_NB_USER,
      name,
      description: '',
      created_at: now,
      updated_at: now,
      document_count: 0,
      metadata: {
        embedding_model: 'sentence-transformers/e2e-mock',
        provider_id: 'notebooks',
        conversation_id: null,
        embedding_dimension: '768',
      },
    };
    sessions.set(id, session);
    sessionsOrder.push(id);
    await route.fulfill({
      json: {
        status: 'success',
        session: readSessionForApi(id),
      },
    });
    return true;
  };

  const fulfillSessionSingle = async (
    route: Route,
    method: string,
    sid: string,
  ): Promise<boolean> => {
    const existing = sessions.get(sid);
    if (!existing) {
      await route.fulfill({
        status: 404,
        json: { status: 'error', error: 'Session not found' },
      });
      return true;
    }
    if (method === 'GET') {
      await route.fulfill({
        json: { status: 'success', session: readSessionForApi(sid) },
      });
      return true;
    }
    if (method === 'PUT') {
      const newName = notebookRouteJsonName(route);
      const next = { ...existing };
      if (newName !== undefined) next.name = newName;
      next.updated_at = new Date().toISOString();
      sessions.set(sid, next);
      await route.fulfill({ json: { status: 'success' } });
      return true;
    }
    if (method !== 'DELETE') return false;

    sessions.delete(sid);
    const ix = sessionsOrder.indexOf(sid);
    if (ix >= 0) sessionsOrder.splice(ix, 1);
    documents.delete(sid);
    await route.fulfill({ json: { status: 'success' } });
    return true;
  };

  const fulfillDocumentsDocumentsRoot = async (
    route: Route,
    method: string,
    sid: string,
  ): Promise<boolean> => {
    if (method === 'GET') {
      const arr = Array.from(docsFor(sid).values());
      await route.fulfill({
        json: {
          status: 'success',
          session_id: sid,
          documents: arr,
          count: arr.length,
        },
      });
      return true;
    }
    if (method !== 'PUT') return false;

    let fileName = 'upload.json';
    try {
      const buf = await route.request().postDataBuffer();
      if (buf) {
        const m = /filename="([^"]+)"/.exec(buf.toString('latin1'));
        if (m?.[1]) fileName = m[1];
      }
    } catch {
      /* keep default */
    }

    const docId = `doc_e2e_${Date.now()}_${randomUUID()}`;
    const now = new Date().toISOString();
    const doc: Record<string, unknown> = {
      document_id: docId,
      title: fileName,
      session_id: sid,
      user_id: E2E_NB_USER,
      source_type: inferSourceType(fileName),
      created_at: now,
    };
    docsFor(sid).set(docId, doc);
    touchSessionAfterDocChange(sid, now);

    await route.fulfill({
      status: 202,
      json: {
        status: 'processing',
        document_id: docId,
        session_id: sid,
        message: 'mock upload accepted',
      },
    });
    return true;
  };

  const fulfillDocumentDelete = async (
    route: Route,
    method: string,
    sid: string,
    encodedDocId: string,
  ): Promise<boolean> => {
    if (method !== 'DELETE') return false;

    docsFor(sid).delete(decodeURIComponent(encodedDocId));
    touchSessionAfterDocChange(sid, new Date().toISOString());
    await route.fulfill({ json: { status: 'success' } });
    return true;
  };

  const fulfillDocumentStatus = async (
    route: Route,
    method: string,
    sid: string,
    encodedDocId: string,
  ): Promise<boolean> => {
    if (method !== 'GET') return false;

    const docId = decodeURIComponent(encodedDocId);
    if (!docsFor(sid).has(docId)) {
      await route.fulfill({
        status: 404,
        json: { status: 'error', error: 'Document not found' },
      });
      return true;
    }
    await route.fulfill({
      json: {
        status: 'completed',
        document_id: docId,
        session_id: sid,
      },
    });
    return true;
  };

  const fulfillDocumentsRoutes = async (
    route: Route,
    method: string,
    tail: string[],
    sid: string,
  ): Promise<boolean> => {
    if (!sessions.has(sid)) {
      await route.fulfill({
        status: 404,
        json: { status: 'error', error: 'Session not found' },
      });
      return true;
    }
    if (tail.length === 2 && tail[1] === 'documents') {
      return fulfillDocumentsDocumentsRoot(route, method, sid);
    }
    if (
      tail.length === 4 &&
      tail[1] === 'documents' &&
      tail[3] === 'status' &&
      tail[2]
    ) {
      return fulfillDocumentStatus(route, method, sid, tail[2]);
    }
    if (tail.length === 3 && tail[1] === 'documents' && tail[2]) {
      return fulfillDocumentDelete(route, method, sid, tail[2]);
    }
    return false;
  };

  return async (route: Route): Promise<void> => {
    const req = route.request();
    const urlObj = new URL(req.url());
    if (!notebookLightspeedV1RouteMatches(urlObj)) {
      await route.fallback();
      return;
    }
    const tail = notebookV1SessionsPathTail(urlObj.pathname);
    if (!tail) {
      await route.fallback();
      return;
    }
    const method = req.method();
    try {
      if (tail.length === 0 && (await fulfillSessionsCollection(route, method)))
        return;
      const sessionSegment = tail[0];
      if (!sessionSegment) {
        await route.fallback();
        return;
      }
      const sid = decodeURIComponent(sessionSegment);
      if (
        tail.length === 1 &&
        (await fulfillSessionSingle(route, method, sid))
      ) {
        return;
      }
      if (
        tail.length >= 2 &&
        tail[1] === 'documents' &&
        (await fulfillDocumentsRoutes(route, method, tail, sid))
      ) {
        return;
      }
    } catch {
      await route.fulfill({
        status: 500,
        json: { status: 'error', error: 'mock notebooks handler error' },
      });
      return;
    }
    await route.fallback();
  };
}

/**
 * In-memory notebooks API (`NotebooksApiClient`): sessions CRUD, document upload/list/delete/status.
 * Mirrors how other Lightspeed mocks use `page.route` + in-memory state (see {@link mockMcpServers}).
 */
export async function mockNotebookLightspeedBackend(page: Page): Promise<void> {
  await page.route(
    notebookLightspeedV1RouteMatches,
    createNotebookLightspeedRouteHandler(page),
  );
}

/**
 * Notebook tab only loads `/v2/conversations/:id` when `NotebookSession.metadata.conversation_id`
 * is set. Sets the per-page conversation seed for {@link mockNotebookLightspeedBackend}, overrides
 * GET `/v2/conversations/*` with seeded `chat_history`. Teardown clears the seed and restores
 * {@link mockChatHistory}.
 */
export async function withNotebookTabSeededConversation(
  page: Page,
  options: { conversationId: string; chatHistory: Record<string, unknown>[] },
): Promise<() => Promise<void>> {
  const { conversationId, chatHistory } = options;

  notebookE2eSetConversationSeed(page, conversationId);

  const conversationGetHandler = async (route: Route) => {
    if (route.request().method() !== 'GET') {
      await route.fallback();
      return;
    }
    const url = route.request().url();
    const match = url.match(/\/v2\/conversations\/([^/?]+)/);
    const captured = match?.[1];
    const id =
      captured === undefined ? conversationId : decodeURIComponent(captured);
    await route.fulfill({
      json: {
        conversation_id: id,
        chat_history: chatHistory,
      },
    });
  };

  await page.unroute(`${modelBaseUrl}/v2/conversations/*`);
  await page.route(
    `${modelBaseUrl}/v2/conversations/*`,
    conversationGetHandler,
  );

  return async () => {
    notebookE2eClearConversationSeed(page);
    await page.unroute(
      `${modelBaseUrl}/v2/conversations/*`,
      conversationGetHandler,
    );
    await mockChatHistory(page);
  };
}

export async function mockQuery(
  page: Page,
  query: string,
  conversations: any[],
) {
  await page.route(`${modelBaseUrl}/v1/query`, async route => {
    const payload = route.request().postDataJSON();

    if (payload.query === query) {
      conversations[1].conversation_id = payload.conversation_id;
    }
    const body = generateQueryResponse(
      payload.query === query
        ? conversations[1].conversation_id
        : conversations[0].conversation_id,
    );
    await route.fulfill({ body });
  });
}

/** Delays the mock response so Stop stays visible during the wait. */
export async function mockQueryWithResponseDelay(
  page: Page,
  query: string,
  conversations: any[],
  delayMs: number,
) {
  await page.unroute(`${modelBaseUrl}/v1/query`);
  await page.route(`${modelBaseUrl}/v1/query`, async route => {
    await new Promise<void>(resolve => {
      setTimeout(resolve, delayMs);
    });
    const payload = route.request().postDataJSON();

    if (payload.query === query) {
      conversations[1].conversation_id = payload.conversation_id;
    }
    const body = generateQueryResponse(
      payload.query === query
        ? conversations[1].conversation_id
        : conversations[0].conversation_id,
    );
    await route.fulfill({ body });
  });
}

const mcpServersRouteGlob = `${modelBaseUrl}/mcp-servers**`;

/**
 * Mocks GET/PATCH `/api/lightspeed/mcp-servers` and POST credential/server validation.
 * Keeps in-memory state so PATCH (e.g. token) is reflected on subsequent GET.
 */
export async function mockMcpServers(
  page: Page,
  json: McpServersListMock = mockedMcpServersResponse,
  options: MockMcpServersOptions = {},
) {
  mcpServersMockState = cloneMcpServersMock(json);
  mcpMockOptions = options;
  await page.unroute(mcpServersRouteGlob);
  await page.route(mcpServersRouteGlob, async route => {
    const req = route.request();
    const pathname = new URL(req.url()).pathname;
    const suffix = pathname.replace(/^.*\/api\/lightspeed\/mcp-servers\/?/, '');
    const segments = suffix.split('/').filter(Boolean);

    if (req.method() === 'GET' && segments.length === 0) {
      await route.fulfill({ json: mcpServersMockState });
      return;
    }

    if (
      req.method() === 'POST' &&
      segments.length === 1 &&
      segments[0] === 'validate'
    ) {
      let body: { url?: string; token?: string };
      try {
        body = req.postDataJSON();
      } catch {
        await route.fulfill({ status: 400, json: { error: 'Invalid JSON' } });
        return;
      }
      const valid = body.token === E2E_MCP_VALID_TOKEN;
      await route.fulfill({
        json: valid
          ? { valid: true, toolCount: 1 }
          : {
              valid: false,
              toolCount: 0,
            },
      });
      return;
    }

    if (
      req.method() === 'POST' &&
      segments.length === 2 &&
      segments[1] === 'validate'
    ) {
      const nameSeg = segments[0];
      if (!nameSeg) {
        await route.fulfill({ status: 400, json: { error: 'Invalid path' } });
        return;
      }
      const name = decodeURIComponent(nameSeg);
      if (mcpMockOptions.failServerValidateFor === name) {
        await route.fulfill({
          json: {
            name,
            status: 'error' as const,
            toolCount: 0,
            validation: {
              error:
                mcpMockOptions.failServerValidateError ??
                'Upstream MCP validation failed.',
            },
          },
        });
        return;
      }

      // Mirror GET list data. The real UI calls validate after load for each server with a
      // token; a static { toolCount: 5 } here overwrote scenario tool counts (14 tools, etc.).
      const server = mcpServersMockState.servers.find(s => s.name === name);
      if (!server) {
        await route.fulfill({
          status: 404,
          json: { error: `MCP server '${name}' is not configured` },
        });
        return;
      }

      const toolCount = server.toolCount;
      await route.fulfill({
        json: {
          name,
          status: server.status,
          toolCount,
          ...(server.status === 'error'
            ? { validation: { error: 'MCP validation failed' } }
            : {}),
        },
      });
      return;
    }

    if (req.method() === 'PATCH' && segments.length === 1) {
      const nameSeg = segments[0];
      if (!nameSeg) {
        await route.fulfill({ status: 400, json: { error: 'Invalid path' } });
        return;
      }
      const name = decodeURIComponent(nameSeg);
      let body: { enabled?: boolean; token?: string | null };
      try {
        body = req.postDataJSON();
      } catch {
        await route.fulfill({ status: 400, json: { error: 'Invalid JSON' } });
        return;
      }
      const server = mcpServersMockState.servers.find(s => s.name === name);
      if (!server) {
        await route.fulfill({
          status: 404,
          json: {
            error: `MCP server '${name}' is not configured`,
          },
        });
        return;
      }
      if (body.enabled !== undefined) {
        server.enabled = body.enabled;
      }
      if (Object.prototype.hasOwnProperty.call(body, 'token')) {
        const tok = body.token;
        if (tok && String(tok).trim().length > 0) {
          server.hasToken = true;
          server.hasUserToken = true;
          server.status = 'connected';
          server.toolCount = 5;
        } else {
          server.hasToken = false;
          server.hasUserToken = false;
          server.status = 'unknown';
          server.toolCount = 0;
        }
      }
      await route.fulfill({ json: { server } });
      return;
    }

    await route.continue();
  });
}

export async function mockFeedbackStatus(page: Page, enabled = true) {
  await page.route(`${modelBaseUrl}/v1/feedback/status`, async route => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        functionality: 'feedback',
        status: {
          enabled: enabled,
        },
      }),
    });
  });
}

export async function mockFeedbackReceived(page: Page) {
  await page.route(`${modelBaseUrl}/v1/feedback`, async route => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        response: 'feedback received',
      }),
    });
  });
}
