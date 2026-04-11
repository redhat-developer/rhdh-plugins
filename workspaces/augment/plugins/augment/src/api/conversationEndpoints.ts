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

import type { DiscoveryApi, FetchApi } from '@backstage/core-plugin-api';
import { jsonBody } from './fetchHelpers';

export interface ConversationApiDeps {
  fetchJson: <T>(path: string, init?: RequestInit) => Promise<T>;
  fetchJsonSafe: <T>(
    path: string,
    fallback: T,
    init?: RequestInit,
  ) => Promise<T>;
  discoveryApi: DiscoveryApi;
  fetchApi: FetchApi;
}

/**
 * Create a new conversation container.
 */
export async function createConversation(
  deps: ConversationApiDeps,
): Promise<{ conversationId: string }> {
  const data = await deps.fetchJson<{ conversationId: string }>(
    '/conversations/create',
    jsonBody({}),
  );
  return { conversationId: data.conversationId };
}
