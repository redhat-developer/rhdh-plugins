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
import type { ChatRequest, MCPServerConfig } from '../../types';
import type { ChatDeps } from './ResponsesApiService';
import { extractLastUserMessage } from './chatUtils';
import type { ClientManager } from './ClientManager';
import type { ConfigResolutionService } from './ConfigResolutionService';
import type { McpAuthService } from './McpAuthService';
import type { ConversationService } from './ConversationService';
import type { BuildDepsForAgent } from '../responses-api/agents/agentGraph';
import type { BackendToolExecutor } from './BackendToolExecutor';

/**
 * Builds the ChatDeps snapshot required by ResponsesApiService and AdkOrchestrator.
 *
 * Extracted from ResponsesApiCoordinator to keep the orchestrator focused on
 * lifecycle management and routing. All per-request dependency resolution —
 * config merging, MCP proxy updates, tool scoping — lives here.
 */
export class ChatDepsBuilder {
  private readonly logger: LoggerService;
  private readonly configResolution: ConfigResolutionService;
  private readonly clientManager: ClientManager;

  private readonly getMcpAuth: () => McpAuthService | null;
  private readonly getConversations: () => ConversationService | null;
  private readonly getMcpServers: () => MCPServerConfig[];
  private readonly ensureInitialized: () => void;
  private readonly getBackendToolExecutor: () => BackendToolExecutor | null;
  private lastServerIds: string | null = null;

  constructor(options: {
    logger: LoggerService;
    configResolution: ConfigResolutionService;
    clientManager: ClientManager;
    getMcpAuth: () => McpAuthService | null;
    getConversations: () => ConversationService | null;
    getMcpServers: () => MCPServerConfig[];
    ensureInitialized: () => void;
    getBackendToolExecutor?: () => BackendToolExecutor | null;
  }) {
    this.logger = options.logger;
    this.configResolution = options.configResolution;
    this.clientManager = options.clientManager;
    this.getMcpAuth = options.getMcpAuth;
    this.getConversations = options.getConversations;
    this.getMcpServers = options.getMcpServers;
    this.ensureInitialized = options.ensureInitialized;
    this.getBackendToolExecutor =
      options.getBackendToolExecutor ?? (() => null);
  }

  /**
   * Build the ChatDeps snapshot from current orchestrator state.
   * Uses resolveConfig() to get effective YAML + DB merged config.
   */
  async buildChatDeps(): Promise<ChatDeps> {
    this.ensureInitialized();
    const config = await this.configResolution.resolve();
    const mcpServers = this.getMcpServers();

    const effectiveMcpServers = this.configResolution.getResolver()
      ? (config.mcpServers ?? mcpServers)
      : mcpServers;

    const backendToolExecutor = this.getBackendToolExecutor() ?? undefined;
    if (backendToolExecutor) {
      const currentIds = effectiveMcpServers
        .map(s => s.id)
        .sort()
        .join(',');
      if (this.lastServerIds !== null && this.lastServerIds !== currentIds) {
        backendToolExecutor.invalidateCache();
        this.logger.info(
          '[ChatDepsBuilder] MCP server list changed — invalidated BackendToolExecutor cache',
        );
      }
      this.lastServerIds = currentIds;
    }

    return {
      client: this.clientManager.getExistingClient(),
      config,
      mcpServers: effectiveMcpServers,
      mcpAuth: this.getMcpAuth(),
      conversations: this.getConversations(),
      backendToolExecutor,
    };
  }

  /**
   * Extract the last user message from a chat request for tool scoping.
   */
  extractUserQuery(request: ChatRequest): string | undefined {
    return extractLastUserMessage(request);
  }

  /**
   * Create a BuildDepsForAgent callback that resolves per-agent ChatDeps.
   * The base deps (config resolution, tool scoping, proxy updates) are
   * computed once and cached for the lifetime of the request. Per-agent
   * MCP filtering is handled downstream in AdkOrchestrator.buildRunOptions().
   */
  makeBuildDepsForAgent(_userQuery?: string): BuildDepsForAgent {
    let cachedDeps: ChatDeps | undefined;
    return async () => {
      if (!cachedDeps) {
        cachedDeps = await this.buildChatDeps();
      }
      return cachedDeps;
    };
  }
}
