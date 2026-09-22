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
 * An entry stored in the in-memory cache.
 */
interface CacheEntry {
  value: string;
  expiresAt?: number;
}

/**
 * Default in-memory {@link CacheAdapter} for standalone (non-Backstage) use.
 *
 * Entries are stored in a plain `Map` with optional TTL-based expiration.
 * This adapter is suitable for development, testing, and single-instance
 * deployments. For production multi-instance deployments, use a
 * Backstage `coreServices.cache`-backed adapter instead.
 *
 * @public
 */
export class InMemoryCacheAdapter implements CacheAdapter {
  private readonly store = new Map<string, CacheEntry>();

  /** {@inheritdoc CacheAdapter.get} */
  async get(key: string): Promise<string | undefined> {
    const entry = this.store.get(key);
    if (!entry) {
      return undefined;
    }
    if (entry.expiresAt !== undefined && Date.now() >= entry.expiresAt) {
      this.store.delete(key);
      return undefined;
    }
    return entry.value;
  }

  /** {@inheritdoc CacheAdapter.set} */
  async set(
    key: string,
    value: string,
    options?: CacheSetOptions,
  ): Promise<void> {
    const expiresAt =
      options?.ttl !== undefined ? Date.now() + options.ttl : undefined;
    this.store.set(key, { value, expiresAt });
  }

  /** {@inheritdoc CacheAdapter.delete} */
  async delete(key: string): Promise<void> {
    this.store.delete(key);
  }
}
