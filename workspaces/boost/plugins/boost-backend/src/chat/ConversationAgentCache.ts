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
 * Options for creating a ConversationAgentCache.
 *
 * @public
 */
export interface ConversationAgentCacheOptions {
  /** The Backstage cache service. */
  cache: CacheService;
  /** The Backstage logger service. */
  logger: LoggerService;
}

/**
 * Session-scoped cache that maps conversation IDs to the agent (provider)
 * ID that is handling the conversation. Uses Backstage cacheService with
 * namespace isolation per Decision 3 (design.md).
 *
 * @public
 */
export class ConversationAgentCache {
  private readonly cache: CacheService;
  private readonly logger: LoggerService;

  /** Cache TTL for conversation-agent mappings: 24 hours. */
  private static readonly TTL_MS = 24 * 60 * 60 * 1000;

  constructor(options: ConversationAgentCacheOptions) {
    this.cache = options.cache.withOptions({
      defaultTtl: ConversationAgentCache.TTL_MS,
    });
    this.logger = options.logger;
  }

  /**
   * Associates a conversation with a provider (agent) ID.
   *
   * @param conversationId - The conversation identifier.
   * @param providerId - The provider identifier handling this conversation.
   */
  async set(conversationId: string, providerId: string): Promise<void> {
    const key = `conversation-agent:${conversationId}`;
    await this.cache.set(key, providerId);
    this.logger.debug(
      `Mapped conversation ${conversationId} to provider ${providerId}`,
    );
  }

  /**
   * Retrieves the provider ID for a conversation.
   *
   * @param conversationId - The conversation identifier.
   * @returns The provider ID or undefined if not cached.
   */
  async get(conversationId: string): Promise<string | undefined> {
    const key = `conversation-agent:${conversationId}`;
    const value = await this.cache.get(key);
    return typeof value === 'string' ? value : undefined;
  }

  /**
   * Removes the conversation-agent mapping.
   *
   * @param conversationId - The conversation identifier.
   */
  async delete(conversationId: string): Promise<void> {
    const key = `conversation-agent:${conversationId}`;
    await this.cache.delete(key);
    this.logger.debug(
      `Removed conversation-agent mapping for ${conversationId}`,
    );
  }
}
