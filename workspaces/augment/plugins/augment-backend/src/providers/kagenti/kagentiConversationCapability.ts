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

/**
 * The Kagenti API does not expose a conversation history endpoint
 * (there is no GET /api/v1/contexts/{id}/history in the OpenAPI spec).
 * Conversation history is served from the local `augment_session_messages`
 * table by `sessionRoutes.ts`. This capability returns an empty array
 * for `getProcessedMessages` as a safe no-op fallback.
 */
export function buildKagentiConversationCapability(
  _getApiClient: () => KagentiApiClient,
  logger: LoggerService,
): ConversationCapability {
  const notSupported = (method: string) => () => {
    throw new Error(`${method} is not supported by the Kagenti provider`);
  };

  return {
    getProcessedMessages: async (
      contextId: string,
    ): Promise<ProcessedMessage[]> => {
      logger.info(
        `Kagenti getProcessedMessages called for context ${contextId} — ` +
          `the Kagenti API has no history endpoint; history is served from the local message store`,
      );
      return [];
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
