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
  AgenticProvider,
  InputItem,
  NormalizedStreamEvent,
  ProviderDescriptor,
} from '@red-hat-developer-hub/backstage-plugin-boost-common';
import type {
  LlamaStackConnectionConfig,
  ResponsesApiInputItem,
  ResponsesApiRequest,
  ResponsesApiResponse,
  ResponsesApiStreamEvent,
} from '../types';

/**
 * Options for creating a {@link ResponsesApiProvider}.
 *
 * @internal
 */
export interface ResponsesApiProviderOptions {
  connection: LlamaStackConnectionConfig;
  logger: LoggerService;
}

/**
 * AI provider that delegates to a Llama Stack endpoint via the Responses API.
 *
 * Implements the {@link AgenticProvider} interface, translating boost
 * conversation inputs into Responses API calls and normalizing the
 * output into {@link NormalizedStreamEvent} for the boost streaming contract.
 *
 * @internal
 */
export class ResponsesApiProvider implements AgenticProvider {
  readonly descriptor: ProviderDescriptor = {
    id: 'llamastack',
    name: 'Llama Stack',
    description:
      'Llama Stack provider using the Responses API for agent orchestration',
    capabilities: {
      agentCatalog: true,
      namespaceScoping: false,
      devSpaces: false,
      buildPipelines: false,
    },
  };

  private readonly connection: LlamaStackConnectionConfig;
  private readonly logger: LoggerService;

  constructor(options: ResponsesApiProviderOptions) {
    this.connection = options.connection;
    this.logger = options.logger;
  }

  /**
   * Send a chat message and receive a complete response via the Responses API.
   */
  async chat(messages: InputItem[]): Promise<string> {
    const body = this.buildRequestBody(messages, false);
    const url = `${this.connection.baseUrl}/v1/responses`;

    this.logger.debug(
      `Sending non-streaming request to ${url} (model: ${body.model})`,
    );

    const response = await fetch(url, {
      method: 'POST',
      headers: this.buildHeaders(),
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const errorText = await response.text();
      this.logger.error(
        `Responses API error: ${response.status} ${response.statusText} — ${errorText}`,
      );
      throw new Error(
        `Llama Stack Responses API returned ${response.status}: ${errorText}`,
      );
    }

    const result = (await response.json()) as ResponsesApiResponse;
    return this.extractTextFromResponse(result);
  }

  /**
   * Send a chat message and receive a streaming response via the Responses API.
   * Yields normalized stream events for the boost streaming contract.
   */
  async *chatStream(
    messages: InputItem[],
  ): AsyncIterable<NormalizedStreamEvent> {
    const body = this.buildRequestBody(messages, true);
    const url = `${this.connection.baseUrl}/v1/responses`;

    this.logger.debug(
      `Sending streaming request to ${url} (model: ${body.model})`,
    );

    const response = await fetch(url, {
      method: 'POST',
      headers: this.buildHeaders(),
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const errorText = await response.text();
      this.logger.error(
        `Responses API streaming error: ${response.status} ${response.statusText} — ${errorText}`,
      );
      yield {
        type: 'error',
        message: `Llama Stack Responses API returned ${response.status}: ${errorText}`,
      };
      return;
    }

    if (!response.body) {
      yield { type: 'error', message: 'Response body is empty' };
      return;
    }

    yield* this.processStream(response.body);
  }

  /**
   * Build the request headers including optional API key.
   */
  private buildHeaders(): Record<string, string> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };
    if (this.connection.apiKey) {
      headers.Authorization = `Bearer ${this.connection.apiKey}`;
    }
    return headers;
  }

  /**
   * Build a Responses API request body from boost InputItems.
   */
  private buildRequestBody(
    messages: InputItem[],
    stream: boolean,
  ): ResponsesApiRequest {
    const input: ResponsesApiInputItem[] = messages
      .filter(
        (m): m is Extract<InputItem, { type: 'text' }> => m.type === 'text',
      )
      .map(m => ({
        role: 'user' as const,
        content: m.text,
      }));

    return {
      model: this.connection.defaultModel ?? 'meta-llama/Llama-3.1-8B-Instruct',
      input,
      stream,
    };
  }

  /**
   * Extract plain text from a non-streaming Responses API response.
   */
  private extractTextFromResponse(result: ResponsesApiResponse): string {
    const parts: string[] = [];
    for (const output of result.output) {
      if (output.type === 'message' && output.content) {
        for (const part of output.content) {
          if (part.type === 'output_text') {
            parts.push(part.text);
          }
        }
      }
    }
    return parts.join('');
  }

  /**
   * Process a Server-Sent Events stream from the Responses API
   * and yield normalized stream events.
   */
  private async *processStream(
    body: ReadableStream<Uint8Array>,
  ): AsyncIterable<NormalizedStreamEvent> {
    const decoder = new TextDecoder();
    const reader = body.getReader();
    let buffer = '';
    let completed = false;

    try {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() ?? '';

        for (const line of lines) {
          const trimmed = line.trim();
          if (!trimmed || trimmed.startsWith(':')) continue;

          if (trimmed.startsWith('data: ')) {
            const data = trimmed.slice(6);
            if (data === '[DONE]') {
              yield { type: 'done' };
              return;
            }

            try {
              const event = JSON.parse(data) as ResponsesApiStreamEvent;
              for (const normalized of this.normalizeStreamEvent(event)) {
                yield normalized;
                if (normalized.type === 'done') {
                  completed = true;
                }
              }
            } catch {
              this.logger.warn(`Failed to parse SSE data: ${data}`);
            }
          }
        }
      }

      if (!completed) {
        yield { type: 'done' };
      }
    } finally {
      reader.releaseLock();
    }
  }

  /**
   * Normalize a Responses API stream event into boost NormalizedStreamEvents.
   */
  private *normalizeStreamEvent(
    event: ResponsesApiStreamEvent,
  ): Iterable<NormalizedStreamEvent> {
    switch (event.type) {
      case 'response.output_text.delta':
        if (event.delta) {
          yield { type: 'text', text: event.delta };
        }
        break;

      case 'response.mcp_call.in_progress':
        if (event.item?.id && event.item?.server_label) {
          yield {
            type: 'tool_call',
            toolCallId: event.item.id,
            toolName: event.item.server_label,
            args: '{}',
          };
        }
        break;

      case 'response.mcp_call.completed':
        if (event.item?.id) {
          const resultText =
            event.item.content?.map(p => p.text).join('') ?? '';
          yield {
            type: 'tool_result',
            toolCallId: event.item.id,
            content: resultText,
          };
        }
        break;

      case 'response.completed':
        yield { type: 'done' };
        break;

      default:
        this.logger.debug(`Unhandled Responses API event type: ${event.type}`);
        break;
    }
  }
}
