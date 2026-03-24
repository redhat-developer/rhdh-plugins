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

import { BackendToolExecutor } from './BackendToolExecutor';
import type { McpAuthService } from '../../llamastack/McpAuthService';
import type { MCPServerConfig } from '../../../types';
import {
  BACKEND_TOOL_DISCOVERY_TTL_MS,
  MAX_MCP_PROXY_RESPONSE_BYTES,
} from '../../../constants';

// Mock the MCP SDK
const mockConnect = jest.fn().mockResolvedValue(undefined);
const mockListTools = jest.fn();
const mockCallTool = jest.fn();
const mockClose = jest.fn().mockResolvedValue(undefined);

jest.mock('@modelcontextprotocol/sdk/client/index.js', () => ({
  Client: jest.fn().mockImplementation(() => ({
    connect: mockConnect,
    listTools: mockListTools,
    callTool: mockCallTool,
    close: mockClose,
  })),
}));

jest.mock('@modelcontextprotocol/sdk/client/streamableHttp.js', () => ({
  StreamableHTTPClientTransport: jest.fn().mockImplementation(() => ({})),
}));

const mockLogger = {
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
  debug: jest.fn(),
  child: jest.fn().mockReturnThis(),
};

function createMockMcpAuth(): McpAuthService {
  return {
    getServerHeaders: jest
      .fn()
      .mockResolvedValue({ Authorization: 'Bearer tok' }),
    getApiApprovalConfig: jest.fn().mockReturnValue('never'),
  } as unknown as McpAuthService;
}

function makeServer(
  id: string,
  url: string = `https://${id}.example.com/mcp`,
): MCPServerConfig {
  return { id, name: id, type: 'streamable-http' as const, url };
}

describe('BackendToolExecutor', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockConnect.mockResolvedValue(undefined);
    mockClose.mockResolvedValue(undefined);
  });

  describe('prefixName / unprefixName', () => {
    it('prefixes with serverId__toolName', () => {
      expect(BackendToolExecutor.prefixName('ocp-mcp', 'list_pods')).toBe(
        'ocp-mcp__list_pods',
      );
    });

    it('unprefixes correctly', () => {
      const result = BackendToolExecutor.unprefixName('ocp-mcp__list_pods');
      expect(result).toEqual({ serverId: 'ocp-mcp', toolName: 'list_pods' });
    });

    it('returns null for names without separator', () => {
      expect(BackendToolExecutor.unprefixName('list_pods')).toBeNull();
    });
  });

  describe('discoverTools', () => {
    it('connects via SDK Client and discovers tools', async () => {
      const mcpAuth = createMockMcpAuth();
      const executor = new BackendToolExecutor(
        mcpAuth,
        mockLogger as any,
        false,
      );

      mockListTools.mockResolvedValue({
        tools: [
          {
            name: 'create_namespace',
            description: 'Create a K8s namespace',
            inputSchema: {
              type: 'object',
              properties: { name: { type: 'string' } },
              required: ['name'],
            },
          },
          {
            name: 'list_pods',
            description: 'List pods in a namespace',
            inputSchema: {
              type: 'object',
              properties: { namespace: { type: 'string' } },
            },
          },
        ],
      });

      const tools = await executor.discoverTools([makeServer('ocp-mcp')]);

      expect(mockConnect).toHaveBeenCalledTimes(1);
      expect(mockListTools).toHaveBeenCalledTimes(1);
      expect(tools).toHaveLength(2);
      expect(tools[0].type).toBe('function');
      expect(tools[0].name).toBe('ocp-mcp__create_namespace');
      expect(tools[0].description).toBe('Create a K8s namespace');
      expect(tools[0].parameters).toEqual({
        type: 'object',
        properties: { name: { type: 'string' } },
        required: ['name'],
      });
      expect(tools[1].name).toBe('ocp-mcp__list_pods');

      expect(executor.isBackendTool('ocp-mcp__create_namespace')).toBe(true);
      expect(executor.isBackendTool('ocp-mcp__list_pods')).toBe(true);
      expect(executor.isBackendTool('unknown_tool')).toBe(false);
      expect(executor.getToolCount()).toBe(2);
    });

    it('handles multiple servers', async () => {
      const mcpAuth = createMockMcpAuth();
      const executor = new BackendToolExecutor(
        mcpAuth,
        mockLogger as any,
        false,
      );

      mockListTools
        .mockResolvedValueOnce({
          tools: [{ name: 'tool_a', description: 'Tool A' }],
        })
        .mockResolvedValueOnce({
          tools: [{ name: 'tool_b', description: 'Tool B' }],
        });

      const tools = await executor.discoverTools([
        makeServer('s1'),
        makeServer('s2'),
      ]);

      expect(tools).toHaveLength(2);
      const names = tools.map(t => t.name).sort((a, b) => a.localeCompare(b));
      expect(names).toEqual(['s1__tool_a', 's2__tool_b']);
      expect(mockConnect).toHaveBeenCalledTimes(2);
    });

    it('handles server connection failure gracefully', async () => {
      const mcpAuth = createMockMcpAuth();
      const executor = new BackendToolExecutor(
        mcpAuth,
        mockLogger as any,
        false,
      );

      mockConnect.mockRejectedValueOnce(new Error('Connection refused'));

      const tools = await executor.discoverTools([makeServer('failing')]);
      expect(tools).toHaveLength(0);
      expect(mockLogger.error).toHaveBeenCalledWith(
        expect.stringContaining('Failed to connect'),
      );
    });

    it('handles tools/list failure gracefully', async () => {
      const mcpAuth = createMockMcpAuth();
      const executor = new BackendToolExecutor(
        mcpAuth,
        mockLogger as any,
        false,
      );

      mockListTools.mockRejectedValueOnce(new Error('tools/list failed'));

      const tools = await executor.discoverTools([makeServer('failing')]);
      expect(tools).toHaveLength(0);
      expect(mockLogger.error).toHaveBeenCalledWith(
        expect.stringContaining('tools/list failed'),
      );
    });

    it('provides default schema when inputSchema is missing', async () => {
      const mcpAuth = createMockMcpAuth();
      const executor = new BackendToolExecutor(
        mcpAuth,
        mockLogger as any,
        false,
      );

      mockListTools.mockResolvedValue({
        tools: [{ name: 'simple_tool' }],
      });

      const tools = await executor.discoverTools([makeServer('s1')]);
      expect(tools[0].parameters).toEqual({
        type: 'object',
        properties: {},
      });
    });
  });

  describe('executeTool', () => {
    it('calls tool via SDK Client and returns text result', async () => {
      const mcpAuth = createMockMcpAuth();
      const executor = new BackendToolExecutor(
        mcpAuth,
        mockLogger as any,
        false,
      );

      mockListTools.mockResolvedValue({
        tools: [
          {
            name: 'create_ns',
            description: 'Create namespace',
            inputSchema: {
              type: 'object',
              properties: { name: { type: 'string' } },
            },
          },
        ],
      });
      await executor.discoverTools([makeServer('ocp')]);

      mockCallTool.mockResolvedValue({
        content: [
          { type: 'text', text: 'Namespace "test" created successfully' },
        ],
      });

      const result = await executor.executeTool(
        'ocp__create_ns',
        JSON.stringify({ name: 'test' }),
      );
      expect(result).toBe('Namespace "test" created successfully');
      expect(mockCallTool).toHaveBeenCalledWith({
        name: 'create_ns',
        arguments: { name: 'test' },
      });
    });

    it('returns error for unknown tool', async () => {
      const mcpAuth = createMockMcpAuth();
      const executor = new BackendToolExecutor(
        mcpAuth,
        mockLogger as any,
        false,
      );

      const result = await executor.executeTool('unknown__tool', '{}');
      expect(JSON.parse(result)).toEqual({
        error: 'Unknown tool: unknown__tool',
      });
    });

    it('handles tool error response (isError flag)', async () => {
      const mcpAuth = createMockMcpAuth();
      const executor = new BackendToolExecutor(
        mcpAuth,
        mockLogger as any,
        false,
      );

      mockListTools.mockResolvedValue({
        tools: [{ name: 'err_tool', description: 'Returns error' }],
      });
      await executor.discoverTools([makeServer('s1')]);

      mockCallTool.mockResolvedValue({
        isError: true,
        content: [{ type: 'text', text: 'Permission denied' }],
      });

      const result = await executor.executeTool('s1__err_tool', '{}');
      const parsed = JSON.parse(result);
      expect(parsed.error).toBe('Permission denied');
    });

    it('handles callTool exception', async () => {
      const mcpAuth = createMockMcpAuth();
      const executor = new BackendToolExecutor(
        mcpAuth,
        mockLogger as any,
        false,
      );

      mockListTools.mockResolvedValue({
        tools: [{ name: 'fail_tool', description: 'Will fail' }],
      });
      await executor.discoverTools([makeServer('s1')]);

      mockCallTool.mockRejectedValue(new Error('Network timeout'));

      const result = await executor.executeTool('s1__fail_tool', '{}');
      const parsed = JSON.parse(result);
      expect(parsed.error).toContain('Network timeout');
    });
  });

  describe('ensureToolsDiscovered', () => {
    it('returns cached tools within TTL', async () => {
      const mcpAuth = createMockMcpAuth();
      const executor = new BackendToolExecutor(
        mcpAuth,
        mockLogger as any,
        false,
      );
      const servers = [makeServer('s1')];

      mockListTools.mockResolvedValue({
        tools: [{ name: 'tool_a', description: 'Tool A' }],
      });

      const firstResult = await executor.ensureToolsDiscovered(servers);
      expect(firstResult).toHaveLength(1);

      const secondResult = await executor.ensureToolsDiscovered(servers);
      expect(secondResult).toBe(firstResult);
      expect(mockConnect).toHaveBeenCalledTimes(1);
    });

    it('re-fetches after TTL expires', async () => {
      const mcpAuth = createMockMcpAuth();
      const executor = new BackendToolExecutor(
        mcpAuth,
        mockLogger as any,
        false,
      );
      const servers = [makeServer('s1')];

      mockListTools.mockResolvedValue({
        tools: [{ name: 'tool_a', description: 'Tool A' }],
      });

      const firstResult = await executor.ensureToolsDiscovered(servers);
      expect(firstResult).toHaveLength(1);

      const realDateNow = Date.now;
      Date.now = () => realDateNow() + BACKEND_TOOL_DISCOVERY_TTL_MS + 1;

      try {
        mockListTools.mockResolvedValue({
          tools: [
            { name: 'tool_a', description: 'Tool A' },
            { name: 'tool_b', description: 'Tool B' },
          ],
        });

        const secondResult = await executor.ensureToolsDiscovered(servers);
        expect(secondResult).toHaveLength(2);
        expect(mockConnect).toHaveBeenCalledTimes(2);
      } finally {
        Date.now = realDateNow;
      }
    });

    it('deduplicates concurrent in-flight requests', async () => {
      const mcpAuth = createMockMcpAuth();
      const executor = new BackendToolExecutor(
        mcpAuth,
        mockLogger as any,
        false,
      );
      const servers = [makeServer('s1')];

      mockListTools.mockResolvedValue({
        tools: [{ name: 'tool_a', description: 'Tool A' }],
      });

      const [result1, result2, result3] = await Promise.all([
        executor.ensureToolsDiscovered(servers),
        executor.ensureToolsDiscovered(servers),
        executor.ensureToolsDiscovered(servers),
      ]);

      expect(result1).toBe(result2);
      expect(result2).toBe(result3);
      expect(mockConnect).toHaveBeenCalledTimes(1);
    });

    it('invalidateCache forces next call to re-fetch', async () => {
      const mcpAuth = createMockMcpAuth();
      const executor = new BackendToolExecutor(
        mcpAuth,
        mockLogger as any,
        false,
      );
      const servers = [makeServer('s1')];

      mockListTools.mockResolvedValue({
        tools: [{ name: 'tool_a', description: 'Tool A' }],
      });

      const firstResult = await executor.ensureToolsDiscovered(servers);
      expect(firstResult).toHaveLength(1);

      executor.invalidateCache();

      mockListTools.mockResolvedValue({
        tools: [
          { name: 'tool_a', description: 'Tool A' },
          { name: 'tool_c', description: 'Tool C' },
        ],
      });

      const secondResult = await executor.ensureToolsDiscovered(servers);
      expect(secondResult).toHaveLength(2);
      expect(secondResult).not.toBe(firstResult);
    });
  });

  describe('response size limit', () => {
    it('rejects responses exceeding MAX_MCP_PROXY_RESPONSE_BYTES', async () => {
      const mcpAuth = createMockMcpAuth();
      const executor = new BackendToolExecutor(
        mcpAuth,
        mockLogger as any,
        false,
      );

      mockListTools.mockResolvedValue({
        tools: [{ name: 'big_tool', description: 'Returns large data' }],
      });
      await executor.discoverTools([makeServer('s1')]);

      const oversizedText = 'x'.repeat(MAX_MCP_PROXY_RESPONSE_BYTES + 1);
      mockCallTool.mockResolvedValue({
        content: [{ type: 'text', text: oversizedText }],
      });

      const result = await executor.executeTool('s1__big_tool', '{}');
      const parsed = JSON.parse(result);
      expect(parsed.error).toContain('Tool response too large');
      expect(mockLogger.warn).toHaveBeenCalledWith(
        expect.stringContaining('exceeds size limit'),
      );
    });

    it('allows responses within size limit', async () => {
      const mcpAuth = createMockMcpAuth();
      const executor = new BackendToolExecutor(
        mcpAuth,
        mockLogger as any,
        false,
      );

      mockListTools.mockResolvedValue({
        tools: [{ name: 'ok_tool', description: 'Normal tool' }],
      });
      await executor.discoverTools([makeServer('s1')]);

      mockCallTool.mockResolvedValue({
        content: [{ type: 'text', text: 'OK result' }],
      });

      const result = await executor.executeTool('s1__ok_tool', '{}');
      expect(result).toBe('OK result');
    });
  });

  describe('SSRF guard', () => {
    it('blocks private URLs during tool discovery', async () => {
      const mcpAuth = createMockMcpAuth();
      const executor = new BackendToolExecutor(
        mcpAuth,
        mockLogger as any,
        false,
      );

      const tools = await executor.discoverTools([
        makeServer('internal', 'https://169.254.169.254/latest/meta-data/'),
      ]);

      expect(tools).toHaveLength(0);
      expect(mockConnect).not.toHaveBeenCalled();
      expect(mockLogger.warn).toHaveBeenCalledWith(
        expect.stringContaining('SSRF guard'),
      );
    });

    it('blocks localhost URLs during tool discovery', async () => {
      const mcpAuth = createMockMcpAuth();
      const executor = new BackendToolExecutor(
        mcpAuth,
        mockLogger as any,
        false,
      );

      const tools = await executor.discoverTools([
        makeServer('local', 'https://localhost:8080/mcp'),
      ]);

      expect(tools).toHaveLength(0);
      expect(mockConnect).not.toHaveBeenCalled();
    });

    it('blocks private URLs during tool execution', async () => {
      const mcpAuth = createMockMcpAuth();
      const executor = new BackendToolExecutor(
        mcpAuth,
        mockLogger as any,
        false,
      );

      mockListTools.mockResolvedValue({
        tools: [{ name: 'evil_tool', description: 'Bad tool' }],
      });
      await executor.discoverTools([
        makeServer('safe', 'https://safe.example.com/mcp'),
      ]);

      // Manually tamper the registry to simulate a stale URL pointing to private IP
      const registry = (executor as any).registry as Map<
        string,
        { serverUrl: string }
      >;
      const tool = registry.get('safe__evil_tool');
      if (tool) tool.serverUrl = 'https://10.0.0.1/mcp';

      const result = await executor.executeTool('safe__evil_tool', '{}');
      const parsed = JSON.parse(result);
      expect(parsed.error).toContain('URL blocked');
    });

    it('allows public URLs', async () => {
      const mcpAuth = createMockMcpAuth();
      const executor = new BackendToolExecutor(
        mcpAuth,
        mockLogger as any,
        false,
      );

      mockListTools.mockResolvedValue({
        tools: [{ name: 'pub_tool', description: 'Public tool' }],
      });

      const tools = await executor.discoverTools([
        makeServer('pub', 'https://mcp.example.com/tools'),
      ]);

      expect(tools).toHaveLength(1);
      expect(mockConnect).toHaveBeenCalledTimes(1);
    });
  });

  describe('suffix-match fallback for unprefixed tool names', () => {
    async function createExecutorWithTools() {
      const mcpAuth = createMockMcpAuth();
      const executor = new BackendToolExecutor(
        mcpAuth,
        mockLogger as any,
        false,
      );

      mockListTools.mockResolvedValue({
        tools: [
          {
            name: 'namespaces_list',
            description: 'List namespaces',
            inputSchema: { type: 'object', properties: {} },
          },
          {
            name: 'pods_list',
            description: 'List pods',
            inputSchema: {
              type: 'object',
              properties: { namespace: { type: 'string' } },
            },
          },
        ],
      });
      await executor.discoverTools([makeServer('ocp-mcp')]);
      return executor;
    }

    it('isBackendTool resolves unprefixed names via suffix match', async () => {
      const executor = await createExecutorWithTools();
      expect(executor.isBackendTool('namespaces_list')).toBe(true);
      expect(executor.isBackendTool('pods_list')).toBe(true);
    });

    it('isBackendTool returns false for truly unknown tools', async () => {
      const executor = await createExecutorWithTools();
      expect(executor.isBackendTool('nonexistent_tool')).toBe(false);
    });

    it('resolveTool returns the resolved tool for unprefixed names', async () => {
      const executor = await createExecutorWithTools();
      const resolved = executor.resolveTool('namespaces_list');
      expect(resolved).toBeDefined();
      expect(resolved!.prefixedName).toBe('ocp-mcp__namespaces_list');
      expect(resolved!.serverId).toBe('ocp-mcp');
      expect(resolved!.originalName).toBe('namespaces_list');
    });

    it('resolveTool returns undefined for unknown tools', async () => {
      const executor = await createExecutorWithTools();
      expect(executor.resolveTool('nonexistent_tool')).toBeUndefined();
    });

    it('resolveTool prefers exact match over suffix match', async () => {
      const executor = await createExecutorWithTools();
      const resolved = executor.resolveTool('ocp-mcp__namespaces_list');
      expect(resolved).toBeDefined();
      expect(resolved!.prefixedName).toBe('ocp-mcp__namespaces_list');
      // Should NOT log a suffix-match warning for exact matches
      expect(mockLogger.warn).not.toHaveBeenCalledWith(
        expect.stringContaining('suffix match'),
      );
    });

    it('getToolServerInfo resolves unprefixed names', async () => {
      const executor = await createExecutorWithTools();
      const info = executor.getToolServerInfo('pods_list');
      expect(info).toEqual({ serverId: 'ocp-mcp', originalName: 'pods_list' });
    });

    it('executeTool works with unprefixed names via suffix match', async () => {
      const executor = await createExecutorWithTools();

      mockCallTool.mockResolvedValue({
        content: [{ type: 'text', text: 'namespace-1\nnamespace-2' }],
      });

      const result = await executor.executeTool('namespaces_list', '{}');
      expect(result).toBe('namespace-1\nnamespace-2');
      expect(mockCallTool).toHaveBeenCalledWith({
        name: 'namespaces_list',
        arguments: {},
      });
      expect(mockLogger.warn).toHaveBeenCalledWith(
        expect.stringContaining(
          'resolved to "ocp-mcp__namespaces_list" via suffix match',
        ),
      );
    });

    it('logs a warning when suffix match is used', async () => {
      const executor = await createExecutorWithTools();
      executor.isBackendTool('namespaces_list');
      expect(mockLogger.warn).toHaveBeenCalledWith(
        expect.stringContaining(
          'Tool "namespaces_list" resolved to "ocp-mcp__namespaces_list" via suffix match',
        ),
      );
    });

    it('handles ambiguous unprefixed names across multiple servers', async () => {
      const mcpAuth = createMockMcpAuth();
      const executor = new BackendToolExecutor(
        mcpAuth,
        mockLogger as any,
        false,
      );

      mockListTools
        .mockResolvedValueOnce({
          tools: [
            { name: 'list_items', description: 'List items from server A' },
          ],
        })
        .mockResolvedValueOnce({
          tools: [
            { name: 'list_items', description: 'List items from server B' },
          ],
        });

      await executor.discoverTools([
        makeServer('server-a'),
        makeServer('server-b'),
      ]);

      // With ambiguous names, suffix match returns the first hit
      const resolved = executor.resolveTool('list_items');
      expect(resolved).toBeDefined();
      expect(['server-a__list_items', 'server-b__list_items']).toContain(
        resolved!.prefixedName,
      );
    });
  });

  describe('client lifecycle', () => {
    it('closes clients on invalidateCache', async () => {
      const mcpAuth = createMockMcpAuth();
      const executor = new BackendToolExecutor(
        mcpAuth,
        mockLogger as any,
        false,
      );

      mockListTools.mockResolvedValue({
        tools: [{ name: 'tool_a', description: 'Tool A' }],
      });
      await executor.discoverTools([makeServer('s1')]);

      executor.invalidateCache();

      // Wait for async close
      await new Promise(resolve => setTimeout(resolve, 10));
      expect(mockClose).toHaveBeenCalled();
    });

    it('reconnects if client is missing during executeTool', async () => {
      const mcpAuth = createMockMcpAuth();
      const executor = new BackendToolExecutor(
        mcpAuth,
        mockLogger as any,
        false,
      );

      mockListTools.mockResolvedValue({
        tools: [{ name: 'tool_a', description: 'Tool A' }],
      });
      await executor.discoverTools([makeServer('s1')]);

      // Remove the client to simulate disconnection
      (executor as any).clients.clear();

      mockCallTool.mockResolvedValue({
        content: [{ type: 'text', text: 'Reconnected result' }],
      });

      const result = await executor.executeTool('s1__tool_a', '{}');
      expect(result).toBe('Reconnected result');
      expect(mockLogger.warn).toHaveBeenCalledWith(
        expect.stringContaining('reconnecting'),
      );
    });
  });
});
