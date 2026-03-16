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

import { createMockLogger } from '../../test-utils/mocks';
import { buildTools } from './ToolsBuilder';
import type { ToolsBuilderDeps } from './ToolsBuilder';
import type { EffectiveConfig, MCPServerConfig } from '../../types';

function makeConfig(overrides: Partial<EffectiveConfig> = {}): EffectiveConfig {
  return {
    model: 'test-model',
    baseUrl: 'https://llama.example.com',
    systemPrompt: '',
    enableWebSearch: false,
    enableCodeInterpreter: false,
    vectorStoreIds: [],
    vectorStoreName: 'default',
    embeddingModel: 'test-embedding',
    embeddingDimension: 384,
    chunkingStrategy: 'static',
    maxChunkSizeTokens: 512,
    chunkOverlapTokens: 50,
    skipTlsVerify: false,
    zdrMode: false,
    verboseStreamLogging: false,
    ...overrides,
  };
}

function makeMcpServer(
  overrides: Partial<MCPServerConfig> = {},
): MCPServerConfig {
  return {
    id: 'mcp-1',
    name: 'Test MCP',
    type: 'streamable-http',
    url: 'https://mcp.example.com',
    ...overrides,
  };
}

describe('buildTools', () => {
  const logger = createMockLogger();

  it('returns empty array when RAG disabled and no MCP servers', async () => {
    const deps: ToolsBuilderDeps = {
      client: {} as ToolsBuilderDeps['client'],
      config: makeConfig(),
      mcpServers: [],
      mcpAuth: null,
      conversations: null,
    };
    const tools = await buildTools(false, deps, logger);
    expect(tools).toEqual([]);
  });

  it('skips MCP servers when mcpAuth is null', async () => {
    const deps: ToolsBuilderDeps = {
      client: {} as ToolsBuilderDeps['client'],
      config: makeConfig(),
      mcpServers: [makeMcpServer()],
      mcpAuth: null,
      conversations: null,
    };
    const tools = await buildTools(false, deps, logger);
    expect(tools).toEqual([]);
    expect(logger.warn).toHaveBeenCalledWith(
      expect.stringContaining('McpAuthService not initialized'),
    );
  });

  it('adds file_search tool when RAG enabled and vectorStoreIds configured', async () => {
    const deps: ToolsBuilderDeps = {
      client: {} as ToolsBuilderDeps['client'],
      config: makeConfig({
        vectorStoreIds: ['vs-1', 'vs-2'],
        fileSearchMaxResults: 15,
        fileSearchScoreThreshold: 0.5,
      }),
      mcpServers: [],
      mcpAuth: null,
      conversations: null,
    };
    const tools = await buildTools(true, deps, logger);
    expect(tools).toHaveLength(1);
    expect(tools[0]).toEqual({
      type: 'file_search',
      vector_store_ids: ['vs-1', 'vs-2'],
      max_num_results: 15,
      ranking_options: { score_threshold: 0.5 },
    });
  });

  it('does not add file_search when RAG enabled but no vectorStoreIds', async () => {
    const deps: ToolsBuilderDeps = {
      client: {} as ToolsBuilderDeps['client'],
      config: makeConfig({ vectorStoreIds: [] }),
      mcpServers: [],
      mcpAuth: null,
      conversations: null,
    };
    const tools = await buildTools(true, deps, logger);
    expect(tools).toEqual([]);
    expect(logger.warn).toHaveBeenCalledWith(
      expect.stringContaining('no vector store IDs configured'),
    );
  });

  it('adds MCP tools when mcpAuth is provided', async () => {
    const mcpAuth = {
      getApiApprovalConfig: jest.fn().mockReturnValue('never'),
      getServerHeaders: jest.fn().mockResolvedValue({}),
    };
    const deps: ToolsBuilderDeps = {
      client: {} as ToolsBuilderDeps['client'],
      config: makeConfig(),
      mcpServers: [
        makeMcpServer({ id: 'mcp-a', url: 'https://mcp-a.example.com' }),
      ],
      mcpAuth: mcpAuth as unknown as ToolsBuilderDeps['mcpAuth'],
      conversations: null,
    };
    const tools = await buildTools(false, deps, logger);
    expect(tools).toHaveLength(1);
    expect(tools[0]).toEqual({
      type: 'mcp',
      server_url: 'https://mcp-a.example.com',
      server_label: 'mcp-a',
      require_approval: 'never',
    });
    expect(mcpAuth.getApiApprovalConfig).toHaveBeenCalledWith(undefined);
    expect(mcpAuth.getServerHeaders).toHaveBeenCalledWith(deps.mcpServers[0]);
  });

  it('adds allowed_tools when MCP server has allowedTools', async () => {
    const mcpAuth = {
      getApiApprovalConfig: jest.fn().mockReturnValue('never'),
      getServerHeaders: jest.fn().mockResolvedValue({}),
    };
    const deps: ToolsBuilderDeps = {
      client: {} as ToolsBuilderDeps['client'],
      config: makeConfig(),
      mcpServers: [
        makeMcpServer({
          id: 'mcp-filtered',
          allowedTools: ['tool1', 'tool2'],
        }),
      ],
      mcpAuth: mcpAuth as unknown as ToolsBuilderDeps['mcpAuth'],
      conversations: null,
    };
    const tools = await buildTools(false, deps, logger);
    expect(tools[0]).toMatchObject({
      type: 'mcp',
      allowed_tools: ['tool1', 'tool2'],
    });
  });

  it('adds headers when getServerHeaders returns non-empty', async () => {
    const mcpAuth = {
      getApiApprovalConfig: jest.fn().mockReturnValue('never'),
      getServerHeaders: jest.fn().mockResolvedValue({
        Authorization: 'Bearer token123',
      }),
    };
    const deps: ToolsBuilderDeps = {
      client: {} as ToolsBuilderDeps['client'],
      config: makeConfig(),
      mcpServers: [makeMcpServer()],
      mcpAuth: mcpAuth as unknown as ToolsBuilderDeps['mcpAuth'],
      conversations: null,
    };
    const tools = await buildTools(false, deps, logger);
    expect(tools[0]).toMatchObject({
      headers: { Authorization: 'Bearer token123' },
    });
  });

  it('adds custom function tools from config', async () => {
    const deps: ToolsBuilderDeps = {
      client: {} as ToolsBuilderDeps['client'],
      config: makeConfig({
        functions: [
          {
            name: 'search_catalog',
            description: 'Search the catalog',
            parameters: {
              type: 'object',
              properties: { q: { type: 'string' } },
            },
            strict: true,
          },
        ],
      }),
      mcpServers: [],
      mcpAuth: null,
      conversations: null,
    };
    const tools = await buildTools(false, deps, logger);
    expect(tools).toHaveLength(1);
    expect(tools[0]).toEqual({
      type: 'function',
      name: 'search_catalog',
      description: 'Search the catalog',
      parameters: { type: 'object', properties: { q: { type: 'string' } } },
      strict: true,
    });
  });

  it('adds web_search when enableWebSearch is true', async () => {
    const deps: ToolsBuilderDeps = {
      client: {} as ToolsBuilderDeps['client'],
      config: makeConfig({ enableWebSearch: true }),
      mcpServers: [],
      mcpAuth: null,
      conversations: null,
    };
    const tools = await buildTools(false, deps, logger);
    expect(tools).toContainEqual({ type: 'web_search' });
  });

  it('adds code_interpreter when enableCodeInterpreter is true', async () => {
    const deps: ToolsBuilderDeps = {
      client: {} as ToolsBuilderDeps['client'],
      config: makeConfig({ enableCodeInterpreter: true }),
      mcpServers: [],
      mcpAuth: null,
      conversations: null,
    };
    const tools = await buildTools(false, deps, logger);
    expect(tools).toContainEqual({ type: 'code_interpreter' });
  });

  it('combines file_search, MCP, functions, web_search, and code_interpreter', async () => {
    const mcpAuth = {
      getApiApprovalConfig: jest.fn().mockReturnValue('never'),
      getServerHeaders: jest.fn().mockResolvedValue({}),
    };
    const deps: ToolsBuilderDeps = {
      client: {} as ToolsBuilderDeps['client'],
      config: makeConfig({
        vectorStoreIds: ['vs-1'],
        enableWebSearch: true,
        enableCodeInterpreter: true,
        functions: [
          {
            name: 'my_func',
            description: 'desc',
            parameters: {},
          },
        ],
      }),
      mcpServers: [makeMcpServer()],
      mcpAuth: mcpAuth as unknown as ToolsBuilderDeps['mcpAuth'],
      conversations: null,
    };
    const tools = await buildTools(true, deps, logger);
    const types = tools.map(t => t.type);
    expect(types).toContain('file_search');
    expect(types).toContain('mcp');
    expect(types).toContain('function');
    expect(types).toContain('web_search');
    expect(types).toContain('code_interpreter');
  });
});
