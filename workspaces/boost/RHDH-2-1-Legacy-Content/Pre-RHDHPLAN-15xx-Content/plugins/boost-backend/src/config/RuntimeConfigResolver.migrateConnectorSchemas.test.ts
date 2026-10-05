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

jest.mock('./schemas', () => {
  const actual = jest.requireActual('./schemas') as typeof import('./schemas');
  return {
    ...actual,
    BOOST_CONNECTOR_SCHEMA_VERSION: 2,
  };
});

import type {
  CacheService,
  LoggerService,
  RootConfigService,
} from '@backstage/backend-plugin-api';
import {
  RuntimeConfigResolver,
  type ConnectorMigrationRegistry,
} from './RuntimeConfigResolver';
import { AdminConfigService } from './AdminConfigService';
import { CONNECTOR_IDS, type ConnectorId } from './schemas';

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
  return {
    get: jest.fn(),
    set: jest.fn(),
    delete: jest.fn(),
    withOptions: jest.fn().mockReturnThis(),
  } as unknown as CacheService;
}

function createMockConfig(): RootConfigService {
  return {
    getOptionalString: () => undefined,
    getOptionalNumber: () => undefined,
    getOptional: () => undefined,
    getOptionalConfig: () => undefined,
  } as unknown as RootConfigService;
}

describe('migrateConnectorSchemas (BOOST_CONNECTOR_SCHEMA_VERSION=2)', () => {
  let cache: CacheService;
  let logger: LoggerService;

  beforeEach(() => {
    cache = createMockCache();
    logger = createMockLogger();
  });

  it('runs v1→v2 migration per connector and stamps 2', async () => {
    const migrationFn = jest.fn().mockResolvedValue(undefined);
    const migrations: ConnectorMigrationRegistry = new Map([[1, migrationFn]]);

    const adminConfigService = {
      getAllOverrides: jest.fn().mockResolvedValue(new Map()),
      getOverride: jest.fn().mockResolvedValue(1),
      setOverride: jest.fn().mockResolvedValue(undefined),
    } as unknown as AdminConfigService;

    const resolver = new RuntimeConfigResolver({
      cache,
      config: createMockConfig(),
      adminConfigService,
      logger,
    });

    await resolver.migrateConnectorSchemas(migrations);

    expect(migrationFn).toHaveBeenCalledTimes(CONNECTOR_IDS.length);
    for (const connectorId of CONNECTOR_IDS) {
      expect(migrationFn).toHaveBeenCalledWith(connectorId, adminConfigService);
      expect(adminConfigService.setOverride).toHaveBeenCalledWith(
        `boost.connectors.${connectorId}.__schemaVersion`,
        2,
      );
    }
  });

  it('stamps 2 when no migration fn is registered (no-op step)', async () => {
    const adminConfigService = {
      getAllOverrides: jest.fn().mockResolvedValue(new Map()),
      getOverride: jest.fn().mockResolvedValue(1),
      setOverride: jest.fn().mockResolvedValue(undefined),
    } as unknown as AdminConfigService;

    const resolver = new RuntimeConfigResolver({
      cache,
      config: createMockConfig(),
      adminConfigService,
      logger,
    });

    await resolver.migrateConnectorSchemas();

    for (const connectorId of CONNECTOR_IDS) {
      expect(adminConfigService.setOverride).toHaveBeenCalledWith(
        `boost.connectors.${connectorId}.__schemaVersion`,
        2,
      );
    }
  });

  it('writes v1 then runs v1→v2 when stored version is missing', async () => {
    const migrationFn = jest.fn().mockResolvedValue(undefined);
    const migrations: ConnectorMigrationRegistry = new Map([[1, migrationFn]]);

    const adminConfigService = {
      getAllOverrides: jest.fn().mockResolvedValue(new Map()),
      getOverride: jest.fn().mockResolvedValue(undefined),
      setOverride: jest.fn().mockResolvedValue(undefined),
    } as unknown as AdminConfigService;

    const resolver = new RuntimeConfigResolver({
      cache,
      config: createMockConfig(),
      adminConfigService,
      logger,
    });

    await resolver.migrateConnectorSchemas(migrations);

    for (const connectorId of CONNECTOR_IDS) {
      const key = `boost.connectors.${connectorId}.__schemaVersion`;
      expect(adminConfigService.setOverride).toHaveBeenCalledWith(key, 1);
      expect(adminConfigService.setOverride).toHaveBeenCalledWith(key, 2);
    }
    expect(migrationFn).toHaveBeenCalledTimes(CONNECTOR_IDS.length);
  });

  it('does not stamp the failed connector to v2; remaining connectors still migrate', async () => {
    const migrationFn = jest.fn(async (connectorId: ConnectorId) => {
      if (connectorId === 'jira') {
        throw new Error('jira migration failed');
      }
    });
    const migrations: ConnectorMigrationRegistry = new Map([[1, migrationFn]]);

    const adminConfigService = {
      getAllOverrides: jest.fn().mockResolvedValue(new Map()),
      getOverride: jest.fn().mockResolvedValue(1),
      setOverride: jest.fn().mockResolvedValue(undefined),
    } as unknown as AdminConfigService;

    const resolver = new RuntimeConfigResolver({
      cache,
      config: createMockConfig(),
      adminConfigService,
      logger,
    });

    await expect(resolver.migrateConnectorSchemas(migrations)).rejects.toThrow(
      'jira migration failed',
    );

    expect(adminConfigService.setOverride).not.toHaveBeenCalledWith(
      'boost.connectors.jira.__schemaVersion',
      2,
    );
    expect(adminConfigService.setOverride).toHaveBeenCalledWith(
      'boost.connectors.github.__schemaVersion',
      2,
    );
    expect(adminConfigService.setOverride).toHaveBeenCalledWith(
      'boost.connectors.gitlab.__schemaVersion',
      2,
    );
    expect(cache.delete).toHaveBeenCalledWith('effective-config');
  });

  it('rethrows the migration error when cache invalidation also fails', async () => {
    const migrationFn = jest.fn(async (connectorId: ConnectorId) => {
      if (connectorId === 'jira') {
        throw new Error('jira migration failed');
      }
    });
    const migrations: ConnectorMigrationRegistry = new Map([[1, migrationFn]]);

    cache.delete = jest
      .fn()
      .mockRejectedValue(new Error('cache delete failed'));

    const adminConfigService = {
      getAllOverrides: jest.fn().mockResolvedValue(new Map()),
      getOverride: jest.fn().mockResolvedValue(1),
      setOverride: jest.fn().mockResolvedValue(undefined),
    } as unknown as AdminConfigService;

    const resolver = new RuntimeConfigResolver({
      cache,
      config: createMockConfig(),
      adminConfigService,
      logger,
    });

    await expect(resolver.migrateConnectorSchemas(migrations)).rejects.toThrow(
      'jira migration failed',
    );
    expect(logger.error).toHaveBeenCalledWith(
      'Failed to invalidate config cache after connector schema migration',
      expect.any(Error),
    );
  });
});
