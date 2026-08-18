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

import { ORCHESTRATOR_WORKFLOW_RESOURCE_TYPE } from '@red-hat-developer-hub/backstage-plugin-orchestrator-common';

import type { Server } from 'node:http';

// eslint-disable-next-line import/first -- must follow jest.mock setup above
import { orchestratorPlugin } from '../plugin';

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

export type BackendPermissionMode =
  'allow-all' | 'deny-all' | 'conditional-workflow1-only';

export type StartMcpBackendOptions = {
  pluginSources?: string[];
  permissionMode?: BackendPermissionMode;
};

function getServerPort(server: Server): number {
  const address = server.address();
  if (typeof address !== 'object' || !address || !('port' in address)) {
    throw new Error('Test backend server address is unavailable');
  }
  return address.port;
}

function conditionalWorkflowDecision(workflowIds: string[]): PolicyDecision {
  return {
    result: AuthorizeResult.CONDITIONAL,
    pluginId: 'orchestrator',
    resourceType: ORCHESTRATOR_WORKFLOW_RESOURCE_TYPE,
    conditions: {
      anyOf: [
        {
          rule: 'IS_ALLOWED_WORKFLOW_ID',
          resourceType: ORCHESTRATOR_WORKFLOW_RESOURCE_TYPE,
          params: { workflowIds },
        },
      ],
    },
  } as PolicyDecision;
}

function createPermissionsFactory(mode: BackendPermissionMode) {
  if (mode === 'deny-all') {
    return mockServices.permissions.mock({
      authorize: async () => [{ result: AuthorizeResult.DENY }],
      authorizeConditional: async () => [{ result: AuthorizeResult.DENY }],
    }).factory;
  }

  if (mode === 'conditional-workflow1-only') {
    return mockServices.permissions.mock({
      authorize: async () => [{ result: AuthorizeResult.DENY }],
      authorizeConditional: async () => [
        conditionalWorkflowDecision(['workflow1']),
      ],
    }).factory;
  }

  return mockServices.permissions.mock({
    authorize: async () => [{ result: AuthorizeResult.ALLOW }],
    authorizeConditional: async () => [{ result: AuthorizeResult.ALLOW }],
  }).factory;
}

export async function startMcpBackend({
  pluginSources = ['orchestrator'],
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
            actions: { pluginSources },
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
