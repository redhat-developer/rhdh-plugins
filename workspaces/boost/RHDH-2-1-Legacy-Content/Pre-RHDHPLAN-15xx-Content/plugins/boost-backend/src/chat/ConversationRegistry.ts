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
  CacheService,
  LoggerService,
} from '@backstage/backend-plugin-api';

/**
 * Options for creating a ConversationRegistry.
 *
 * @public
 */
export interface ConversationRegistryOptions {
  /** The Backstage cache service. */
  cache: CacheService;
  /** The Backstage logger service. */
  logger: LoggerService;
}

/**
 * Cache-backed registry that maps response IDs to conversation IDs.
 * Uses Backstage cacheService with a 24h TTL per the cache-migration spec (task 1.3).
 *
 * @public
 */
export class ConversationRegistry {
  private readonly cache: CacheService;
  private readonly logger: LoggerService;

  /** Cache TTL for response-to-conversation mappings: 24 hours. */
  private static readonly TTL_MS = 24 * 60 * 60 * 1000;

  constructor(options: ConversationRegistryOptions) {
    this.cache = options.cache.withOptions({
      defaultTtl: ConversationRegistry.TTL_MS,
    });
    this.logger = options.logger;
  }

  /**
   * Associates a response ID with a conversation ID.
   *
   * @param responseId - The response identifier from the provider.
   * @param conversationId - The conversation identifier.
   */
  async set(responseId: string, conversationId: string): Promise<void> {
    const key = `conversation-registry:${responseId}`;
    await this.cache.set(key, conversationId);
    this.logger.debug(
      `Mapped response ${responseId} to conversation ${conversationId}`,
    );
  }

  /**
   * Retrieves the conversation ID for a response.
   *
   * @param responseId - The response identifier.
   * @returns The conversation ID or undefined if not cached.
   */
  async get(responseId: string): Promise<string | undefined> {
    const key = `conversation-registry:${responseId}`;
    const value = await this.cache.get(key);
    return typeof value === 'string' ? value : undefined;
  }

  /**
   * Removes a response-to-conversation mapping.
   *
   * @param responseId - The response identifier.
   */
  async delete(responseId: string): Promise<void> {
    const key = `conversation-registry:${responseId}`;
    await this.cache.delete(key);
    this.logger.debug(
      `Removed conversation-registry mapping for response ${responseId}`,
    );
  }
}
