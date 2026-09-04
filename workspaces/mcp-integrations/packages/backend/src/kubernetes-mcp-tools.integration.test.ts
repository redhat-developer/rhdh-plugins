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

import {
  mockCredentials,
  mockServices,
  startTestBackend,
} from '@backstage/backend-test-utils';
import mcpPlugin from '@backstage/plugin-mcp-actions-backend';
import mcpKubernetesExtrasPlugin from '@red-hat-developer-hub/backstage-plugin-kubernetes-mcp-extras';
import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StreamableHTTPClientTransport } from '@modelcontextprotocol/sdk/client/streamableHttp.js';
import {
  CallToolResultSchema,
  ListToolsResultSchema,
} from '@modelcontextprotocol/sdk/types.js';
import type { Server } from 'node:http';

type CallToolResult = {
  structuredContent?: unknown;
  content?: Array<{ type: string; text?: string }>;
  isError?: boolean;
};

type StartKubernetesMcpBackendOptions = {
  pluginSources?: string[];
};

const MCP_TRANSPORT_RECONNECTION_OPTIONS = {
  initialReconnectionDelay: 0,
  maxReconnectionDelay: 0,
  reconnectionDelayGrowFactor: 1,
  maxRetries: 0,
} as const;

const KUBERNETES_TOOL_NAMES = [
  'kubernetes-mcp-extras.get-kubernetes-clusters',
  'kubernetes-mcp-extras.get-kubernetes-resources-for-entity',
] as const;

function getServerPort(server: Server): number {
  const address = server.address();
  if (typeof address !== 'object' || !address || !('port' in address)) {
    throw new Error('Test backend server address is unavailable');
  }
  return address.port;
}

function createBackendConfig(pluginSources: string[]) {
  return {
    backend: {
      baseUrl: 'http://localhost:7007',
      actions: {
        pluginSources,
      },
    },
  };
}

async function startKubernetesMcpBackend({
  pluginSources = ['kubernetes-mcp-extras'],
}: StartKubernetesMcpBackendOptions = {}) {
  return startTestBackend({
    features: [
      mcpKubernetesExtrasPlugin,
      mcpPlugin,
      mockServices.rootConfig.factory({
        data: createBackendConfig(pluginSources),
      }),
      mockServices.auth.factory(),
      mockServices.httpAuth.factory({
        defaultCredentials: mockCredentials.user('user:default/test'),
      }),
    ],
  });
}

function createMcpTransport(server: Server): StreamableHTTPClientTransport {
  return new StreamableHTTPClientTransport(
    new URL(`http://127.0.0.1:${getServerPort(server)}/api/mcp-actions/v1`),
    {
      reconnectionOptions: { ...MCP_TRANSPORT_RECONNECTION_OPTIONS },
    },
  );
}

async function closeMcpConnection(
  client: Client,
  transport: StreamableHTTPClientTransport,
): Promise<void> {
  try {
    await transport.terminateSession();
  } catch {
    // MCP servers may respond with 405 when session termination is unsupported.
  }

  await client.close();
}

async function withMcpClient<T>(
  server: Server,
  run: (client: Client) => Promise<T>,
): Promise<T> {
  const client = new Client({
    name: 'kubernetes-mcp-integration-test',
    version: '1.0.0',
  });

  const transport = createMcpTransport(server);

  try {
    await client.connect(transport);
    return await run(client);
  } finally {
    await closeMcpConnection(client, transport);
  }
}

function parseCallToolError(result: unknown): string {
  const callResult = result as CallToolResult;
  const messages: string[] = [];

  if ('content' in callResult && Array.isArray(callResult.content)) {
    for (const item of callResult.content) {
      if (item.type === 'text' && typeof item.text === 'string') {
        messages.push(item.text);
      }
    }
  }

  return messages.join('\n');
}

type McpTestBackend = Awaited<ReturnType<typeof startKubernetesMcpBackend>>;

describe('Kubernetes MCP tools integration', () => {
  let backend: McpTestBackend;

  beforeAll(async () => {
    backend = await startKubernetesMcpBackend();
  });

  it('marks kubernetes tools as read-only in MCP metadata', async () => {
    await withMcpClient(backend.server, async client => {
      const result = await client.request(
        { method: 'tools/list' },
        ListToolsResultSchema,
      );

      const toolsByName = Object.fromEntries(
        result.tools.map(tool => [tool.name, tool]),
      );

      for (const toolName of KUBERNETES_TOOL_NAMES) {
        expect(toolsByName[toolName]?.annotations?.readOnlyHint).toBe(true);
        expect(toolsByName[toolName]?.annotations?.destructiveHint).toBe(false);
        expect(toolsByName[toolName]?.inputSchema).toMatchObject({
          type: 'object',
        });
        expect(
          toolsByName[toolName]?.description?.trim().length,
        ).toBeGreaterThan(0);
      }
    });
  });

  it('hides kubernetes tools when kubernetes-mcp-extras is not in pluginSources', async () => {
    const filteredBackend = await startKubernetesMcpBackend({
      pluginSources: [],
    });

    await withMcpClient(filteredBackend.server, async client => {
      const result = await client.request(
        { method: 'tools/list' },
        ListToolsResultSchema,
      );

      const toolNames = result.tools.map(tool => tool.name);
      for (const toolName of KUBERNETES_TOOL_NAMES) {
        expect(toolNames).not.toContain(toolName);
      }
    });
  });

  it('returns validation error when get-kubernetes-resources-for-entity name is missing', async () => {
    await withMcpClient(backend.server, async client => {
      const result = await client.callTool(
        {
          name: 'kubernetes-mcp-extras.get-kubernetes-resources-for-entity',
          arguments: {},
        },
        CallToolResultSchema,
      );

      expect(result.isError).toBe(true);
      expect(parseCallToolError(result)).toContain('name');
    });
  });

  it('returns validation error when get-kubernetes-resources-for-entity name has invalid type', async () => {
    await withMcpClient(backend.server, async client => {
      const result = await client.callTool(
        {
          name: 'kubernetes-mcp-extras.get-kubernetes-resources-for-entity',
          arguments: { name: 12345 },
        },
        CallToolResultSchema,
      );

      expect(result.isError).toBe(true);
      expect(parseCallToolError(result)).toContain('name');
    });
  });
});
