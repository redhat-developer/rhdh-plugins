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
import type { LlamaStackModel } from '../types';

/**
 * Options for creating a {@link ModelListCache}.
 *
 * @internal
 */
export interface ModelListCacheOptions {
  cache: CacheService;
  logger: LoggerService;
}

const CACHE_KEY = 'llamastack:models';

/**
 * Caches the list of available models from the Llama Stack endpoint.
 *
 * Uses Backstage cacheService with a 60-second TTL per the design spec
 * (Decision 3, task 3.2). Redis-backed in production for multi-instance safety.
 *
 * @internal
 */
export class ModelListCache {
  private readonly cache: CacheService;
  private readonly logger: LoggerService;

  constructor(options: ModelListCacheOptions) {
    this.cache = options.cache.withOptions({
      defaultTtl: { seconds: 60 },
    });
    this.logger = options.logger;
  }

  /**
   * Retrieve the cached model list.
   *
   * @returns The cached models, or undefined if not cached.
   */
  async get(): Promise<LlamaStackModel[] | undefined> {
    const cached = await this.cache.get(CACHE_KEY);
    if (typeof cached === 'string') {
      try {
        const models = JSON.parse(cached) as LlamaStackModel[];
        this.logger.debug(`Model list cache hit (${models.length} models)`);
        return models;
      } catch {
        this.logger.warn('Corrupted model list cache entry, deleting');
        await this.cache.delete(CACHE_KEY);
        return undefined;
      }
    }
    return undefined;
  }

  /**
   * Store a model list in the cache.
   *
   * @param models - The model list to cache.
   */
  async set(models: LlamaStackModel[]): Promise<void> {
    await this.cache.set(CACHE_KEY, JSON.stringify(models));
    this.logger.debug(`Cached ${models.length} models`);
  }

  /**
   * Invalidate the cached model list.
   */
  async invalidate(): Promise<void> {
    await this.cache.delete(CACHE_KEY);
    this.logger.debug('Model list cache invalidated');
  }
}
