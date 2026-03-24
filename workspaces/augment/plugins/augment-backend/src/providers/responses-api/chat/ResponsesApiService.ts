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
import {
  DEFAULT_INCLUDE_FIELDS,
  MESSAGE_PREVIEW_MAX_LENGTH,
  ZDR_INCLUDE_FIELDS,
} from '../../../constants';
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

/**
 * Result from `continueFunctionCallOutput`. Includes any `function_call`
 * items the model produced so the caller can implement a continuation loop
 * (auto-execute or request another HITL approval).
 */
export interface ContinuationResult {
  responseId: string;
  text: string;
  functionCalls: Array<{
    callId: string;
    name: string;
    arguments: string;
  }>;
}

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

/**
 * Stateless chat service extracted from ResponsesApiCoordinator.
 *
 * Every public method receives its dependencies explicitly —
 * nothing is cached on the instance except the logger.
 * This makes the service safe for runtime config changes:
 * a new EffectiveConfig or ResponsesApiClient can be passed
 * per-request without restarting the plugin.
 */
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

  // ===========================================================================
  // First-Turn Preparation (used by AdkOrchestrator)
  // ===========================================================================

  /**
   * Prepare the first turn of a request for the Runner path.
   *
   * Applies the same pre-processing that `chat()` does via
   * `prepareChatContext()`:
   * - Builds conversation context from multi-message history (legacy
   *   fallback for requests without `previousResponseId`)
   * - Checks user input against admin-configured safety patterns
   * - Computes the first-turn store override for ConversationService
   *
   * Returns the enriched instructions and store override. The Runner
   * should call this once for the initial turn, not for subsequent
   * handoff/continue turns which are internal agent transitions.
   */
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

  // ===========================================================================
  // Multi-Agent Low-Level API
  // ===========================================================================

  /**
   * Execute a single Responses API turn and return the raw response.
   *
   * Unlike `chat()`, this method:
   * - Accepts `input` as a string OR an array of input items
   *   (needed for `function_call_output` acknowledgments during handoffs)
   * - Accepts `instructions` and `tools` directly (not from EffectiveConfig)
   * - Returns the raw `ResponsesApiResponse` for the runner to inspect
   *   before deciding the next step
   * - Does NOT call `prepareChatContext()`, `processResponse()`, or
   *   register with `ConversationService`
   *
   * The `store` option defaults to `!config.zdrMode`. Multi-agent
   * callers with handoffs must pass `store: true` explicitly.
   */
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
    const request = this.buildTurnRequest(
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

  /**
   * Streaming variant of `chatTurn()`. Same semantics but streams SSE
   * events to the caller via `onEvent`.
   */
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
    const request = this.buildTurnRequest(input, instructions, tools, config, {
      ...options,
      stream: true,
    });

    this.logger.info('[MultiAgent] chatTurnStream request', {
      model: config.model,
      inputType: typeof input === 'string' ? 'string' : 'items',
      toolCount: tools.length,
      store: request.store as boolean,
      hasPreviousResponse: !!options?.previousResponseId,
    });

    await client.streamRequest('/v1/responses', request, onEvent, signal);
  }

  /**
   * Build a Responses API request body for a single agent turn.
   *
   * Used by both multi-agent orchestration and the auto-synthesized
   * single-agent path.
   *
   * Maps 1:1 to the LlamaStack `/v1/responses` `CreateResponseRequest`:
   *   input, model, instructions|prompt, tools, tool_choice, temperature,
   *   max_output_tokens, max_tool_calls, reasoning, guardrails, text.format,
   *   parallel_tool_calls, stream, store, previous_response_id, conversation.
   * No agent type/role fields exist in this API -- orchestration patterns
   * (handoffs, agents-as-tools) are expressed via function tools in `tools`
   * and function_call_output items in `input`.
   */
  private buildTurnRequest(
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
    const isZdrMode = config.zdrMode === true;
    const storeValue = options?.store ?? !isZdrMode;
    const includeFields = isZdrMode
      ? ZDR_INCLUDE_FIELDS
      : DEFAULT_INCLUDE_FIELDS;

    const request: Record<string, unknown> = {
      input,
      model: config.model,
      tools: tools.length > 0 ? tools : undefined,
      store: storeValue,
      include: includeFields,
    };

    if (config.promptRef) {
      const prompt: Record<string, unknown> = { id: config.promptRef.id };
      if (config.promptRef.version !== undefined)
        prompt.version = config.promptRef.version;
      if (config.promptRef.variables)
        prompt.variables = config.promptRef.variables;
      request.prompt = prompt;
    } else {
      request.instructions = instructions;
    }

    if (options?.stream) {
      request.stream = true;
    }

    if (config.toolChoice) {
      request.tool_choice = config.toolChoice;
    }
    if (config.parallelToolCalls !== undefined) {
      request.parallel_tool_calls = config.parallelToolCalls;
    }

    if (config.textFormat) {
      request.text = { format: config.textFormat };
    }

    if (config.reasoning) {
      const reasoning: Record<string, unknown> = {};
      if (config.reasoning.effort) reasoning.effort = config.reasoning.effort;
      if (config.reasoning.summary)
        reasoning.summary = config.reasoning.summary;
      if (Object.keys(reasoning).length > 0) {
        request.reasoning = reasoning;
      }
    }

    // conversation and previous_response_id are mutually exclusive in
    // Llama Stack.  Prefer conversation so every turn is stored in the
    // conversation container and retrievable via GET /conversations/{id}/items.
    if (options?.conversationId) {
      request.conversation = options.conversationId;
    } else if (options?.previousResponseId) {
      request.previous_response_id = options.previousResponseId;
    }

    this.applyProductionParams(request, config);

    if (config.truncation && this.isResponsesParamSupported('truncation')) {
      request.truncation = config.truncation;
    }

    return request;
  }

  // ===========================================================================
  // Internal Helpers
  // ===========================================================================

  /**
   * Check user input against configured destructive action patterns.
   * Logs a warning when a match is found so administrators can monitor.
   */
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

  /**
   * Apply production-grade Responses API parameters to a request body.
   */
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

  /**
   * Check if a Responses API parameter is supported by the connected server.
   * Delegates to `ServerCapabilities` for version-aware decisions.
   */
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

  // ===========================================================================
  // Function Call Output Continuation
  // ===========================================================================

  /**
   * Send a `function_call_output` to the Responses API and return the
   * model's follow-up response. Used after backend tool execution
   * (both auto-exec and human-approved).
   *
   * Accepts optional production params (maxOutputTokens, temperature,
   * instructions, truncation) to match the context of the original agent
   * turn. Without these, the continuation would use server defaults,
   * which can cause context window overflow when tool output is large.
   *
   * When `tools` is provided, the model can generate new `function_call`
   * items in its response, enabling chained tool execution after HITL
   * approval (the caller is responsible for the continuation loop).
   */
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
    /** Additional tool outputs for parallel tool calls in the same turn. */
    additionalToolOutputs?: Array<{
      callId: string;
      output: string;
      functionCall?: { name: string; arguments: string };
    }>;
  }): Promise<ContinuationResult> {
    const input = this.buildToolOutputInput(options);
    const body = this.buildContinuationBody(options, input);

    const response = await options.client.request<{
      id: string;
      output: Array<{
        type: string;
        content?: Array<{ type: string; text: string }>;
        name?: string;
        call_id?: string;
        server_label?: string;
        arguments?: string;
        id?: string;
      }>;
    }>('/v1/responses', {
      method: 'POST',
      body: JSON.stringify(body),
    });

    return this.parseContinuationResponse(response);
  }

  private buildToolOutputInput(options: {
    callId: string;
    output: string;
    functionCall?: { name: string; arguments: string };
    additionalToolOutputs?: Array<{
      callId: string;
      output: string;
      functionCall?: { name: string; arguments: string };
    }>;
  }): Array<Record<string, unknown>> {
    const input: Array<Record<string, unknown>> = [];
    const allOutputs = [
      {
        callId: options.callId,
        output: options.output,
        functionCall: options.functionCall,
      },
      ...(options.additionalToolOutputs ?? []),
    ];

    for (const toolOutput of allOutputs) {
      if (toolOutput.functionCall) {
        input.push({
          type: 'function_call',
          call_id: toolOutput.callId,
          name: toolOutput.functionCall.name,
          arguments: toolOutput.functionCall.arguments,
        });
      }
      input.push({
        type: 'function_call_output',
        call_id: toolOutput.callId,
        output: toolOutput.output,
      });
    }
    return input;
  }

  private buildContinuationBody(
    options: {
      model: string;
      conversationId?: string;
      previousResponseId?: string;
      tools?: ResponsesApiTool[];
      guardrails?: string[];
      safetyIdentifier?: string;
      instructions?: string;
      maxOutputTokens?: number;
      temperature?: number;
      truncation?: 'auto' | 'disabled';
    },
    input: Array<Record<string, unknown>>,
  ): Record<string, unknown> {
    const body: Record<string, unknown> = {
      model: options.model,
      input,
      store: true,
    };

    // conversation and previous_response_id are mutually exclusive in
    // Llama Stack.  Prefer conversation so tool-continuation turns are
    // also stored in the conversation container for history retrieval.
    if (options.conversationId) {
      body.conversation = options.conversationId;
    } else if (options.previousResponseId) {
      body.previous_response_id = options.previousResponseId;
    }
    if (options.tools && options.tools.length > 0) {
      body.tools = options.tools;
    }
    if (options.guardrails && options.guardrails.length > 0) {
      body.guardrails = options.guardrails;
    }
    if (options.safetyIdentifier) {
      body.safety_identifier = options.safetyIdentifier;
    }
    if (options.instructions) {
      body.instructions = options.instructions;
    }
    if (options.maxOutputTokens !== undefined && options.maxOutputTokens > 0) {
      if (this.isResponsesParamSupported('max_output_tokens')) {
        body.max_output_tokens = options.maxOutputTokens;
      }
    }
    if (options.temperature !== undefined) {
      body.temperature = options.temperature;
    }
    if (options.truncation && this.isResponsesParamSupported('truncation')) {
      body.truncation = options.truncation;
    }
    return body;
  }

  private parseContinuationResponse(response: {
    id: string;
    output: Array<{
      type: string;
      content?: Array<{ type: string; text: string }>;
      name?: string;
      call_id?: string;
      arguments?: string;
      id?: string;
    }>;
  }): ContinuationResult {
    let text = '';
    const functionCalls: ContinuationResult['functionCalls'] = [];

    for (const item of response.output ?? []) {
      if (item.type === 'function_call') {
        functionCalls.push({
          callId: item.call_id ?? item.id ?? '',
          name: item.name ?? '',
          arguments: item.arguments ?? '{}',
        });
        continue;
      }
      if (item.type !== 'message') continue;
      const msg = item as { content?: Array<{ type: string; text?: string }> };
      for (const c of msg.content ?? []) {
        if (c.type === 'output_text' && c.text) text += c.text;
      }
    }

    return { responseId: response.id, text, functionCalls };
  }
}
