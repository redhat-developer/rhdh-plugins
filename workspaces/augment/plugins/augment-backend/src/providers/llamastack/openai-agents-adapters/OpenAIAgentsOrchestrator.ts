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
import {
  Runner,
  tool as createTool,
} from '@openai/agents-core';
import type {
  FunctionTool as AgentsFunctionTool,
} from '@openai/agents-core';
import type { ChatRequest, ChatResponse } from '../../../types';
import type { ResponsesApiService } from '../../responses-api/chat/ResponsesApiService';
import type { ChatDeps } from '../../responses-api/chat/ResponsesApiService';
import type { BackendApprovalStore } from '../../responses-api/tools/BackendApprovalStore';
import { LlamaStackProvider } from './LlamaStackProvider';
import { buildAgentGraph } from './configMapper';
import { toChatResponse } from './responseMapper';
import { mapRunStreamEventToFrontend } from './streamMapper';
import { requireLastUserMessage } from '../../responses-api/chat/chatUtils';

interface CachedToolMeta {
  name: string;
  description: string;
  parameters: Record<string, unknown>;
}

/**
 * Bridges the augment-backend plugin to @openai/agents-core's
 * Agent / Runner system.
 *
 * - `chat()` uses the non-streaming `run()` path.
 * - `chatStream()` uses `run(agent, input, { stream: true })` with
 *   per-token SSE events, tool execution progress, and agent handoff
 *   notifications.
 *
 * Replaces the previous AdkOrchestrator that used @augment-adk/augment-adk.
 */
export class OpenAIAgentsOrchestrator {
  private readonly logger: LoggerService;
  private readonly chatService: ResponsesApiService;
  /** Retained for future HITL approval integration */
  readonly backendApprovalStore?: BackendApprovalStore;

  private cachedToolMeta: CachedToolMeta[] | null = null;
  private cachedToolMetaKey = '';
  private cachedDiscoveryGeneration = -1;

  private static readonly MAX_CONVERSATION_STATES = 500;
  private readonly conversationAgents = new Map<string, string>();

  constructor(options: {
    chatService: ResponsesApiService;
    logger: LoggerService;
    backendApprovalStore?: BackendApprovalStore;
    toolScopeService?: unknown;
  }) {
    this.chatService = options.chatService;
    this.logger = options.logger;
    this.backendApprovalStore = options.backendApprovalStore;
  }

  invalidateToolCache(): void {
    this.cachedToolMeta = null;
    this.cachedToolMetaKey = '';
    this.cachedDiscoveryGeneration = -1;
  }

  warmUpToolCache(deps: ChatDeps): void {
    this.ensureToolMetaCached(deps).catch(err => {
      this.logger.warn(
        '[OpenAIAgentsOrchestrator] Background tool cache warm-up failed',
        { error: err instanceof Error ? err.message : String(err) },
      );
    });
  }

  async chat(
    request: ChatRequest,
    agentsConfig: Record<string, Record<string, unknown>>,
    defaultAgentKey: string,
    maxTurns: number | undefined,
    deps: ChatDeps,
  ): Promise<ChatResponse> {
    try {
      const userInput = requireLastUserMessage(request, '[OpenAIAgentsOrchestrator] ');
      const backendTools = await this.discoverBackendTools(deps);
      const toolFilter = this.buildAgentToolFilter(agentsConfig, deps);
      const { defaultAgent } = buildAgentGraph(
        agentsConfig as Record<string, any>,
        this.resolveStartAgent(request.conversationId, defaultAgentKey, request.model),
        backendTools,
        toolFilter,
      );

      const provider = new LlamaStackProvider(
        this.chatService,
        deps.client,
        () => deps.config,
      );

      const runner = new Runner({ modelProvider: provider });
      const result = await runner.run(defaultAgent, userInput, {
        maxTurns: maxTurns ?? 10,
      });

      this.saveConversationAgent(request.conversationId, result.lastAgent?.name);

      return toChatResponse(result);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      this.logger.error('[OpenAIAgentsOrchestrator] chat() failed', { error: message });
      throw error;
    }
  }

  async chatStream(
    request: ChatRequest,
    agentsConfig: Record<string, Record<string, unknown>>,
    defaultAgentKey: string,
    maxTurns: number | undefined,
    onEvent: (event: string) => void,
    deps: ChatDeps,
    signal?: AbortSignal,
  ): Promise<void> {
    try {
      const userInput = requireLastUserMessage(request, '[OpenAIAgentsOrchestrator] ');
      const backendTools = await this.discoverBackendTools(deps);
      const toolFilter = this.buildAgentToolFilter(agentsConfig, deps);
      const { defaultAgent } = buildAgentGraph(
        agentsConfig as Record<string, any>,
        this.resolveStartAgent(request.conversationId, defaultAgentKey, request.model),
        backendTools,
        toolFilter,
      );

      const provider = new LlamaStackProvider(
        this.chatService,
        deps.client,
        () => deps.config,
      );

      const runner = new Runner({ modelProvider: provider });
      const streamed = await runner.run(defaultAgent, userInput, {
        stream: true,
        maxTurns: maxTurns ?? 10,
        signal,
      });

      for await (const event of streamed) {
        for (const fe of mapRunStreamEventToFrontend(event)) {
          onEvent(fe);
        }
      }

      this.saveConversationAgent(request.conversationId, streamed.lastAgent?.name);

      const resultData = streamed as unknown as {
        usage?: { inputTokens?: number; outputTokens?: number; totalTokens?: number };
        lastAgent?: { name?: string };
        lastResponseId?: string;
      };

      onEvent(
        JSON.stringify({
          type: 'stream.completed',
          usage: resultData.usage
            ? {
                input_tokens: resultData.usage.inputTokens ?? 0,
                output_tokens: resultData.usage.outputTokens ?? 0,
                total_tokens: resultData.usage.totalTokens ?? 0,
              }
            : undefined,
          agentName: resultData.lastAgent?.name,
          responseId: resultData.lastResponseId,
        }),
      );
    } catch (error) {
      if (signal?.aborted) {
        this.logger.info('[OpenAIAgentsOrchestrator] Stream aborted by client');
        return;
      }
      const message = error instanceof Error ? error.message : String(error);
      this.logger.error('[OpenAIAgentsOrchestrator] Stream error', { error: message });
      onEvent(
        JSON.stringify({
          type: 'stream.error',
          error: message,
          code: 'orchestrator_error',
        }),
      );
    }
  }

  private resolveStartAgent(
    conversationId: string | undefined,
    defaultAgentKey: string,
    requestedAgent?: string,
  ): string {
    if (requestedAgent) {
      return requestedAgent;
    }
    if (conversationId) {
      const stored = this.conversationAgents.get(conversationId);
      if (stored) {
        this.logger.info(
          `[OpenAIAgentsOrchestrator] Resuming from agent "${stored}" for conversation ${conversationId}`,
        );
        return stored;
      }
    }
    return defaultAgentKey;
  }

  private saveConversationAgent(
    conversationId: string | undefined,
    agentName: string | undefined,
  ): void {
    if (!conversationId || !agentName) return;

    this.conversationAgents.set(conversationId, agentName);

    if (this.conversationAgents.size > OpenAIAgentsOrchestrator.MAX_CONVERSATION_STATES) {
      const oldest = this.conversationAgents.keys().next().value;
      if (oldest) {
        this.conversationAgents.delete(oldest);
      }
    }
  }

  /**
   * Build a per-agent tool filter based on AgentConfig.mcpServers.
   * When an agent has `mcpServers` configured, only tools from those
   * servers are made available to it. Otherwise it gets all tools.
   */
  private buildAgentToolFilter(
    agentsConfig: Record<string, Record<string, unknown>>,
    deps: ChatDeps,
  ): ((agentKey: string, tools: AgentsFunctionTool[]) => AgentsFunctionTool[]) | undefined {
    const hasScoping = Object.values(agentsConfig).some(
      c => Array.isArray(c.mcpServers) && (c.mcpServers as string[]).length > 0,
    );
    if (!hasScoping || !deps.backendToolExecutor) return undefined;

    const executor = deps.backendToolExecutor;
    return (agentKey: string, tools: AgentsFunctionTool[]) => {
      const config = agentsConfig[agentKey];
      if (!config) return tools;
      const allowedServers = config.mcpServers as string[] | undefined;
      if (!allowedServers || allowedServers.length === 0) return tools;

      return tools.filter(t => {
        const serverInfo = executor.getToolServerInfo(t.name);
        if (!serverInfo) return true;
        return allowedServers.includes(serverInfo.serverId);
      });
    };
  }

  private static readonly DISCOVERY_TIMEOUT_MS = 10_000;

  /**
   * Discover MCP tools and build agents-core FunctionTool wrappers.
   * Tool metadata is cached; execute closures are per-request.
   */
  private async discoverBackendTools(
    deps: ChatDeps,
  ): Promise<AgentsFunctionTool[]> {
    if (!deps.backendToolExecutor) return [];
    const toolExecutor = deps.backendToolExecutor;

    const meta = await this.ensureToolMetaCached(deps);

    return meta.map(t =>
      createTool({
        name: t.name,
        description: t.description,
        parameters: t.parameters as any,
        execute: async (input: unknown) => {
          const args = typeof input === 'string' ? input : JSON.stringify(input ?? {});
          try {
            return await toolExecutor.executeTool(t.name, args);
          } catch (execError) {
            const msg = execError instanceof Error ? execError.message : String(execError);
            this.logger.error('[OpenAIAgentsOrchestrator] Tool execution failed', {
              tool: t.name,
              error: msg,
            });
            return JSON.stringify({ error: msg });
          }
        },
      }) as unknown as AgentsFunctionTool,
    );
  }

  private async ensureToolMetaCached(
    deps: ChatDeps,
  ): Promise<CachedToolMeta[]> {
    const executor = deps.backendToolExecutor;
    if (!executor) return [];

    const cacheKey = deps.mcpServers
      .map(s => s.id)
      .sort((a, b) => a.localeCompare(b))
      .join(',');
    const currentGen = executor.getDiscoveryGeneration();

    if (
      this.cachedToolMeta &&
      this.cachedToolMetaKey === cacheKey &&
      this.cachedDiscoveryGeneration === currentGen
    ) {
      return this.cachedToolMeta;
    }

    let discovered: Array<{
      name: string;
      description?: string;
      parameters?: Record<string, unknown>;
    }>;

    try {
      discovered = await Promise.race([
        executor.ensureToolsDiscovered(deps.mcpServers),
        new Promise<never>((_, reject) =>
          setTimeout(
            () => reject(new Error('Tool discovery timed out')),
            OpenAIAgentsOrchestrator.DISCOVERY_TIMEOUT_MS,
          ),
        ),
      ]);
    } catch (error) {
      const msg = error instanceof Error ? error.message : String(error);
      this.logger.warn('[OpenAIAgentsOrchestrator] Tool discovery failed', {
        error: msg,
      });
      if (this.cachedToolMeta) {
        return this.cachedToolMeta;
      }
      return [];
    }

    this.logger.info('[OpenAIAgentsOrchestrator] Discovered backend MCP tools', {
      count: discovered.length,
      servers: deps.mcpServers.map(s => s.id),
    });

    const meta: CachedToolMeta[] = discovered.map(apiTool => ({
      name: apiTool.name,
      description: apiTool.description ?? apiTool.name,
      parameters: apiTool.parameters ?? { type: 'object', properties: {} },
    }));

    this.cachedToolMeta = meta;
    this.cachedToolMetaKey = cacheKey;
    this.cachedDiscoveryGeneration = executor.getDiscoveryGeneration();
    return meta;
  }
}
