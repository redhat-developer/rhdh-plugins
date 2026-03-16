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
import { ChatDepsBuilder } from './ChatDepsBuilder';
import type { LoggerService } from '@backstage/backend-plugin-api';
import type {
  ChatRequest,
  EffectiveConfig,
  MCPServerConfig,
} from '../../types';
import type { ConfigResolutionService } from './ConfigResolutionService';
import type { ClientManager } from './ClientManager';
import type { BackendToolExecutor } from './BackendToolExecutor';

function mockLogger(): LoggerService {
  return {
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
    debug: jest.fn(),
    child: jest.fn().mockReturnThis(),
  } as unknown as LoggerService;
}

function baseConfig(): EffectiveConfig {
  return {
    model: 'test-model',
    baseUrl: 'http://localhost:8321',
    systemPrompt: 'You are helpful.',
    enableWebSearch: false,
    enableCodeInterpreter: false,
    vectorStoreIds: [],
    vectorStoreName: 'test',
    embeddingModel: 'test-embed',
    embeddingDimension: 384,
    chunkingStrategy: 'auto' as const,
    maxChunkSizeTokens: 800,
    chunkOverlapTokens: 400,
    skipTlsVerify: false,
    zdrMode: false,
    verboseStreamLogging: false,
  };
}

function mockConfigResolution(
  config: EffectiveConfig,
): ConfigResolutionService {
  return {
    resolve: jest.fn().mockResolvedValue(config),
    getResolver: jest.fn().mockReturnValue(null),
  } as unknown as ConfigResolutionService;
}

function mockClientManager(): ClientManager {
  return {
    getExistingClient: jest.fn().mockReturnValue({ request: jest.fn() }),
  } as unknown as ClientManager;
}

function createBuilder(overrides?: {
  config?: EffectiveConfig;
  mcpServers?: MCPServerConfig[];
  getBackendToolExecutor?: () => any;
}): ChatDepsBuilder {
  const config = overrides?.config ?? baseConfig();
  return new ChatDepsBuilder({
    logger: mockLogger(),
    configResolution: mockConfigResolution(config),
    clientManager: mockClientManager(),
    getMcpAuth: () => null,
    getConversations: () => null,
    getMcpServers: () => overrides?.mcpServers ?? [],
    ensureInitialized: () => {},
    getBackendToolExecutor: overrides?.getBackendToolExecutor,
  });
}

describe('ChatDepsBuilder', () => {
  describe('extractUserQuery', () => {
    it('returns the last user message content', () => {
      const builder = createBuilder();
      const request: ChatRequest = {
        messages: [
          { role: 'user', content: 'first question' },
          { role: 'assistant', content: 'response' },
          { role: 'user', content: 'follow-up question' },
        ],
      } as ChatRequest;

      expect(builder.extractUserQuery(request)).toBe('follow-up question');
    });

    it('returns undefined when no user message exists', () => {
      const builder = createBuilder();
      const request: ChatRequest = {
        messages: [{ role: 'assistant', content: 'solo' }],
      } as ChatRequest;

      expect(builder.extractUserQuery(request)).toBeUndefined();
    });

    it('returns undefined for empty messages', () => {
      const builder = createBuilder();
      const request: ChatRequest = { messages: [] } as unknown as ChatRequest;

      expect(builder.extractUserQuery(request)).toBeUndefined();
    });
  });

  describe('buildChatDeps', () => {
    it('returns a ChatDeps snapshot with resolved config', async () => {
      const config = baseConfig();
      const builder = createBuilder({ config });

      const deps = await builder.buildChatDeps();

      expect(deps.config).toBe(config);
      expect(deps.client).toBeDefined();
      expect(deps.mcpServers).toEqual([]);
      expect(deps.mcpAuth).toBeNull();
      expect(deps.conversations).toBeNull();
    });

    it('uses YAML mcpServers when no resolver is set', async () => {
      const servers: MCPServerConfig[] = [
        { id: 'mcp-1', url: 'http://mcp-1' } as MCPServerConfig,
      ];
      const builder = createBuilder({ mcpServers: servers });

      const deps = await builder.buildChatDeps();

      expect(deps.mcpServers).toEqual(servers);
    });
  });

  describe('backendToolExecutor singleton', () => {
    it('returns the same backendToolExecutor instance across buildChatDeps calls', async () => {
      const mockExecutor = {
        invalidateCache: jest.fn(),
        ensureToolsDiscovered: jest.fn().mockResolvedValue([]),
      };
      const servers: MCPServerConfig[] = [
        { id: 'mcp-1', url: 'http://mcp-1' } as MCPServerConfig,
      ];
      const builder = createBuilder({
        mcpServers: servers,
        getBackendToolExecutor: () => mockExecutor,
      });

      const deps1 = await builder.buildChatDeps();
      const deps2 = await builder.buildChatDeps();

      expect(deps1.backendToolExecutor).toBe(mockExecutor);
      expect(deps2.backendToolExecutor).toBe(mockExecutor);
      expect(deps1.backendToolExecutor).toBe(deps2.backendToolExecutor);
    });

    it('invalidates cache when MCP server list changes', async () => {
      const mockExecutor = {
        invalidateCache: jest.fn(),
        ensureToolsDiscovered: jest.fn().mockResolvedValue([]),
      } as unknown as BackendToolExecutor;
      let currentServers: MCPServerConfig[] = [
        { id: 'mcp-1', url: 'http://mcp-1' } as MCPServerConfig,
      ];

      const builder = new ChatDepsBuilder({
        logger: mockLogger(),
        configResolution: mockConfigResolution(baseConfig()),
        clientManager: mockClientManager(),
        getMcpAuth: () => null,
        getConversations: () => null,
        getMcpServers: () => currentServers,
        ensureInitialized: () => {},
        getBackendToolExecutor: () => mockExecutor,
      });

      await builder.buildChatDeps();
      expect(mockExecutor.invalidateCache).not.toHaveBeenCalled();

      currentServers = [
        { id: 'mcp-1', url: 'http://mcp-1' } as MCPServerConfig,
        { id: 'mcp-2', url: 'http://mcp-2' } as MCPServerConfig,
      ];
      await builder.buildChatDeps();
      expect(mockExecutor.invalidateCache).toHaveBeenCalledTimes(1);
    });

    it('does not invalidate cache when MCP server list stays the same', async () => {
      const mockExecutor = {
        invalidateCache: jest.fn(),
        ensureToolsDiscovered: jest.fn().mockResolvedValue([]),
      };
      const servers: MCPServerConfig[] = [
        { id: 'mcp-1', url: 'http://mcp-1' } as MCPServerConfig,
      ];
      const builder = createBuilder({
        mcpServers: servers,
        getBackendToolExecutor: () => mockExecutor,
      });

      await builder.buildChatDeps();
      await builder.buildChatDeps();
      await builder.buildChatDeps();

      expect(mockExecutor.invalidateCache).not.toHaveBeenCalled();
    });
  });

  describe('makeBuildDepsForAgent', () => {
    it('caches the result across multiple calls', async () => {
      const config = baseConfig();
      const configResolution = mockConfigResolution(config);
      const builder = new ChatDepsBuilder({
        logger: mockLogger(),
        configResolution,
        clientManager: mockClientManager(),
        getMcpAuth: () => null,
        getConversations: () => null,
        getMcpServers: () => [],
        ensureInitialized: () => {},
      });

      const depsBuilder = builder.makeBuildDepsForAgent('test query');

      const deps1 = await depsBuilder({ key: 'a' } as any);
      const deps2 = await depsBuilder({ key: 'b' } as any);

      expect(deps1).toBe(deps2);
      expect(configResolution.resolve).toHaveBeenCalledTimes(1);
    });
  });
});
