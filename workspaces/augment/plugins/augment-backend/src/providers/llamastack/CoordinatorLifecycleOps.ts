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
import type {
  AugmentStatus,
  MCPServerConfig,
  SecurityConfig,
} from '../../types';
import { aggregateStatus } from './StatusAggregator';
import type { ClientManager } from './ClientManager';
import type { ConfigResolutionService } from './ConfigResolutionService';
import type { ConfigLoader } from './ConfigLoader';
import type { McpAuthService } from './McpAuthService';
import type { StatusService } from './StatusService';
import type { AgentGraphManager } from './AgentGraphManager';
import type { OpenAIAgentsOrchestrator } from './openai-agents-adapters/OpenAIAgentsOrchestrator';
import type { ChatDepsBuilder } from './ChatDepsBuilder';
import type { BackendToolExecutor } from './BackendToolExecutor';
import type { BackendApprovalStore } from './BackendApprovalStore';
import type { ConversationFacade } from './ConversationFacade';
import type { ResponsesApiService } from './ResponsesApiService';
import type { ConversationService } from './ConversationService';
import { BackendApprovalHandler } from './BackendApprovalHandler';
import { toErrorMessage } from '../../services/utils';

export interface StatusContext {
  configResolution: ConfigResolutionService;
  clientManager: ClientManager;
  configLoader: ConfigLoader;
  mcpAuth: McpAuthService | null;
  mcpServers: MCPServerConfig[];
  securityConfig: SecurityConfig;
  vectorStoreReady: boolean;
  statusService: StatusService;
  agentGraphManager: AgentGraphManager | null;
  logger: LoggerService;
  ensureInitialized: () => void;
}

export async function getCoordinatorStatus(
  ctx: StatusContext,
): Promise<AugmentStatus> {
  const llamaStackConfig = ctx.configResolution.getLlamaStackConfig();
  if (!llamaStackConfig) {
    return aggregateStatus({
      llamaStackConfig: null,
      clientManager: ctx.clientManager,
      mcpAuth: ctx.mcpAuth,
      mcpServers: ctx.mcpServers,
      yamlMcpServers: ctx.mcpServers,
      securityConfig: ctx.securityConfig,
      vectorStoreReady: ctx.vectorStoreReady,
      statusService: ctx.statusService,
      logger: ctx.logger,
    });
  }

  let resolved;
  try {
    ctx.ensureInitialized();
    resolved = await ctx.configResolution.resolve();
  } catch (error) {
    ctx.logger.debug(
      'Config resolution failed, using YAML fallback config',
      error instanceof Error ? error : undefined,
    );
    resolved = ctx.configResolution.buildYamlFallback();
  }

  return aggregateStatus({
    llamaStackConfig,
    resolved,
    clientManager: ctx.clientManager,
    mcpAuth: ctx.mcpAuth,
    mcpServers: resolved.mcpServers ?? ctx.mcpServers,
    yamlMcpServers: ctx.mcpServers,
    securityConfig: ctx.securityConfig,
    vectorStoreReady: ctx.vectorStoreReady,
    statusService: ctx.statusService,
    logger: ctx.logger,
    toolExecutionMode: ctx.configLoader.loadToolExecutionMode(),
    agentGraphError: ctx.agentGraphManager?.getLastResolutionError(),
  });
}

export interface PostInitContext {
  configResolution: ConfigResolutionService;
  mcpServers: MCPServerConfig[];
  orchestrator: OpenAIAgentsOrchestrator | null;
  chatDepsBuilder: ChatDepsBuilder;
  logger: LoggerService;
  getStatus: () => Promise<AugmentStatus>;
}

export async function postInitialize(ctx: PostInitContext): Promise<void> {
  const warmupTasks: Array<{ name: string; task: Promise<unknown> }> = [];

  warmupTasks.push({ name: 'config', task: ctx.configResolution.resolve() });

  if (ctx.mcpServers.length > 0) {
    warmupTasks.push({ name: 'mcp-status-warmup', task: ctx.getStatus() });
  }

  if (ctx.orchestrator && ctx.mcpServers.length > 0) {
    warmupTasks.push({
      name: 'tool-discovery-warmup',
      task: ctx.chatDepsBuilder
        .buildChatDeps()
        .then(deps => ctx.orchestrator!.warmUpToolCache(deps)),
    });
  }

  const results = await Promise.allSettled(warmupTasks.map(w => w.task));

  for (let i = 0; i < results.length; i++) {
    const result = results[i];
    if (result.status === 'rejected') {
      ctx.logger.warn(
        `Warmup task "${warmupTasks[i].name}" failed (non-fatal): ${toErrorMessage(result.reason)}`,
      );
    }
  }

  ctx.logger.info('Post-initialization warmup complete');
}

export interface ApprovalHandlerContext {
  conversationFacade: ConversationFacade;
  backendApprovalStore: BackendApprovalStore;
  backendToolExecutor: BackendToolExecutor;
  chatService: ResponsesApiService;
  clientManager: ClientManager;
  configResolution: ConfigResolutionService;
  getConversations: () => ConversationService | null;
  getAgentGraphManager?: () => AgentGraphManager | null;
  getMcpServers: () => MCPServerConfig[];
  logger: LoggerService;
}

export function initializeBackendApprovalHandler(
  ctx: ApprovalHandlerContext,
): void {
  const handler = new BackendApprovalHandler({
    conversationFacade: ctx.conversationFacade,
    backendApprovalStore: ctx.backendApprovalStore,
    backendToolExecutor: ctx.backendToolExecutor,
    chatService: ctx.chatService,
    clientManager: ctx.clientManager,
    configResolution: ctx.configResolution,
    getConversations: ctx.getConversations,
    getAgentGraphManager: ctx.getAgentGraphManager,
    getMcpServers: ctx.getMcpServers,
    logger: ctx.logger,
  });
  handler.initialize();
}
