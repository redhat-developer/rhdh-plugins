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
import { AgentCardCache } from './AgentCardCache';
import type { AgentCard } from '../types';

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

describe('AgentCardCache', () => {
  let cache: CacheService;
  let agentCardCache: AgentCardCache;

  beforeEach(() => {
    cache = createMockCache();
    agentCardCache = new AgentCardCache({
      cache,
      logger: createMockLogger(),
    });
  });

  it('uses cacheService withOptions with 5m TTL', () => {
    expect(cache.withOptions).toHaveBeenCalledWith({
      defaultTtl: { minutes: 5 },
    });
  });

  it('stores and retrieves agent cards', async () => {
    const cards: AgentCard[] = [
      { id: 'agent-1', name: 'Agent One', url: 'http://agent-1:8080' },
      { id: 'agent-2', name: 'Agent Two', url: 'http://agent-2:8080' },
    ];

    await agentCardCache.set(cards);
    const result = await agentCardCache.get();
    expect(result).toEqual(cards);
  });

  it('returns undefined when no cards are cached', async () => {
    const result = await agentCardCache.get();
    expect(result).toBeUndefined();
  });

  it('invalidates cached cards', async () => {
    const cards: AgentCard[] = [
      { id: 'agent-1', name: 'Agent One', url: 'http://agent-1:8080' },
    ];

    await agentCardCache.set(cards);
    await agentCardCache.invalidate();
    const result = await agentCardCache.get();
    expect(result).toBeUndefined();
  });

  it('handles pre-parsed array returned by cache backend', async () => {
    const cards: AgentCard[] = [
      { id: 'agent-1', name: 'Agent One', url: 'http://agent-1:8080' },
    ];
    (cache.get as jest.Mock).mockResolvedValueOnce(cards);

    const result = await agentCardCache.get();
    expect(result).toEqual(cards);
  });
});
