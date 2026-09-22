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

import {
  BackstageCacheAdapter,
  type BackstageCacheServiceLike,
} from './BackstageCacheAdapter';

function createMockCacheService(): BackstageCacheServiceLike {
  const store = new Map<string, unknown>();
  return {
    get: jest.fn(async (key: string) => store.get(key)),
    set: jest.fn(async (key: string, value: unknown) => {
      store.set(key, value);
    }),
    delete: jest.fn(async (key: string) => {
      store.delete(key);
    }),
  };
}

describe('BackstageCacheAdapter', () => {
  let mockCache: BackstageCacheServiceLike;
  let adapter: BackstageCacheAdapter;

  beforeEach(() => {
    mockCache = createMockCacheService();
    adapter = new BackstageCacheAdapter(mockCache);
  });

  it('delegates get to the underlying cache', async () => {
    await mockCache.set('key-1', 'value-1');
    const result = await adapter.get('key-1');
    expect(result).toBe('value-1');
    expect(mockCache.get).toHaveBeenCalledWith('key-1');
  });

  it('returns undefined when underlying cache returns non-string', async () => {
    await mockCache.set('key-1', 42);
    const result = await adapter.get('key-1');
    expect(result).toBeUndefined();
  });

  it('returns undefined for missing key', async () => {
    const result = await adapter.get('nonexistent');
    expect(result).toBeUndefined();
  });

  it('delegates set with TTL', async () => {
    await adapter.set('key-1', 'value-1', { ttl: 5000 });
    expect(mockCache.set).toHaveBeenCalledWith('key-1', 'value-1', {
      ttl: 5000,
    });
  });

  it('delegates set without TTL', async () => {
    await adapter.set('key-1', 'value-1');
    expect(mockCache.set).toHaveBeenCalledWith('key-1', 'value-1', {});
  });

  it('delegates delete', async () => {
    await adapter.delete('key-1');
    expect(mockCache.delete).toHaveBeenCalledWith('key-1');
  });
});
