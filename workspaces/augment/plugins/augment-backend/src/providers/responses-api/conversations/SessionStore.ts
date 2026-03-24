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
import type { ResponsesApiInputItem } from '../../../types';

/**
 * Conversation item stored on the Llama Stack server.
 */
export interface ConversationItem {
  id: string;
  type: string;
  role?: string;
  content?: unknown;
  [key: string]: unknown;
}

/**
 * Session memory manager wrapping the Llama Stack Conversations API.
 *
 * Provides:
 * - Session creation and lookup via `POST /v1/conversations`
 * - Item retrieval via `GET /v1/conversations/{id}/items`
 * - History compaction via `POST /v1/conversations/{id}/items` (inserting summary items)
 * - Item count tracking for automatic compaction triggers
 *
 * Matches the OpenAI Agents SDK `RunState.session` pattern:
 * the SDK maintains session history and supports compaction to avoid
 * unbounded context growth. This implementation leverages Llama Stack's
 * server-side persistence instead of maintaining client-side state.
 */
export class SessionStore {
  private readonly compactionThreshold: number;

  constructor(
    private readonly logger: LoggerService,
    options?: { compactionThreshold?: number },
  ) {
    this.compactionThreshold = options?.compactionThreshold ?? 50;
  }

  async createSession(client: ResponsesApiClient): Promise<string> {
    const response = await client.requestWithRetry<{ id: string }>(
      '/v1/conversations',
      { method: 'POST', body: JSON.stringify({}) },
    );
    this.logger.info(`[SessionStore] Created session: ${response.id}`);
    return response.id;
  }

  async getItems(
    client: ResponsesApiClient,
    conversationId: string,
  ): Promise<ConversationItem[]> {
    const response = await client.requestWithRetry<
      { data: ConversationItem[] } | ConversationItem[]
    >(`/v1/conversations/${encodeURIComponent(conversationId)}/items`, {
      method: 'GET',
    });
    return Array.isArray(response) ? response : (response.data ?? []);
  }

  /**
   * Insert a summary item into the conversation to compact history.
   * Older items remain on the server but the summary provides a condensed
   * view for the model's context window.
   */
  async insertCompactionSummary(
    client: ResponsesApiClient,
    conversationId: string,
    summaryText: string,
  ): Promise<void> {
    const item: ResponsesApiInputItem = {
      type: 'message',
      role: 'system',
      content: `[Session Summary] ${summaryText}`,
    };

    await client.requestWithRetry(
      `/v1/conversations/${encodeURIComponent(conversationId)}/items`,
      { method: 'POST', body: JSON.stringify(item) },
    );

    this.logger.info(
      `[SessionStore] Inserted compaction summary into conversation ${conversationId}`,
    );
  }

  /**
   * Check if a conversation needs compaction based on item count.
   */
  async shouldCompact(
    client: ResponsesApiClient,
    conversationId: string,
  ): Promise<boolean> {
    const items = await this.getItems(client, conversationId);
    return items.length >= this.compactionThreshold;
  }

  /**
   * Get the count of items in a conversation.
   */
  async getItemCount(
    client: ResponsesApiClient,
    conversationId: string,
  ): Promise<number> {
    const items = await this.getItems(client, conversationId);
    return items.length;
  }
}
