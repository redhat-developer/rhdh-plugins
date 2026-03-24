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
import type {
  Model,
  ModelTurnOptions,
  EffectiveConfig,
  ResponsesApiInputItem,
  ResponsesApiResponse,
  ResponsesApiTool,
} from '@augment-adk/augment-adk';
import type { ResponsesApiService } from '../../responses-api/chat/ResponsesApiService';
import type { ResponsesApiClient } from '../../responses-api/client/ResponsesApiClient';
import type {
  EffectiveConfig as PluginEffectiveConfig,
  ResponsesApiInputItem as PluginInputItem,
  ResponsesApiTool as PluginTool,
  ResponsesApiResponse as PluginResponse,
} from '../../../types';

/*
 * Type bridge helpers.
 *
 * ADK and plugin declare structurally identical types for InputItem,
 * Tool, and Response (the plugin adds a few optional fields like
 * `image_generation` tools and `metadata` on responses). Because
 * they originate from separate packages TypeScript treats them as
 * nominally distinct, requiring explicit casts at the adapter boundary.
 *
 * These helpers centralise the casts so the main code stays readable
 * and any structural divergence surfaces in exactly one place.
 */
function toPluginConfig(c: EffectiveConfig): PluginEffectiveConfig {
  return c as unknown as PluginEffectiveConfig;
}

function toPluginInput(
  i: string | ResponsesApiInputItem[],
): string | PluginInputItem[] {
  return i as string | PluginInputItem[];
}

function toPluginTools(t: ResponsesApiTool[]): PluginTool[] {
  return t as unknown as PluginTool[];
}

function toAdkResponse(r: PluginResponse): ResponsesApiResponse {
  return r as unknown as ResponsesApiResponse;
}

/**
 * Adapts the plugin's ResponsesApiService + Client pair to
 * the ADK's framework-agnostic `Model` interface.
 *
 * The ADK calls `chatTurn()` / `chatTurnStream()` on this adapter;
 * the adapter delegates to the existing Backstage-level service
 * which handles request building, retries, and SSE parsing.
 */
export class BackstageModelAdapter implements Model {
  constructor(
    private readonly chatService: ResponsesApiService,
    private readonly client: ResponsesApiClient,
  ) {}

  async chatTurn(
    input: string | ResponsesApiInputItem[],
    instructions: string,
    tools: ResponsesApiTool[],
    config: EffectiveConfig,
    options?: ModelTurnOptions,
  ): Promise<ResponsesApiResponse> {
    const result = await this.chatService.chatTurn(
      toPluginInput(input),
      instructions,
      toPluginTools(tools),
      toPluginConfig(config),
      this.client,
      options
        ? {
            previousResponseId: options.previousResponseId,
            conversationId: options.conversationId,
            store: options.store,
          }
        : undefined,
    );
    return toAdkResponse(result);
  }

  async chatTurnStream(
    input: string | ResponsesApiInputItem[],
    instructions: string,
    tools: ResponsesApiTool[],
    config: EffectiveConfig,
    onEvent: (eventData: string) => void,
    options?: ModelTurnOptions,
    signal?: AbortSignal,
  ): Promise<void> {
    await this.chatService.chatTurnStream(
      toPluginInput(input),
      instructions,
      toPluginTools(tools),
      toPluginConfig(config),
      this.client,
      onEvent,
      options
        ? {
            previousResponseId: options.previousResponseId,
            conversationId: options.conversationId,
            store: options.store,
          }
        : undefined,
      signal,
    );
  }

  async testConnection(): Promise<{ connected: boolean; error?: string }> {
    try {
      await this.client.requestWithRetry('/v1/models', { method: 'GET' });
      return { connected: true };
    } catch (error) {
      return {
        connected: false,
        error: error instanceof Error ? error.message : String(error),
      };
    }
  }
}
