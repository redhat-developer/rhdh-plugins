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
  generateQueryResponse,
  mockedMcpServersResponse,
  modelBaseUrl,
  type McpServersListMock,
} from '../fixtures/responses';

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
 * Mocks GET `/api/lightspeed/mcp-servers` and PATCH `/api/lightspeed/mcp-servers/:name`
 * (toggle enabled). Other methods (e.g. POST validate) pass through to the backend.
 */
export async function mockMcpServers(
  page: Page,
  json: McpServersListMock = mockedMcpServersResponse,
) {
  await page.unroute(mcpServersRouteGlob);
  await page.route(mcpServersRouteGlob, async route => {
    const req = route.request();
    const pathname = new URL(req.url()).pathname;
    const suffix = pathname.replace(/^.*\/api\/lightspeed\/mcp-servers\/?/, '');
    const segments = suffix.split('/').filter(Boolean);

    if (req.method() === 'GET' && segments.length === 0) {
      await route.fulfill({ json });
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
      const server = json.servers.find(s => s.name === name);
      if (!server) {
        await route.fulfill({
          status: 404,
          json: {
            error: `MCP server '${name}' is not configured`,
          },
        });
        return;
      }
      const updated = {
        ...server,
        enabled: body.enabled !== undefined ? body.enabled : server.enabled,
      };
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
