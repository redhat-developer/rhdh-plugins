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
import { ClientManager } from './ClientManager';
import type { ClientState } from '../types';

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

describe('ClientManager', () => {
  let cache: CacheService;
  let clientManager: ClientManager;

  beforeEach(() => {
    cache = createMockCache();
    clientManager = new ClientManager({
      cache,
      logger: createMockLogger(),
    });
  });

  it('stores and retrieves client state', async () => {
    const state: ClientState = {
      userRef: 'user:default/john',
      lastActivity: '2025-01-01T00:00:00.000Z',
      sessionCount: 1,
    };

    await clientManager.set('user:default/john', state);
    const result = await clientManager.get('user:default/john');
    expect(result).toEqual(state);
  });

  it('returns undefined for unknown user', async () => {
    const result = await clientManager.get('user:default/unknown');
    expect(result).toBeUndefined();
  });

  it('stores state with 1-hour TTL', async () => {
    const state: ClientState = {
      userRef: 'user:default/john',
      lastActivity: '2025-01-01T00:00:00.000Z',
      sessionCount: 1,
    };

    await clientManager.set('user:default/john', state);
    expect(cache.set).toHaveBeenCalledWith(
      'llamastack:client:user:default/john',
      JSON.stringify(state),
      { ttl: 3600000 },
    );
  });

  it('records activity and increments session count', async () => {
    const first = await clientManager.recordActivity('user:default/jane');
    expect(first.sessionCount).toBe(1);
    expect(first.userRef).toBe('user:default/jane');

    const second = await clientManager.recordActivity('user:default/jane');
    expect(second.sessionCount).toBe(2);
  });

  it('deletes client state', async () => {
    await clientManager.recordActivity('user:default/john');
    await clientManager.delete('user:default/john');
    const result = await clientManager.get('user:default/john');
    expect(result).toBeUndefined();
  });
});
