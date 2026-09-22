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
import { SyncAttemptsStore } from './SyncAttemptsStore';

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
 * Creates a mock Knex client following the ConversationStore.test.ts
 * pattern with in-memory arrays.
 */
function createMockKnex() {
  const rows: Array<{
    id: string;
    connector_id: string;
    timestamp: string;
    outcome: string;
    error_type: string | null;
    error_message: string | null;
    assets_added: number;
    assets_updated: number;
    assets_removed: number;
    duration_ms: number;
  }> = [];

  const schema = {
    hasTable: jest.fn().mockResolvedValue(true),
    createTable: jest.fn(),
  };

  function createQueryBuilder() {
    let filters: Record<string, unknown> = {};
    let orderField: string | undefined;
    let orderDir: string | undefined;
    let limitVal: number | undefined;
    let whereInField: string | undefined;
    let whereInValues: unknown[] | undefined;
    let whereNotInField: string | undefined;
    let whereNotInValues: unknown[] | undefined;

    const builder: Record<
      string,
      jest.Mock | ((...args: unknown[]) => unknown)
    > = {
      where: jest.fn((arg: unknown) => {
        if (typeof arg === 'object' && arg !== null) {
          filters = { ...filters, ...(arg as Record<string, unknown>) };
        }
        return builder;
      }),
      whereIn: jest.fn((field: string, values: unknown[]) => {
        whereInField = field;
        whereInValues = values;
        return builder;
      }),
      whereNotIn: jest.fn((field: string, values: unknown[]) => {
        whereNotInField = field;
        whereNotInValues = values;
        return builder;
      }),
      orderBy: jest.fn((field: string, dir: string) => {
        orderField = field;
        orderDir = dir;
        return builder;
      }),
      limit: jest.fn((val: number) => {
        limitVal = val;
        return builder;
      }),
      first: jest.fn(async () => {
        let results = applyFilters();
        results = applySort(results);
        return results[0] || undefined;
      }),
      select: jest.fn((...selectArgs: unknown[]) => {
        if (selectArgs.length === 1 && typeof selectArgs[0] === 'string') {
          // select('id') — return rows with just that column
          return (async () => {
            let results = applyFilters();
            results = applySort(results);
            if (limitVal !== undefined) {
              results = results.slice(0, limitVal);
            }
            return results.map(r => ({
              [selectArgs[0] as string]: (r as Record<string, unknown>)[
                selectArgs[0] as string
              ],
            }));
          })();
        }
        return (async () => {
          let results = applyFilters();
          results = applySort(results);
          if (limitVal !== undefined) {
            results = results.slice(0, limitVal);
          }
          return results;
        })();
      }),
      insert: jest.fn(async (row: Record<string, unknown>) => {
        const now = new Date().toISOString();
        const newRow = { ...row } as Record<string, unknown>;
        if (!newRow.timestamp || newRow.timestamp === 'NOW') {
          newRow.timestamp = now;
        }
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        rows.push(newRow as any);
        return [1];
      }),
      delete: jest.fn(async () => {
        let count = 0;
        for (let i = rows.length - 1; i >= 0; i--) {
          if (matchRow(rows[i])) {
            rows.splice(i, 1);
            count++;
          }
        }
        return count;
      }),
      distinct: jest.fn((col: string) => {
        const distinctBuilder = {
          select: jest.fn(async () => {
            const seen = new Set<string>();
            const result: Array<Record<string, string>> = [];
            for (const row of rows) {
              const val = (row as Record<string, unknown>)[col] as string;
              if (!seen.has(val)) {
                seen.add(val);
                result.push({ [col]: val });
              }
            }
            return result;
          }),
        };
        return distinctBuilder;
      }),
      index: jest.fn(),
    };

    function matchRow(row: Record<string, unknown>): boolean {
      const matchFilters = Object.entries(filters).every(
        ([k, v]) => (row as Record<string, unknown>)[k] === v,
      );
      const matchWhereIn =
        !whereInField ||
        !whereInValues ||
        whereInValues.includes((row as Record<string, unknown>)[whereInField!]);
      const matchWhereNotIn =
        !whereNotInField ||
        !whereNotInValues ||
        !whereNotInValues.includes(
          (row as Record<string, unknown>)[whereNotInField!],
        );
      return matchFilters && matchWhereIn && matchWhereNotIn;
    }

    function applyFilters() {
      return rows.filter(row => matchRow(row));
    }

    function applySort(arr: typeof rows): typeof rows {
      if (!orderField) return arr;
      return [...arr].sort((a, b) => {
        const aVal = (a as Record<string, unknown>)[orderField!] as string;
        const bVal = (b as Record<string, unknown>)[orderField!] as string;
        return orderDir === 'asc'
          ? aVal.localeCompare(bVal)
          : bVal.localeCompare(aVal);
      });
    }

    return builder;
  }

  const knex = jest.fn(() => createQueryBuilder()) as unknown as {
    (): ReturnType<typeof createQueryBuilder>;
    schema: typeof schema;
    fn: { now: () => string };
  };
  knex.schema = schema;
  knex.fn = { now: () => 'NOW' as unknown as string };

  return { knex, rows };
}

describe('SyncAttemptsStore', () => {
  let repo: SyncAttemptsStore;
  let mock: ReturnType<typeof createMockKnex>;

  beforeEach(() => {
    mock = createMockKnex();
    const database: DatabaseService = {
      getClient: jest.fn().mockResolvedValue(mock.knex),
    };
    repo = new SyncAttemptsStore({
      database,
      logger: createMockLogger(),
    });
  });

  afterEach(() => {
    mock.rows.length = 0;
  });

  describe('insertSyncAttempt', () => {
    it('inserts and returns a sync attempt', async () => {
      const result = await repo.insertSyncAttempt({
        id: 'sa-1',
        connectorId: 'github',
        outcome: 'success',
        assetsAdded: 5,
        assetsUpdated: 3,
        assetsRemoved: 1,
        durationMs: 1200,
      });

      expect(result.id).toBe('sa-1');
      expect(result.connectorId).toBe('github');
      expect(result.outcome).toBe('success');
      expect(result.assetsAdded).toBe(5);
    });

    it('inserts a failed attempt with error info', async () => {
      const result = await repo.insertSyncAttempt({
        id: 'sa-2',
        connectorId: 'jira',
        outcome: 'failure',
        errorType: 'auth',
        errorMessage: '401 Unauthorized',
      });

      expect(result.outcome).toBe('failure');
      expect(result.errorType).toBe('auth');
      expect(result.errorMessage).toBe('401 Unauthorized');
    });

    it('defaults numeric fields to 0', async () => {
      const result = await repo.insertSyncAttempt({
        id: 'sa-3',
        connectorId: 'github',
        outcome: 'success',
      });

      expect(result.assetsAdded).toBe(0);
      expect(result.assetsUpdated).toBe(0);
      expect(result.assetsRemoved).toBe(0);
      expect(result.durationMs).toBe(0);
    });
  });

  describe('getLatestAttempts', () => {
    it('returns attempts ordered by timestamp desc', async () => {
      await repo.insertSyncAttempt({
        id: 'sa-1',
        connectorId: 'github',
        outcome: 'success',
      });
      // Manually set timestamps for ordering
      mock.rows[0].timestamp = '2026-08-10T10:00:00Z';

      await repo.insertSyncAttempt({
        id: 'sa-2',
        connectorId: 'github',
        outcome: 'failure',
      });
      mock.rows[1].timestamp = '2026-08-10T11:00:00Z';

      const attempts = await repo.getLatestAttempts('github', 2);
      expect(attempts).toHaveLength(2);
      // Newest first
      expect(attempts[0].id).toBe('sa-2');
      expect(attempts[1].id).toBe('sa-1');
    });

    it('respects limit parameter', async () => {
      for (let i = 0; i < 5; i++) {
        await repo.insertSyncAttempt({
          id: `sa-${i}`,
          connectorId: 'github',
          outcome: 'success',
        });
        mock.rows[i].timestamp = `2026-08-10T${10 + i}:00:00Z`;
      }

      const attempts = await repo.getLatestAttempts('github', 3);
      expect(attempts).toHaveLength(3);
    });
  });

  describe('getLatestAttemptsForAll', () => {
    it('returns map of connector ID to attempts', async () => {
      await repo.insertSyncAttempt({
        id: 'sa-1',
        connectorId: 'github',
        outcome: 'success',
      });
      mock.rows[0].timestamp = '2026-08-10T10:00:00Z';

      await repo.insertSyncAttempt({
        id: 'sa-2',
        connectorId: 'jira',
        outcome: 'failure',
      });
      mock.rows[1].timestamp = '2026-08-10T11:00:00Z';

      const result = await repo.getLatestAttemptsForAll(['github', 'jira'], 3);
      expect(result.size).toBe(2);
      expect(result.get('github')).toHaveLength(1);
      expect(result.get('jira')).toHaveLength(1);
      expect(result.get('github')![0].id).toBe('sa-1');
      expect(result.get('jira')![0].id).toBe('sa-2');
    });

    it('returns empty map for empty connector list', async () => {
      const result = await repo.getLatestAttemptsForAll([], 3);
      expect(result.size).toBe(0);
    });

    it('limits results per connector', async () => {
      for (let i = 0; i < 5; i++) {
        await repo.insertSyncAttempt({
          id: `sa-${i}`,
          connectorId: 'github',
          outcome: 'success',
        });
        mock.rows[i].timestamp = `2026-08-10T${10 + i}:00:00Z`;
      }

      const result = await repo.getLatestAttemptsForAll(['github'], 2);
      expect(result.get('github')).toHaveLength(2);
    });

    it('does not starve quieter connectors when another is busy', async () => {
      // Many recent github attempts would fill a naive global LIMIT window.
      for (let i = 0; i < 10; i++) {
        await repo.insertSyncAttempt({
          id: `gh-${i}`,
          connectorId: 'github',
          outcome: 'success',
        });
        mock.rows[i].timestamp = `2026-08-10T${10 + i}:00:00Z`;
      }

      await repo.insertSyncAttempt({
        id: 'jira-1',
        connectorId: 'jira',
        outcome: 'failure',
        errorType: 'auth',
        errorMessage: '401 Unauthorized',
      });
      mock.rows[10].timestamp = '2026-08-09T09:00:00Z';

      const result = await repo.getLatestAttemptsForAll(['github', 'jira'], 3);
      expect(result.get('github')).toHaveLength(3);
      expect(result.get('jira')).toHaveLength(1);
      expect(result.get('jira')![0].id).toBe('jira-1');
    });
  });

  describe('getLastSuccessfulAttempt', () => {
    it('returns the latest success even when recent attempts failed', async () => {
      await repo.insertSyncAttempt({
        id: 'sa-success',
        connectorId: 'github',
        outcome: 'success',
      });
      mock.rows[0].timestamp = '2026-08-10T10:00:00Z';

      await repo.insertSyncAttempt({
        id: 'sa-fail-1',
        connectorId: 'github',
        outcome: 'failure',
        errorType: 'network',
        errorMessage: 'ECONNREFUSED',
      });
      mock.rows[1].timestamp = '2026-08-10T11:00:00Z';

      await repo.insertSyncAttempt({
        id: 'sa-fail-2',
        connectorId: 'github',
        outcome: 'failure',
        errorType: 'network',
        errorMessage: 'ETIMEDOUT',
      });
      mock.rows[2].timestamp = '2026-08-10T12:00:00Z';

      const result = await repo.getLastSuccessfulAttempt('github');
      expect(result).not.toBeNull();
      expect(result!.id).toBe('sa-success');
      expect(result!.timestamp).toBe('2026-08-10T10:00:00Z');
    });

    it('returns null when no successful attempts exist', async () => {
      await repo.insertSyncAttempt({
        id: 'sa-fail',
        connectorId: 'github',
        outcome: 'failure',
        errorType: 'auth',
        errorMessage: '401 Unauthorized',
      });

      const result = await repo.getLastSuccessfulAttempt('github');
      expect(result).toBeNull();
    });
  });

  describe('cleanupOldAttempts', () => {
    it('deletes rows beyond retention limit', async () => {
      for (let i = 0; i < 5; i++) {
        await repo.insertSyncAttempt({
          id: `sa-${i}`,
          connectorId: 'github',
          outcome: 'success',
        });
        mock.rows[i].timestamp = `2026-08-10T${10 + i}:00:00Z`;
      }

      const deleted = await repo.cleanupOldAttempts('github', 3);
      expect(deleted).toBe(2);
      expect(mock.rows).toHaveLength(3);
    });

    it('returns 0 when under retention limit', async () => {
      await repo.insertSyncAttempt({
        id: 'sa-1',
        connectorId: 'github',
        outcome: 'success',
      });

      const deleted = await repo.cleanupOldAttempts('github', 5);
      expect(deleted).toBe(0);
    });
  });

  describe('getDistinctConnectorIds', () => {
    it('returns unique connector IDs', async () => {
      await repo.insertSyncAttempt({
        id: 'sa-1',
        connectorId: 'github',
        outcome: 'success',
      });
      await repo.insertSyncAttempt({
        id: 'sa-2',
        connectorId: 'jira',
        outcome: 'success',
      });
      await repo.insertSyncAttempt({
        id: 'sa-3',
        connectorId: 'github',
        outcome: 'failure',
      });

      const ids = await repo.getDistinctConnectorIds();
      expect(ids).toHaveLength(2);
      expect(ids).toContain('github');
      expect(ids).toContain('jira');
    });
  });
});
