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
import { ModelListCache } from './ModelListCache';
import type { LlamaStackModel } from '../types';

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

describe('ModelListCache', () => {
  let cache: CacheService;
  let modelListCache: ModelListCache;

  beforeEach(() => {
    cache = createMockCache();
    modelListCache = new ModelListCache({
      cache,
      logger: createMockLogger(),
    });
  });

  it('uses cacheService withOptions with 60s TTL', () => {
    expect(cache.withOptions).toHaveBeenCalledWith({
      defaultTtl: { seconds: 60 },
    });
  });

  it('stores and retrieves models', async () => {
    const models: LlamaStackModel[] = [
      { identifier: 'model-1', displayName: 'Model One' },
      { identifier: 'model-2', displayName: 'Model Two' },
    ];

    await modelListCache.set(models);
    const result = await modelListCache.get();
    expect(result).toEqual(models);
  });

  it('returns undefined when no models are cached', async () => {
    const result = await modelListCache.get();
    expect(result).toBeUndefined();
  });

  it('invalidates cached models', async () => {
    const models: LlamaStackModel[] = [{ identifier: 'model-1' }];

    await modelListCache.set(models);
    await modelListCache.invalidate();
    const result = await modelListCache.get();
    expect(result).toBeUndefined();
  });
});
