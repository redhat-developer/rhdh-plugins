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
import { Runner } from '@openai/agents-core';
import type { ChatRequest, ChatResponse } from '../../../types';
import type { ResponsesApiService } from '../../responses-api/chat/ResponsesApiService';
import type { ChatDeps } from '../../responses-api/chat/ResponsesApiService';
import type { BackendApprovalStore } from '../../responses-api/tools/BackendApprovalStore';
import { LlamaStackProvider } from './LlamaStackProvider';
import { buildAgentGraph } from './configMapper';
import { toChatResponse } from './responseMapper';
import { mapRunStreamEventToFrontend } from './streamMapper';
import { requireLastUserMessage } from '../../responses-api/chat/chatUtils';
import {
  discoverBackendTools,
  ensureToolMetaCached,
  buildAgentToolFilter,
} from './orchestratorToolDiscovery';
import type { ToolMetaCache } from './orchestratorToolDiscovery';

export class OpenAIAgentsOrchestrator {
  private readonly logger: LoggerService;
  private readonly chatService: ResponsesApiService;
  readonly backendApprovalStore?: BackendApprovalStore;

  private readonly toolCache: ToolMetaCache = {
    cachedToolMeta: null,
    cachedToolMetaKey: '',
    cachedDiscoveryGeneration: -1,
  };

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
    this.toolCache.cachedToolMeta = null;
    this.toolCache.cachedToolMetaKey = '';
    this.toolCache.cachedDiscoveryGeneration = -1;
  }

  warmUpToolCache(deps: ChatDeps): void {
    ensureToolMetaCached(deps, this.toolCache, this.logger).catch(err => {
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
      const userInput = requireLastUserMessage(
        request,
        '[OpenAIAgentsOrchestrator] ',
      );
      const backendTools = await discoverBackendTools(
        deps,
        this.toolCache,
        this.logger,
      );
      const toolFilter = buildAgentToolFilter(agentsConfig, deps);
      const { defaultAgent } = buildAgentGraph(
        agentsConfig as Record<string, any>,
        this.resolveStartAgent(
          request.conversationId,
          defaultAgentKey,
          request.model,
        ),
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

      this.saveConversationAgent(
        request.conversationId,
        result.lastAgent?.name,
      );

      return toChatResponse(result);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      this.logger.error('[OpenAIAgentsOrchestrator] chat() failed', {
        error: message,
      });
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
      const userInput = requireLastUserMessage(
        request,
        '[OpenAIAgentsOrchestrator] ',
      );
      const backendTools = await discoverBackendTools(
        deps,
        this.toolCache,
        this.logger,
      );
      const toolFilter = buildAgentToolFilter(agentsConfig, deps);
      const { defaultAgent } = buildAgentGraph(
        agentsConfig as Record<string, any>,
        this.resolveStartAgent(
          request.conversationId,
          defaultAgentKey,
          request.model,
        ),
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

      this.saveConversationAgent(
        request.conversationId,
        streamed.lastAgent?.name,
      );

      const resultData = streamed as unknown as {
        usage?: {
          inputTokens?: number;
          outputTokens?: number;
          totalTokens?: number;
        };
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
      this.logger.error('[OpenAIAgentsOrchestrator] Stream error', {
        error: message,
      });
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

    if (
      this.conversationAgents.size >
      OpenAIAgentsOrchestrator.MAX_CONVERSATION_STATES
    ) {
      const oldest = this.conversationAgents.keys().next().value;
      if (oldest) {
        this.conversationAgents.delete(oldest);
      }
    }
  }
}
