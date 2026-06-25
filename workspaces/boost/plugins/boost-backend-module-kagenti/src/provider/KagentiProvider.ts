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
  KagentiConnectionConfig,
  A2ATaskRequest,
  A2ATaskResponse,
  A2AStreamEvent,
  A2AMessagePart,
} from '../types';

/**
 * Options for creating a {@link KagentiProvider}.
 *
 * @internal
 */
export interface KagentiProviderOptions {
  connection: KagentiConnectionConfig;
  logger: LoggerService;
}

/**
 * AI provider that delegates to Kagenti agents via the A2A protocol.
 *
 * Implements the {@link AgenticProvider} interface, translating boost
 * conversation inputs into A2A task requests and normalizing the
 * output into {@link NormalizedStreamEvent} for the boost streaming contract.
 *
 * @internal
 */
export class KagentiProvider implements AgenticProvider {
  readonly descriptor: ProviderDescriptor = {
    id: 'kagenti',
    name: 'Kagenti',
    description:
      'Kagenti provider using the A2A protocol for multi-agent orchestration',
    capabilities: {
      agentCatalog: true,
      namespaceScoping: true,
      devSpaces: false,
      buildPipelines: false,
    },
  };

  private readonly connection: KagentiConnectionConfig;
  private readonly logger: LoggerService;

  constructor(options: KagentiProviderOptions) {
    this.connection = options.connection;
    this.logger = options.logger;
  }

  /**
   * Send a chat message and receive a complete response via the A2A protocol.
   */
  async chat(messages: InputItem[]): Promise<string> {
    const request = this.buildTaskRequest(messages);

    if (request.message.parts.length === 0) {
      throw new Error('No text input items provided');
    }

    const url = `${this.connection.baseUrl}/a2a/tasks`;

    this.logger.debug(
      `Sending A2A task request to ${url} (agent: ${request.agentId})`,
    );

    let response: Response;
    try {
      response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(request),
      });
    } catch (err) {
      this.logger.error(
        `Fetch failed for request to ${url}`,
        err instanceof Error ? err : undefined,
      );
      throw new Error('Failed to connect to Kagenti endpoint');
    }

    if (!response.ok) {
      const errorText = await response.text();
      this.logger.error(
        `A2A task error: ${response.status} ${response.statusText} — ${errorText}`,
      );
      throw new Error(`Kagenti A2A API returned ${response.status}`);
    }

    const result = (await response.json()) as A2ATaskResponse;

    if (result.status?.state === 'failed') {
      throw new Error(result.status.message ?? 'A2A task failed');
    }
    if (result.status?.state === 'canceled') {
      throw new Error(result.status.message ?? 'A2A task canceled');
    }

    return this.extractTextFromResponse(result);
  }

  /**
   * Send a chat message and receive a streaming response via the A2A protocol.
   * Yields normalized stream events for the boost streaming contract.
   */
  async *chatStream(
    messages: InputItem[],
  ): AsyncIterable<NormalizedStreamEvent> {
    const request = this.buildTaskRequest(messages);

    if (request.message.parts.length === 0) {
      yield { type: 'error', message: 'No text input items provided' };
      return;
    }

    const url = `${this.connection.baseUrl}/a2a/tasks/stream`;

    this.logger.debug(
      `Sending A2A streaming task request to ${url} (agent: ${request.agentId})`,
    );

    let response: Response;
    try {
      response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(request),
      });
    } catch (err) {
      this.logger.error(
        `Fetch failed for streaming request to ${url}`,
        err instanceof Error ? err : undefined,
      );
      yield {
        type: 'error',
        message: 'Failed to connect to Kagenti endpoint',
      };
      return;
    }

    if (!response.ok) {
      const errorText = await response.text();
      this.logger.error(
        `A2A streaming error: ${response.status} ${response.statusText} — ${errorText}`,
      );
      yield {
        type: 'error',
        message: `Kagenti A2A API returned ${response.status}`,
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
   * Build an A2A task request from boost InputItems.
   */
  private buildTaskRequest(messages: InputItem[]): A2ATaskRequest {
    const skipped = messages.filter(m => m.type !== 'text');
    if (skipped.length > 0) {
      this.logger.debug(
        `Skipping ${skipped.length} non-text input item(s) (types: ${[...new Set(skipped.map(m => m.type))].join(', ')})`,
      );
    }

    const parts: A2AMessagePart[] = messages
      .filter(
        (m): m is Extract<InputItem, { type: 'text' }> => m.type === 'text',
      )
      .map(m => ({
        type: 'text' as const,
        text: m.text,
      }));

    return {
      id: `task-${Date.now()}`,
      agentId: this.connection.defaultAgent ?? 'default',
      message: {
        role: 'user',
        parts,
      },
    };
  }

  /**
   * Extract plain text from an A2A task response.
   */
  private extractTextFromResponse(result: A2ATaskResponse): string {
    if (!result.message?.parts) {
      return '';
    }
    return result.message.parts
      .filter(p => p.type === 'text')
      .map(p => p.text)
      .join('');
  }

  /**
   * Process a Server-Sent Events stream from the A2A endpoint
   * and yield normalized stream events.
   */
  private async *processStream(
    body: ReadableStream<Uint8Array>,
  ): AsyncIterable<NormalizedStreamEvent> {
    const decoder = new TextDecoder();
    const reader = body.getReader();
    let buffer = '';

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
              const event = JSON.parse(data) as A2AStreamEvent;
              for (const normalized of this.normalizeStreamEvent(event)) {
                yield normalized;
                if (normalized.type === 'done') {
                  return;
                }
              }
            } catch {
              this.logger.warn(`Failed to parse SSE data: ${data}`);
            }
          }
        }
      }

      buffer += decoder.decode();
      if (buffer.trim()) {
        const remaining = buffer.trim();
        if (remaining.startsWith('data: ')) {
          const data = remaining.slice(6);
          if (data === '[DONE]') {
            yield { type: 'done' };
            return;
          }
          try {
            const event = JSON.parse(data) as A2AStreamEvent;
            for (const normalized of this.normalizeStreamEvent(event)) {
              yield normalized;
              if (normalized.type === 'done') {
                return;
              }
            }
          } catch {
            this.logger.warn(`Failed to parse SSE data: ${data}`);
          }
        }
      }

      yield { type: 'done' };
    } finally {
      reader.releaseLock();
    }
  }

  /**
   * Normalize an A2A stream event into boost NormalizedStreamEvents.
   */
  private *normalizeStreamEvent(
    event: A2AStreamEvent,
  ): Iterable<NormalizedStreamEvent> {
    switch (event.type) {
      case 'task.text.delta':
        if (event.delta) {
          yield { type: 'text', text: event.delta };
        }
        break;

      case 'task.status.update':
        if (event.status?.state === 'completed') {
          if (event.message?.parts) {
            for (const part of event.message.parts) {
              if (part.type === 'text' && part.text) {
                yield { type: 'text', text: part.text };
              }
            }
          }
          yield { type: 'done' };
        } else if (event.status?.state === 'failed') {
          yield {
            type: 'error',
            message: event.status.message ?? 'A2A task failed',
          };
          yield { type: 'done' };
        } else if (event.status?.state === 'canceled') {
          yield {
            type: 'error',
            message: event.status.message ?? 'A2A task canceled',
          };
          yield { type: 'done' };
        }
        break;

      default:
        this.logger.debug(`Unhandled A2A event type: ${event.type}`);
        break;
    }
  }
}
