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
import { BACKEND_TOOL_DISCOVERY_TTL_MS } from '../../../constants';
import { toErrorMessage } from '../../../services/utils';
import {
  processDiscoveryResults,
  collectSucceededServerIds,
  preserveFailedServerTools,
  swapRegistryAndCleanup,
  closeOrphanedClients,
} from './toolDiscoveryHelpers';
import type { ResolvedTool } from './toolDiscoveryHelpers';
import {
  connectAndListToolsSafe,
  executeToolOnClient,
  isSessionError,
} from './toolClientOps';

const SEPARATOR = '__';

export class BackendToolExecutor {
  private registry = new Map<string, ResolvedTool>();
  private clients = new Map<string, Client>();
  private cachedTools: ResponsesApiFunctionTool[] | null = null;
  private cachedServerKey = '';
  private lastDiscoveryTimestamp = 0;
  private inflightDiscovery: Promise<ResponsesApiFunctionTool[]> | null = null;
  private inflightServerKey = '';
  private discoveryGeneration = 0;

  constructor(
    private readonly mcpAuth: McpAuthService,
    private readonly logger: LoggerService,
    private readonly skipTlsVerify: boolean,
  ) {}

  getDiscoveryGeneration(): number {
    return this.discoveryGeneration;
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
          if (!STRIP_KEYS.has(k)) out[k] = slim(v);
        }
        return out;
      }
      return obj;
    };
    return slim(schema) as Record<string, unknown>;
  }

  async discoverTools(
    servers: MCPServerConfig[],
  ): Promise<ResponsesApiFunctionTool[]> {
    const nextRegistry = new Map<string, ResolvedTool>();
    const nextClients = new Map<string, Client>();
    const tools: ResponsesApiFunctionTool[] = [];

    const results = await Promise.allSettled(
      servers.map(async server => {
        const { client, tools: serverTools } = await connectAndListToolsSafe(
          server,
          this.mcpAuth,
          this.skipTlsVerify,
          this.logger,
          { skipSsrfCheck: true },
        );
        return { server, serverTools, client };
      }),
    );

    processDiscoveryResults(
      results,
      nextRegistry,
      nextClients,
      tools,
      BackendToolExecutor.prefixName,
      BackendToolExecutor.slimSchema,
      this.logger,
    );

    const succeededServerIds = collectSucceededServerIds(results);
    preserveFailedServerTools(
      succeededServerIds,
      this.registry,
      nextRegistry,
      nextClients,
      this.clients,
      tools,
      BackendToolExecutor.slimSchema,
      this.logger,
    );

    if (
      nextRegistry.size === 0 &&
      this.registry.size > 0 &&
      succeededServerIds.size === 0
    ) {
      closeOrphanedClients(
        nextClients,
        this.clients,
        this.registry.size,
        this.logger,
      );
      return this.cachedTools ?? this.rebuildFromRegistry();
    }

    const staleClients = new Map(this.clients);
    this.registry = nextRegistry;
    this.clients = nextClients;
    this.discoveryGeneration++;
    swapRegistryAndCleanup(
      staleClients,
      nextClients,
      servers.length,
      this.registry.size,
      this.discoveryGeneration,
      this.logger,
    );
    return tools;
  }

  private rebuildFromRegistry(): ResponsesApiFunctionTool[] {
    const rebuilt: ResponsesApiFunctionTool[] = [];
    for (const resolved of this.registry.values()) {
      rebuilt.push({
        type: 'function',
        name: resolved.prefixedName,
        description: resolved.description,
        parameters: BackendToolExecutor.slimSchema(resolved.inputSchema),
      });
    }
    return rebuilt;
  }

  private static serverCacheKey(servers: MCPServerConfig[]): string {
    return servers
      .map(s => s.id)
      .sort((a, b) => a.localeCompare(b))
      .join(',');
  }

  async ensureToolsDiscovered(
    servers: MCPServerConfig[],
  ): Promise<ResponsesApiFunctionTool[]> {
    const key = BackendToolExecutor.serverCacheKey(servers);
    if (
      this.cachedTools &&
      this.cachedServerKey === key &&
      Date.now() - this.lastDiscoveryTimestamp < BACKEND_TOOL_DISCOVERY_TTL_MS
    )
      return this.cachedTools;
    if (this.inflightDiscovery !== null && this.inflightServerKey === key)
      return this.inflightDiscovery;
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

  invalidateCache(): void {
    this.cachedTools = null;
    this.cachedServerKey = '';
    this.lastDiscoveryTimestamp = 0;
    this.logger.info(
      '[BackendToolExecutor] Tool cache invalidated (registry and clients preserved for in-flight requests)',
    );
  }

  isBackendTool(functionName: string): boolean {
    return this.resolveTool(functionName) !== undefined;
  }

  getToolServerInfo(
    functionName: string,
  ): { serverId: string; originalName: string } | undefined {
    const tool = this.resolveTool(functionName);
    return tool
      ? { serverId: tool.serverId, originalName: tool.originalName }
      : undefined;
  }

  private static normalizeFunctionName(name: string): string {
    return name.replace(/\.(json|yaml|yml|xml|txt)$/i, '');
  }

  resolveTool(functionName: string): ResolvedTool | undefined {
    const exact = this.registry.get(functionName);
    if (exact) return exact;
    const normalized = BackendToolExecutor.normalizeFunctionName(functionName);
    if (normalized !== functionName) {
      const r = this.registry.get(normalized);
      if (r) {
        this.logger.warn(
          `[BackendToolExecutor] Tool "${functionName}" resolved to "${normalized}" after stripping extension`,
        );
        return r;
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
      if (normalized === `${value.serverId}_${value.originalName}`) {
        this.logger.warn(
          `[BackendToolExecutor] Tool "${functionName}" resolved to "${key}" via collapsed-separator match`,
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

  async executeTool(
    functionName: string,
    argumentsJson: string,
  ): Promise<string> {
    const tool = this.resolveTool(functionName);
    if (!tool)
      return JSON.stringify({ error: `Unknown tool: ${functionName}` });
    let args: Record<string, unknown>;
    try {
      args = JSON.parse(argumentsJson);
    } catch {
      args = {};
    }
    this.logger.info(
      `[BackendToolExecutor] Executing ${tool.originalName} on ${tool.serverId}`,
    );
    try {
      let client = this.clients.get(tool.serverId);
      if (!client) {
        this.logger.warn(
          `[BackendToolExecutor] No connected client for ${tool.serverId}, reconnecting...`,
        );
        client = (await this.reconnectToServer(tool)) ?? undefined;
        if (!client)
          return JSON.stringify({
            error: `Failed to connect to MCP server ${tool.serverId}`,
          });
      }
      return await executeToolOnClient(client, tool, args, this.logger);
    } catch (error) {
      const msg = toErrorMessage(error);
      if (isSessionError(msg)) {
        this.logger.warn(
          `[BackendToolExecutor] Session expired for ${tool.serverId}, reconnecting...`,
        );
        this.clients.delete(tool.serverId);
        const freshClient = await this.reconnectToServer(tool);
        if (!freshClient)
          return JSON.stringify({
            error: `Failed to reconnect to MCP server ${tool.serverId}`,
          });
        try {
          return await executeToolOnClient(
            freshClient,
            tool,
            args,
            this.logger,
          );
        } catch (retryError) {
          return JSON.stringify({
            error: `Tool execution failed after reconnect: ${toErrorMessage(retryError)}`,
          });
        }
      }
      this.logger.error(
        `[BackendToolExecutor] Failed to execute ${tool.originalName} on ${tool.serverId}: ${msg}`,
      );
      return JSON.stringify({ error: `Tool execution failed: ${msg}` });
    }
  }

  private async reconnectToServer(tool: ResolvedTool): Promise<Client | null> {
    const server: MCPServerConfig = {
      id: tool.serverId,
      name: tool.serverId,
      type: 'streamable-http',
      url: tool.serverUrl,
    };
    const { client } = await connectAndListToolsSafe(
      server,
      this.mcpAuth,
      this.skipTlsVerify,
      this.logger,
      { skipSsrfCheck: true },
    );
    if (client) this.clients.set(tool.serverId, client);
    return client;
  }

  async closeAllClients(): Promise<void> {
    await Promise.allSettled(
      Array.from(this.clients.entries()).map(async ([id, client]) => {
        try {
          await client.close();
        } catch (err) {
          this.logger.warn(
            `[BackendToolExecutor] Error closing client for ${id}: ${toErrorMessage(err)}`,
          );
        }
      }),
    );
    this.clients.clear();
  }
}
