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
  DatabaseService,
  LoggerService,
} from '@backstage/backend-plugin-api';
import { InputError } from '@backstage/errors';
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

/**
 * In-memory store that simulates the DB table, used to build a
 * mock Knex client that the AdminConfigService can drive.
 */
function createMockKnex() {
  const rows: Array<{
    key: string;
    value: string;
    schema_version: number;
    updated_at: string;
  }> = [];

  // Schema mock
  const schema = {
    hasTable: jest.fn().mockResolvedValue(true), // pretend table exists
    createTable: jest.fn(),
  };

  // Query builder mock — supports chaining
  function createQueryBuilder(_tableName?: string) {
    let filterKey: string | undefined;

    const builder: Record<string, jest.Mock> = {
      where: jest.fn((condition: { key: string }) => {
        filterKey = condition.key;
        return builder;
      }),
      first: jest.fn(async () => {
        if (!filterKey) return undefined;
        return rows.find(r => r.key === filterKey);
      }),
      select: jest.fn(async () => [...rows]),
      insert: jest.fn(async (row: (typeof rows)[0]) => {
        rows.push({ ...row });
      }),
      update: jest.fn(async (updates: Partial<(typeof rows)[0]>) => {
        const idx = rows.findIndex(r => r.key === filterKey);
        if (idx >= 0) {
          Object.assign(rows[idx], updates);
        }
      }),
      delete: jest.fn(async () => {
        const idx = rows.findIndex(r => r.key === filterKey);
        if (idx >= 0) {
          rows.splice(idx, 1);
        }
      }),
    };

    return builder;
  }

  const knex = jest.fn((tableName: string) =>
    createQueryBuilder(tableName),
  ) as unknown as any;
  knex.schema = schema;
  knex.fn = { now: jest.fn().mockReturnValue('now()') };
  knex._rows = rows; // expose for test assertions

  return knex;
}

describe('AdminConfigService', () => {
  let mockKnex: ReturnType<typeof createMockKnex>;
  let service: AdminConfigService;
  let logger: LoggerService;

  beforeEach(async () => {
    mockKnex = createMockKnex();

    const database: DatabaseService = {
      getClient: async () => mockKnex,
    } as unknown as DatabaseService;

    logger = createMockLogger();
    service = new AdminConfigService({
      database,
      logger,
      encryptionSecret: 'test-secret',
    });
  });

  describe('getOverride', () => {
    it('returns undefined for non-existent key', async () => {
      const value = await service.getOverride('boost.model.baseUrl');
      expect(value).toBeUndefined();
    });

    it('returns stored value after setOverride', async () => {
      await service.setOverride(
        'boost.model.baseUrl',
        'https://example.com/api',
      );
      const value = await service.getOverride('boost.model.baseUrl');
      expect(value).toBe('https://example.com/api');
    });
  });

  describe('setOverride', () => {
    it('stores a valid config value', async () => {
      await service.setOverride(
        'boost.model.baseUrl',
        'https://example.com/api',
      );
      const value = await service.getOverride('boost.model.baseUrl');
      expect(value).toBe('https://example.com/api');
    });

    it('rejects yaml-only fields', async () => {
      await expect(
        service.setOverride('boost.security.mode', 'full'),
      ).rejects.toThrow(InputError);
      await expect(
        service.setOverride('boost.security.mode', 'full'),
      ).rejects.toThrow('yaml-only');
    });

    it('validates against Zod schema — rejects invalid URLs', async () => {
      await expect(
        service.setOverride('boost.model.baseUrl', 'not-a-url'),
      ).rejects.toThrow();
    });

    it('validates against Zod schema — rejects empty model name', async () => {
      await expect(
        service.setOverride('boost.model.name', ''),
      ).rejects.toThrow();
    });

    it('encrypts sensitive fields', async () => {
      await service.setOverride(
        'boost.devSpaces.credentials',
        'my-secret-token',
      );

      // Read back — should be decrypted transparently
      const value = await service.getOverride('boost.devSpaces.credentials');
      expect(value).toBe('my-secret-token');

      // Raw DB value should be encrypted (not plaintext)
      const rawRow = mockKnex._rows.find(
        (r: { key: string }) => r.key === 'boost.devSpaces.credentials',
      );
      expect(rawRow).toBeDefined();
      const rawValue = JSON.parse(rawRow!.value);
      expect(rawValue).not.toBe('my-secret-token');
    });

    it('rejects sensitive field write without encryption secret', async () => {
      const database: DatabaseService = {
        getClient: async () => createMockKnex(),
      } as unknown as DatabaseService;

      const noSecretService = new AdminConfigService({
        database,
        logger,
        // no encryptionSecret
      });

      await expect(
        noSecretService.setOverride(
          'boost.devSpaces.credentials',
          'my-secret-token',
        ),
      ).rejects.toThrow(InputError);
      await expect(
        noSecretService.setOverride(
          'boost.devSpaces.credentials',
          'my-secret-token',
        ),
      ).rejects.toThrow('encryption secret');
    });
  });

  describe('removeOverride', () => {
    it('removes an existing override', async () => {
      await service.setOverride(
        'boost.model.baseUrl',
        'https://example.com/api',
      );
      await service.removeOverride('boost.model.baseUrl');
      const value = await service.getOverride('boost.model.baseUrl');
      expect(value).toBeUndefined();
    });
  });

  describe('getAllOverrides', () => {
    it('returns empty map when no overrides exist', async () => {
      const overrides = await service.getAllOverrides();
      expect(overrides.size).toBe(0);
    });

    it('returns all stored overrides', async () => {
      await service.setOverride(
        'boost.model.baseUrl',
        'https://example.com/api',
      );
      await service.setOverride('boost.model.name', 'gpt-4');
      const overrides = await service.getAllOverrides();
      expect(overrides.size).toBe(2);
      expect(overrides.get('boost.model.baseUrl')).toBe(
        'https://example.com/api',
      );
      expect(overrides.get('boost.model.name')).toBe('gpt-4');
    });
  });

  describe('validateStoredValues', () => {
    it('returns empty array when all values are valid', async () => {
      await service.setOverride(
        'boost.model.baseUrl',
        'https://example.com/api',
      );
      const removed = await service.validateStoredValues();
      expect(removed).toEqual([]);
    });

    it('removes values for unknown keys', async () => {
      // Insert directly into the mock rows
      mockKnex._rows.push({
        key: 'boost.nonexistent.field',
        value: JSON.stringify('value'),
        schema_version: 0,
        updated_at: new Date().toISOString(),
      });

      const removed = await service.validateStoredValues();
      expect(removed).toContain('boost.nonexistent.field');
    });

    it('removes values that fail validation', async () => {
      // Insert invalid URL directly
      mockKnex._rows.push({
        key: 'boost.model.baseUrl',
        value: JSON.stringify('not-a-url'),
        schema_version: 0,
        updated_at: new Date().toISOString(),
      });

      const removed = await service.validateStoredValues();
      expect(removed).toContain('boost.model.baseUrl');
    });
  });
});
