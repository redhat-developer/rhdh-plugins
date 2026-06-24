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
import { KeycloakTokenCache } from './KeycloakTokenCache';

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

describe('KeycloakTokenCache', () => {
  let cache: CacheService;
  let tokenCache: KeycloakTokenCache;

  beforeEach(() => {
    cache = createMockCache();
    tokenCache = new KeycloakTokenCache({
      cache,
      logger: createMockLogger(),
    });
  });

  it('stores and retrieves a token', async () => {
    await tokenCache.set('my-realm/my-client', 'token-abc', 300);
    const result = await tokenCache.get('my-realm/my-client');
    expect(result).toBe('token-abc');
  });

  it('returns undefined for unknown key', async () => {
    const result = await tokenCache.get('unknown');
    expect(result).toBeUndefined();
  });

  it('stores token with TTL in milliseconds', async () => {
    await tokenCache.set('my-realm/my-client', 'token-abc', 300);
    expect(cache.set).toHaveBeenCalledWith(
      'kagenti:keycloak-token:my-realm/my-client',
      'token-abc',
      { ttl: 300000 },
    );
  });

  it('invalidates a cached token', async () => {
    await tokenCache.set('my-realm/my-client', 'token-abc', 300);
    await tokenCache.invalidate('my-realm/my-client');
    const result = await tokenCache.get('my-realm/my-client');
    expect(result).toBeUndefined();
  });

  it('uses key prefix for namespace isolation', async () => {
    await tokenCache.set('realm-a/client-a', 'token-a', 60);
    await tokenCache.set('realm-b/client-b', 'token-b', 120);

    expect(cache.set).toHaveBeenCalledWith(
      'kagenti:keycloak-token:realm-a/client-a',
      'token-a',
      { ttl: 60000 },
    );
    expect(cache.set).toHaveBeenCalledWith(
      'kagenti:keycloak-token:realm-b/client-b',
      'token-b',
      { ttl: 120000 },
    );
  });
});
