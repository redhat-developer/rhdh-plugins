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
import type { AgentCard } from '../types';

/**
 * Options for creating an {@link AgentCardCache}.
 *
 * @internal
 */
export interface AgentCardCacheOptions {
  cache: CacheService;
  logger: LoggerService;
}

const CACHE_KEY = 'kagenti:agent-cards';

/**
 * Caches A2A agent cards from the Kagenti gateway.
 *
 * Uses Backstage cacheService with a 5-minute TTL per the design spec
 * (Decision 3, task 3.3). Cache invalidation occurs on agent
 * create/update/delete operations. Redis-backed in production for
 * multi-instance safety.
 *
 * @internal
 */
export class AgentCardCache {
  private readonly cache: CacheService;
  private readonly logger: LoggerService;

  constructor(options: AgentCardCacheOptions) {
    this.cache = options.cache.withOptions({
      defaultTtl: { minutes: 5 },
    });
    this.logger = options.logger;
  }

  /**
   * Retrieve the cached agent cards.
   *
   * @returns The cached agent cards, or undefined if not cached.
   */
  async get(): Promise<AgentCard[] | undefined> {
    const cached = await this.cache.get(CACHE_KEY);
    if (cached === undefined || cached === null) {
      return undefined;
    }
    if (Array.isArray(cached)) {
      this.logger.debug(`Agent card cache hit (${cached.length} cards)`);
      return cached as AgentCard[];
    }
    if (typeof cached === 'string') {
      try {
        const cards = JSON.parse(cached) as AgentCard[];
        this.logger.debug(`Agent card cache hit (${cards.length} cards)`);
        return cards;
      } catch {
        this.logger.warn('Corrupted agent card cache entry, deleting');
        await this.cache.delete(CACHE_KEY);
        return undefined;
      }
    }
    return undefined;
  }

  /**
   * Store agent cards in the cache.
   *
   * @param cards - The agent cards to cache.
   */
  async set(cards: AgentCard[]): Promise<void> {
    await this.cache.set(CACHE_KEY, JSON.stringify(cards));
    this.logger.debug(`Cached ${cards.length} agent cards`);
  }

  /**
   * Invalidate the cached agent cards.
   * Called on agent create/update/delete operations.
   */
  async invalidate(): Promise<void> {
    await this.cache.delete(CACHE_KEY);
    this.logger.debug('Agent card cache invalidated');
  }
}
