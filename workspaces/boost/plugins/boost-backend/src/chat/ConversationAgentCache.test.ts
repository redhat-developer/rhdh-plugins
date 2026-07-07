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
import { ConversationAgentCache } from './ConversationAgentCache';

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
  const cache: CacheService = {
    get: jest.fn(async (key: string) => store.get(key)) as CacheService['get'],
    set: jest.fn(async (key: string, value: unknown) => {
      store.set(key, value);
    }),
    delete: jest.fn(async (key: string) => {
      store.delete(key);
    }),
    withOptions: jest.fn().mockReturnThis(),
  };
  return cache;
}

describe('ConversationAgentCache', () => {
  let cache: CacheService;
  let conversationCache: ConversationAgentCache;

  beforeEach(() => {
    cache = createMockCache();
    conversationCache = new ConversationAgentCache({
      cache,
      logger: createMockLogger(),
    });
  });

  it('stores and retrieves a conversation-agent mapping', async () => {
    await conversationCache.set('conv-1', 'llamastack');
    const result = await conversationCache.get('conv-1');
    expect(result).toBe('llamastack');
  });

  it('returns undefined for unknown conversation', async () => {
    const result = await conversationCache.get('unknown');
    expect(result).toBeUndefined();
  });

  it('deletes a conversation-agent mapping', async () => {
    await conversationCache.set('conv-1', 'llamastack');
    await conversationCache.delete('conv-1');
    const result = await conversationCache.get('conv-1');
    expect(result).toBeUndefined();
  });

  it('uses cacheService withOptions for namespace isolation', () => {
    expect(cache.withOptions).toHaveBeenCalledWith({
      defaultTtl: 24 * 60 * 60 * 1000,
    });
  });
});
