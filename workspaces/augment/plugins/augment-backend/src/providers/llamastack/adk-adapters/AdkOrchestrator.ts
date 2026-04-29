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
  ApprovalStore,
  ToolResolver,
  createContinuationState,
  type RunOptions,
  type RunStreamOptions,
  type RunState,
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
import type { BackendApprovalStore } from '../../responses-api/tools/BackendApprovalStore';
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
/**
 * Per-request mutable reference to the currently active agent key.
 * Created fresh for each `chat()` / `chatStream()` call so that
 * concurrent requests do not interfere with each other.
 */
interface AgentRef {
  key: string;
}

interface CachedToolMeta {
  name: string;
  description: string;
  parameters: Record<string, unknown>;
}

export class AdkOrchestrator {
  private readonly logger: LoggerService;
  private readonly adkLogger: ILogger;
  private readonly chatService: ResponsesApiService;
  private readonly adkApprovalStore = new ApprovalStore();
  private readonly backendApprovalStore?: BackendApprovalStore;
  private cachedToolMeta: CachedToolMeta[] | null = null;
  private cachedToolMetaKey = '';
  private cachedDiscoveryGeneration = -1;

  private static readonly MAX_CONVERSATION_STATES = 500;
  private readonly conversationStates = new Map<string, RunState>();

  constructor(options: {
    chatService: ResponsesApiService;
    logger: LoggerService;
    backendApprovalStore?: BackendApprovalStore;
    toolScopeService?: unknown;
  }) {
    this.chatService = options.chatService;
    this.logger = options.logger;
    this.adkLogger = toAdkLogger(options.logger);
    this.backendApprovalStore = options.backendApprovalStore;
  }

  /** Invalidate the cached tool list (e.g. after config change). */
  invalidateToolCache(): void {
    this.cachedToolMeta = null;
    this.cachedToolMetaKey = '';
    this.cachedDiscoveryGeneration = -1;
  }

  /**
   * Eagerly warm the tool metadata cache in the background.
   * Call after config load/invalidation so the first chat request
   * does not pay the full MCP discovery cost.
   */
  warmUpToolCache(deps: ChatDeps): void {
    this.ensureToolMetaCached(deps).catch(err => {
      this.logger.warn(
        '[AdkOrchestrator] Background tool cache warm-up failed',
        {
          error: err instanceof Error ? err.message : String(err),
        },
      );
    });
  }

  async chat(
    request: ChatRequest,
    snapshot: AgentGraphSnapshot,
    buildDepsForAgent: BuildDepsForAgent,
  ): Promise<ChatResponse> {
    try {
      const userInput = requireLastUserMessage(request, '[AdkOrchestrator] ');
      const { agentRef, resumeState } = this.resolveAgentContinuity(
        request.conversationId,
        snapshot,
        'chat',
        request.model,
      );
      const runOptions = await this.buildRunOptions(
        snapshot,
        buildDepsForAgent,
        agentRef,
        undefined,
        request.conversationId,
        resumeState,
      );
      const result = await adkRun(userInput, runOptions);

      this.saveConversationState(request.conversationId, result);
      this.mirrorPendingApprovals(result, request.conversationId);

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
      const { agentRef, resumeState } = this.resolveAgentContinuity(
        request.conversationId,
        snapshot,
        'stream',
        request.model,
      );
      const runOptions = await this.buildRunOptions(
        snapshot,
        buildDepsForAgent,
        agentRef,
        signal,
        request.conversationId,
        resumeState,
      );

      const streamed = runStream(userInput, {
        ...runOptions,
        signal,
      } as RunStreamOptions);

      for await (const event of streamed) {
        if (event.type === 'agent_start') {
          agentRef.key = event.agentKey;
        }
        for (const fe of mapAdkEventToFrontend(event)) {
          onEvent(fe);
        }
      }

      const result = streamed.result;

      this.saveConversationState(request.conversationId, result);
      this.mirrorPendingApprovals(result, request.conversationId);

      onEvent(
        JSON.stringify({
          type: 'stream.completed',
          usage: result.usage,
          agentName: result.agentName,
          ...(result.responseId ? { responseId: result.responseId } : {}),
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

  private resolveAgentContinuity(
    conversationId: string | undefined,
    snapshot: AgentGraphSnapshot,
    mode: 'chat' | 'stream',
    requestedAgent?: string,
  ): { agentRef: AgentRef; resumeState: RunState | undefined } {
    let startKey = snapshot.defaultAgentKey;
    if (requestedAgent && snapshot.agents.has(requestedAgent)) {
      startKey = requestedAgent;
      this.logger.info(
        `[AdkOrchestrator] Using requested agent "${requestedAgent}" as starting agent for ${mode}`,
      );
    }
    const agentRef: AgentRef = { key: startKey };
    const resumeState = this.getConversationState(conversationId, snapshot);
    if (resumeState) {
      agentRef.key = resumeState.currentAgentKey;
      this.logger.info(
        `[AdkOrchestrator] Resuming ${mode} from agent "${resumeState.currentAgentKey}" for conversation ${conversationId}`,
      );
    }
    return { agentRef, resumeState };
  }

  private mirrorPendingApprovals(
    result: {
      pendingApprovals?: Array<{ toolName: string; approvalRequestId: string }>;
      responseId?: string;
    },
    conversationId?: string,
  ): void {
    if (!result.pendingApprovals?.length || !this.backendApprovalStore) return;
    for (const pa of result.pendingApprovals) {
      const adkEntry = this.adkApprovalStore.get(
        result.responseId ?? '',
        pa.approvalRequestId,
      );
      if (!adkEntry) continue;
      if (!adkEntry.conversationId && conversationId) {
        adkEntry.conversationId = conversationId;
      }
      this.backendApprovalStore.store(adkEntry);
      this.logger.info(
        `[HITL] Mirrored pending approval to BackendApprovalStore: ` +
          `tool=${pa.toolName}, callId=${pa.approvalRequestId}`,
      );
    }
  }

  private async buildRunOptions(
    snapshot: AgentGraphSnapshot,
    buildDepsForAgent: BuildDepsForAgent,
    _agentRef: AgentRef,
    signal?: AbortSignal,
    conversationId?: string,
    resumeState?: RunState,
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

    const toolResolver = this.buildToolResolver(functionTools, deps);

    return {
      model,
      agents: adkAgents,
      defaultAgent: snapshot.defaultAgentKey,
      config: adkConfig,
      mcpServers: adkMcpServers,
      functionTools,
      toolResolver,
      approvalStore: this.adkApprovalStore,
      conversationId,
      logger: this.adkLogger,
      maxAgentTurns: snapshot.maxTurns,
      signal,
      resumeState,
    };
  }

  private static readonly DISCOVERY_TIMEOUT_MS = 10_000;

  /**
   * Discover MCP tools and build FunctionTool wrappers.
   *
   * Tool *metadata* (name, description, parameters) is cached across
   * requests to avoid redundant MCP server round-trips.
   * Tool *execute closures* are built fresh per request so they capture
   * the current request's `agentRef` and `snapshot` — preventing
   * cross-request state leakage.
   *
   * NOTE: Per-agent tool filtering (based on AgentConfig.mcpServers)
   * is handled by the ADK's native `filterMcpServers` for MCP tools.
   * For backend-proxied function tools, proper per-agent filtering
   * requires an ADK-level change in `buildAgentTools`. Until then,
   * all function tools are visible to all agents.
   */
  private async discoverBackendTools(deps: ChatDeps): Promise<FunctionTool[]> {
    if (!deps.backendToolExecutor) return [];
    const toolExecutor = deps.backendToolExecutor;

    const meta = await this.ensureToolMetaCached(deps);

    return meta.map(tool => ({
      type: 'function' as const,
      name: tool.name,
      description: tool.description,
      parameters: tool.parameters,
      strict: false,
      execute: async (args: Record<string, unknown>): Promise<string> => {
        try {
          return await toolExecutor.executeTool(
            tool.name,
            JSON.stringify(args),
          );
        } catch (execError) {
          const msg =
            execError instanceof Error ? execError.message : String(execError);
          this.logger.error('[AdkOrchestrator] Tool execution failed', {
            tool: tool.name,
            error: msg,
          });
          return JSON.stringify({ error: msg });
        }
      },
    }));
  }

  /**
   * Cache the raw tool metadata from MCP discovery.
   * This is safe to share across requests since metadata doesn't
   * contain request-specific state.
   */
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
      this.logger.debug(
        '[AdkOrchestrator] Using cached backend tool metadata',
        {
          count: this.cachedToolMeta.length,
        },
      );
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
      if (this.cachedToolMeta) {
        this.logger.info(
          '[AdkOrchestrator] Returning stale cached tools after discovery failure',
          { count: this.cachedToolMeta.length },
        );
        return this.cachedToolMeta;
      }
      return [];
    }

    this.logger.info('[AdkOrchestrator] Discovered backend MCP tools', {
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

  /**
   * Build a ToolResolver that maps each function tool back to its
   * source MCP server ID. Without this, the ADK registers all
   * function tools with serverId 'function' and partitionByApproval
   * cannot match them to MCP servers' requireApproval config.
   */
  private buildToolResolver(
    functionTools: FunctionTool[],
    deps: ChatDeps,
  ): ToolResolver {
    const resolver = new ToolResolver(this.adkLogger);

    for (const ft of functionTools) {
      const serverInfo = deps.backendToolExecutor?.getToolServerInfo(ft.name);
      resolver.register({
        serverId: serverInfo?.serverId ?? 'function',
        serverUrl: '',
        originalName: serverInfo?.originalName ?? ft.name,
        prefixedName: ft.name,
        description: ft.description,
        inputSchema: ft.parameters,
      });
    }

    return resolver;
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

  /**
   * Look up stored continuation state for a conversation so the next
   * run() starts from the same agent that produced the last result.
   *
   * Returns undefined (falls back to default agent) when:
   * - No conversationId is provided
   * - No state is stored for this conversation
   * - The stored agent no longer exists in the current snapshot
   *   (e.g. admin deleted/renamed the agent between turns)
   */
  private getConversationState(
    conversationId?: string,
    snapshot?: AgentGraphSnapshot,
  ): RunState | undefined {
    if (!conversationId) return undefined;
    const state = this.conversationStates.get(conversationId);
    if (!state) return undefined;

    if (snapshot && !snapshot.agents.has(state.currentAgentKey)) {
      this.logger.warn(
        `[AdkOrchestrator] Stored agent "${state.currentAgentKey}" no longer exists in graph, ` +
          `falling back to default agent for conversation ${conversationId}`,
      );
      this.conversationStates.delete(conversationId);
      return undefined;
    }

    return state;
  }

  /**
   * Store continuation state after a completed run so follow-up messages
   * resume from the active agent instead of restarting from the router.
   */
  private saveConversationState(
    conversationId: string | undefined,
    result: {
      currentAgentKey?: string;
      responseId?: string;
      handoffPath?: string[];
    },
  ): void {
    if (!conversationId || !result.currentAgentKey) return;

    const state = createContinuationState(
      result as Parameters<typeof createContinuationState>[0],
      conversationId,
    );

    this.conversationStates.set(conversationId, state);

    if (
      this.conversationStates.size > AdkOrchestrator.MAX_CONVERSATION_STATES
    ) {
      const oldest = this.conversationStates.keys().next().value;
      if (oldest) {
        this.logger.warn(
          `[AdkOrchestrator] Evicting conversation state for ${oldest} ` +
            `(map size ${this.conversationStates.size} exceeds cap ${AdkOrchestrator.MAX_CONVERSATION_STATES}). ` +
            `Follow-up messages for this conversation will restart from the default agent.`,
        );
        this.conversationStates.delete(oldest);
      }
    }

    this.logger.debug(
      `[AdkOrchestrator] Saved continuation state for conversation ${conversationId}, ` +
        `activeAgent="${result.currentAgentKey}"`,
    );
  }
}
