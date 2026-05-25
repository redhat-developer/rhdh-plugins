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
import { toErrorMessage } from '../../../services/utils';
import {
  ResponsesApiError,
  type ResponsesApiClient,
} from '../client/ResponsesApiClient';
import {
  mapRawItemsToConversationItems,
  mapRawInputItemsToNormalized,
} from './ConversationHelpers';
import { getInputText, processConversationItems } from './MessageProcessor';
import type {
  ConversationDetails,
  ConversationSummary,
  InputItemsResult,
  ConversationItemsResult,
  ProcessedMessage,
} from './conversationTypes';
import { toConversationSummary } from './ConversationHelpers';
import type { ConversationRegistry } from './ConversationRegistry';

function extractItemsArray(
  response: unknown,
  logger: LoggerService,
): Array<Record<string, unknown>> {
  if (Array.isArray(response)) {
    logger.debug('Conversation items returned as bare array — wrapping');
    return response as Array<Record<string, unknown>>;
  }
  if (response && typeof response === 'object') {
    const obj = response as Record<string, unknown>;
    if (Array.isArray(obj.data))
      return obj.data as Array<Record<string, unknown>>;
    if (Array.isArray(obj.items)) {
      logger.debug(
        'Conversation items returned under "items" key instead of "data"',
      );
      return obj.items as Array<Record<string, unknown>>;
    }
  }
  logger.warn(
    `Unexpected conversation items response shape: ${typeof response}`,
  );
  return [];
}

export async function fetchConversation(
  client: ResponsesApiClient,
  responseId: string,
  logger: LoggerService,
): Promise<ConversationDetails | null> {
  logger.debug(`Getting conversation ${responseId}`);

  try {
    const response = await client.request<{
      id: string;
      model: string;
      status: string;
      created_at: number;
      input: unknown;
      output: Array<{
        type: string;
        id?: string;
        role?: string;
        content?: Array<{ type: string; text: string }>;
      }>;
      previous_response_id?: string;
    }>(`/v1/responses/${responseId}`, { method: 'GET' });

    logger.info(
      `Got conversation ${responseId}, input type: ${typeof response.input}, isArray: ${Array.isArray(
        response.input,
      )}, input length: ${
        Array.isArray(response.input) ? response.input.length : 'n/a'
      }, output items: ${response.output?.length || 0}`,
    );

    return {
      id: response.id,
      model: response.model,
      status: response.status,
      createdAt: new Date(response.created_at * 1000),
      input: response.input,
      output: response.output || [],
      previousResponseId: response.previous_response_id,
    };
  } catch (error) {
    const errorMsg = toErrorMessage(error);
    if (errorMsg.includes('400') || errorMsg.includes('Bad Request')) {
      logger.warn(
        `Llama Stack schema validation error for ${responseId} - response may contain MCP tool calls that can't be serialized`,
      );
    } else {
      logger.warn(`Failed to get conversation ${responseId}: ${errorMsg}`);
    }
    return null;
  }
}

export async function fetchConversationInputs(
  client: ResponsesApiClient,
  responseId: string,
  logger: LoggerService,
): Promise<InputItemsResult> {
  logger.debug(`Getting input items for response ${responseId}`);

  try {
    const response = await client.request<{
      data: Array<{
        type: string;
        id?: string;
        role?: string;
        content?: unknown;
        status?: string;
        call_id?: string;
        output?: string;
      }>;
      has_more: boolean;
    }>(`/v1/responses/${responseId}/input_items`, { method: 'GET' });

    const normalizedItems = mapRawInputItemsToNormalized(
      (response.data || []) as Array<Record<string, unknown>>,
    );

    logger.info(
      `Got ${normalizedItems.length} input items for response ${responseId}`,
    );

    return {
      items: normalizedItems,
      hasMore: response.has_more || false,
    };
  } catch (error) {
    const errorMsg = toErrorMessage(error);
    if (errorMsg.includes('400') || errorMsg.includes('Bad Request')) {
      logger.warn(
        `Llama Stack schema validation error for input_items ${responseId} - conversation may contain MCP tool calls`,
      );
    } else {
      logger.warn(
        `Failed to get conversation inputs for ${responseId}: ${errorMsg}`,
      );
    }
    return { items: [], hasMore: false };
  }
}

export async function fetchConversationItems(
  client: ResponsesApiClient,
  conversationId: string,
  logger: LoggerService,
): Promise<ConversationItemsResult> {
  logger.info(`Getting items for conversation ${conversationId}`);

  try {
    const response = await client.request<unknown>(
      `/v1/conversations/${conversationId}/items?order=asc`,
      { method: 'GET' },
    );

    const rawItems = extractItemsArray(response, logger);
    const items = mapRawItemsToConversationItems(rawItems);

    logger.info(`Got ${items.length} items for conversation ${conversationId}`);
    return { items };
  } catch (error) {
    if (error instanceof ResponsesApiError && error.statusCode === 404) {
      logger.warn(
        `Conversation ${conversationId} not found (404) — may have been garbage-collected`,
      );
      return { items: [] };
    }
    const errorMsg = toErrorMessage(error);
    logger.warn(
      `Failed to get conversation items for ${conversationId}: ${errorMsg}`,
    );
    throw error;
  }
}

export async function fetchProcessedMessages(
  client: ResponsesApiClient,
  conversationId: string,
  logger: LoggerService,
): Promise<ProcessedMessage[]> {
  logger.info(`Getting processed messages for conversation ${conversationId}`);

  const { items } = await fetchConversationItems(
    client,
    conversationId,
    logger,
  );
  const messages = processConversationItems(items, logger);

  logger.info(
    `Processed ${messages.length} messages for conversation ${conversationId}`,
  );
  return messages;
}

export async function enrichResponsesWithConversations(
  items: Array<{
    id: string;
    model: string;
    status: string;
    created_at: number;
    input: Array<{
      type: string;
      content?: string | Array<{ type: string; text?: string }>;
      role?: string;
    }>;
    previous_response_id?: string;
    conversation?: string;
  }>,
  registry: ConversationRegistry,
): Promise<ConversationSummary[]> {
  const conversations: ConversationSummary[] = [];

  for (const r of items) {
    if (!r.id) continue;
    const preview = getInputText(r.input) || 'Conversation';
    const registryConvId = await registry.getConversationForResponse(r.id);
    const summary = toConversationSummary(
      r,
      preview,
      r.conversation || registryConvId,
    );
    if (summary) conversations.push(summary);
  }

  return conversations;
}

export async function deleteConversation(
  client: ResponsesApiClient,
  responseId: string,
  conversationId: string | undefined,
  logger: LoggerService,
): Promise<boolean> {
  try {
    await client.request(`/v1/responses/${responseId}`, { method: 'DELETE' });
    logger.info(`Deleted response ${responseId}`);
  } catch (error) {
    logger.warn(
      `Failed to delete response ${responseId}: ${toErrorMessage(error)}`,
    );
    return false;
  }

  if (conversationId) {
    try {
      await client.request(`/v1/conversations/${conversationId}`, {
        method: 'DELETE',
      });
      logger.info(`Deleted conversation container ${conversationId}`);
    } catch (error) {
      logger.warn(
        `Failed to delete conversation container ${conversationId} (non-fatal): ${toErrorMessage(error)}`,
      );
    }
  }

  return true;
}

export async function createConversation(
  client: ResponsesApiClient,
  logger: LoggerService,
): Promise<string> {
  logger.info('Creating new Llama Stack conversation');
  try {
    const response = await client.request<{ id: string }>('/v1/conversations', {
      method: 'POST',
      body: JSON.stringify({}),
    });
    logger.info(`Created conversation: ${response.id}`);
    return response.id;
  } catch (error) {
    const errorMsg = toErrorMessage(error);
    logger.error(`Failed to create conversation: ${errorMsg}`);
    throw error;
  }
}
