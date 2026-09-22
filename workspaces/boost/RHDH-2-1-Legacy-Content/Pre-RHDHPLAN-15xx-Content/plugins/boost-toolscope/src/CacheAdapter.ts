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

/**
 * Options for cache set operations.
 *
 * @public
 */
export interface CacheSetOptions {
  /** Time-to-live in milliseconds. Entries expire after this duration. */
  ttl?: number;
}

/**
 * Injectable cache abstraction for toolscope.
 *
 * This interface decouples toolscope from any specific cache implementation.
 * Use {@link InMemoryCacheAdapter} for standalone (non-Backstage) usage, or
 * provide a Backstage `coreServices.cache`-backed adapter for production.
 *
 * @public
 */
export interface CacheAdapter {
  /**
   * Retrieve a cached value by key.
   *
   * @param key - The cache key.
   * @returns The cached value, or `undefined` if the key is not found or expired.
   */
  get(key: string): Promise<string | undefined>;

  /**
   * Store a value in the cache.
   *
   * @param key - The cache key.
   * @param value - The value to cache (must be a string).
   * @param options - Optional TTL configuration.
   */
  set(key: string, value: string, options?: CacheSetOptions): Promise<void>;

  /**
   * Delete a cached value by key.
   *
   * @param key - The cache key to remove.
   */
  delete(key: string): Promise<void>;
}
