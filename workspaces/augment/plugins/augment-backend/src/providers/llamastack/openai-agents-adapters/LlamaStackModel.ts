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
import { Usage } from '@openai/agents-core';
import type {
  Model,
  ModelRequest,
  ModelResponse,
} from '@openai/agents-core';
import type { StreamEvent } from '@openai/agents-core/types';
import type { ResponsesApiService } from '../../responses-api/chat/ResponsesApiService';
import type { ResponsesApiClient } from '../../responses-api/client/ResponsesApiClient';
import type {
  EffectiveConfig,
  ResponsesApiInputItem,
  ResponsesApiTool,
  ResponsesApiResponse,
} from '../../../types';

/**
 * Adapts the existing ResponsesApiService + ResponsesApiClient to the
 * `@openai/agents-core` Model interface.
 *
 * This is the key bridge: the agents-core Runner calls getResponse() and
 * getStreamedResponse() on this adapter; internally we delegate to the
 * existing Backstage services that know how to call LlamaStack's
 * `/v1/responses` endpoint.
 */
export class LlamaStackModel implements Model {
  constructor(
    private readonly chatService: ResponsesApiService,
    private readonly client: ResponsesApiClient,
    private readonly effectiveConfig: EffectiveConfig,
  ) {}

  async getResponse(request: ModelRequest): Promise<ModelResponse> {
    const { input, instructions, tools, options } =
      this.mapRequestToServiceArgs(request);

    const result = await this.chatService.chatTurn(
      input,
      instructions,
      tools,
      this.effectiveConfig,
      this.client,
      options,
    );

    return this.mapResponseToModelResponse(result);
  }

  async *getStreamedResponse(
    request: ModelRequest,
  ): AsyncIterable<StreamEvent> {
    const { input, instructions, tools, options } =
      this.mapRequestToServiceArgs(request);

    const events: string[] = [];
    let resolveNext: (() => void) | null = null;
    let done = false;

    const streamPromise = this.chatService.chatTurnStream(
      input,
      instructions,
      tools,
      this.effectiveConfig,
      this.client,
      (eventData: string) => {
        events.push(eventData);
        resolveNext?.();
      },
      options,
      request.signal,
    );

    streamPromise
      .then(() => {
        done = true;
        resolveNext?.();
      })
      .catch(() => {
        done = true;
        resolveNext?.();
      });

    while (!done || events.length > 0) {
      if (events.length > 0) {
        const eventData = events.shift()!;
        const parsed = this.parseStreamEvent(eventData);
        if (parsed) {
          yield parsed;
        }
      } else {
        await new Promise<void>(resolve => {
          resolveNext = resolve;
        });
        resolveNext = null;
      }
    }

    await streamPromise;
  }

  private mapRequestToServiceArgs(request: ModelRequest): {
    input: string | ResponsesApiInputItem[];
    instructions: string;
    tools: ResponsesApiTool[];
    options: {
      previousResponseId?: string;
      conversationId?: string;
      store?: boolean;
    };
  } {
    const input = typeof request.input === 'string'
      ? request.input
      : (request.input as unknown as ResponsesApiInputItem[]);

    const instructions = request.systemInstructions ?? '';

    const tools = this.mapToolsToResponsesApi(request.tools, request.handoffs);

    return {
      input,
      instructions,
      tools,
      options: {
        previousResponseId: request.previousResponseId,
        conversationId: request.conversationId,
        store: request.modelSettings.store,
      },
    };
  }

  private mapToolsToResponsesApi(
    tools: ModelRequest['tools'],
    handoffs: ModelRequest['handoffs'],
  ): ResponsesApiTool[] {
    const mapped: ResponsesApiTool[] = [];

    for (const tool of tools) {
      if (tool.type === 'function') {
        mapped.push({
          type: 'function',
          name: tool.name,
          description: tool.description,
          parameters: tool.parameters as Record<string, unknown>,
          strict: tool.strict,
        } as ResponsesApiTool);
      } else {
        mapped.push(tool as unknown as ResponsesApiTool);
      }
    }

    for (const handoff of handoffs) {
      mapped.push({
        type: 'function',
        name: handoff.toolName,
        description: handoff.toolDescription,
        parameters: handoff.inputJsonSchema as Record<string, unknown>,
        strict: handoff.strictJsonSchema,
      } as ResponsesApiTool);
    }

    return mapped;
  }

  private mapResponseToModelResponse(
    result: ResponsesApiResponse,
  ): ModelResponse {
    const output: ModelResponse['output'] = [];
    const resultAny = result as unknown as Record<string, unknown>;

    if (result.output) {
      for (const item of result.output) {
        output.push(item as unknown as ModelResponse['output'][0]);
      }
    } else if (typeof resultAny.content === 'string' && resultAny.content) {
      output.push({
        type: 'message',
        role: 'assistant',
        status: 'completed',
        content: [{ type: 'output_text', text: resultAny.content }],
      } as unknown as ModelResponse['output'][0]);
    }

    const requestUsage = new Usage();
    const otherUsage = new Usage();
    otherUsage.inputTokens = result.usage?.input_tokens ?? 0;
    otherUsage.outputTokens = result.usage?.output_tokens ?? 0;
    otherUsage.totalTokens =
      (result.usage?.input_tokens ?? 0) +
      (result.usage?.output_tokens ?? 0);
    requestUsage.add(otherUsage);

    return {
      usage: requestUsage,
      output,
      responseId: result.id,
    };
  }

  /**
   * Parse a raw SSE data string from LlamaStack into an agents-core
   * StreamEvent. We yield `output_text_delta` for text chunks and
   * `response_done` for the completed response, plus `model` events
   * for anything else the frontend may need.
   */
  private parseStreamEvent(eventData: string): StreamEvent | null {
    try {
      const parsed = JSON.parse(eventData);

      switch (parsed.type) {
        case 'response.output_text.delta':
          return {
            type: 'output_text_delta',
            delta: parsed.delta ?? '',
          };

        case 'response.completed':
        case 'response.done':
          return {
            type: 'response_done',
            response: {
              id: parsed.response?.id ?? '',
              usage: {
                inputTokens: parsed.response?.usage?.input_tokens ?? 0,
                outputTokens: parsed.response?.usage?.output_tokens ?? 0,
                totalTokens:
                  (parsed.response?.usage?.input_tokens ?? 0) +
                  (parsed.response?.usage?.output_tokens ?? 0),
              },
              output: parsed.response?.output ?? [],
            },
          };

        case 'response.created':
          return { type: 'response_started' };

        case 'response.output_item.added':
        case 'response.output_item.done':
        case 'response.function_call_arguments.delta':
        case 'response.function_call_arguments.done':
        case 'response.web_search_call.completed':
        case 'response.file_search_call.completed':
        case 'response.code_interpreter_call_code.delta':
        case 'response.code_interpreter_call_code.done':
        case 'response.code_interpreter_call.completed':
        case 'response.mcp_call_arguments.delta':
        case 'response.mcp_call_arguments.done':
          return { type: 'model', event: parsed };

        default:
          return { type: 'model', event: parsed };
      }
    } catch {
      return null;
    }
  }
}
