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
  run as adkRun,
  runStream,
  type RunOptions,
  type RunStreamOptions,
  type ILogger,
  type FunctionTool,
  type AgentConfig as AdkAgentConfig,
} from '@augment-adk/augment-adk';
import type { ChatRequest, ChatResponse } from '../../../types';
import type { ResponsesApiService } from '../../responses-api/chat/ResponsesApiService';
import type { ChatDeps } from '../../responses-api/chat/ResponsesApiService';
import type {
  AgentGraphSnapshot,
  BuildDepsForAgent,
} from '../../responses-api/agents/agentGraph';
import { BackstageModelAdapter } from './BackstageModelAdapter';
import { toAdkLogger } from './BackstageLoggerAdapter';
import { toAdkEffectiveConfig, toAdkMcpServerConfig } from './configAdapter';
import { toChatResponse } from './responseAdapter';
import { mapAdkEventToFrontend } from './streamEventMapper';
import { requireLastUserMessage } from '../../responses-api/chat/chatUtils';

/**
 * Bridges the augment-backend plugin to the ADK's `run()` and
 * `runStream()` functions.
 *
 * - `chat()` uses the non-streaming `run()` path.
 * - `chatStream()` uses the real streaming `runStream()` path
 *   with per-token SSE events, tool execution progress, and
 *   agent handoff notifications.
 */
export class AdkOrchestrator {
  private readonly logger: LoggerService;
  private readonly adkLogger: ILogger;
  private readonly chatService: ResponsesApiService;
  private cachedTools: FunctionTool[] | null = null;
  private cachedToolsKey = '';

  constructor(options: {
    chatService: ResponsesApiService;
    logger: LoggerService;
    backendApprovalStore?: unknown;
    toolScopeService?: unknown;
  }) {
    this.chatService = options.chatService;
    this.logger = options.logger;
    this.adkLogger = toAdkLogger(options.logger);
  }

  /** Invalidate the cached tool list (e.g. after config change). */
  invalidateToolCache(): void {
    this.cachedTools = null;
    this.cachedToolsKey = '';
  }

  async chat(
    request: ChatRequest,
    snapshot: AgentGraphSnapshot,
    buildDepsForAgent: BuildDepsForAgent,
  ): Promise<ChatResponse> {
    try {
      const userInput = requireLastUserMessage(request, '[AdkOrchestrator] ');
      const runOptions = await this.buildRunOptions(
        snapshot,
        buildDepsForAgent,
        undefined,
        request.conversationId,
      );
      const result = await adkRun(userInput, runOptions);
      return toChatResponse(result);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      this.logger.error('[AdkOrchestrator] chat() failed', { error: message });
      throw error;
    }
  }

  /**
   * Real streaming chat via ADK `runStream()`.
   *
   * Per-token text deltas, reasoning, tool execution progress,
   * and agent handoffs are emitted as `stream.*` SSE events
   * that the frontend reducer handles directly.
   */
  async chatStream(
    request: ChatRequest,
    snapshot: AgentGraphSnapshot,
    onEvent: (event: string) => void,
    buildDepsForAgent: BuildDepsForAgent,
    signal?: AbortSignal,
  ): Promise<void> {
    try {
      const userInput = requireLastUserMessage(request, '[AdkOrchestrator] ');
      const runOptions = await this.buildRunOptions(
        snapshot,
        buildDepsForAgent,
        signal,
        request.conversationId,
      );

      const streamed = runStream(userInput, {
        ...runOptions,
        signal,
      } as RunStreamOptions);

      for await (const event of streamed) {
        const frontendEvents = mapAdkEventToFrontend(event);
        for (const fe of frontendEvents) {
          onEvent(fe);
        }
      }

      const result = streamed.result;

      onEvent(
        JSON.stringify({
          type: 'stream.completed',
          usage: result.usage,
          agentName: result.agentName,
        }),
      );
    } catch (error) {
      if (signal?.aborted) {
        this.logger.info('[AdkOrchestrator] Stream aborted by client');
        return;
      }
      const message = error instanceof Error ? error.message : String(error);
      this.logger.error('[AdkOrchestrator] Stream error', { error: message });
      onEvent(
        JSON.stringify({
          type: 'stream.error',
          error: message,
          code: 'adk_error',
        }),
      );
    }
  }

  private async buildRunOptions(
    snapshot: AgentGraphSnapshot,
    buildDepsForAgent: BuildDepsForAgent,
    signal?: AbortSignal,
    conversationId?: string,
  ): Promise<RunOptions> {
    const defaultAgent = snapshot.agents.get(snapshot.defaultAgentKey);
    if (!defaultAgent) {
      throw new Error(
        `[AdkOrchestrator] Default agent "${snapshot.defaultAgentKey}" not found`,
      );
    }

    const deps = await buildDepsForAgent(defaultAgent);
    const model = new BackstageModelAdapter(this.chatService, deps.client);
    const adkConfig = toAdkEffectiveConfig(deps.config);
    const adkAgents = this.snapshotToAdkAgents(snapshot);
    const adkMcpServers = deps.mcpServers.map(toAdkMcpServerConfig);
    const functionTools = await this.discoverBackendTools(deps);

    return {
      model,
      agents: adkAgents,
      defaultAgent: snapshot.defaultAgentKey,
      config: adkConfig,
      mcpServers: adkMcpServers,
      functionTools,
      conversationId,
      logger: this.adkLogger,
      maxAgentTurns: snapshot.maxTurns,
      signal,
    };
  }

  private static readonly DISCOVERY_TIMEOUT_MS = 30_000;

  private async discoverBackendTools(deps: ChatDeps): Promise<FunctionTool[]> {
    if (!deps.backendToolExecutor) return [];

    const cacheKey = deps.mcpServers
      .map(s => s.id)
      .sort((a, b) => a.localeCompare(b))
      .join(',');
    if (this.cachedTools && this.cachedToolsKey === cacheKey) {
      this.logger.debug('[AdkOrchestrator] Using cached backend tools', {
        count: this.cachedTools.length,
      });
      return this.cachedTools;
    }

    let discovered: Array<{
      name: string;
      description?: string;
      parameters?: Record<string, unknown>;
    }>;

    try {
      discovered = await Promise.race([
        deps.backendToolExecutor.ensureToolsDiscovered(deps.mcpServers),
        new Promise<never>((_, reject) =>
          setTimeout(
            () => reject(new Error('Tool discovery timed out')),
            AdkOrchestrator.DISCOVERY_TIMEOUT_MS,
          ),
        ),
      ]);
    } catch (error) {
      const msg = error instanceof Error ? error.message : String(error);
      this.logger.warn('[AdkOrchestrator] Tool discovery failed', {
        error: msg,
        serverCount: deps.mcpServers.length,
      });
      return [];
    }

    this.logger.info('[AdkOrchestrator] Discovered backend MCP tools', {
      count: discovered.length,
      servers: deps.mcpServers.map(s => s.id),
    });

    const tools = discovered.map(apiTool => ({
      type: 'function' as const,
      name: apiTool.name,
      description: apiTool.description ?? apiTool.name,
      parameters: apiTool.parameters ?? { type: 'object', properties: {} },
      strict: false,
      execute: async (args: Record<string, unknown>): Promise<string> => {
        try {
          return await deps.backendToolExecutor!.executeTool(
            apiTool.name,
            JSON.stringify(args),
          );
        } catch (execError) {
          const msg =
            execError instanceof Error ? execError.message : String(execError);
          this.logger.error('[AdkOrchestrator] Tool execution failed', {
            tool: apiTool.name,
            error: msg,
          });
          return JSON.stringify({ error: msg });
        }
      },
    }));

    this.cachedTools = tools;
    this.cachedToolsKey = cacheKey;
    return tools;
  }

  /**
   * Plugin AgentConfig and ADK AgentConfig are structurally identical
   * (the plugin adds only the deprecated `inheritSystemPrompt` field).
   * The cast is safe because the ADK ignores unknown properties.
   */
  private snapshotToAdkAgents(
    snapshot: AgentGraphSnapshot,
  ): Record<string, AdkAgentConfig> {
    const agents: Record<string, AdkAgentConfig> = {};
    for (const [key, resolved] of snapshot.agents) {
      agents[key] = resolved.config as unknown as AdkAgentConfig;
    }
    return agents;
  }
}
