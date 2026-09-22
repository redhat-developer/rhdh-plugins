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
import { CONNECTOR_IDS, BOOST_CONNECTOR_SCHEMA_VERSION } from './schemas';

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

      // getAllOverrides called twice: once to build cache, once on cache
      // hit to fetch sensitive fields fresh from DB
      expect(adminConfigService.getAllOverrides).toHaveBeenCalledTimes(2);
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

  describe('connector config resolution', () => {
    it('resolves connector enabled from YAML baseline when no DB override', async () => {
      const config = createMockConfig({
        boost: {
          connectors: {
            jira: { enabled: true },
          },
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

      const value = await resolver.resolve('boost.connectors.jira.enabled');
      expect(value).toBe(true);
    });

    it('DB override takes precedence for connector enabled', async () => {
      const config = createMockConfig({
        boost: {
          connectors: {
            jira: { enabled: true },
          },
        },
      });

      const dbOverrides = new Map([['boost.connectors.jira.enabled', false]]);
      const adminConfigService = {
        getAllOverrides: jest.fn().mockResolvedValue(dbOverrides),
      } as unknown as AdminConfigService;

      const resolver = new RuntimeConfigResolver({
        cache,
        config,
        adminConfigService,
        logger,
      });

      const value = await resolver.resolve('boost.connectors.jira.enabled');
      expect(value).toBe(false);
    });

    it('resolves connector endpoint from YAML baseline', async () => {
      const config = createMockConfig({
        boost: {
          connectors: {
            github: {
              endpoint: 'https://api.github.com',
            },
          },
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

      const value = await resolver.resolve('boost.connectors.github.endpoint');
      expect(value).toBe('https://api.github.com');
    });

    it('resolves connector numeric fields from YAML baseline', async () => {
      const config = createMockConfig({
        boost: {
          connectors: {
            jira: {
              schedule: { intervalMs: 600000 },
              batchSize: 50,
              timeout: { connectionMs: 15000 },
            },
          },
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

      expect(
        await resolver.resolve('boost.connectors.jira.schedule.intervalMs'),
      ).toBe(600000);
      expect(await resolver.resolve('boost.connectors.jira.batchSize')).toBe(
        50,
      );
      expect(
        await resolver.resolve('boost.connectors.jira.timeout.connectionMs'),
      ).toBe(15000);
    });

    it('returns undefined for unset connector fields', async () => {
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

      const value = await resolver.resolve('boost.connectors.jira.enabled');
      expect(value).toBeUndefined();
    });

    it('caches connector config with 30s TTL', async () => {
      const config = createMockConfig({
        boost: {
          connectors: {
            gitlab: { enabled: true },
          },
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

      await resolver.resolve('boost.connectors.gitlab.enabled');

      expect(cache.set).toHaveBeenCalledWith(
        'effective-config',
        expect.any(Object),
        { ttl: 30_000 },
      );
    });

    it('immediate invalidation causes fresh resolve', async () => {
      const config = createMockConfig({
        boost: {
          connectors: {
            jira: { enabled: true },
          },
        },
      });

      let dbOverrides = new Map<string, unknown>();
      const adminConfigService = {
        getAllOverrides: jest.fn().mockImplementation(async () => dbOverrides),
        setOverride: jest.fn().mockImplementation(async () => {
          dbOverrides = new Map([['boost.connectors.jira.enabled', false]]);
        }),
      } as unknown as AdminConfigService;

      const resolver = new RuntimeConfigResolver({
        cache,
        config,
        adminConfigService,
        logger,
      });

      // Initial resolve: YAML baseline
      let value = await resolver.resolve('boost.connectors.jira.enabled');
      expect(value).toBe(true);

      // Write DB override and invalidate
      await resolver.set('boost.connectors.jira.enabled', false);

      // Resolve again: should return DB override
      value = await resolver.resolve('boost.connectors.jira.enabled');
      expect(value).toBe(false);
    });

    it('resolves multiple connector types simultaneously', async () => {
      const config = createMockConfig({
        boost: {
          connectors: {
            jira: { enabled: true, batchSize: 200 },
            github: { enabled: false },
            gitlab: { enabled: true },
          },
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

      const allConfig = await resolver.resolveAll();

      expect(allConfig.get('boost.connectors.jira.enabled')).toBe(true);
      expect(allConfig.get('boost.connectors.jira.batchSize')).toBe(200);
      expect(allConfig.get('boost.connectors.github.enabled')).toBe(false);
      expect(allConfig.get('boost.connectors.gitlab.enabled')).toBe(true);
    });
  });

  describe('migrateConnectorSchemas', () => {
    it('writes v1 when no __schemaVersion exists', async () => {
      const config = createMockConfig({});
      const adminConfigService = {
        getAllOverrides: jest.fn().mockResolvedValue(new Map()),
        getOverride: jest.fn().mockResolvedValue(undefined),
        setOverride: jest.fn().mockResolvedValue(undefined),
      } as unknown as AdminConfigService;

      const resolver = new RuntimeConfigResolver({
        cache,
        config,
        adminConfigService,
        logger,
      });

      await resolver.migrateConnectorSchemas();

      for (const connectorId of CONNECTOR_IDS) {
        expect(adminConfigService.setOverride).toHaveBeenCalledWith(
          `boost.connectors.${connectorId}.__schemaVersion`,
          1,
        );
      }
    });

    it('treats missing version as v1 (logged)', async () => {
      const config = createMockConfig({});
      const adminConfigService = {
        getAllOverrides: jest.fn().mockResolvedValue(new Map()),
        getOverride: jest.fn().mockResolvedValue(undefined),
        setOverride: jest.fn().mockResolvedValue(undefined),
      } as unknown as AdminConfigService;

      const resolver = new RuntimeConfigResolver({
        cache,
        config,
        adminConfigService,
        logger,
      });

      await resolver.migrateConnectorSchemas();

      expect(logger.info).toHaveBeenCalledWith(
        expect.stringContaining('treating as v1'),
      );
    });

    it('skips migration when stored version equals current', async () => {
      const config = createMockConfig({});
      const adminConfigService = {
        getAllOverrides: jest.fn().mockResolvedValue(new Map()),
        getOverride: jest
          .fn()
          .mockResolvedValue(BOOST_CONNECTOR_SCHEMA_VERSION),
        setOverride: jest.fn().mockResolvedValue(undefined),
      } as unknown as AdminConfigService;

      const resolver = new RuntimeConfigResolver({
        cache,
        config,
        adminConfigService,
        logger,
      });

      await resolver.migrateConnectorSchemas();

      expect(adminConfigService.setOverride).not.toHaveBeenCalled();
    });

    it('warns and skips when stored version is ahead of current', async () => {
      const config = createMockConfig({});
      const adminConfigService = {
        getAllOverrides: jest.fn().mockResolvedValue(new Map()),
        getOverride: jest.fn().mockResolvedValue(99),
        setOverride: jest.fn().mockResolvedValue(undefined),
      } as unknown as AdminConfigService;

      const resolver = new RuntimeConfigResolver({
        cache,
        config,
        adminConfigService,
        logger,
      });

      await resolver.migrateConnectorSchemas();

      expect(adminConfigService.setOverride).not.toHaveBeenCalled();
      expect(logger.warn).toHaveBeenCalledWith(
        expect.stringContaining('possible downgrade'),
      );
    });

    it('invalidates cache after migration completes', async () => {
      const config = createMockConfig({});
      const adminConfigService = {
        getAllOverrides: jest.fn().mockResolvedValue(new Map()),
        getOverride: jest.fn().mockResolvedValue(undefined),
        setOverride: jest.fn().mockResolvedValue(undefined),
      } as unknown as AdminConfigService;

      const resolver = new RuntimeConfigResolver({
        cache,
        config,
        adminConfigService,
        logger,
      });

      await resolver.migrateConnectorSchemas();

      expect(cache.delete).toHaveBeenCalledWith('effective-config');
    });

    it('handles each connector independently', async () => {
      const config = createMockConfig({});

      const adminConfigService = {
        getAllOverrides: jest.fn().mockResolvedValue(new Map()),
        getOverride: jest.fn().mockImplementation(async (key: string) => {
          if (key === 'boost.connectors.jira.__schemaVersion') {
            return BOOST_CONNECTOR_SCHEMA_VERSION;
          }
          if (key === 'boost.connectors.gitlab.__schemaVersion') {
            return BOOST_CONNECTOR_SCHEMA_VERSION;
          }
          return undefined;
        }),
        setOverride: jest.fn().mockResolvedValue(undefined),
      } as unknown as AdminConfigService;

      const resolver = new RuntimeConfigResolver({
        cache,
        config,
        adminConfigService,
        logger,
      });

      await resolver.migrateConnectorSchemas();

      expect(adminConfigService.setOverride).toHaveBeenCalledTimes(1);
      expect(adminConfigService.setOverride).toHaveBeenCalledWith(
        'boost.connectors.github.__schemaVersion',
        1,
      );
    });
  });

  describe('field defaults', () => {
    it('returns field default when DB and YAML are both unset', async () => {
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

      expect(
        await resolver.resolve('boost.connectors.jira.schedule.intervalMs'),
      ).toBe(300000);
      expect(
        await resolver.resolve('boost.connectors.github.schedule.intervalMs'),
      ).toBe(300000);
      expect(
        await resolver.resolve('boost.connectors.gitlab.schedule.intervalMs'),
      ).toBe(300000);
    });

    it('returns batchSize default when DB and YAML are both unset', async () => {
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

      expect(await resolver.resolve('boost.connectors.jira.batchSize')).toBe(
        100,
      );
      expect(await resolver.resolve('boost.connectors.github.batchSize')).toBe(
        100,
      );
      expect(await resolver.resolve('boost.connectors.gitlab.batchSize')).toBe(
        100,
      );
    });

    it('returns timeout.connectionMs default for Jira when unset', async () => {
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

      expect(
        await resolver.resolve('boost.connectors.jira.timeout.connectionMs'),
      ).toBe(30000);
    });

    it('YAML value takes precedence over field default', async () => {
      const config = createMockConfig({
        boost: {
          connectors: {
            jira: {
              schedule: { intervalMs: 600000 },
              batchSize: 50,
              timeout: { connectionMs: 15000 },
            },
          },
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

      expect(
        await resolver.resolve('boost.connectors.jira.schedule.intervalMs'),
      ).toBe(600000);
      expect(await resolver.resolve('boost.connectors.jira.batchSize')).toBe(
        50,
      );
      expect(
        await resolver.resolve('boost.connectors.jira.timeout.connectionMs'),
      ).toBe(15000);
    });

    it('DB override takes precedence over YAML and field default', async () => {
      const config = createMockConfig({
        boost: {
          connectors: {
            jira: {
              schedule: { intervalMs: 600000 },
              batchSize: 50,
            },
          },
        },
      });

      const dbOverrides = new Map<string, unknown>([
        ['boost.connectors.jira.schedule.intervalMs', 120000],
        ['boost.connectors.jira.batchSize', 25],
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

      expect(
        await resolver.resolve('boost.connectors.jira.schedule.intervalMs'),
      ).toBe(120000);
      expect(await resolver.resolve('boost.connectors.jira.batchSize')).toBe(
        25,
      );
    });

    it('falls back to default after removeOverride when no YAML', async () => {
      const config = createMockConfig({});

      let dbOverrides = new Map<string, unknown>([
        ['boost.connectors.jira.batchSize', 25],
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

      // DB override is present
      expect(await resolver.resolve('boost.connectors.jira.batchSize')).toBe(
        25,
      );

      // Remove override and invalidate
      await resolver.remove('boost.connectors.jira.batchSize');

      // Should fall back to field default
      expect(await resolver.resolve('boost.connectors.jira.batchSize')).toBe(
        100,
      );
    });

    it('returns undefined for fields without defaults', async () => {
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

      // enabled, endpoint, schedule.cron have no defaults
      expect(
        await resolver.resolve('boost.connectors.jira.enabled'),
      ).toBeUndefined();
      expect(
        await resolver.resolve('boost.connectors.jira.endpoint'),
      ).toBeUndefined();
      expect(
        await resolver.resolve('boost.connectors.jira.schedule.cron'),
      ).toBeUndefined();
    });

    it('resolveAll includes field defaults for unset keys', async () => {
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

      const allConfig = await resolver.resolveAll();

      // Defaults should be present
      expect(allConfig.get('boost.connectors.jira.schedule.intervalMs')).toBe(
        300000,
      );
      expect(allConfig.get('boost.connectors.jira.batchSize')).toBe(100);
      expect(allConfig.get('boost.connectors.jira.timeout.connectionMs')).toBe(
        30000,
      );
      expect(allConfig.get('boost.connectors.github.schedule.intervalMs')).toBe(
        300000,
      );
      expect(allConfig.get('boost.connectors.github.batchSize')).toBe(100);
      expect(allConfig.get('boost.connectors.gitlab.schedule.intervalMs')).toBe(
        300000,
      );
      expect(allConfig.get('boost.connectors.gitlab.batchSize')).toBe(100);

      // Fields without defaults should NOT be present
      expect(allConfig.has('boost.connectors.jira.enabled')).toBe(false);
      expect(allConfig.has('boost.connectors.jira.endpoint')).toBe(false);
      expect(allConfig.has('boost.connectors.jira.schedule.cron')).toBe(false);
    });

    it('resolveAll does not override YAML or DB values with defaults', async () => {
      const config = createMockConfig({
        boost: {
          connectors: {
            jira: {
              schedule: { intervalMs: 600000 },
            },
          },
        },
      });

      const dbOverrides = new Map<string, unknown>([
        ['boost.connectors.jira.batchSize', 250],
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

      const allConfig = await resolver.resolveAll();

      // YAML value beats default
      expect(allConfig.get('boost.connectors.jira.schedule.intervalMs')).toBe(
        600000,
      );
      // DB override beats default
      expect(allConfig.get('boost.connectors.jira.batchSize')).toBe(250);
      // No YAML or DB — default applied
      expect(allConfig.get('boost.connectors.jira.timeout.connectionMs')).toBe(
        30000,
      );
    });
  });
});
