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

import type { Entity } from '@backstage/catalog-model';
import {
  mockCredentials,
  mockServices,
  startTestBackend,
} from '@backstage/backend-test-utils';
import { metricsServiceMock } from '@backstage/backend-test-utils/alpha';
import { AuthorizeResult } from '@backstage/plugin-permission-common';
import { catalogServiceMock } from '@backstage/plugin-catalog-node/testUtils';
import mcpPlugin from '@backstage/plugin-mcp-actions-backend';
import scorecardPlugin from '@red-hat-developer-hub/backstage-plugin-scorecard-backend';
import scorecardFilecheckModule from '@red-hat-developer-hub/backstage-plugin-scorecard-backend-module-filecheck';
import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StreamableHTTPClientTransport } from '@modelcontextprotocol/sdk/client/streamableHttp.js';
import type { Server } from 'node:http';

export type CallToolResult = {
  structuredContent?: unknown;
  content?: Array<{ type: string; text?: string }>;
  isError?: boolean;
};

export type BackendPermissionMode =
  | 'allow-all'
  | 'deny-entity-read'
  | 'conditional-license-only';

export type StartMcpBackendOptions = {
  pluginSources: string[];
  entities?: Entity[];
  permissionMode?: BackendPermissionMode;
};

const MCP_TRANSPORT_RECONNECTION_OPTIONS = {
  initialReconnectionDelay: 0,
  maxReconnectionDelay: 0,
  reconnectionDelayGrowFactor: 1,
  maxRetries: 0,
} as const;

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
    scorecard: {
      plugins: {
        filecheck: {
          files: {
            license: 'LICENSE',
            codeowners: 'CODEOWNERS',
          },
        },
      },
    },
  };
}

function createPermissionsFactory(permissionMode: BackendPermissionMode) {
  if (permissionMode === 'deny-entity-read') {
    return mockServices.permissions.mock({
      authorize: async () => [{ result: AuthorizeResult.DENY }],
      authorizeConditional: async () => [{ result: AuthorizeResult.ALLOW }],
    }).factory;
  }

  if (permissionMode === 'conditional-license-only') {
    return mockServices.permissions.mock({
      authorize: async () => [{ result: AuthorizeResult.ALLOW }],
      authorizeConditional: async () => [
        {
          result: AuthorizeResult.CONDITIONAL,
          pluginId: 'scorecard',
          resourceType: 'scorecard-metric',
          conditions: {
            rule: 'HAS_METRIC_ID',
            resourceType: 'scorecard-metric',
            params: { metricIds: ['filecheck.license'] },
          },
        },
      ],
    }).factory;
  }

  return mockServices.permissions.mock({
    authorize: async () => [{ result: AuthorizeResult.ALLOW }],
    authorizeConditional: async () => [{ result: AuthorizeResult.ALLOW }],
  }).factory;
}

export async function startMcpBackend({
  pluginSources,
  entities = [],
  permissionMode = 'allow-all',
}: StartMcpBackendOptions) {
  return startTestBackend({
    features: [
      mcpPlugin,
      scorecardPlugin,
      scorecardFilecheckModule,
      metricsServiceMock.mock().factory,
      mockServices.rootLogger.factory(),
      mockServices.rootConfig.factory({
        data: createBackendConfig(pluginSources),
      }),
      mockServices.auth.factory(),
      mockServices.httpAuth.factory({
        defaultCredentials: mockCredentials.user('user:default/test'),
      }),
      createPermissionsFactory(permissionMode),
      mockServices.database.factory(),
      mockServices.cache.factory(),
      mockServices.urlReader.factory(),
      catalogServiceMock.factory({ entities }),
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
    // MCP servers may return 405 when session termination is unsupported.
  }

  await client.close();
}

export async function withMcpClient<T>(
  server: Server,
  run: (client: Client) => Promise<T>,
): Promise<T> {
  const client = new Client({
    name: 'scorecard-mcp-integration-test',
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

export function createTestComponentEntity(
  name: string,
  namespace = 'default',
): Entity {
  return {
    apiVersion: 'backstage.io/v1alpha1',
    kind: 'Component',
    metadata: {
      name,
      namespace,
    },
    spec: {
      type: 'service',
      owner: 'group:default/guests',
      lifecycle: 'experimental',
    },
  };
}
