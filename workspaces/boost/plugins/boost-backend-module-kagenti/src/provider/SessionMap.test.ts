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
import { SessionMap, type SessionData } from './SessionMap';

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

describe('SessionMap', () => {
  let cache: CacheService;
  let sessionMap: SessionMap;

  beforeEach(() => {
    cache = createMockCache();
    sessionMap = new SessionMap({
      cache,
      logger: createMockLogger(),
    });
  });

  it('stores and retrieves session data', async () => {
    const data: SessionData = {
      sessionId: 'a2a-session-123',
      agentId: 'my-agent',
      createdAt: '2025-01-01T00:00:00.000Z',
      lastActivity: '2025-01-01T00:01:00.000Z',
    };

    await sessionMap.set('conv-1', data);
    const result = await sessionMap.get('conv-1');
    expect(result).toEqual(data);
  });

  it('returns undefined for unknown conversation', async () => {
    const result = await sessionMap.get('unknown');
    expect(result).toBeUndefined();
  });

  it('stores session with 24-hour TTL', async () => {
    const data: SessionData = {
      sessionId: 'a2a-session-123',
      agentId: 'my-agent',
      createdAt: '2025-01-01T00:00:00.000Z',
      lastActivity: '2025-01-01T00:01:00.000Z',
    };

    await sessionMap.set('conv-1', data);
    expect(cache.set).toHaveBeenCalledWith(
      'kagenti:session:conv-1',
      JSON.stringify(data),
      { ttl: 86400000 },
    );
  });

  it('removes session data', async () => {
    const data: SessionData = {
      sessionId: 'a2a-session-123',
      agentId: 'my-agent',
      createdAt: '2025-01-01T00:00:00.000Z',
      lastActivity: '2025-01-01T00:01:00.000Z',
    };

    await sessionMap.set('conv-1', data);
    await sessionMap.delete('conv-1');
    const result = await sessionMap.get('conv-1');
    expect(result).toBeUndefined();
  });

  it('handles pre-parsed object returned by cache backend', async () => {
    const data: SessionData = {
      sessionId: 'a2a-session-456',
      agentId: 'my-agent',
      createdAt: '2025-01-01T00:00:00.000Z',
      lastActivity: '2025-01-01T00:01:00.000Z',
    };
    (cache.get as jest.Mock).mockResolvedValueOnce(data);

    const result = await sessionMap.get('conv-obj');
    expect(result).toEqual(data);
  });
});
