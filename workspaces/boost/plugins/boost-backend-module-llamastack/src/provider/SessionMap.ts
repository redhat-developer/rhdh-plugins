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
 * Options for creating a {@link SessionMap}.
 *
 * @internal
 */
export interface SessionMapOptions {
  cache: CacheService;
  logger: LoggerService;
}

/**
 * Session data tracked by the provider.
 *
 * @internal
 */
export interface SessionData {
  /** The Responses API response ID for multi-turn tracking. */
  responseId: string;
  /** The model used for this session. */
  model: string;
  /** ISO 8601 timestamp of session creation. */
  createdAt: string;
  /** ISO 8601 timestamp of last activity. */
  lastActivity: string;
}

/**
 * Maps conversation IDs to Llama Stack session data using Backstage cacheService.
 *
 * Enables multi-turn conversations by tracking the Responses API response ID
 * chain. Uses cacheService with a 24-hour session TTL (platform-ops task 1.5).
 * Redis-backed in production for multi-instance safety.
 *
 * @internal
 */
export class SessionMap {
  private static readonly KEY_PREFIX = 'llamastack:session:';
  static readonly TTL_MS = 24 * 3600 * 1000; // 24 hours

  private readonly cache: CacheService;
  private readonly logger: LoggerService;

  constructor(options: SessionMapOptions) {
    this.cache = options.cache;
    this.logger = options.logger;
  }

  /**
   * Retrieve session data for a conversation.
   *
   * @param conversationId - The boost conversation identifier.
   * @returns The session data, or undefined if no session exists.
   */
  async get(conversationId: string): Promise<SessionData | undefined> {
    const key = `${SessionMap.KEY_PREFIX}${conversationId}`;
    const cached = await this.cache.get(key);
    if (typeof cached === 'string') {
      return JSON.parse(cached) as SessionData;
    }
    return undefined;
  }

  /**
   * Store or update session data for a conversation.
   * Refreshes the TTL on each update.
   *
   * @param conversationId - The boost conversation identifier.
   * @param data - The session data to store.
   */
  async set(conversationId: string, data: SessionData): Promise<void> {
    const key = `${SessionMap.KEY_PREFIX}${conversationId}`;
    await this.cache.set(key, JSON.stringify(data), { ttl: SessionMap.TTL_MS });
    this.logger.debug(
      `Updated session for conversation "${conversationId}" (response: ${data.responseId})`,
    );
  }

  /**
   * Delete session data for a conversation.
   *
   * @param conversationId - The boost conversation identifier.
   */
  async delete(conversationId: string): Promise<void> {
    const key = `${SessionMap.KEY_PREFIX}${conversationId}`;
    await this.cache.delete(key);
    this.logger.debug(`Deleted session for conversation "${conversationId}"`);
  }
}
