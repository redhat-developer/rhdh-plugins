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
import type { ResponsesApiClient } from '../client/ResponsesApiClient';
import type { McpAuthService } from '../../llamastack/McpAuthService';
import type { ConversationService } from '../conversations/ConversationService';
import { MESSAGE_PREVIEW_MAX_LENGTH } from '../../../constants';
import type {
  ChatRequest,
  EffectiveConfig,
  MCPServerConfig,
  ResponsesApiInputItem,
  ResponsesApiResponse,
  ResponsesApiTool,
} from '../../../types';
import type { BackendToolExecutor } from '../tools/BackendToolExecutor';
import { requireLastUserMessage } from './chatUtils';
import type { CapabilityInfo } from '../types';

export type { ContinuationResult } from './chatTurnBuilder';
import type { ContinuationResult } from './chatTurnBuilder';
import { buildTurnRequest } from './chatTurnBuilder';
import { executeContinuation } from './continuationHandler';

/**
 * Dependencies injected into every ResponsesApiService call.
 * These are resolved per-request by the orchestrator so that
 * runtime config changes take effect immediately.
 */
export interface ChatDeps {
  client: ResponsesApiClient;
  config: EffectiveConfig;
  mcpServers: MCPServerConfig[];
  mcpAuth: McpAuthService | null;
  conversations: ConversationService | null;
  /** When set, MCP tools are converted to function tools and executed by the backend. */
  backendToolExecutor?: BackendToolExecutor;
}

export class ResponsesApiService {
  private readonly logger: LoggerService;
  private capabilityProvider: () => CapabilityInfo;

  constructor(
    logger: LoggerService,
    capabilityProvider?: () => CapabilityInfo,
  ) {
    this.logger = logger;
    this.capabilityProvider =
      capabilityProvider ??
      (() => ({
        functionTools: true,
        strictField: true,
        maxOutputTokens: true,
        mcpTools: true,
        parallelToolCalls: true,
        truncation: false,
      }));
  }

  /** Replace the capability provider (e.g. after server version is known). */
  setCapabilityProvider(provider: () => CapabilityInfo): void {
    this.capabilityProvider = provider;
  }

  /** Get the current server capabilities from the injected provider. */
  getCapabilities(): CapabilityInfo {
    return this.capabilityProvider();
  }

  prepareFirstTurn(
    request: ChatRequest,
    agentInstructions: string,
    config: EffectiveConfig,
    conversations: ConversationService | null,
  ): {
    instructions: string;
    storeOverride: boolean | undefined;
  } {
    const userInput = this.extractUserInput(request);
    const conversationContext = this.buildConversationContext(
      request,
      userInput,
    );
    const instructions = agentInstructions + conversationContext;

    this.checkSafetyPatterns(userInput, config.safetyPatterns, '[Runner] ');

    let storeOverride: boolean | undefined;
    if (request.conversationId && conversations) {
      const isFirst = conversations.markFirstStoredTurn(request.conversationId);
      storeOverride = isFirst;
    }

    return { instructions, storeOverride };
  }

  async chatTurn(
    input: string | ResponsesApiInputItem[],
    instructions: string,
    tools: ResponsesApiTool[],
    config: EffectiveConfig,
    client: ResponsesApiClient,
    options?: {
      previousResponseId?: string;
      conversationId?: string;
      store?: boolean;
    },
  ): Promise<ResponsesApiResponse> {
    const request = this.buildTurnRequestImpl(
      input,
      instructions,
      tools,
      config,
      options,
    );

    this.logger.info('[MultiAgent] chatTurn request', {
      model: config.model,
      inputType: typeof input === 'string' ? 'string' : 'items',
      toolCount: tools.length,
      store: request.store as boolean,
      hasPreviousResponse: !!options?.previousResponseId,
    });

    return client.requestWithRetry<ResponsesApiResponse>('/v1/responses', {
      method: 'POST',
      body: JSON.stringify(request),
    });
  }

  async chatTurnStream(
    input: string | ResponsesApiInputItem[],
    instructions: string,
    tools: ResponsesApiTool[],
    config: EffectiveConfig,
    client: ResponsesApiClient,
    onEvent: (eventData: string) => void,
    options?: {
      previousResponseId?: string;
      conversationId?: string;
      store?: boolean;
    },
    signal?: AbortSignal,
  ): Promise<void> {
    const request = this.buildTurnRequestImpl(
      input,
      instructions,
      tools,
      config,
      { ...options, stream: true },
    );

    this.logger.info('[MultiAgent] chatTurnStream request', {
      model: config.model,
      inputType: typeof input === 'string' ? 'string' : 'items',
      toolCount: tools.length,
      store: request.store as boolean,
      hasPreviousResponse: !!options?.previousResponseId,
    });

    await client.streamRequest('/v1/responses', request, onEvent, signal);
  }

  private buildTurnRequestImpl(
    input: string | ResponsesApiInputItem[],
    instructions: string,
    tools: ResponsesApiTool[],
    config: EffectiveConfig,
    options?: {
      previousResponseId?: string;
      conversationId?: string;
      stream?: boolean;
      store?: boolean;
    },
  ): Record<string, unknown> {
    return buildTurnRequest(
      input,
      instructions,
      tools,
      config,
      options,
      p => this.isResponsesParamSupported(p),
      (req, cfg) => this.applyProductionParams(req, cfg),
    );
  }

  private checkSafetyPatterns(
    userInput: string,
    patterns: string[] | undefined,
    logPrefix: string,
  ): void {
    if (!patterns || patterns.length === 0) return;
    const lower = userInput.toLowerCase();
    const matched = patterns.filter(p => lower.includes(p.toLowerCase()));
    if (matched.length > 0) {
      this.logger.warn(
        `${logPrefix}User input matched safety pattern(s): ${matched.join(
          ', ',
        )}`,
      );
    }
  }

  private extractUserInput(request: ChatRequest): string {
    return requireLastUserMessage(request);
  }

  private buildConversationContext(
    request: ChatRequest,
    userInput: string,
  ): string {
    const hasNativeContext =
      !!request.previousResponseId || !!request.conversationId;

    if (hasNativeContext || request.messages.length <= 1) {
      return '';
    }

    const historyMessages = request.messages
      .slice(0, -1)
      .filter(m => m.role !== 'system');

    if (historyMessages.length === 0) {
      return '';
    }

    const historyParts = historyMessages.map(m => {
      const role = m.role === 'user' ? 'User' : 'Assistant';
      const content = m.content
        .replace(/[\n\r]/g, ' ')
        .substring(0, MESSAGE_PREVIEW_MAX_LENGTH);
      return `${role} said: ${content}`;
    });

    const sanitizedInput = userInput.replace(/[\n\r]/g, ' ');
    return ` CONVERSATION CONTEXT: This is a follow-up. Previous: ${historyParts.join(
      ' | ',
    )} | User now says: ${sanitizedInput}`;
  }

  private applyProductionParams(
    request: Record<string, unknown>,
    config: EffectiveConfig,
  ): void {
    if (config.guardrails && config.guardrails.length > 0) {
      request.guardrails = config.guardrails;
    }
    if (config.maxToolCalls !== undefined && config.maxToolCalls > 0) {
      request.max_tool_calls = config.maxToolCalls;
    }
    if (config.maxOutputTokens !== undefined && config.maxOutputTokens > 0) {
      if (this.isResponsesParamSupported('max_output_tokens')) {
        request.max_output_tokens = config.maxOutputTokens;
      }
    }
    if (config.temperature !== undefined) {
      request.temperature = config.temperature;
    }
    if (config.safetyIdentifier) {
      request.safety_identifier = config.safetyIdentifier;
    }
    if (config.maxInferIters !== undefined && config.maxInferIters > 0) {
      request.max_infer_iters = config.maxInferIters;
    }
  }

  isResponsesParamSupported(param: string): boolean {
    const caps = this.getCapabilities();
    switch (param) {
      case 'max_output_tokens':
        return caps.maxOutputTokens;
      case 'function_tools':
        return caps.functionTools;
      case 'strict':
        return caps.strictField;
      case 'truncation':
        return caps.truncation;
      default:
        return true;
    }
  }

  async continueFunctionCallOutput(options: {
    client: ResponsesApiClient;
    model: string;
    callId: string;
    output: string;
    previousResponseId: string;
    guardrails?: string[];
    safetyIdentifier?: string;
    functionCall?: { name: string; arguments: string };
    conversationId?: string;
    maxOutputTokens?: number;
    temperature?: number;
    instructions?: string;
    truncation?: 'auto' | 'disabled';
    tools?: ResponsesApiTool[];
    additionalToolOutputs?: Array<{
      callId: string;
      output: string;
      functionCall?: { name: string; arguments: string };
    }>;
  }): Promise<ContinuationResult> {
    return executeContinuation(options, p => this.isResponsesParamSupported(p));
  }
}
