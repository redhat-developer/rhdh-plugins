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
import { BACKEND_TOOL_DISCOVERY_TTL_MS } from '../../../constants';

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

  describe('SSRF guard', () => {
    it('admin-configured servers bypass SSRF during discovery', async () => {
      const mcpAuth = createMockMcpAuth();
      const executor = new BackendToolExecutor(
        mcpAuth,
        mockLogger as any,
        false,
      );

      mockListTools.mockResolvedValue({
        tools: [{ name: 'internal_tool', description: 'Internal tool' }],
      });

      const tools = await executor.discoverTools([
        makeServer('internal', 'https://169.254.169.254/latest/meta-data/'),
      ]);

      expect(tools).toHaveLength(1);
      expect(tools[0].name).toBe('internal__internal_tool');
      expect(mockConnect).toHaveBeenCalledTimes(1);
    });

    it('admin-configured localhost servers are allowed during discovery', async () => {
      const mcpAuth = createMockMcpAuth();
      const executor = new BackendToolExecutor(
        mcpAuth,
        mockLogger as any,
        false,
      );

      mockListTools.mockResolvedValue({
        tools: [{ name: 'local_tool', description: 'Local tool' }],
      });

      const tools = await executor.discoverTools([
        makeServer('local', 'https://localhost:8080/mcp'),
      ]);

      expect(tools).toHaveLength(1);
      expect(mockConnect).toHaveBeenCalledTimes(1);
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
    it('preserves clients on invalidateCache for in-flight requests', async () => {
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

      await new Promise(resolve => setTimeout(resolve, 10));
      expect(mockClose).not.toHaveBeenCalled();
      expect(mockLogger.info).toHaveBeenCalledWith(
        expect.stringContaining('registry and clients preserved'),
      );
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

  describe('zero-tool rediscovery preserves cached tools', () => {
    it('preserves tools when server is unreachable during rediscovery', async () => {
      const mcpAuth = createMockMcpAuth();
      const executor = new BackendToolExecutor(
        mcpAuth,
        mockLogger as any,
        false,
      );

      mockListTools.mockResolvedValue({
        tools: [
          { name: 'tool_a', description: 'A' },
          { name: 'tool_b', description: 'B' },
        ],
      });

      const servers = [makeServer('s1')];
      const firstTools = await executor.ensureToolsDiscovered(servers);
      expect(firstTools).toHaveLength(2);

      executor.invalidateCache();

      mockConnect.mockRejectedValue(new Error('Server unreachable'));

      const secondTools = await executor.ensureToolsDiscovered(servers);

      expect(secondTools).toHaveLength(2);
      expect(secondTools[0].name).toBe('s1__tool_a');
      expect(mockLogger.warn).toHaveBeenCalledWith(
        expect.stringContaining('Preserved 2 tool(s) from failed server(s)'),
      );
    });
  });

  describe('partial re-discovery preservation', () => {
    it('preserves tools from failed servers when other servers succeed', async () => {
      const mcpAuth = createMockMcpAuth();
      const executor = new BackendToolExecutor(
        mcpAuth,
        mockLogger as any,
        false,
      );

      // First discovery: both servers succeed
      mockListTools
        .mockResolvedValueOnce({
          tools: [{ name: 'tool_a', description: 'Tool A' }],
        })
        .mockResolvedValueOnce({
          tools: [{ name: 'tool_b', description: 'Tool B' }],
        });

      const servers = [makeServer('s1'), makeServer('s2')];
      const firstTools = await executor.discoverTools(servers);
      expect(firstTools).toHaveLength(2);

      // Second discovery: s2 fails (connection error), s1 succeeds
      mockConnect
        .mockResolvedValueOnce(undefined) // s1 succeeds
        .mockRejectedValueOnce(new Error('Connection refused')); // s2 fails
      mockListTools.mockResolvedValueOnce({
        tools: [{ name: 'tool_a', description: 'Tool A updated' }],
      });

      const secondTools = await executor.discoverTools(servers);

      // Should have tools from both: s1 (re-discovered) + s2 (preserved)
      expect(secondTools).toHaveLength(2);
      const names = secondTools
        .map(t => t.name)
        .sort((a, b) => a.localeCompare(b));
      expect(names).toEqual(['s1__tool_a', 's2__tool_b']);
      expect(mockLogger.warn).toHaveBeenCalledWith(
        expect.stringContaining('Preserved 1 tool(s) from failed server(s)'),
      );
    });

    it('does not preserve tools when a server succeeds with zero tools', async () => {
      const mcpAuth = createMockMcpAuth();
      const executor = new BackendToolExecutor(
        mcpAuth,
        mockLogger as any,
        false,
      );

      // First discovery: s1 has tools
      mockListTools.mockResolvedValueOnce({
        tools: [{ name: 'tool_a', description: 'A' }],
      });
      await executor.discoverTools([makeServer('s1')]);
      expect(executor.getToolCount()).toBe(1);

      // Second discovery: s1 succeeds but returns 0 tools (legitimate removal)
      mockListTools.mockResolvedValueOnce({ tools: [] });
      await executor.discoverTools([makeServer('s1')]);

      // Server was reachable (client not null) so its tools are not preserved
      expect(executor.getToolCount()).toBe(0);
    });

    it('preserves clients for failed servers so executeTool still works', async () => {
      const mcpAuth = createMockMcpAuth();
      const executor = new BackendToolExecutor(
        mcpAuth,
        mockLogger as any,
        false,
      );

      // First discovery: both servers succeed
      mockListTools
        .mockResolvedValueOnce({
          tools: [{ name: 'tool_a', description: 'A' }],
        })
        .mockResolvedValueOnce({
          tools: [{ name: 'tool_b', description: 'B' }],
        });

      const servers = [makeServer('s1'), makeServer('s2')];
      await executor.discoverTools(servers);

      // Second discovery: s2 fails
      mockConnect
        .mockResolvedValueOnce(undefined) // s1 succeeds
        .mockRejectedValueOnce(new Error('s2 down')); // s2 fails
      mockListTools.mockResolvedValueOnce({
        tools: [{ name: 'tool_a', description: 'A' }],
      });
      await executor.discoverTools(servers);

      // s2's tool should still be resolvable
      expect(executor.isBackendTool('s2__tool_b')).toBe(true);
      const info = executor.getToolServerInfo('s2__tool_b');
      expect(info).toEqual({ serverId: 's2', originalName: 'tool_b' });
    });
  });

  describe('discoveryGeneration', () => {
    it('starts at 0', () => {
      const mcpAuth = createMockMcpAuth();
      const executor = new BackendToolExecutor(
        mcpAuth,
        mockLogger as any,
        false,
      );
      expect(executor.getDiscoveryGeneration()).toBe(0);
    });

    it('increments after successful discovery', async () => {
      const mcpAuth = createMockMcpAuth();
      const executor = new BackendToolExecutor(
        mcpAuth,
        mockLogger as any,
        false,
      );

      mockListTools.mockResolvedValue({
        tools: [{ name: 'tool_a', description: 'A' }],
      });

      await executor.discoverTools([makeServer('s1')]);
      expect(executor.getDiscoveryGeneration()).toBe(1);

      await executor.discoverTools([makeServer('s1')]);
      expect(executor.getDiscoveryGeneration()).toBe(2);
    });

    it('still increments when all servers fail (tools preserved via partial re-discovery)', async () => {
      const mcpAuth = createMockMcpAuth();
      const executor = new BackendToolExecutor(
        mcpAuth,
        mockLogger as any,
        false,
      );

      // First discovery succeeds
      mockListTools.mockResolvedValueOnce({
        tools: [{ name: 'tool_a', description: 'A' }],
      });
      await executor.discoverTools([makeServer('s1')]);
      expect(executor.getDiscoveryGeneration()).toBe(1);

      // Second discovery: server fails → tools preserved, swap still happens
      mockConnect.mockRejectedValueOnce(new Error('Server unreachable'));
      await executor.discoverTools([makeServer('s1')]);

      // Generation increments because swap occurred (with preserved tools)
      expect(executor.getDiscoveryGeneration()).toBe(2);
      // Tools were preserved
      expect(executor.getToolCount()).toBe(1);
    });

    it('increments on partial re-discovery (some servers fail)', async () => {
      const mcpAuth = createMockMcpAuth();
      const executor = new BackendToolExecutor(
        mcpAuth,
        mockLogger as any,
        false,
      );

      mockListTools
        .mockResolvedValueOnce({
          tools: [{ name: 'tool_a', description: 'A' }],
        })
        .mockResolvedValueOnce({
          tools: [{ name: 'tool_b', description: 'B' }],
        });

      await executor.discoverTools([makeServer('s1'), makeServer('s2')]);
      expect(executor.getDiscoveryGeneration()).toBe(1);

      // s2 fails but s1 succeeds → partial re-discovery with preservation
      mockConnect
        .mockResolvedValueOnce(undefined)
        .mockRejectedValueOnce(new Error('s2 down'));
      mockListTools.mockResolvedValueOnce({
        tools: [{ name: 'tool_a', description: 'A' }],
      });

      await executor.discoverTools([makeServer('s1'), makeServer('s2')]);
      expect(executor.getDiscoveryGeneration()).toBe(2);
    });
  });

  describe('session expiry auto-reconnect', () => {
    it('reconnects and retries when execution fails with "session not found"', async () => {
      const mcpAuth = createMockMcpAuth();
      const executor = new BackendToolExecutor(
        mcpAuth,
        mockLogger as any,
        false,
      );

      mockListTools.mockResolvedValueOnce({
        tools: [{ name: 'pods_list', description: 'List pods' }],
      });
      await executor.discoverTools([makeServer('ocp-mcp')]);

      // First call fails with session error, reconnect succeeds, retry succeeds
      mockCallTool
        .mockRejectedValueOnce(
          new Error(
            'Streamable HTTP error: Error POSTing to endpoint: session not found',
          ),
        )
        .mockResolvedValueOnce({
          content: [{ type: 'text', text: 'pod-1\npod-2' }],
        });

      // Reconnect discovery
      mockListTools.mockResolvedValueOnce({
        tools: [{ name: 'pods_list', description: 'List pods' }],
      });

      const result = await executor.executeTool('ocp-mcp__pods_list', '{}');
      expect(result).toBe('pod-1\npod-2');
      expect(mockLogger.warn).toHaveBeenCalledWith(
        expect.stringContaining('Session expired'),
      );
    });

    it('returns error when reconnect fails after session expiry', async () => {
      const mcpAuth = createMockMcpAuth();
      const executor = new BackendToolExecutor(
        mcpAuth,
        mockLogger as any,
        false,
      );

      mockListTools.mockResolvedValueOnce({
        tools: [{ name: 'pods_list', description: 'List pods' }],
      });
      await executor.discoverTools([makeServer('ocp-mcp')]);

      mockCallTool.mockRejectedValueOnce(new Error('session not found'));

      // Reconnect fails
      mockConnect.mockRejectedValueOnce(new Error('Server unreachable'));

      const result = await executor.executeTool('ocp-mcp__pods_list', '{}');
      expect(JSON.parse(result).error).toContain('Failed to reconnect');
    });

    it('does not reconnect for non-session errors', async () => {
      const mcpAuth = createMockMcpAuth();
      const executor = new BackendToolExecutor(
        mcpAuth,
        mockLogger as any,
        false,
      );

      mockListTools.mockResolvedValueOnce({
        tools: [{ name: 'pods_list', description: 'List pods' }],
      });
      await executor.discoverTools([makeServer('ocp-mcp')]);

      mockCallTool.mockRejectedValueOnce(new Error('Permission denied'));

      const result = await executor.executeTool('ocp-mcp__pods_list', '{}');
      expect(JSON.parse(result).error).toContain('Permission denied');
      expect(mockLogger.warn).not.toHaveBeenCalledWith(
        expect.stringContaining('Session expired'),
      );
    });
  });

  describe('atomic swap correctness', () => {
    it('preserves in-flight tool across a registry swap to different servers', async () => {
      const mcpAuth = createMockMcpAuth();
      const executor = new BackendToolExecutor(
        mcpAuth,
        mockLogger as any,
        false,
      );

      mockListTools.mockResolvedValueOnce({
        tools: [{ name: 'tool_x', description: 'X' }],
      });
      await executor.discoverTools([makeServer('s1')]);

      // Swap registry to a different set of servers
      mockListTools.mockResolvedValueOnce({
        tools: [{ name: 'tool_y', description: 'Y' }],
      });
      await executor.discoverTools([makeServer('s2')]);

      // s1's tool was preserved because s1 was not in the new discovery set
      expect(executor.isBackendTool('s1__tool_x')).toBe(true);
      expect(executor.isBackendTool('s2__tool_y')).toBe(true);

      mockCallTool.mockResolvedValueOnce({
        content: [{ type: 'text', text: 'result-from-preserved-tool' }],
      });
      const result = await executor.executeTool('s1__tool_x', '{}');
      expect(result).toBe('result-from-preserved-tool');
    });
  });
});
