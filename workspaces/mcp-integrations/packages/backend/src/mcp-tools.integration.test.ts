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
import { metricsServiceMock } from '@backstage/backend-test-utils/alpha';
import {
  createServiceFactory,
  coreServices,
} from '@backstage/backend-plugin-api';
import type { HttpAuthService } from '@backstage/backend-plugin-api';
import { AuthenticationError } from '@backstage/errors';
import mcpPlugin from '@backstage/plugin-mcp-actions-backend';
import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StreamableHTTPClientTransport } from '@modelcontextprotocol/sdk/client/streamableHttp.js';
import {
  CallToolResultSchema,
  ListToolsResultSchema,
} from '@modelcontextprotocol/sdk/types.js';
import type { Server } from 'node:http';
import type { z } from 'zod';
import { catalogServiceMock } from '@backstage/plugin-catalog-node/testUtils';
import softwareCatalogMcpExtrasPlugin from '@red-hat-developer-hub/backstage-plugin-software-catalog-mcp-extras';
import mcpTechdocsExtrasPlugin from '@red-hat-developer-hub/backstage-plugin-techdocs-mcp-extras';
import mcpScaffolderExtrasPlugin from '@red-hat-developer-hub/backstage-plugin-scaffolder-mcp-extras';

const MCP_TOKEN = 'ci-test-mcp-token-12345';

const EXPECTED_EXTRA_TOOLS = [
  'scaffolder-mcp-extras.execute-template',
  'scaffolder-mcp-extras.fetch-template-metadata',
  'scaffolder-mcp-extras.get-scaffolder-task-logs',
  'scaffolder-mcp-extras.list-scaffolder-actions',
  'scaffolder-mcp-extras.list-scaffolder-tasks',
  'scaffolder-mcp-extras.validate-scaffolder',
  'software-catalog-mcp-extras.query-catalog-entities',
  'techdocs-mcp-extras.analyze-techdocs-coverage',
  'techdocs-mcp-extras.fetch-techdocs',
  'techdocs-mcp-extras.retrieve-techdocs-content',
];

const READ_ONLY_TOOLS = [
  'software-catalog-mcp-extras.query-catalog-entities',
  'techdocs-mcp-extras.fetch-techdocs',
  'techdocs-mcp-extras.analyze-techdocs-coverage',
  'techdocs-mcp-extras.retrieve-techdocs-content',
  'scaffolder-mcp-extras.fetch-template-metadata',
  'scaffolder-mcp-extras.list-scaffolder-tasks',
  'scaffolder-mcp-extras.list-scaffolder-actions',
  'scaffolder-mcp-extras.get-scaffolder-task-logs',
  'scaffolder-mcp-extras.validate-scaffolder',
];

const DESTRUCTIVE_TOOLS = ['scaffolder-mcp-extras.execute-template'];

const TECHDOCS_CONFIG = {
  builder: 'local',
  generator: { runIn: 'local' },
  publisher: { type: 'local' },
};

type CallToolResult = z.infer<typeof CallToolResultSchema>;
type McpTestBackend = Awaited<ReturnType<typeof startMcpBackend>>;

const ALL_PLUGIN_SOURCES = [
  'software-catalog-mcp-extras',
  'techdocs-mcp-extras',
  'scaffolder-mcp-extras',
] as const;

const BEARER_TOKEN_PATTERN = /^Bearer +(\S+)$/i;

function extractBearerToken(
  authHeader: string | undefined,
): string | undefined {
  if (typeof authHeader !== 'string') {
    return undefined;
  }

  const match = BEARER_TOKEN_PATTERN.exec(authHeader);
  return match?.[1];
}

function sortAlphabetically(items: readonly string[]): string[] {
  return [...items].sort((a, b) => a.localeCompare(b));
}

function createStrictMcpHttpAuthFeature() {
  return createServiceFactory({
    service: coreServices.httpAuth,
    deps: { plugin: coreServices.pluginMetadata },
    factory: ({ plugin }) => {
      const pluginId = plugin.getId();
      const standardHttpAuth = mockServices.httpAuth({
        pluginId,
        defaultCredentials: mockCredentials.user('user:default/test'),
      });

      const credentials = (async (req, options) => {
        const requestUrl = String(req.originalUrl ?? req.url ?? '');

        if (
          pluginId === 'mcp-actions' &&
          requestUrl.includes('/api/mcp-actions')
        ) {
          const token = extractBearerToken(req.headers.authorization);

          if (!token) {
            throw new AuthenticationError('Missing Authorization header');
          }

          if (token !== MCP_TOKEN) {
            throw new AuthenticationError('Invalid credentials');
          }

          return mockCredentials.user('user:default/mcp-client');
        }

        const token = extractBearerToken(req.headers.authorization);

        if (token === MCP_TOKEN) {
          return mockCredentials.user('user:default/mcp-client');
        }

        return standardHttpAuth.credentials(req, options);
      }) as HttpAuthService['credentials'];

      return {
        credentials,
        issueUserCookie:
          standardHttpAuth.issueUserCookie.bind(standardHttpAuth),
      };
    },
  });
}

type McpBackendOptions = {
  pluginSources: string[];
  requireMcpToken?: boolean;
};

function createBackendConfig(options: McpBackendOptions) {
  return {
    backend: {
      baseUrl: 'http://localhost:7007',
      actions: {
        pluginSources: options.pluginSources,
      },
    },
    techdocs: TECHDOCS_CONFIG,
  };
}

function getServerPort(server: Server): number {
  const address = server.address();
  if (typeof address !== 'object' || !address || !('port' in address)) {
    throw new Error('Test backend server address is unavailable');
  }
  return address.port;
}

async function startMcpBackend(options: McpBackendOptions) {
  const features = [
    mcpPlugin,
    softwareCatalogMcpExtrasPlugin,
    mcpTechdocsExtrasPlugin,
    mcpScaffolderExtrasPlugin,
    metricsServiceMock.mock().factory,
    mockServices.rootConfig.factory({
      data: createBackendConfig(options),
    }),
    mockServices.auth.factory(),
    catalogServiceMock.factory({ entities: [] }),
  ];

  if (options.requireMcpToken) {
    features.push(createStrictMcpHttpAuthFeature());
  } else {
    features.push(
      mockServices.httpAuth.factory({
        defaultCredentials: mockCredentials.user('user:default/test'),
      }),
    );
  }

  return startTestBackend({ features });
}

async function withMcpClient<T>(
  server: Server,
  run: (client: Client) => Promise<T>,
  headers?: Record<string, string>,
): Promise<T> {
  const client = new Client({
    name: 'mcp-integrations-test',
    version: '1.0.0',
  });

  const transport = new StreamableHTTPClientTransport(
    new URL(`http://127.0.0.1:${getServerPort(server)}/api/mcp-actions/v1`),
    headers
      ? {
          requestInit: {
            headers,
          },
        }
      : undefined,
  );

  try {
    await client.connect(transport);
    return await run(client);
  } finally {
    await client.close();
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

function parseCallToolOutput(result: unknown): unknown {
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

describe('MCP tools integration', () => {
  describe('tools/list', () => {
    describe('with all plugin sources', () => {
      let backend: McpTestBackend;

      beforeAll(async () => {
        backend = await startMcpBackend({
          pluginSources: [...ALL_PLUGIN_SOURCES],
        });
      });

      it('exposes all overlay MCP tools via the mcp-actions endpoint', async () => {
        await withMcpClient(backend.server, async client => {
          const result = await client.request(
            { method: 'tools/list' },
            ListToolsResultSchema,
          );

          const toolNames = sortAlphabetically(
            result.tools.map(tool => tool.name),
          );
          expect(toolNames).toEqual(sortAlphabetically(EXPECTED_EXTRA_TOOLS));
          expect(result.tools).toHaveLength(EXPECTED_EXTRA_TOOLS.length);
        });
      });

      it('includes description and inputSchema for every tool', async () => {
        await withMcpClient(backend.server, async client => {
          const result = await client.request(
            { method: 'tools/list' },
            ListToolsResultSchema,
          );

          for (const tool of result.tools) {
            expect(tool.description?.trim().length).toBeGreaterThan(0);
            expect(tool.inputSchema).toMatchObject({ type: 'object' });
          }
        });
      });

      it('marks read-only and destructive tools with the correct MCP hints', async () => {
        await withMcpClient(backend.server, async client => {
          const result = await client.request(
            { method: 'tools/list' },
            ListToolsResultSchema,
          );

          const toolsByName = Object.fromEntries(
            result.tools.map(tool => [tool.name, tool]),
          );

          for (const toolName of READ_ONLY_TOOLS) {
            expect(toolsByName[toolName]?.annotations?.readOnlyHint).toBe(true);
            expect(toolsByName[toolName]?.annotations?.destructiveHint).toBe(
              false,
            );
          }

          for (const toolName of DESTRUCTIVE_TOOLS) {
            expect(toolsByName[toolName]?.annotations?.destructiveHint).toBe(
              true,
            );
            expect(toolsByName[toolName]?.annotations?.readOnlyHint).toBe(
              false,
            );
          }
        });
      });
    });

    it('only exposes tools from configured pluginSources', async () => {
      const backend = await startMcpBackend({
        pluginSources: ['software-catalog-mcp-extras'],
      });

      await withMcpClient(backend.server, async client => {
        const result = await client.request(
          { method: 'tools/list' },
          ListToolsResultSchema,
        );

        expect(result.tools).toHaveLength(1);
        expect(result.tools[0]?.name).toBe(
          'software-catalog-mcp-extras.query-catalog-entities',
        );
      });
    });
  });

  describe('tools/call smoke tests', () => {
    let backend: McpTestBackend;
    let fetchSpy: jest.SpyInstance;

    beforeAll(async () => {
      backend = await startMcpBackend({
        pluginSources: [...ALL_PLUGIN_SOURCES],
      });
    });

    beforeEach(() => {
      const originalFetch = globalThis.fetch.bind(globalThis);
      fetchSpy = jest
        .spyOn(globalThis, 'fetch')
        .mockImplementation(async (input, init) => {
          const url = String(input);

          if (/\/api\/scaffolder(?:\/|\?|$)/.test(url)) {
            return {
              ok: true,
              json: async () => ({ tasks: [], totalTasks: 0 }),
            } as Response;
          }

          return originalFetch(input, init);
        });
    });

    afterEach(() => {
      fetchSpy.mockRestore();
    });

    it('calls query-catalog-entities and returns an empty entity list', async () => {
      await withMcpClient(backend.server, async client => {
        const result = await client.callTool(
          {
            name: 'software-catalog-mcp-extras.query-catalog-entities',
            arguments: {},
          },
          CallToolResultSchema,
        );

        expect(parseCallToolOutput(result)).toEqual({ entities: [] });
      });
    });

    it('calls analyze-techdocs-coverage and returns coverage stats', async () => {
      await withMcpClient(backend.server, async client => {
        const result = await client.callTool(
          {
            name: 'techdocs-mcp-extras.analyze-techdocs-coverage',
            arguments: {},
          },
          CallToolResultSchema,
        );

        expect(parseCallToolOutput(result)).toMatchObject({
          totalEntities: 0,
          entitiesWithDocs: 0,
          coveragePercentage: 0,
        });
      });
    });

    it('calls fetch-template-metadata and returns an empty template list', async () => {
      await withMcpClient(backend.server, async client => {
        const result = await client.callTool(
          {
            name: 'scaffolder-mcp-extras.fetch-template-metadata',
            arguments: {},
          },
          CallToolResultSchema,
        );

        expect(parseCallToolOutput(result)).toEqual({ templates: [] });
      });
    });
  });

  describe('authentication', () => {
    let backend: McpTestBackend;

    beforeAll(async () => {
      backend = await startMcpBackend({
        pluginSources: ['software-catalog-mcp-extras'],
        requireMcpToken: true,
      });
    });

    it('rejects MCP requests without Authorization when an MCP token is required', async () => {
      await expect(
        withMcpClient(backend.server, async client =>
          client.request({ method: 'tools/list' }, ListToolsResultSchema),
        ),
      ).rejects.toThrow();
    });

    it('allows tools/list with a valid Bearer token', async () => {
      await withMcpClient(
        backend.server,
        async client => {
          const result = await client.request(
            { method: 'tools/list' },
            ListToolsResultSchema,
          );

          expect(result.tools).toHaveLength(1);
          expect(result.tools[0]?.name).toBe(
            'software-catalog-mcp-extras.query-catalog-entities',
          );
        },
        { Authorization: `Bearer ${MCP_TOKEN}` },
      );
    });
  });
});
