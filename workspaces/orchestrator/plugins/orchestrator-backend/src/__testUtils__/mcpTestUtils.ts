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
import {
  AuthorizeResult,
  type PolicyDecision,
} from '@backstage/plugin-permission-common';

import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StreamableHTTPClientTransport } from '@modelcontextprotocol/sdk/client/streamableHttp.js';

import type { Server } from 'node:http';

// Must be imported after the `jest.mock` calls above so that `orchestratorPlugin`'s
// transitive imports resolve to the mocked service classes.
// eslint-disable-next-line import/first
import { orchestratorPlugin } from '../plugin';

// Orchestrator has no official test double for SonataFlowService /
// DataIndexService / WorkflowCacheService / OrchestratorService (unlike e.g.
// Scorecard's `catalogServiceMock`). The only established convention for
// stubbing them in this package is `service/router.test.ts`'s same-package,
// relative-path `jest.mock(...)` calls, reused here verbatim so the real
// `orchestratorPlugin` boots through `startTestBackend` without touching a
// real SonataFlow/DataIndex service.
jest.mock('../service/DataIndexService', () => ({
  DataIndexService: jest.fn().mockImplementation(() => ({})),
}));

jest.mock('../service/SonataFlowService', () => ({
  SonataFlowService: jest.fn().mockImplementation(() => ({})),
}));

jest.mock('../service/WorkflowCacheService', () => ({
  WorkflowCacheService: jest.fn().mockImplementation(() => ({
    schedule: jest.fn(),
  })),
}));

export const mockOrchestratorService = {
  fetchInstance: jest.fn(),
  fetchWorkflowOverviews: jest.fn(),
  fetchWorkflowInfo: jest.fn(),
  fetchWorkflowDefinition: jest.fn(),
  fetchWorkflowInfoOnService: jest.fn(),
  executeWorkflow: jest.fn(),
  fetchInstances: jest.fn(),
  getWorkflowIds: jest.fn(),
};

jest.mock('../service/OrchestratorService', () => ({
  OrchestratorService: jest
    .fn()
    .mockImplementation(() => mockOrchestratorService),
}));

export type BackendPermissionMode = 'allow-all' | 'deny-all';

export type StartMcpBackendOptions = {
  permissionMode?: BackendPermissionMode;
};

function getServerPort(server: Server): number {
  const address = server.address();
  if (typeof address !== 'object' || !address || !('port' in address)) {
    throw new Error('Test backend server address is unavailable');
  }
  return address.port;
}

function createPermissionsFactory(mode: BackendPermissionMode) {
  const decision: PolicyDecision =
    mode === 'deny-all'
      ? { result: AuthorizeResult.DENY }
      : { result: AuthorizeResult.ALLOW };

  return mockServices.permissions.mock({
    authorize: async () => [decision],
    authorizeConditional: async () => [decision],
  }).factory;
}

export async function startMcpBackend({
  permissionMode = 'allow-all',
}: StartMcpBackendOptions = {}) {
  return startTestBackend({
    features: [
      orchestratorPlugin,
      mcpPlugin,
      mockServices.rootConfig.factory({
        data: {
          backend: {
            baseUrl: 'http://localhost:7007',
            actions: { pluginSources: ['orchestrator'] },
          },
          orchestrator: {
            dataIndexService: { url: 'http://localhost:8080' },
          },
        },
      }),
      mockServices.auth.factory(),
      mockServices.httpAuth.factory({
        defaultCredentials: mockCredentials.user('user:default/test'),
      }),
      createPermissionsFactory(permissionMode),
      mockServices.database.factory(),
      mockServices.cache.factory(),
    ],
  });
}

const MCP_TRANSPORT_RECONNECTION_OPTIONS = {
  initialReconnectionDelay: 0,
  maxReconnectionDelay: 0,
  reconnectionDelayGrowFactor: 1,
  maxRetries: 0,
} as const;

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
    // MCP servers may return 405 when session termination is unsupported.
  }

  await client.close();
}

export async function withMcpClient<T>(
  server: Server,
  run: (client: Client) => Promise<T>,
): Promise<T> {
  const client = new Client({
    name: 'orchestrator-mcp-integration-test',
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

export type CallToolResult = {
  structuredContent?: unknown;
  content?: Array<{ type: string; text?: string }>;
  isError?: boolean;
};

function stripMarkdownJsonFence(text: string): string {
  let jsonText = text.trim();

  if (jsonText.toLowerCase().startsWith('```json')) {
    jsonText = jsonText.slice('```json'.length);
  }

  if (jsonText.endsWith('```')) {
    jsonText = jsonText.slice(0, -3);
  }

  return jsonText.trim();
}

export function parseCallToolOutput(result: unknown): unknown {
  const callResult = result as CallToolResult;

  if (
    'structuredContent' in callResult &&
    callResult.structuredContent !== undefined
  ) {
    return callResult.structuredContent;
  }

  if ('content' in callResult && Array.isArray(callResult.content)) {
    for (const item of callResult.content) {
      if (
        item.type === 'text' &&
        'text' in item &&
        typeof item.text === 'string'
      ) {
        return JSON.parse(stripMarkdownJsonFence(item.text));
      }
    }
  }

  throw new Error('Call tool result did not include parseable output');
}

export function parseCallToolError(result: unknown): string {
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
