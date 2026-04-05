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
import type { ConversationCapability } from '../types';
import type { ProcessedMessage } from '../responses-api/conversations/conversationTypes';
import type { KagentiApiClient } from './client/KagentiApiClient';
import type { ContextHistoryItem } from './client/types';

function convertHistoryToProcessedMessages(
  items: ContextHistoryItem[],
): ProcessedMessage[] {
  const messages: ProcessedMessage[] = [];
  for (const item of items) {
    if (item.kind === 'artifact') {
      const art = item.data as {
        parts?: Array<{ text?: string; [k: string]: unknown }>;
      };
      const textParts = (art.parts ?? [])
        .filter(p => typeof p.text === 'string')
        .map(p => p.text as string);
      const text = textParts.join('');
      if (text) {
        messages.push({
          role: 'assistant',
          text,
          createdAt: item.created_at,
        });
      }
      continue;
    }
    if (item.kind !== 'message') continue;
    const msg = item.data as {
      role?: string;
      parts?: Array<{ text?: string; [k: string]: unknown }>;
    };
    if (!msg.role || !msg.parts) continue;

    let role: 'user' | 'assistant' | 'system' = 'assistant';
    if (msg.role === 'user') role = 'user';
    else if (msg.role === 'system') role = 'system';

    const textParts = msg.parts
      .filter(p => typeof p.text === 'string')
      .map(p => p.text as string);
    const text = textParts.join('');
    if (!text) continue;

    messages.push({ role, text, createdAt: item.created_at });
  }
  return messages;
}

export function buildKagentiConversationCapability(
  getApiClient: () => KagentiApiClient,
  logger: LoggerService,
): ConversationCapability {
  const notSupported = (method: string) => () => {
    throw new Error(`${method} is not supported by the Kagenti provider`);
  };

  return {
    getProcessedMessages: async (
      contextId: string,
    ): Promise<ProcessedMessage[]> => {
      const apiClient = getApiClient();
      try {
        const allItems: ContextHistoryItem[] = [];
        let pageToken: string | undefined;
        do {
          const page = await apiClient.listContextHistory(contextId, {
            limit: 100,
            pageToken,
          });
          allItems.push(...page.items);
          pageToken =
            page.has_more && page.next_page_token
              ? page.next_page_token
              : undefined;
        } while (pageToken);

        return convertHistoryToProcessedMessages(allItems);
      } catch (err) {
        logger.warn(`Failed to fetch context history for ${contextId}: ${err}`);
        return [];
      }
    },
    submitApproval: notSupported(
      'submitApproval',
    ) as ConversationCapability['submitApproval'],
    create: notSupported('create') as ConversationCapability['create'],
    list: notSupported('list') as ConversationCapability['list'],
    get: notSupported('get') as ConversationCapability['get'],
    getInputs: notSupported('getInputs') as ConversationCapability['getInputs'],
    getByResponseChain: notSupported(
      'getByResponseChain',
    ) as ConversationCapability['getByResponseChain'],
    delete: notSupported('delete') as ConversationCapability['delete'],
  };
}
