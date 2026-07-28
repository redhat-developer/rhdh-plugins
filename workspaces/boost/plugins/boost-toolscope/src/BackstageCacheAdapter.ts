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

import type { CacheAdapter, CacheSetOptions } from './CacheAdapter';

/**
 * Minimal cache interface that matches Backstage's `CacheService`.
 *
 * This type is structurally compatible with `@backstage/backend-plugin-api`'s
 * `CacheService` without requiring a direct import, keeping the toolscope
 * package free of Backstage dependencies.
 *
 * @public
 */
export interface BackstageCacheServiceLike {
  /** Retrieve a cached value by key. */
  get(key: string): Promise<unknown>;
  /** Store a value in the cache. */
  set(key: string, value: unknown, options?: { ttl?: number }): Promise<void>;
  /** Delete a cached value by key. */
  delete(key: string): Promise<void>;
}

/**
 * {@link CacheAdapter} that wraps a Backstage `coreServices.cache` instance.
 *
 * Pass a Backstage `CacheService` (or any structurally compatible object)
 * and this adapter bridges it to the toolscope {@link CacheAdapter} interface.
 *
 * @example
 * ```ts
 * import { coreServices } from '\@backstage/backend-plugin-api';
 * import { BackstageCacheAdapter } from '\@red-hat-developer-hub/backstage-plugin-boost-toolscope';
 *
 * // In a Backstage module init:
 * const adapter = new BackstageCacheAdapter(cache);
 * ```
 *
 * @public
 */
export class BackstageCacheAdapter implements CacheAdapter {
  private readonly cache: BackstageCacheServiceLike;

  /**
   * Create a new BackstageCacheAdapter.
   *
   * @param cache - A Backstage `CacheService` or compatible object.
   */
  constructor(cache: BackstageCacheServiceLike) {
    this.cache = cache;
  }

  /** {@inheritdoc CacheAdapter.get} */
  async get(key: string): Promise<string | undefined> {
    const value = await this.cache.get(key);
    if (typeof value === 'string') {
      return value;
    }
    return undefined;
  }

  /** {@inheritdoc CacheAdapter.set} */
  async set(
    key: string,
    value: string,
    options?: CacheSetOptions,
  ): Promise<void> {
    await this.cache.set(
      key,
      value,
      options?.ttl !== undefined ? { ttl: options.ttl } : {},
    );
  }

  /** {@inheritdoc CacheAdapter.delete} */
  async delete(key: string): Promise<void> {
    await this.cache.delete(key);
  }
}
