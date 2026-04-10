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
import { Page } from '@playwright/test';
import {
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
      const name = decodeURIComponent(segments[0]!);
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
      if (server.status === 'error') {
        await route.fulfill({
          json: {
            name,
            status: 'error' as const,
            toolCount,
            validation: { error: 'MCP validation failed' },
          },
        });
        return;
      }
      if (server.status === 'unknown') {
        await route.fulfill({
          json: {
            name,
            status: 'unknown' as const,
            toolCount,
          },
        });
        return;
      }

      await route.fulfill({
        json: {
          name,
          status: 'connected' as const,
          toolCount,
        },
      });
      return;
    }

    if (req.method() === 'PATCH' && segments.length === 1) {
      const name = decodeURIComponent(segments[0]!);
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
      const updated = { ...server };
      if (body.enabled !== undefined) {
        updated.enabled = body.enabled;
      }
      if (Object.prototype.hasOwnProperty.call(body, 'token')) {
        const tok = body.token;
        if (tok && String(tok).trim().length > 0) {
          updated.hasToken = true;
          updated.hasUserToken = true;
          updated.status = 'connected';
          updated.toolCount = 5;
        } else {
          updated.hasToken = false;
          updated.hasUserToken = false;
          updated.status = 'unknown';
          updated.toolCount = 0;
        }
      }
      const idx = mcpServersMockState.servers.findIndex(s => s.name === name);
      mcpServersMockState.servers[idx] = updated;
      await route.fulfill({ json: { server: updated } });
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
