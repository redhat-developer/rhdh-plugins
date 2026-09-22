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

import { InMemoryCacheAdapter } from './InMemoryCacheAdapter';

describe('InMemoryCacheAdapter', () => {
  let adapter: InMemoryCacheAdapter;

  beforeEach(() => {
    adapter = new InMemoryCacheAdapter();
  });

  it('stores and retrieves a value', async () => {
    await adapter.set('key-1', 'value-1');
    const result = await adapter.get('key-1');
    expect(result).toBe('value-1');
  });

  it('returns undefined for missing key', async () => {
    const result = await adapter.get('nonexistent');
    expect(result).toBeUndefined();
  });

  it('overwrites existing value', async () => {
    await adapter.set('key-1', 'old');
    await adapter.set('key-1', 'new');
    const result = await adapter.get('key-1');
    expect(result).toBe('new');
  });

  it('deletes a value', async () => {
    await adapter.set('key-1', 'value-1');
    await adapter.delete('key-1');
    const result = await adapter.get('key-1');
    expect(result).toBeUndefined();
  });

  it('does not throw when deleting a nonexistent key', async () => {
    await expect(adapter.delete('nonexistent')).resolves.toBeUndefined();
  });

  it('expires entries after TTL', async () => {
    jest.useFakeTimers();
    try {
      await adapter.set('key-1', 'value-1', { ttl: 1000 });

      // Still valid before TTL
      let result = await adapter.get('key-1');
      expect(result).toBe('value-1');

      // Advance past TTL
      jest.advanceTimersByTime(1001);

      result = await adapter.get('key-1');
      expect(result).toBeUndefined();
    } finally {
      jest.useRealTimers();
    }
  });

  it('retains entries without TTL indefinitely', async () => {
    jest.useFakeTimers();
    try {
      await adapter.set('key-1', 'value-1');

      jest.advanceTimersByTime(365 * 24 * 3600 * 1000);

      const result = await adapter.get('key-1');
      expect(result).toBe('value-1');
    } finally {
      jest.useRealTimers();
    }
  });
});
