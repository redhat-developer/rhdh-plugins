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
import { RateLimiter } from './RateLimiter';

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

describe('RateLimiter', () => {
  let cache: CacheService;
  let limiter: RateLimiter;

  beforeEach(() => {
    cache = createMockCache();
    limiter = new RateLimiter({
      cache,
      logger: createMockLogger(),
      maxRequests: 3,
      windowMs: 60_000,
    });
  });

  it('allows requests within the limit', async () => {
    const r1 = await limiter.consume('user-1');
    expect(r1.allowed).toBe(true);
    expect(r1.remaining).toBe(2);

    const r2 = await limiter.consume('user-1');
    expect(r2.allowed).toBe(true);
    expect(r2.remaining).toBe(1);
  });

  it('denies requests exceeding the limit', async () => {
    await limiter.consume('user-1');
    await limiter.consume('user-1');
    await limiter.consume('user-1');

    const r4 = await limiter.consume('user-1');
    expect(r4.allowed).toBe(false);
    expect(r4.remaining).toBe(0);
    expect(r4.retryAfterMs).toBeGreaterThan(0);
  });

  it('tracks separate limits per identity', async () => {
    await limiter.consume('user-1');
    await limiter.consume('user-1');
    await limiter.consume('user-1');

    // user-2 should still be allowed
    const r = await limiter.consume('user-2');
    expect(r.allowed).toBe(true);
    expect(r.remaining).toBe(2);
  });

  it('uses cacheService withOptions for namespace isolation', () => {
    expect(cache.withOptions).toHaveBeenCalledWith({
      defaultTtl: 60_000,
    });
  });
});
