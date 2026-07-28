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

import type { ToolCall } from '../types';

/**
 * Caps how many conversation/message-index entries we retain. Oldest touched
 * entries are evicted first (approximate LRU via insertion order in keyOrder).
 */
const MAX_TOOL_CALLS_CACHE_KEYS = 256;

const sharedToolCallsCache: Record<string, ToolCall[]> = {};
const keyOrder: string[] = [];

function removeKeyFromOrder(key: string) {
  const i = keyOrder.indexOf(key);
  if (i >= 0) {
    keyOrder.splice(i, 1);
  }
}

function touchCacheKey(key: string) {
  removeKeyFromOrder(key);
  keyOrder.push(key);
  while (keyOrder.length > MAX_TOOL_CALLS_CACHE_KEYS) {
    const oldest = keyOrder.shift();
    if (oldest) {
      delete sharedToolCallsCache[oldest];
    }
  }
}

export function getSharedToolCallsCache(key: string): ToolCall[] | undefined {
  const v = sharedToolCallsCache[key];
  return v?.length ? v : undefined;
}

export function setSharedToolCallsCache(key: string, toolCalls: ToolCall[]) {
  sharedToolCallsCache[key] = toolCalls;
  touchCacheKey(key);
}

/**
 * Drop all cached tool rows for a conversation (e.g. after server delete).
 */
export function clearSharedToolCallsCacheForConversation(
  conversationId: string,
) {
  const prefix = `${conversationId}-`;
  for (const key of [...Object.keys(sharedToolCallsCache)]) {
    if (key.startsWith(prefix)) {
      delete sharedToolCallsCache[key];
      removeKeyFromOrder(key);
    }
  }
}

/**
 * Moves tool-call cache entries from a per-stream session prefix (used while
 * conversation id is still temp) to the persisted conversation id. Only keys
 * for this prefix are migrated so a late stream cannot clobber another temp
 * session.
 */
export function migrateSharedToolCallsCacheSessionPrefixToConversation(
  sessionPrefix: string,
  newConversationId: string,
) {
  const keyPrefix = `${sessionPrefix}-`;
  for (const key of [...Object.keys(sharedToolCallsCache)]) {
    if (key.startsWith(keyPrefix)) {
      const messageIndex = key.slice(keyPrefix.length);
      const newKey = `${newConversationId}-${messageIndex}`;
      sharedToolCallsCache[newKey] = sharedToolCallsCache[key];
      delete sharedToolCallsCache[key];
      removeKeyFromOrder(key);
      touchCacheKey(newKey);
    }
  }
}

/** Removes cache entries written under a per-temp-stream session prefix. */
export function clearSharedToolCallsCacheSessionPrefix(sessionPrefix: string) {
  const keyPrefix = `${sessionPrefix}-`;
  for (const key of [...Object.keys(sharedToolCallsCache)]) {
    if (key.startsWith(keyPrefix)) {
      delete sharedToolCallsCache[key];
      removeKeyFromOrder(key);
    }
  }
}

/** Clears the store; only used from unit tests. */
export function resetSharedToolCallsCacheStoreForTests() {
  for (const key of Object.keys(sharedToolCallsCache)) {
    delete sharedToolCallsCache[key];
  }
  keyOrder.length = 0;
}
