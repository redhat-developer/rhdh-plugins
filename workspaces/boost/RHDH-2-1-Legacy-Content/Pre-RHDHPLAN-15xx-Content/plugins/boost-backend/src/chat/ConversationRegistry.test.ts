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
import { ConversationRegistry } from './ConversationRegistry';

function createMockLogger(): LoggerService {
  return {
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
    debug: jest.fn(),
    child: jest.fn().mockReturnThis(),
  };
}

function createMockCache(): CacheService {
  const store = new Map<string, unknown>();
  return {
    get: jest.fn(async (key: string) => store.get(key)) as CacheService['get'],
    set: jest.fn(async (key: string, value: unknown) => {
      store.set(key, value);
    }),
    delete: jest.fn(async (key: string) => {
      store.delete(key);
    }),
    withOptions: jest.fn().mockReturnThis(),
  };
}

describe('ConversationRegistry', () => {
  let registry: ConversationRegistry;
  let mockCache: CacheService;

  beforeEach(() => {
    mockCache = createMockCache();
    registry = new ConversationRegistry({
      cache: mockCache,
      logger: createMockLogger(),
    });
  });

  it('uses cacheService with 24h TTL', () => {
    expect(mockCache.withOptions).toHaveBeenCalledWith({
      defaultTtl: 24 * 60 * 60 * 1000,
    });
  });

  it('sets and gets a response-to-conversation mapping', async () => {
    await registry.set('resp-1', 'conv-1');
    const result = await registry.get('resp-1');
    expect(result).toBe('conv-1');
  });

  it('returns undefined for unknown response ID', async () => {
    const result = await registry.get('unknown');
    expect(result).toBeUndefined();
  });

  it('deletes a mapping', async () => {
    await registry.set('resp-1', 'conv-1');
    await registry.delete('resp-1');
    const result = await registry.get('resp-1');
    expect(result).toBeUndefined();
  });

  it('uses namespaced cache keys', async () => {
    await registry.set('resp-1', 'conv-1');
    expect(mockCache.set).toHaveBeenCalledWith(
      'conversation-registry:resp-1',
      'conv-1',
    );
  });
});
