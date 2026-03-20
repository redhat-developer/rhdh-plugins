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

import type { LoggerService } from '@backstage/backend-plugin-api';
import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import type { McpAuthService } from '../../llamastack/McpAuthService';
import type { MCPServerConfig, ResponsesApiFunctionTool } from '../../../types';
import {
  BACKEND_TOOL_DISCOVERY_TTL_MS,
  MAX_MCP_PROXY_RESPONSE_BYTES,
  MAX_TOOL_OUTPUT_CHARS,
} from '../../../constants';
import { toErrorMessage } from '../../../services/utils';
import { isPrivateUrlWithDns } from '../../../services/utils/SsrfGuard';
import { connectToMcpServer } from '../../../services/utils/mcpClient';

const SEPARATOR = '__';

interface ResolvedTool {
  serverId: string;
  serverUrl: string;
  originalName: string;
  prefixedName: string;
  description: string;
  inputSchema: Record<string, unknown>;
}

/**
 * Executes MCP tool calls on behalf of LlamaStack using the official
 * @modelcontextprotocol/sdk Client.
 *
 * When LlamaStack cannot reach MCP servers (network isolation),
 * this service converts MCP tools into function tools and proxies
 * tool execution through the Backstage backend, which CAN reach
 * the MCP servers.
 *
 * Flow:
 *   1. discoverTools() — connects to MCP servers via the SDK Client,
 *      lists tools, and converts them to function tool definitions
 *   2. isBackendTool() — checks if a function_call name belongs to
 *      a backend-managed MCP tool
 *   3. executeTool() — calls the MCP server via the SDK Client's
 *      callTool() and returns the result text
 */
export class BackendToolExecutor {
  private readonly registry = new Map<string, ResolvedTool>();
  private readonly clients = new Map<string, Client>();
  private cachedTools: ResponsesApiFunctionTool[] | null = null;
  private cachedServerKey = '';
  private lastDiscoveryTimestamp = 0;
  private inflightDiscovery: Promise<ResponsesApiFunctionTool[]> | null = null;
  private inflightServerKey = '';
  private readonly maxOutputChars?: number;

  constructor(
    private readonly mcpAuth: McpAuthService,
    private readonly logger: LoggerService,
    private readonly skipTlsVerify: boolean,
    options?: { maxOutputChars?: number },
  ) {
    this.maxOutputChars = options?.maxOutputChars;
  }

  /**
   * Truncate tool output to stay within the LLM context budget.
   * Preserves the beginning (most relevant data) and appends a
   * truncation notice so the LLM knows the output was cut.
   */
  static truncateOutput(output: string, maxChars: number): string {
    if (output.length <= maxChars) return output;

    const TRUNCATION_NOTICE = `\n\n[... OUTPUT TRUNCATED: showing ${maxChars.toLocaleString()} of ${output.length.toLocaleString()} chars. Ask the user to narrow the query for complete results. ...]`;
    const keepChars = maxChars - TRUNCATION_NOTICE.length;
    if (keepChars <= 0) return output.slice(0, maxChars);

    const lastNewline = output.lastIndexOf('\n', keepChars);
    const cutPoint = lastNewline > keepChars * 0.5 ? lastNewline : keepChars;

    return output.slice(0, cutPoint) + TRUNCATION_NOTICE;
  }

  static prefixName(serverId: string, toolName: string): string {
    return `${serverId}${SEPARATOR}${toolName}`;
  }

  static unprefixName(
    prefixed: string,
  ): { serverId: string; toolName: string } | null {
    const idx = prefixed.indexOf(SEPARATOR);
    if (idx < 0) return null;
    return {
      serverId: prefixed.slice(0, idx),
      toolName: prefixed.slice(idx + SEPARATOR.length),
    };
  }

  /**
   * Strip verbose metadata from JSON Schema to reduce token footprint
   * while preserving the structure the LLM needs for tool calling.
   * Keeps: type, properties (names + types), required, enum, items.
   * Removes: nested descriptions, examples, $schema, title, default, additionalProperties.
   */
  static slimSchema(schema: Record<string, unknown>): Record<string, unknown> {
    const STRIP_KEYS = new Set([
      'description',
      'examples',
      'example',
      '$schema',
      'title',
      'default',
      'additionalProperties',
    ]);
    const slim = (obj: unknown): unknown => {
      if (Array.isArray(obj)) return obj.map(slim);
      if (obj !== null && typeof obj === 'object') {
        const out: Record<string, unknown> = {};
        for (const [k, v] of Object.entries(obj as Record<string, unknown>)) {
          if (STRIP_KEYS.has(k)) continue;
          out[k] = slim(v);
        }
        return out;
      }
      return obj;
    };
    return slim(schema) as Record<string, unknown>;
  }

  /**
   * Connect to all configured MCP servers using the official SDK,
   * discover their tools, and register them as function tool definitions.
   */
  async discoverTools(
    servers: MCPServerConfig[],
  ): Promise<ResponsesApiFunctionTool[]> {
    this.registry.clear();
    await this.closeAllClients();
    const tools: ResponsesApiFunctionTool[] = [];

    const results = await Promise.allSettled(
      servers.map(async server => {
        const serverTools = await this.connectAndListTools(server);
        return { server, serverTools };
      }),
    );

    for (const result of results) {
      if (result.status === 'rejected') {
        this.logger.error(
          `[BackendToolExecutor] Server discovery rejected: ${toErrorMessage(result.reason)}`,
        );
        continue;
      }
      const { server, serverTools } = result.value;

      for (const tool of serverTools) {
        const prefixedName = BackendToolExecutor.prefixName(
          server.id,
          tool.name,
        );
        const resolved: ResolvedTool = {
          serverId: server.id,
          serverUrl: server.url,
          originalName: tool.name,
          prefixedName,
          description:
            tool.description || `Tool ${tool.name} from ${server.id}`,
          inputSchema: (tool.inputSchema as Record<string, unknown>) || {
            type: 'object',
            properties: {},
          },
        };
        this.registry.set(prefixedName, resolved);

        tools.push({
          type: 'function',
          name: prefixedName,
          description: resolved.description,
          parameters: BackendToolExecutor.slimSchema(resolved.inputSchema),
        });
      }

      this.logger.info(
        `[BackendToolExecutor] Discovered ${serverTools.length} tools from ${server.id}: [${serverTools.map(t => t.name).join(', ')}]`,
      );
    }

    this.logger.info(
      `[BackendToolExecutor] Total: ${this.registry.size} function tools from ${servers.length} server(s)`,
    );
    return tools;
  }

  private static serverCacheKey(servers: MCPServerConfig[]): string {
    return servers
      .map(s => s.id)
      .sort((a, b) => a.localeCompare(b))
      .join(',');
  }

  /**
   * Returns cached tools if the cache is still valid (within TTL) and
   * was populated for the same set of servers.
   * Otherwise triggers a fresh `discoverTools()` call.
   * Concurrent callers share a single in-flight request only when they
   * request the same server set.
   */
  async ensureToolsDiscovered(
    servers: MCPServerConfig[],
  ): Promise<ResponsesApiFunctionTool[]> {
    const key = BackendToolExecutor.serverCacheKey(servers);
    if (
      this.cachedTools &&
      this.cachedServerKey === key &&
      this.isWithinTtl()
    ) {
      return this.cachedTools;
    }
    if (this.inflightDiscovery !== null && this.inflightServerKey === key) {
      return this.inflightDiscovery;
    }
    this.inflightServerKey = key;
    this.inflightDiscovery = this.discoverTools(servers)
      .then(tools => {
        this.cachedTools = tools;
        this.cachedServerKey = key;
        this.lastDiscoveryTimestamp = Date.now();
        return tools;
      })
      .finally(() => {
        this.inflightDiscovery = null;
        this.inflightServerKey = '';
      });
    return this.inflightDiscovery;
  }

  /** Force the next `ensureToolsDiscovered` call to re-fetch. */
  invalidateCache(): void {
    this.cachedTools = null;
    this.cachedServerKey = '';
    this.lastDiscoveryTimestamp = 0;
    this.closeAllClients().catch(err => {
      this.logger.warn(
        `[BackendToolExecutor] Error closing clients during invalidation: ${toErrorMessage(err)}`,
      );
    });
    this.logger.info(
      '[BackendToolExecutor] Tool cache invalidated, MCP clients closed',
    );
  }

  private isWithinTtl(): boolean {
    return (
      Date.now() - this.lastDiscoveryTimestamp < BACKEND_TOOL_DISCOVERY_TTL_MS
    );
  }

  isBackendTool(functionName: string): boolean {
    return this.resolveTool(functionName) !== undefined;
  }

  getToolServerInfo(
    functionName: string,
  ): { serverId: string; originalName: string } | undefined {
    const tool = this.resolveTool(functionName);
    if (!tool) return undefined;
    return { serverId: tool.serverId, originalName: tool.originalName };
  }

  /**
   * Normalize a tool name by stripping file extensions the LLM may
   * hallucinate (e.g. "rhokp__solr_query.json" → "rhokp__solr_query").
   */
  private static normalizeFunctionName(name: string): string {
    return name.replace(/\.(json|yaml|yml|xml|txt)$/i, '');
  }

  /**
   * Resolve a tool by exact prefixed name first, then progressively
   * fuzzier matching for names the LLM may hallucinate:
   *
   *  1. Exact match
   *  2. After stripping file extensions (.json, .yaml, etc.)
   *  3. Suffix match for unprefixed names (e.g. "pods_list" → "ocp-mcp__pods_list")
   *  4. Collapsed-separator match: LLMs often use single `_` where the
   *     registered name uses `__`. For each registered `{serverId}__{tool}`,
   *     check if the query equals `{serverId}_{tool}`.
   *  5. Case-insensitive exact match as a last resort.
   */
  resolveTool(functionName: string): ResolvedTool | undefined {
    const exact = this.registry.get(functionName);
    if (exact) return exact;

    const normalized = BackendToolExecutor.normalizeFunctionName(functionName);
    if (normalized !== functionName) {
      const afterNorm = this.registry.get(normalized);
      if (afterNorm) {
        this.logger.warn(
          `[BackendToolExecutor] Tool "${functionName}" resolved to "${normalized}" after stripping extension`,
        );
        return afterNorm;
      }
    }

    const suffix = `${SEPARATOR}${normalized}`;
    for (const [key, value] of this.registry) {
      if (key.endsWith(suffix)) {
        this.logger.warn(
          `[BackendToolExecutor] Tool "${functionName}" resolved to "${key}" via suffix match`,
        );
        return value;
      }
    }

    for (const [key, value] of this.registry) {
      const singleUnderscore = `${value.serverId}_${value.originalName}`;
      if (normalized === singleUnderscore) {
        this.logger.warn(
          `[BackendToolExecutor] Tool "${functionName}" resolved to "${key}" via collapsed-separator match (_ → __)`,
        );
        return value;
      }
    }

    const lower = normalized.toLowerCase();
    for (const [key, value] of this.registry) {
      if (key.toLowerCase() === lower) {
        this.logger.warn(
          `[BackendToolExecutor] Tool "${functionName}" resolved to "${key}" via case-insensitive match`,
        );
        return value;
      }
    }

    return undefined;
  }

  getToolCount(): number {
    return this.registry.size;
  }

  /**
   * Execute a tool call using the connected MCP SDK Client.
   * Returns the result as a string suitable for function_call_output.
   */
  async executeTool(
    functionName: string,
    argumentsJson: string,
  ): Promise<string> {
    const tool = this.resolveTool(functionName);
    if (!tool) {
      return JSON.stringify({
        error: `Unknown tool: ${functionName}`,
      });
    }

    let args: Record<string, unknown>;
    try {
      args = JSON.parse(argumentsJson);
    } catch {
      args = {};
    }

    const ssrfReason = await isPrivateUrlWithDns(tool.serverUrl);
    if (ssrfReason) {
      this.logger.error(
        `[BackendToolExecutor] Blocked tool execution for ${tool.originalName}: URL blocked by SSRF guard (${ssrfReason})`,
      );
      return JSON.stringify({
        error: `Tool server URL blocked: ${ssrfReason}`,
      });
    }

    this.logger.info(
      `[BackendToolExecutor] Executing ${tool.originalName} on ${tool.serverId}`,
    );

    try {
      const client = this.clients.get(tool.serverId);
      if (!client) {
        this.logger.warn(
          `[BackendToolExecutor] No connected client for ${tool.serverId}, reconnecting...`,
        );
        const server: MCPServerConfig = {
          id: tool.serverId,
          name: tool.serverId,
          type: 'streamable-http',
          url: tool.serverUrl,
        };
        await this.connectAndListTools(server);
        const reconnectedClient = this.clients.get(tool.serverId);
        if (!reconnectedClient) {
          return JSON.stringify({
            error: `Failed to connect to MCP server ${tool.serverId}`,
          });
        }
        return this.executeToolOnClient(reconnectedClient, tool, args);
      }

      return await this.executeToolOnClient(client, tool, args);
    } catch (error) {
      const msg = toErrorMessage(error);
      this.logger.error(
        `[BackendToolExecutor] Failed to execute ${tool.originalName} on ${tool.serverId}: ${msg}`,
      );
      return JSON.stringify({ error: `Tool execution failed: ${msg}` });
    }
  }

  // ===========================================================================
  // Private — SDK Client management
  // ===========================================================================

  /**
   * Connect to an MCP server using the official SDK and list its tools.
   * The Client handles the full MCP protocol: initialize handshake,
   * session management, and transport details.
   */
  private async connectAndListTools(
    server: MCPServerConfig,
  ): Promise<
    Array<{ name: string; description?: string; inputSchema?: unknown }>
  > {
    const ssrfReason = await isPrivateUrlWithDns(server.url);
    if (ssrfReason) {
      this.logger.warn(
        `[BackendToolExecutor] Skipping MCP server ${server.id}: URL blocked by SSRF guard (${ssrfReason})`,
      );
      return [];
    }

    this.logger.info(
      `[BackendToolExecutor] Connecting to MCP server ${server.id} @ ${server.url} (skipTlsVerify=${this.skipTlsVerify})`,
    );

    const authHeaders = await this.mcpAuth.getServerHeaders(server);

    try {
      const { client, tools } = await connectToMcpServer(server.url, {
        headers: authHeaders,
        skipTlsVerify: this.skipTlsVerify,
        clientName: 'augment-backend',
      });

      this.logger.info(
        `[BackendToolExecutor] ${server.id} tools/list: ${tools.length} tool(s) [${tools.map(t => t.name).join(', ')}]`,
      );

      this.clients.set(server.id, client);
      return tools;
    } catch (err) {
      this.logger.error(
        `[BackendToolExecutor] Failed to connect to ${server.id}: ${toErrorMessage(err)}`,
      );
      return [];
    }
  }

  /**
   * Execute a tool call on a connected MCP SDK Client.
   */
  private async executeToolOnClient(
    client: Client,
    tool: ResolvedTool,
    args: Record<string, unknown>,
  ): Promise<string> {
    const result = await client.callTool({
      name: tool.originalName,
      arguments: args,
    });

    if (result.isError) {
      const errorText = Array.isArray(result.content)
        ? result.content
            .filter(
              (c: { type: string; text?: string }) =>
                c.type === 'text' && c.text,
            )
            .map((c: { type: string; text?: string }) => c.text)
            .join('\n')
        : JSON.stringify(result.content);
      this.logger.error(
        `[BackendToolExecutor] Tool ${tool.originalName} returned error: ${errorText}`,
      );
      return JSON.stringify({ error: errorText || 'Tool returned an error' });
    }

    let formattedResult: string;
    if (Array.isArray(result.content)) {
      const textParts = result.content
        .filter(
          (c: { type: string; text?: string }) => c.type === 'text' && c.text,
        )
        .map((c: { type: string; text?: string }) => c.text!);
      formattedResult =
        textParts.length > 0
          ? textParts.join('\n')
          : JSON.stringify(result.content);
    } else {
      formattedResult = JSON.stringify(result.content ?? result);
    }

    if (formattedResult.length > MAX_MCP_PROXY_RESPONSE_BYTES) {
      this.logger.warn(
        `[BackendToolExecutor] Response from ${tool.serverId}/${tool.originalName} exceeds size limit (${formattedResult.length} bytes > ${MAX_MCP_PROXY_RESPONSE_BYTES})`,
      );
      return JSON.stringify({
        error: `Tool response too large (${Math.round(formattedResult.length / 1024)}KB). Maximum allowed: ${Math.round(MAX_MCP_PROXY_RESPONSE_BYTES / 1024)}KB`,
      });
    }

    const maxChars = this.maxOutputChars ?? MAX_TOOL_OUTPUT_CHARS;
    if (formattedResult.length > maxChars) {
      this.logger.warn(
        `[BackendToolExecutor] Truncating output from ${tool.serverId}/${tool.originalName}: ${formattedResult.length} chars -> ${maxChars} chars (prevents context window overflow)`,
      );
      return BackendToolExecutor.truncateOutput(formattedResult, maxChars);
    }

    return formattedResult;
  }

  /**
   * Close all connected MCP SDK clients.
   */
  private async closeAllClients(): Promise<void> {
    const closePromises = Array.from(this.clients.entries()).map(
      async ([serverId, client]) => {
        try {
          await client.close();
          this.logger.info(
            `[BackendToolExecutor] Closed client for ${serverId}`,
          );
        } catch (err) {
          this.logger.warn(
            `[BackendToolExecutor] Error closing client for ${serverId}: ${toErrorMessage(err)}`,
          );
        }
      },
    );
    await Promise.allSettled(closePromises);
    this.clients.clear();
  }
}
