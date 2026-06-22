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
  RootConfigService,
} from '@backstage/backend-plugin-api';
import type { JsonValue } from '@backstage/types';
import { RuntimeConfigResolver } from './RuntimeConfigResolver';
import { AdminConfigService } from './AdminConfigService';

function createMockLogger(): LoggerService {
  return {
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
    debug: jest.fn(),
    child: jest.fn().mockReturnThis(),
  };
}

function createMockCache(): CacheService & {
  store: Map<string, { value: unknown; ttl?: number }>;
} {
  const store = new Map<string, { value: unknown; ttl?: number }>();
  return {
    store,
    get: jest.fn(async (key: string) => {
      const entry = store.get(key);
      return entry?.value as JsonValue | undefined;
    }) as CacheService['get'],
    set: jest.fn(
      async (key: string, value: JsonValue, options?: { ttl?: number }) => {
        store.set(key, { value, ttl: options?.ttl });
      },
    ),
    delete: jest.fn(async (key: string) => {
      store.delete(key);
    }),
    withOptions: jest.fn().mockReturnThis(),
  };
}

function createMockConfig(
  values: Record<string, unknown> = {},
): RootConfigService {
  const createConfigProxy = (
    obj: Record<string, unknown>,
  ): RootConfigService => {
    return {
      getOptionalString: (key: string) => {
        const val = obj[key];
        return typeof val === 'string' ? val : undefined;
      },
      getOptionalNumber: (key: string) => {
        const val = obj[key];
        return typeof val === 'number' ? val : undefined;
      },
      getOptional: (key: string) => {
        return obj[key];
      },
      getOptionalConfig: (key: string) => {
        const val = obj[key];
        if (val && typeof val === 'object') {
          return createConfigProxy(val as Record<string, unknown>);
        }
        return undefined;
      },
    } as unknown as RootConfigService;
  };

  return createConfigProxy(values);
}

describe('RuntimeConfigResolver', () => {
  let cache: ReturnType<typeof createMockCache>;
  let logger: LoggerService;

  beforeEach(() => {
    cache = createMockCache();
    logger = createMockLogger();
  });

  describe('resolve', () => {
    it('returns YAML baseline value when no DB override exists', async () => {
      const config = createMockConfig({
        boost: {
          model: { baseUrl: 'https://yaml.example.com/api' },
        },
      });

      const adminConfigService = {
        getAllOverrides: jest.fn().mockResolvedValue(new Map()),
      } as unknown as AdminConfigService;

      const resolver = new RuntimeConfigResolver({
        cache,
        config,
        adminConfigService,
        logger,
      });

      const value = await resolver.resolve('boost.model.baseUrl');
      expect(value).toBe('https://yaml.example.com/api');
    });

    it('returns DB override when it exists (takes precedence)', async () => {
      const config = createMockConfig({
        boost: {
          model: { baseUrl: 'https://yaml.example.com/api' },
        },
      });

      const dbOverrides = new Map([
        ['boost.model.baseUrl', 'https://db.example.com/api'],
      ]);
      const adminConfigService = {
        getAllOverrides: jest.fn().mockResolvedValue(dbOverrides),
      } as unknown as AdminConfigService;

      const resolver = new RuntimeConfigResolver({
        cache,
        config,
        adminConfigService,
        logger,
      });

      const value = await resolver.resolve('boost.model.baseUrl');
      expect(value).toBe('https://db.example.com/api');
    });

    it('returns undefined when neither YAML nor DB has the value', async () => {
      const config = createMockConfig({});
      const adminConfigService = {
        getAllOverrides: jest.fn().mockResolvedValue(new Map()),
      } as unknown as AdminConfigService;

      const resolver = new RuntimeConfigResolver({
        cache,
        config,
        adminConfigService,
        logger,
      });

      const value = await resolver.resolve('boost.model.baseUrl');
      expect(value).toBeUndefined();
    });
  });

  describe('caching', () => {
    it('caches resolved config with 30s TTL', async () => {
      const config = createMockConfig({
        boost: { model: { baseUrl: 'https://yaml.example.com/api' } },
      });
      const adminConfigService = {
        getAllOverrides: jest.fn().mockResolvedValue(new Map()),
      } as unknown as AdminConfigService;

      const resolver = new RuntimeConfigResolver({
        cache,
        config,
        adminConfigService,
        logger,
      });

      await resolver.resolve('boost.model.baseUrl');

      // Cache should have been set with 30s TTL
      expect(cache.set).toHaveBeenCalledWith(
        'effective-config',
        expect.any(Object),
        { ttl: 30_000 },
      );
    });

    it('uses cached value on subsequent calls', async () => {
      const config = createMockConfig({
        boost: { model: { baseUrl: 'https://yaml.example.com/api' } },
      });
      const adminConfigService = {
        getAllOverrides: jest.fn().mockResolvedValue(new Map()),
      } as unknown as AdminConfigService;

      const resolver = new RuntimeConfigResolver({
        cache,
        config,
        adminConfigService,
        logger,
      });

      // First call populates cache
      await resolver.resolve('boost.model.baseUrl');
      // Second call should use cache
      await resolver.resolve('boost.model.baseUrl');

      // getAllOverrides should only be called once (cache hit on second)
      expect(adminConfigService.getAllOverrides).toHaveBeenCalledTimes(1);
    });
  });

  describe('invalidate', () => {
    it('clears the cache', async () => {
      const config = createMockConfig({
        boost: { model: { baseUrl: 'https://yaml.example.com/api' } },
      });
      const adminConfigService = {
        getAllOverrides: jest.fn().mockResolvedValue(new Map()),
      } as unknown as AdminConfigService;

      const resolver = new RuntimeConfigResolver({
        cache,
        config,
        adminConfigService,
        logger,
      });

      // Populate cache
      await resolver.resolve('boost.model.baseUrl');

      // Invalidate
      await resolver.invalidate();

      expect(cache.delete).toHaveBeenCalledWith('effective-config');
    });
  });

  describe('set', () => {
    it('writes to admin service and invalidates cache', async () => {
      const config = createMockConfig({});
      const adminConfigService = {
        getAllOverrides: jest.fn().mockResolvedValue(new Map()),
        setOverride: jest.fn().mockResolvedValue(undefined),
      } as unknown as AdminConfigService;

      const resolver = new RuntimeConfigResolver({
        cache,
        config,
        adminConfigService,
        logger,
      });

      await resolver.set('boost.model.baseUrl', 'https://new.example.com/api');

      expect(adminConfigService.setOverride).toHaveBeenCalledWith(
        'boost.model.baseUrl',
        'https://new.example.com/api',
      );
      expect(cache.delete).toHaveBeenCalledWith('effective-config');
    });
  });

  describe('remove', () => {
    it('removes from admin service and invalidates cache', async () => {
      const config = createMockConfig({});
      const adminConfigService = {
        getAllOverrides: jest.fn().mockResolvedValue(new Map()),
        removeOverride: jest.fn().mockResolvedValue(undefined),
      } as unknown as AdminConfigService;

      const resolver = new RuntimeConfigResolver({
        cache,
        config,
        adminConfigService,
        logger,
      });

      await resolver.remove('boost.model.baseUrl');

      expect(adminConfigService.removeOverride).toHaveBeenCalledWith(
        'boost.model.baseUrl',
      );
      expect(cache.delete).toHaveBeenCalledWith('effective-config');
    });
  });

  describe('resolveAll', () => {
    it('returns all resolved values', async () => {
      const config = createMockConfig({
        boost: {
          model: {
            baseUrl: 'https://yaml.example.com/api',
            name: 'gpt-4',
          },
          security: { mode: 'full' },
        },
      });

      const dbOverrides = new Map([['boost.model.name', 'claude-3']]);
      const adminConfigService = {
        getAllOverrides: jest.fn().mockResolvedValue(dbOverrides),
      } as unknown as AdminConfigService;

      const resolver = new RuntimeConfigResolver({
        cache,
        config,
        adminConfigService,
        logger,
      });

      const allConfig = await resolver.resolveAll();

      // YAML value (no DB override)
      expect(allConfig.get('boost.model.baseUrl')).toBe(
        'https://yaml.example.com/api',
      );
      // DB override takes precedence
      expect(allConfig.get('boost.model.name')).toBe('claude-3');
      // YAML-only value
      expect(allConfig.get('boost.security.mode')).toBe('full');
    });
  });

  describe('DB override removed restores YAML baseline', () => {
    it('falls back to YAML after DB override is removed', async () => {
      const config = createMockConfig({
        boost: {
          model: { baseUrl: 'https://yaml.example.com/api' },
        },
      });

      // Initially has DB override
      let dbOverrides = new Map([
        ['boost.model.baseUrl', 'https://db.example.com/api'],
      ]);
      const adminConfigService = {
        getAllOverrides: jest.fn().mockImplementation(async () => dbOverrides),
        removeOverride: jest.fn().mockImplementation(async () => {
          dbOverrides = new Map();
        }),
      } as unknown as AdminConfigService;

      const resolver = new RuntimeConfigResolver({
        cache,
        config,
        adminConfigService,
        logger,
      });

      // Should return DB override
      let value = await resolver.resolve('boost.model.baseUrl');
      expect(value).toBe('https://db.example.com/api');

      // Remove DB override and invalidate
      await resolver.remove('boost.model.baseUrl');

      // Should now return YAML baseline
      value = await resolver.resolve('boost.model.baseUrl');
      expect(value).toBe('https://yaml.example.com/api');
    });
  });
});
