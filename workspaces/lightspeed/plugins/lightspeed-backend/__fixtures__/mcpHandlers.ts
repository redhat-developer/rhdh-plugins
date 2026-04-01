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

import { http, HttpResponse, type HttpHandler } from 'msw';

export const MOCK_MCP_ADDR = 'https://mock-mcp-server:9999';
export const MOCK_MCP_VALID_TOKEN = 'valid-mcp-token';

const MOCK_TOOLS = [
  { name: 'create_issue', description: 'Create a GitHub issue' },
  { name: 'list_repos', description: 'List repositories' },
  { name: 'get_user', description: 'Get user profile' },
];

export const mcpHandlers: HttpHandler[] = [
  http.post(MOCK_MCP_ADDR, async ({ request }) => {
    const auth = request.headers.get('Authorization');
    if (auth !== `Bearer ${MOCK_MCP_VALID_TOKEN}`) {
      return HttpResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = (await request.json()) as { method: string; id?: number };

    if (body.method === 'initialize') {
      return HttpResponse.json(
        {
          jsonrpc: '2.0',
          result: {
            protocolVersion: '2024-11-05',
            capabilities: { tools: {} },
            serverInfo: { name: 'mock-mcp-server', version: '1.0.0' },
          },
          id: body.id,
        },
        { headers: { 'Mcp-Session-Id': 'mock-session-123' } },
      );
    }

    if (body.method === 'notifications/initialized') {
      return new HttpResponse(null, { status: 204 });
    }

    if (body.method === 'tools/list') {
      return HttpResponse.json({
        jsonrpc: '2.0',
        result: { tools: MOCK_TOOLS },
        id: body.id,
      });
    }

    return HttpResponse.json(
      {
        jsonrpc: '2.0',
        error: { code: -32601, message: 'Method not found' },
        id: body.id,
      },
      { status: 200 },
    );
  }),
];
