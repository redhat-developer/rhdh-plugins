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

import {
  mockServices,
  TestDatabaseId,
  TestDatabases,
} from '@backstage/backend-test-utils';
import { DatabaseMetricValues } from './DatabaseMetricValues';
import { DbMetricValueCreate } from './types';
import { toMetricValueRow } from './utils/mapMetricValueRow';
import { migrate } from './migration';

jest.setTimeout(60000);

const baseTimestamp = new Date('2023-01-01T00:00:00Z');

const metricValues: DbMetricValueCreate[] = [
  {
    catalogEntityRef: 'component:default/test-service',
    metricId: 'github.metric1',
    value: 41,
    timestamp: baseTimestamp,
    status: 'success',
  },
  {
    catalogEntityRef: 'component:default/another-service',
    metricId: 'github.metric1',
    value: 25,
    timestamp: baseTimestamp,
    status: 'success',
  },
  {
    catalogEntityRef: 'component:default/another-service',
    metricId: 'github.metric2',
    timestamp: baseTimestamp,
    errorMessage: 'Failed to fetch metric',
  },
];

const createMetricValue = (overrides: {
  entityRef: string;
  metricId?: string;
  timestamp?: Date;
  value?: number | boolean | null;
  status?: string | null;
  errorMessage?: string | null;
}) => ({
  catalogEntityRef: overrides.entityRef,
  metricId: overrides.metricId ?? 'github.metric1',
  timestamp: overrides.timestamp ?? baseTimestamp,
  value: overrides.value === undefined ? 10 : overrides.value,
  errorMessage: overrides.errorMessage ?? null,
  status: overrides.status === undefined ? 'success' : overrides.status,
});

describe('DatabaseMetricValues', () => {
  const databases = TestDatabases.create({
    ids: ['SQLITE_3', 'POSTGRES_15'],
  });

  async function createDatabase(databaseId: TestDatabaseId) {
    const client = await databases.init(databaseId);
    const mockDatabaseService = mockServices.database.mock({
      getClient: async () => client,
      migrations: { skip: false },
    });

    await migrate(mockDatabaseService);

    return {
      client,
      db: new DatabaseMetricValues(client),
    };
  }

  describe('createMetricValues', () => {
    it.each(databases.eachSupportedId())(
      'should successfully insert metric values - %p',
      async databaseId => {
        const { client, db } = await createDatabase(databaseId);

        await expect(
          db.createMetricValues(metricValues),
        ).resolves.not.toThrow();

        const insertedValues = await client('metric_values').select('*');

        expect(insertedValues).toHaveLength(3);

        expect(insertedValues[0]).toMatchObject({
          catalog_entity_ref: 'component:default/test-service',
          metric_id: 'github.metric1',
          value: 41,
          error_message: null,
        });

        expect(insertedValues[1]).toMatchObject({
          catalog_entity_ref: 'component:default/another-service',
          metric_id: 'github.metric1',
          value: 25,
          error_message: null,
        });

        expect(insertedValues[2]).toMatchObject({
          catalog_entity_ref: 'component:default/another-service',
          metric_id: 'github.metric2',
          value: null,
          error_message: 'Failed to fetch metric',
        });
      },
    );

    it.each(databases.eachSupportedId())(
      'should handle empty metric values - %p',
      async databaseId => {
        const { client, db } = await createDatabase(databaseId);

        await expect(db.createMetricValues([])).resolves.not.toThrow();

        const insertedValues = await client('metric_values').select('*');

        expect(insertedValues).toHaveLength(0);
      },
    );
  });

  describe('readLatestEntityMetricValues', () => {
    it.each(databases.eachSupportedId())(
      'should return latest metric values for entity and metrics - %p',
      async databaseId => {
        const { client, db } = await createDatabase(databaseId);

        const baseTime = new Date('2023-01-01T00:00:00Z');
        const laterTime = new Date('2023-01-01T01:00:00Z');

        await client('metric_values').insert(
          [
            {
              ...metricValues[0],
              timestamp: baseTime, // older time
            },
            {
              ...metricValues[1],
              timestamp: laterTime, // newer time, value should be returned
            },
            {
              ...metricValues[2],
              timestamp: laterTime, // newer time, different entity
            },
            {
              catalogEntityRef: 'component:default/test-service',
              metricId: 'github.metric2',
              value: undefined,
              timestamp: baseTime,
              errorMessage: 'Failed to fetch metric',
            },
          ].map(toMetricValueRow),
        );

        const result = await db.readLatestEntityMetricValues(
          'component:default/test-service',
          ['github.metric1', 'github.metric2'],
        );

        expect(result).toHaveLength(2);

        const metric1Result = result.find(r => r.metricId === 'github.metric1');
        const metric2Result = result.find(r => r.metricId === 'github.metric2');

        expect(metric1Result).toMatchObject({
          catalogEntityRef: 'component:default/test-service',
          metricId: 'github.metric1',
          value: 41,
        });

        expect(metric2Result).toMatchObject({
          catalogEntityRef: 'component:default/test-service',
          metricId: 'github.metric2',
          value: null,
        });
      },
    );
  });

  describe('readLatestEntityMetricValuesPerUtcDay', () => {
    it.each(databases.eachSupportedId())(
      'should return one row per UTC day with highest id - %p',
      async databaseId => {
        const { client, db } = await createDatabase(databaseId);
        const entityRef = 'component:default/test-service';
        const metricId = 'github.metric1';

        await client('metric_values').insert(
          [
            createMetricValue({
              entityRef,
              metricId,
              value: 1,
              timestamp: new Date('2023-01-01T10:00:00Z'),
            }),
            createMetricValue({
              entityRef,
              metricId,
              value: 2,
              timestamp: new Date('2023-01-02T10:00:00Z'),
            }),
            createMetricValue({
              entityRef,
              metricId,
              value: 3,
              timestamp: new Date('2023-01-03T10:00:00Z'),
            }),
            // outside range
            createMetricValue({
              entityRef,
              metricId,
              value: 99,
              timestamp: new Date('2023-01-05T10:00:00Z'),
            }),
            // different entity
            createMetricValue({
              entityRef: 'component:default/other-service',
              metricId,
              value: 50,
              timestamp: new Date('2023-01-02T12:00:00Z'),
            }),
            // different metric
            createMetricValue({
              entityRef,
              metricId: 'github.metric2',
              value: 50,
              timestamp: new Date('2023-01-02T12:00:00Z'),
            }),
          ].map(toMetricValueRow),
        );

        const result = await db.readLatestEntityMetricValuesPerUtcDay(
          entityRef,
          metricId,
          new Date('2023-01-01T00:00:00Z'),
          new Date('2023-01-03T23:59:59Z'),
        );

        expect(result).toHaveLength(3);
        expect(result.map(r => r.value)).toEqual([1, 2, 3]);
        expect(result.every(r => r.catalogEntityRef === entityRef)).toBe(true);
        expect(result.every(r => r.metricId === metricId)).toBe(true);
      },
    );

    it.each(databases.eachSupportedId())(
      'should keep only the highest id among samples on the same UTC day - %p',
      async databaseId => {
        const { client, db } = await createDatabase(databaseId);
        const entityRef = 'component:default/test-service';
        const metricId = 'github.metric1';

        await client('metric_values').insert(
          [
            createMetricValue({
              entityRef,
              metricId,
              value: 8,
              timestamp: new Date('2023-01-01T08:00:00Z'),
            }),
            createMetricValue({
              entityRef,
              metricId,
              value: 9,
              timestamp: new Date('2023-01-01T20:00:00Z'),
            }),
          ].map(toMetricValueRow),
        );

        const result = await db.readLatestEntityMetricValuesPerUtcDay(
          entityRef,
          metricId,
          new Date('2023-01-01T00:00:00Z'),
          new Date('2023-01-01T23:59:59Z'),
        );

        expect(result).toHaveLength(1);
        expect(result[0].value).toBe(9);
        expect(result[0].timestamp.toISOString()).toBe(
          '2023-01-01T20:00:00.000Z',
        );
      },
    );

    it.each(databases.eachSupportedId())(
      'should include inclusive range bounds - %p',
      async databaseId => {
        const { client, db } = await createDatabase(databaseId);
        const entityRef = 'component:default/test-service';
        const metricId = 'github.metric1';
        const from = new Date('2023-01-01T12:00:00Z');
        const to = new Date('2023-01-02T12:00:00Z');

        await client('metric_values').insert(
          [
            createMetricValue({
              entityRef,
              metricId,
              value: 1,
              timestamp: from,
            }),
            createMetricValue({
              entityRef,
              metricId,
              value: 2,
              timestamp: to,
            }),
            createMetricValue({
              entityRef,
              metricId,
              value: 3,
              timestamp: new Date('2023-01-01T11:59:59Z'),
            }),
            createMetricValue({
              entityRef,
              metricId,
              value: 4,
              timestamp: new Date('2023-01-02T12:00:01Z'),
            }),
          ].map(toMetricValueRow),
        );

        const result = await db.readLatestEntityMetricValuesPerUtcDay(
          entityRef,
          metricId,
          from,
          to,
        );

        expect(result.map(r => r.value)).toEqual([1, 2]);
      },
    );

    it.each(databases.eachSupportedId())(
      'should treat UTC midnight as a new day matching getUTC* - %p',
      async databaseId => {
        const { client, db } = await createDatabase(databaseId);
        const entityRef = 'component:default/test-service';
        const metricId = 'github.metric1';

        await client('metric_values').insert(
          [
            createMetricValue({
              entityRef,
              metricId,
              value: 1,
              timestamp: new Date('2026-04-27T23:30:00.000Z'),
            }),
            createMetricValue({
              entityRef,
              metricId,
              value: 2,
              timestamp: new Date('2026-04-28T00:15:00.000Z'),
            }),
          ].map(toMetricValueRow),
        );

        const result = await db.readLatestEntityMetricValuesPerUtcDay(
          entityRef,
          metricId,
          new Date('2026-04-27T00:00:00.000Z'),
          new Date('2026-04-28T23:59:59.999Z'),
        );

        expect(result).toHaveLength(2);
        expect(result.map(r => r.value)).toEqual([1, 2]);
        expect(result[0].timestamp.toISOString()).toBe(
          '2026-04-27T23:30:00.000Z',
        );
        expect(result[1].timestamp.toISOString()).toBe(
          '2026-04-28T00:15:00.000Z',
        );
      },
    );

    it.each(databases.eachSupportedId())(
      'should bucket by UTC day when Postgres session TimeZone is non-UTC - %p',
      async databaseId => {
        if (databaseId !== 'POSTGRES_15') {
          return;
        }

        const { client } = await createDatabase(databaseId);
        const entityRef = 'component:default/test-service';
        const metricId = 'github.metric1';

        // Knex dateTime → timestamptz. TO_CHAR(timestamptz) uses the session TimeZone,
        // so America/New_York would put both of these UTC instants on local 2026-04-27.
        // Keep SET LOCAL + queries on one connection via a transaction.
        await client.transaction(async trx => {
          await trx.raw(`SET LOCAL TIME ZONE 'America/New_York'`);

          await trx('metric_values').insert(
            [
              createMetricValue({
                entityRef,
                metricId,
                value: 1,
                timestamp: new Date('2026-04-27T23:30:00.000Z'),
              }),
              createMetricValue({
                entityRef,
                metricId,
                value: 2,
                timestamp: new Date('2026-04-28T00:15:00.000Z'),
              }),
            ].map(toMetricValueRow),
          );

          const db = new DatabaseMetricValues(trx);
          const result = await db.readLatestEntityMetricValuesPerUtcDay(
            entityRef,
            metricId,
            new Date('2026-04-27T00:00:00.000Z'),
            new Date('2026-04-28T23:59:59.999Z'),
          );

          expect(result).toHaveLength(2);
          expect(result.map(r => r.value)).toEqual([1, 2]);
          expect(result[0].timestamp.toISOString()).toBe(
            '2026-04-27T23:30:00.000Z',
          );
          expect(result[1].timestamp.toISOString()).toBe(
            '2026-04-28T00:15:00.000Z',
          );
        });
      },
    );

    it.each(databases.eachSupportedId())(
      'should map JSON literal null with error_message as calculation error - %p',
      async databaseId => {
        const { client, db } = await createDatabase(databaseId);
        const entityRef = 'component:default/test-service';
        const metricId = 'github.metric1';

        await client('metric_values').insert([
          {
            catalog_entity_ref: entityRef,
            metric_id: metricId,
            // Simulates a JSON literal null (not SQL NULL), seen in production DB rows.
            value: 'null',
            timestamp: new Date('2023-01-01T10:00:00Z'),
            error_message: 'GitHub API 500',
            status: null,
          },
        ]);

        const result = await db.readLatestEntityMetricValuesPerUtcDay(
          entityRef,
          metricId,
          new Date('2023-01-01T00:00:00Z'),
          new Date('2023-01-01T23:59:59Z'),
        );

        expect(result).toHaveLength(1);
        expect(result[0].value).toBeNull();
        expect(result[0].errorMessage).toBe('GitHub API 500');
      },
    );

    it.each(databases.eachSupportedId())(
      'should treat 0 and boolean false as successes - %p',
      async databaseId => {
        const { client, db } = await createDatabase(databaseId);
        const entityRef = 'component:default/test-service';
        const metricId = 'github.metric1';

        await client('metric_values').insert(
          [
            createMetricValue({
              entityRef,
              metricId,
              value: 0,
              timestamp: new Date('2023-01-01T10:00:00Z'),
            }),
            createMetricValue({
              entityRef,
              metricId,
              value: false,
              timestamp: new Date('2023-01-02T10:00:00Z'),
            }),
          ].map(toMetricValueRow),
        );

        const result = await db.readLatestEntityMetricValuesPerUtcDay(
          entityRef,
          metricId,
          new Date('2023-01-01T00:00:00Z'),
          new Date('2023-01-02T23:59:59Z'),
        );

        expect(result).toHaveLength(2);
        expect(result[0].value).toBe(0);
        // Boolean false must not be treated as a missing value. Knex/better-sqlite3
        // may round-trip JSON `false` as `0`; either form is a successful sample.
        expect(result[1].value).not.toBeNull();
        expect(result[1].errorMessage).toBeNull();
        expect([false, 0]).toContain(result[1].value);
      },
    );

    it.each(databases.eachSupportedId())(
      'should return empty array when no data in range - %p',
      async databaseId => {
        const { db } = await createDatabase(databaseId);

        const result = await db.readLatestEntityMetricValuesPerUtcDay(
          'component:default/test-service',
          'github.metric1',
          new Date('2023-01-01T00:00:00Z'),
          new Date('2023-01-02T00:00:00Z'),
        );

        expect(result).toEqual([]);
      },
    );

    it.each(databases.eachSupportedId())(
      'should include latest calculation error for error-only days - %p',
      async databaseId => {
        const { client, db } = await createDatabase(databaseId);
        const entityRef = 'component:default/test-service';
        const metricId = 'github.metric1';

        await client('metric_values').insert(
          [
            createMetricValue({
              entityRef,
              metricId,
              value: null,
              status: null,
              errorMessage: 'GitHub API 500',
              timestamp: new Date('2023-01-01T10:00:00Z'),
            }),
            createMetricValue({
              entityRef,
              metricId,
              value: null,
              status: null,
              errorMessage: 'timeout',
              timestamp: new Date('2023-01-01T16:00:00Z'),
            }),
          ].map(toMetricValueRow),
        );

        const result = await db.readLatestEntityMetricValuesPerUtcDay(
          entityRef,
          metricId,
          new Date('2023-01-01T00:00:00Z'),
          new Date('2023-01-01T23:59:59Z'),
        );

        expect(result).toHaveLength(1);
        expect(result[0].value).toBeNull();
        expect(result[0].errorMessage).toBe('timeout');
        expect(result[0].timestamp.toISOString()).toBe(
          '2023-01-01T16:00:00.000Z',
        );
      },
    );

    it.each(databases.eachSupportedId())(
      'should prefer a later error over an earlier success on the same UTC day - %p',
      async databaseId => {
        const { client, db } = await createDatabase(databaseId);
        const entityRef = 'component:default/test-service';
        const metricId = 'github.metric1';

        await client('metric_values').insert(
          [
            createMetricValue({
              entityRef,
              metricId,
              value: 5,
              timestamp: new Date('2023-01-01T09:00:00Z'),
            }),
            createMetricValue({
              entityRef,
              metricId,
              value: null,
              status: null,
              errorMessage: 'fail',
              timestamp: new Date('2023-01-01T21:00:00Z'),
            }),
          ].map(toMetricValueRow),
        );

        const result = await db.readLatestEntityMetricValuesPerUtcDay(
          entityRef,
          metricId,
          new Date('2023-01-01T00:00:00Z'),
          new Date('2023-01-01T23:59:59Z'),
        );

        expect(result).toHaveLength(1);
        expect(result[0].value).toBeNull();
        expect(result[0].errorMessage).toBe('fail');
        expect(result[0].timestamp.toISOString()).toBe(
          '2023-01-01T21:00:00.000Z',
        );
      },
    );

    it.each(databases.eachSupportedId())(
      'should prefer a later success over an earlier error on the same UTC day - %p',
      async databaseId => {
        const { client, db } = await createDatabase(databaseId);
        const entityRef = 'component:default/test-service';
        const metricId = 'github.metric1';

        await client('metric_values').insert(
          [
            createMetricValue({
              entityRef,
              metricId,
              value: null,
              status: null,
              errorMessage: 'fail',
              timestamp: new Date('2023-01-01T09:00:00Z'),
            }),
            createMetricValue({
              entityRef,
              metricId,
              value: 3,
              timestamp: new Date('2023-01-01T18:00:00Z'),
            }),
          ].map(toMetricValueRow),
        );

        const result = await db.readLatestEntityMetricValuesPerUtcDay(
          entityRef,
          metricId,
          new Date('2023-01-01T00:00:00Z'),
          new Date('2023-01-01T23:59:59Z'),
        );

        expect(result).toHaveLength(1);
        expect(result[0].value).toBe(3);
        expect(result[0].errorMessage).toBeNull();
      },
    );

    it.each(databases.eachSupportedId())(
      'should omit days that only have null without error_message - %p',
      async databaseId => {
        const { client, db } = await createDatabase(databaseId);
        const entityRef = 'component:default/test-service';
        const metricId = 'github.metric1';

        await client('metric_values').insert(
          [
            createMetricValue({
              entityRef,
              metricId,
              value: 8,
              timestamp: new Date('2023-01-01T10:00:00Z'),
            }),
            createMetricValue({
              entityRef,
              metricId,
              value: null,
              status: null,
              errorMessage: null,
              timestamp: new Date('2023-01-02T10:00:00Z'),
            }),
            createMetricValue({
              entityRef,
              metricId,
              value: 7,
              timestamp: new Date('2023-01-03T10:00:00Z'),
            }),
          ].map(toMetricValueRow),
        );

        const result = await db.readLatestEntityMetricValuesPerUtcDay(
          entityRef,
          metricId,
          new Date('2023-01-01T00:00:00Z'),
          new Date('2023-01-03T23:59:59Z'),
        );

        expect(result).toHaveLength(2);
        expect(result.map(r => r.value)).toEqual([8, 7]);
      },
    );
  });

  describe('cleanupExpiredMetrics', () => {
    it.each(databases.eachSupportedId())(
      'should delete metric values that are older than the given date - %p',
      async databaseId => {
        const { client, db } = await createDatabase(databaseId);

        await client('metric_values').insert(
          [
            {
              ...metricValues[0],
              timestamp: new Date('2022-01-01T00:00:00Z'),
            },
            {
              ...metricValues[1],
            },
          ].map(toMetricValueRow),
        );

        const result = await db.cleanupExpiredMetrics(
          new Date('2023-01-01T00:00:00Z'),
        );

        expect(result).toBe(1);
      },
    );
  });

  describe('readAggregatedMetricByEntityRefs', () => {
    it.each(databases.eachSupportedId())(
      'should aggregate metrics by status for multiple entities - %p',
      async databaseId => {
        const { client, db } = await createDatabase(databaseId);

        await client('metric_values').insert(
          [
            createMetricValue({
              entityRef: 'component:default/service1',
              value: 5,
              status: 'success',
            }),
            createMetricValue({
              entityRef: 'component:default/service2',
              value: 25,
              status: 'warning',
            }),
            createMetricValue({
              entityRef: 'component:default/service3',
              value: 60,
              status: 'critical',
            }),
          ].map(toMetricValueRow),
        );

        const result = await db.readAggregatedMetricByEntityRefs(
          [
            'component:default/service1',
            'component:default/service2',
            'component:default/service3',
          ],
          'github.metric1',
        );

        expect(result).toEqual({
          metricId: 'github.metric1',
          total: 3,
          statusCounts: expect.objectContaining({
            success: 1,
            warning: 1,
            critical: 1,
          }),
          maxTimestamp: baseTimestamp,
          calculationErrorCount: 0,
          latestEntityCount: 3,
        });
      },
    );

    it.each(databases.eachSupportedId())(
      'should filter by catalog entity refs and metricId - %p',
      async databaseId => {
        const { client, db } = await createDatabase(databaseId);

        await client('metric_values').insert(
          [
            createMetricValue({
              entityRef: 'component:default/service1',
              metricId: 'github.metric1',
              status: 'success',
            }),
            createMetricValue({
              entityRef: 'component:default/service2',
              metricId: 'github.metric1',
              status: 'warning',
            }),
            createMetricValue({
              entityRef: 'component:default/service1',
              metricId: 'github.metric2',
              status: 'error',
            }),
          ].map(toMetricValueRow),
        );

        const result = await db.readAggregatedMetricByEntityRefs(
          ['component:default/service1'],
          'github.metric1',
        );

        expect(result).toEqual({
          metricId: 'github.metric1',
          total: 1,
          statusCounts: { success: 1 },
          maxTimestamp: baseTimestamp,
          calculationErrorCount: 0,
          latestEntityCount: 1,
        });
      },
    );

    it.each(databases.eachSupportedId())(
      'should only include latest metric value per metric and entity - %p',
      async databaseId => {
        const { client, db } = await createDatabase(databaseId);

        const olderTime = new Date('2023-01-01T00:00:00Z');
        const newerTime = new Date('2023-01-01T01:00:00Z');

        await client('metric_values').insert(
          [
            createMetricValue({
              entityRef: 'component:default/service1',
              timestamp: olderTime,
              status: 'success',
            }),
            createMetricValue({
              entityRef: 'component:default/service1',
              timestamp: newerTime,
              status: 'error',
            }),
            createMetricValue({
              entityRef: 'component:default/service2',
              timestamp: olderTime,
              status: 'success',
            }),
            createMetricValue({
              entityRef: 'component:default/service2',
              timestamp: newerTime,
              status: 'error',
            }),
          ].map(toMetricValueRow),
        );

        const result = await db.readAggregatedMetricByEntityRefs(
          ['component:default/service1', 'component:default/service2'],
          'github.metric1',
        );

        expect(result).toEqual({
          metricId: 'github.metric1',
          total: 2,
          statusCounts: { error: 2 },
          maxTimestamp: newerTime,
          calculationErrorCount: 0,
          latestEntityCount: 2,
        });
      },
    );

    it.each(databases.eachSupportedId())(
      'should exclude entries with null value or status - %p',
      async databaseId => {
        const { client, db } = await createDatabase(databaseId);

        await client('metric_values').insert(
          [
            createMetricValue({
              entityRef: 'component:default/service1',
              value: 5,
              status: 'success',
            }),
            createMetricValue({
              entityRef: 'component:default/service2',
              value: null,
              status: 'error',
              errorMessage: 'Fetch failed',
            }),
            createMetricValue({
              entityRef: 'component:default/service3',
              value: 5,
              status: null,
              errorMessage: 'Invalid thresholds',
            }),
          ].map(toMetricValueRow),
        );

        const result = await db.readAggregatedMetricByEntityRefs(
          [
            'component:default/service1',
            'component:default/service2',
            'component:default/service3',
          ],
          'github.metric1',
        );

        expect(result).toEqual({
          metricId: 'github.metric1',
          total: 1,
          statusCounts: { success: 1 },
          maxTimestamp: baseTimestamp,
          calculationErrorCount: 1,
          latestEntityCount: 3,
        });
      },
    );

    it.each(databases.eachSupportedId())(
      'should return max timestamp across all status groups - %p',
      async databaseId => {
        const { client, db } = await createDatabase(databaseId);

        const time1 = new Date('2023-01-01T00:00:00Z');
        const time2 = new Date('2023-01-01T01:00:00Z');
        const time3 = new Date('2023-01-01T02:00:00Z');

        await client('metric_values').insert(
          [
            createMetricValue({
              entityRef: 'component:default/service1',
              timestamp: time1,
              status: 'success',
            }),
            createMetricValue({
              entityRef: 'component:default/service1',
              timestamp: time2,
              status: 'success',
            }),
            createMetricValue({
              entityRef: 'component:default/service2',
              timestamp: time3,
              status: 'error',
            }),
            createMetricValue({
              entityRef: 'component:default/service3',
              timestamp: time2,
              status: 'warning',
            }),
          ].map(toMetricValueRow),
        );

        const result = await db.readAggregatedMetricByEntityRefs(
          [
            'component:default/service1',
            'component:default/service2',
            'component:default/service3',
          ],
          'github.metric1',
        );

        expect(result).toEqual({
          metricId: 'github.metric1',
          total: 3,
          statusCounts: expect.objectContaining({
            success: 1,
            error: 1,
            warning: 1,
          }),
          maxTimestamp: time3,
          calculationErrorCount: 0,
          latestEntityCount: 3,
        });
      },
    );

    it.each(databases.eachSupportedId())(
      'should count multiple entities with same status - %p',
      async databaseId => {
        const { client, db } = await createDatabase(databaseId);

        await client('metric_values').insert(
          [
            createMetricValue({
              entityRef: 'component:default/service1',
              value: 25,
              status: 'warning',
            }),
            createMetricValue({
              entityRef: 'component:default/service2',
              value: 30,
              status: 'warning',
            }),
            createMetricValue({
              entityRef: 'component:default/service3',
              value: 1,
              status: 'success',
            }),
            createMetricValue({
              entityRef: 'component:default/service4',
              value: 35,
              status: 'warning',
            }),
          ].map(toMetricValueRow),
        );

        const result = await db.readAggregatedMetricByEntityRefs(
          [
            'component:default/service1',
            'component:default/service2',
            'component:default/service3',
          ],
          'github.metric1',
        );

        expect(result).toEqual({
          metricId: 'github.metric1',
          statusCounts: { success: 1, warning: 2 },
          total: 3,
          maxTimestamp: baseTimestamp,
          calculationErrorCount: 0,
          latestEntityCount: 3,
        });
      },
    );

    it.each(databases.eachSupportedId())(
      'should aggregate calculation errors when no successful values exist - %p',
      async databaseId => {
        const { client, db } = await createDatabase(databaseId);

        await client('metric_values').insert(
          [
            createMetricValue({
              entityRef: 'component:default/service1',
              value: null,
              status: null,
              errorMessage: 'boom-a',
            }),
            createMetricValue({
              entityRef: 'component:default/service2',
              value: null,
              status: null,
              errorMessage: 'boom-b',
            }),
          ].map(toMetricValueRow),
        );

        const result = await db.readAggregatedMetricByEntityRefs(
          ['component:default/service1', 'component:default/service2'],
          'github.metric1',
        );

        expect(result).toEqual({
          metricId: 'github.metric1',
          total: 0,
          statusCounts: {},
          maxTimestamp: baseTimestamp,
          calculationErrorCount: 2,
          latestEntityCount: 2,
        });
      },
    );

    it.each(databases.eachSupportedId())(
      'should treat JSON null metric values as calculation errors - %p',
      async databaseId => {
        const { client, db } = await createDatabase(databaseId);

        await client('metric_values').insert([
          {
            catalog_entity_ref: 'component:default/service1',
            metric_id: 'github.metric1',
            // Simulates a JSON literal null (not SQL NULL), seen in production DB rows.
            value: 'null',
            timestamp: baseTimestamp,
            error_message: 'boom-a',
            status: 'null',
          },
          {
            catalog_entity_ref: 'component:default/service2',
            metric_id: 'github.metric1',
            value: 4,
            timestamp: baseTimestamp,
            error_message: null,
            status: 'warning',
          },
        ]);

        const result = await db.readAggregatedMetricByEntityRefs(
          ['component:default/service1', 'component:default/service2'],
          'github.metric1',
        );

        expect(result).toEqual({
          metricId: 'github.metric1',
          total: 1,
          statusCounts: { warning: 1 },
          maxTimestamp: baseTimestamp,
          calculationErrorCount: 1,
          latestEntityCount: 2,
        });
      },
    );

    it.each(databases.eachSupportedId())(
      'should return undefined when no matching entities - %p',
      async databaseId => {
        const { client, db } = await createDatabase(databaseId);

        await client('metric_values').insert(
          [
            createMetricValue({
              entityRef: 'component:default/service1',
              status: 'success',
            }),
          ].map(toMetricValueRow),
        );

        const result = await db.readAggregatedMetricByEntityRefs(
          ['component:default/non-existent'],
          'github.metric1',
        );
        expect(result).toBeUndefined();
      },
    );
  });

  describe('readEntityMetricsWithFilters', () => {
    it.each(databases.eachSupportedId())(
      'should return paginated entity metrics filtered by status - %p',
      async databaseId => {
        const { client, db } = await createDatabase(databaseId);

        const baseTime = new Date('2023-01-01T00:00:00Z');
        const laterTime = new Date('2023-01-01T01:00:00Z');

        // Insert test data with different statuses
        await client('metric_values').insert(
          [
            // Older value for service1 - should be ignored
            {
              catalogEntityRef: 'component:default/service1',
              metricId: 'github.metric1',
              value: 999,
              timestamp: baseTime,
              status: 'success',
            },
            {
              catalogEntityRef: 'component:default/service1',
              metricId: 'github.metric1',
              value: 10,
              timestamp: laterTime,
              status: 'error',
            },
            {
              catalogEntityRef: 'component:default/service2',
              metricId: 'github.metric1',
              value: 5,
              timestamp: laterTime,
              status: 'success',
            },
            {
              catalogEntityRef: 'component:default/service3',
              metricId: 'github.metric1',
              value: 15,
              timestamp: laterTime,
              status: 'error',
            },
            {
              catalogEntityRef: 'component:default/service4',
              metricId: 'github.metric1',
              value: 3,
              timestamp: laterTime,
              status: 'warning',
            },
          ].map(toMetricValueRow),
        );

        const result = await db.readEntityMetricsWithFilters('github.metric1', {
          status: 'error',
          pagination: { limit: 10, offset: 0 },
        });

        // Should return 2 entities with error status
        expect(result).toHaveLength(2);

        // Check that both are error status
        expect(result[0].status).toBe('error');
        expect(result[1].status).toBe('error');

        // Verify it's the latest values (not the old one for service1)
        const service1Result = result.find(
          r => r.catalogEntityRef === 'component:default/service1',
        );
        expect(service1Result?.value).toBe(10); // Not 999 from older entry
      },
    );

    it.each(databases.eachSupportedId())(
      'should return all statuses when no filter provided - %p',
      async databaseId => {
        const { client, db } = await createDatabase(databaseId);

        const timestamp = new Date('2023-01-01T00:00:00Z');

        await client('metric_values').insert(
          [
            {
              catalogEntityRef: 'component:default/service1',
              metricId: 'github.metric1',
              value: 10,
              timestamp,
              status: 'error',
            },
            {
              catalogEntityRef: 'component:default/service2',
              metricId: 'github.metric1',
              value: 5,
              timestamp,
              status: 'success',
            },
            {
              catalogEntityRef: 'component:default/service3',
              metricId: 'github.metric1',
              value: 15,
              timestamp,
              status: 'warning',
            },
          ].map(toMetricValueRow),
        );

        const result = await db.readEntityMetricsWithFilters('github.metric1', {
          pagination: { limit: 10, offset: 0 },
        });

        expect(result).toHaveLength(3);
      },
    );

    it.each(databases.eachSupportedId())(
      'should handle pagination correctly - %p',
      async databaseId => {
        const { client, db } = await createDatabase(databaseId);

        const timestamp = new Date('2023-01-01T00:00:00Z');

        // Insert 5 entities with same status
        await client('metric_values').insert(
          [
            {
              catalogEntityRef: 'component:default/service1',
              metricId: 'github.metric1',
              value: 1,
              timestamp,
              status: 'error',
            },
            {
              catalogEntityRef: 'component:default/service2',
              metricId: 'github.metric1',
              value: 2,
              timestamp,
              status: 'error',
            },
            {
              catalogEntityRef: 'component:default/service3',
              metricId: 'github.metric1',
              value: 3,
              timestamp,
              status: 'error',
            },
            {
              catalogEntityRef: 'component:default/service4',
              metricId: 'github.metric1',
              value: 4,
              timestamp,
              status: 'error',
            },
            {
              catalogEntityRef: 'component:default/service5',
              metricId: 'github.metric1',
              value: 5,
              timestamp,
              status: 'error',
            },
          ].map(toMetricValueRow),
        );

        // Page 1: limit 2
        const page1 = await db.readEntityMetricsWithFilters('github.metric1', {
          status: 'error',
          pagination: { limit: 2, offset: 0 },
        });

        expect(page1).toHaveLength(2);

        // Page 2: limit 2, offset 2
        const page2 = await db.readEntityMetricsWithFilters('github.metric1', {
          status: 'error',
          pagination: { limit: 2, offset: 2 },
        });

        expect(page2).toHaveLength(2);

        // Page 3: limit 2, offset 4
        const page3 = await db.readEntityMetricsWithFilters('github.metric1', {
          status: 'error',
          pagination: { limit: 2, offset: 4 },
        });

        expect(page3).toHaveLength(1); // Only 1 left on page 3
      },
    );

    it.each(databases.eachSupportedId())(
      'should return empty result when database has no rows for the metric - %p',
      async databaseId => {
        const { db } = await createDatabase(databaseId);

        const result = await db.readEntityMetricsWithFilters('github.metric1', {
          status: 'error',
          pagination: { limit: 10, offset: 0 },
        });

        expect(result).toHaveLength(0);
      },
    );

    it.each(databases.eachSupportedId())(
      'should filter by entity kind - %p',
      async databaseId => {
        const { client, db } = await createDatabase(databaseId);

        const timestamp = new Date('2023-01-01T00:00:00Z');

        // Insert entities with different kinds
        await client('metric_values').insert(
          [
            {
              catalogEntityRef: 'component:default/service1',
              metricId: 'github.metric1',
              value: 10,
              timestamp,
              status: 'error',
              entityKind: 'Component',
              entityOwner: 'team:default/platform',
            },
            {
              catalogEntityRef: 'api:default/api1',
              metricId: 'github.metric1',
              value: 5,
              timestamp,
              status: 'error',
              entityKind: 'API',
              entityOwner: 'team:default/platform',
            },
            {
              catalogEntityRef: 'component:default/service2',
              metricId: 'github.metric1',
              value: 15,
              timestamp,
              status: 'error',
              entityKind: 'Component',
              entityOwner: 'team:default/backend',
            },
          ].map(toMetricValueRow),
        );

        const result = await db.readEntityMetricsWithFilters('github.metric1', {
          status: 'error',
          entityKind: 'Component', // Filter by kind
          pagination: { limit: 10, offset: 0 },
        });

        // Should only return Component entities
        expect(result).toHaveLength(2);
        expect(result[0].entityKind).toBe('Component');
        expect(result[1].entityKind).toBe('Component');
      },
    );

    it.each(databases.eachSupportedId())(
      'should filter by entity owner - %p',
      async databaseId => {
        const { client, db } = await createDatabase(databaseId);

        const timestamp = new Date('2023-01-01T00:00:00Z');

        // Insert entities with different owners
        await client('metric_values').insert(
          [
            {
              catalogEntityRef: 'component:default/service1',
              metricId: 'github.metric1',
              value: 10,
              timestamp,
              status: 'error',
              entityKind: 'Component',
              entityOwner: 'team:default/platform',
            },
            {
              catalogEntityRef: 'component:default/service2',
              metricId: 'github.metric1',
              value: 5,
              timestamp,
              status: 'error',
              entityKind: 'Component',
              entityOwner: 'team:default/backend',
            },
            {
              catalogEntityRef: 'component:default/service3',
              metricId: 'github.metric1',
              value: 15,
              timestamp,
              status: 'error',
              entityKind: 'Component',
              entityOwner: 'team:default/platform',
            },
          ].map(toMetricValueRow),
        );

        const result = await db.readEntityMetricsWithFilters('github.metric1', {
          status: 'error',
          entityOwner: ['team:default/platform'], // Filter by owner
          pagination: { limit: 10, offset: 0 },
        });

        // Should only return entities owned by team:default/platform
        expect(result).toHaveLength(2);
        expect(result[0].entityOwner).toBe('team:default/platform');
        expect(result[1].entityOwner).toBe('team:default/platform');
      },
    );

    it.each(databases.eachSupportedId())(
      'should filter by status, kind, and owner together - %p',
      async databaseId => {
        const { client, db } = await createDatabase(databaseId);

        const timestamp = new Date('2023-01-01T00:00:00Z');

        // Insert diverse test data
        await client('metric_values').insert(
          [
            {
              catalogEntityRef: 'component:default/service1',
              metricId: 'github.metric1',
              value: 10,
              timestamp,
              status: 'error',
              entityKind: 'Component',
              entityOwner: 'team:default/platform',
            },
            {
              catalogEntityRef: 'api:default/api1',
              metricId: 'github.metric1',
              value: 5,
              timestamp,
              status: 'error',
              entityKind: 'API',
              entityOwner: 'team:default/platform',
            },
            {
              catalogEntityRef: 'component:default/service2',
              metricId: 'github.metric1',
              value: 15,
              timestamp,
              status: 'warning',
              entityKind: 'Component',
              entityOwner: 'team:default/platform',
            },
            {
              catalogEntityRef: 'component:default/service3',
              metricId: 'github.metric1',
              value: 20,
              timestamp,
              status: 'error',
              entityKind: 'Component',
              entityOwner: 'team:default/backend',
            },
          ].map(toMetricValueRow),
        );

        const result = await db.readEntityMetricsWithFilters('github.metric1', {
          status: 'error', // Only error status
          entityKind: 'Component', // Only Component kind
          entityOwner: ['team:default/platform'], // Only platform team
          pagination: { limit: 10, offset: 0 },
        });

        // Should only return service1 (Component, error, platform)
        expect(result).toHaveLength(1);
        expect(result[0].catalogEntityRef).toBe('component:default/service1');
        expect(result[0].status).toBe('error');
        expect(result[0].entityKind).toBe('Component');
        expect(result[0].entityOwner).toBe('team:default/platform');
      },
    );

    it.each(databases.eachSupportedId())(
      'should work without pagination (fetch all) - %p',
      async databaseId => {
        const { client, db } = await createDatabase(databaseId);

        const timestamp = new Date('2023-01-01T00:00:00Z');

        await client('metric_values').insert(
          [
            {
              catalogEntityRef: 'component:default/service1',
              metricId: 'github.metric1',
              value: 10,
              timestamp,
              status: 'error',
              entityKind: 'Component',
              entityOwner: 'team:default/platform',
            },
            {
              catalogEntityRef: 'component:default/service2',
              metricId: 'github.metric1',
              value: 5,
              timestamp,
              status: 'error',
              entityKind: 'Component',
              entityOwner: 'team:default/platform',
            },
            {
              catalogEntityRef: 'component:default/service3',
              metricId: 'github.metric1',
              value: 15,
              timestamp,
              status: 'error',
              entityKind: 'Component',
              entityOwner: 'team:default/platform',
            },
          ].map(toMetricValueRow),
        );

        // No pagination parameter - should return all
        const result = await db.readEntityMetricsWithFilters('github.metric1', {
          status: 'error',
        });

        expect(result).toHaveLength(3);
      },
    );

    it.each(databases.eachSupportedId())(
      'should handle null entityKind and entityOwner - %p',
      async databaseId => {
        const { client, db } = await createDatabase(databaseId);

        const timestamp = new Date('2023-01-01T00:00:00Z');

        // Insert entity with null kind/owner (legacy data)
        await client('metric_values').insert(
          [
            {
              catalogEntityRef: 'component:default/service1',
              metricId: 'github.metric1',
              value: 10,
              timestamp,
              status: 'error',
              entityKind: null,
              entityOwner: null,
            },
            {
              catalogEntityRef: 'component:default/service2',
              metricId: 'github.metric1',
              value: 5,
              timestamp,
              status: 'error',
              entityKind: 'Component',
              entityOwner: 'team:default/platform',
            },
          ].map(toMetricValueRow),
        );

        // Should return both when no filters
        const result = await db.readEntityMetricsWithFilters('github.metric1', {
          status: 'error',
          pagination: { limit: 10, offset: 0 },
        });

        expect(result).toHaveLength(2);

        // Should only return service2 when filtering by kind
        const filteredResult = await db.readEntityMetricsWithFilters(
          'github.metric1',
          {
            status: 'error',
            entityKind: 'Component',
            pagination: { limit: 10, offset: 0 },
          },
        );

        expect(filteredResult).toHaveLength(1);
        expect(filteredResult[0].catalogEntityRef).toBe(
          'component:default/service2',
        );
      },
    );

    it.each(databases.eachSupportedId())(
      'should return all rows when no owner filter is applied - %p',
      async databaseId => {
        const { client, db } = await createDatabase(databaseId);

        const timestamp = new Date('2023-01-01T00:00:00Z');

        await client('metric_values').insert(
          [
            {
              catalogEntityRef: 'component:default/service1',
              metricId: 'github.metric1',
              value: 10,
              timestamp,
              status: 'success',
              entityKind: 'Component',
              entityOwner: 'team:default/platform',
            },
            {
              catalogEntityRef: 'component:default/service2',
              metricId: 'github.metric1',
              value: 5,
              timestamp,
              status: 'warning',
              entityKind: 'Component',
              entityOwner: 'team:default/backend',
            },
          ].map(toMetricValueRow),
        );

        // No owner filter — all rows for the metric are returned.
        // Per-row authorization is enforced downstream by catalog.getEntitiesByRefs.
        const result = await db.readEntityMetricsWithFilters('github.metric1', {
          pagination: { limit: 10, offset: 0 },
        });

        expect(result).toHaveLength(2);
      },
    );

    it.each(databases.eachSupportedId())(
      'should filter by multiple owner refs - %p',
      async databaseId => {
        const { client, db } = await createDatabase(databaseId);

        const timestamp = new Date('2023-01-01T00:00:00Z');

        await client('metric_values').insert(
          [
            {
              catalogEntityRef: 'component:default/service1',
              metricId: 'github.metric1',
              value: 10,
              timestamp,
              status: 'error',
              entityKind: 'Component',
              entityOwner: 'team:default/platform',
            },
            {
              catalogEntityRef: 'component:default/service2',
              metricId: 'github.metric1',
              value: 5,
              timestamp,
              status: 'error',
              entityKind: 'Component',
              entityOwner: 'team:default/backend',
            },
            {
              catalogEntityRef: 'component:default/service3',
              metricId: 'github.metric1',
              value: 8,
              timestamp,
              status: 'error',
              entityKind: 'Component',
              entityOwner: 'team:default/other',
            },
          ].map(toMetricValueRow),
        );

        // Passing two owners returns only those two teams' entities.
        const result = await db.readEntityMetricsWithFilters('github.metric1', {
          status: 'error',
          entityOwner: ['team:default/platform', 'team:default/backend'],
          pagination: { limit: 10, offset: 0 },
        });

        expect(result).toHaveLength(2);
        expect(
          result
            .map(r => r.entityOwner)
            .filter((o): o is string => o !== null)
            .sort((a, b) => a.localeCompare(b)),
        ).toEqual(['team:default/backend', 'team:default/platform']);
      },
    );

    it.each(databases.eachSupportedId())(
      'should filter by entityName substring via catalogEntityRef LIKE - %p',
      async databaseId => {
        const { client, db } = await createDatabase(databaseId);

        const timestamp = new Date('2023-01-01T00:00:00Z');

        await client('metric_values').insert(
          [
            {
              catalogEntityRef: 'component:default/my-service',
              metricId: 'github.metric1',
              value: 10,
              timestamp,
              status: 'error',
              entityKind: 'Component',
              entityOwner: 'team:default/platform',
            },
            {
              catalogEntityRef: 'component:default/service-api',
              metricId: 'github.metric1',
              value: 5,
              timestamp,
              status: 'error',
              entityKind: 'Component',
              entityOwner: 'team:default/platform',
            },
            {
              catalogEntityRef: 'component:default/unrelated',
              metricId: 'github.metric1',
              value: 15,
              timestamp,
              status: 'error',
              entityKind: 'Component',
              entityOwner: 'team:default/platform',
            },
          ].map(toMetricValueRow),
        );

        // 'service' should match 'my-service' and 'service-api' but not 'unrelated'
        const result = await db.readEntityMetricsWithFilters('github.metric1', {
          entityName: 'service',
          pagination: { limit: 10, offset: 0 },
        });

        expect(result).toHaveLength(2);
        expect(
          result
            .map(r => r.catalogEntityRef)
            .sort((a, b) => a.localeCompare(b)),
        ).toEqual([
          'component:default/my-service',
          'component:default/service-api',
        ]);
      },
    );

    it.each(databases.eachSupportedId())(
      'should sort by catalogEntityRef ascending when sortBy=entityName - %p',
      async databaseId => {
        const { client, db } = await createDatabase(databaseId);

        const timestamp = new Date('2023-01-01T00:00:00Z');

        await client('metric_values').insert(
          [
            {
              catalogEntityRef: 'component:default/service-c',
              metricId: 'github.metric1',
              value: 1,
              timestamp,
              status: 'success',
            },
            {
              catalogEntityRef: 'component:default/service-a',
              metricId: 'github.metric1',
              value: 2,
              timestamp,
              status: 'success',
            },
            {
              catalogEntityRef: 'component:default/service-b',
              metricId: 'github.metric1',
              value: 3,
              timestamp,
              status: 'success',
            },
          ].map(toMetricValueRow),
        );

        const result = await db.readEntityMetricsWithFilters('github.metric1', {
          sortBy: 'entityName',
          sortOrder: 'asc',
          pagination: { limit: 10, offset: 0 },
        });

        expect(result).toHaveLength(3);
        expect(result[0].catalogEntityRef).toBe('component:default/service-a');
        expect(result[1].catalogEntityRef).toBe('component:default/service-b');
        expect(result[2].catalogEntityRef).toBe('component:default/service-c');
      },
    );

    it.each(databases.eachSupportedId())(
      'should sort by value descending with nulls last when sortBy=metricValue - %p',
      async databaseId => {
        const { client, db } = await createDatabase(databaseId);

        const timestamp = new Date('2023-01-01T00:00:00Z');

        await client('metric_values').insert(
          [
            {
              catalogEntityRef: 'component:default/service-a',
              metricId: 'github.metric1',
              value: null,
              timestamp,
              status: 'error',
            },
            {
              catalogEntityRef: 'component:default/service-b',
              metricId: 'github.metric1',
              value: 5,
              timestamp,
              status: 'error',
            },
            {
              catalogEntityRef: 'component:default/service-c',
              metricId: 'github.metric1',
              value: 15,
              timestamp,
              status: 'error',
            },
          ].map(toMetricValueRow),
        );

        const result = await db.readEntityMetricsWithFilters('github.metric1', {
          sortBy: 'metricValue',
          sortOrder: 'desc',
          pagination: { limit: 10, offset: 0 },
        });

        expect(result).toHaveLength(3);
        expect(result[0].value).toBe(15);
        expect(result[1].value).toBe(5);
        expect(result[2].value).toBeNull(); // null sorted last
      },
    );

    it.each(databases.eachSupportedId())(
      'should sort by status ascending when sortBy=status - %p',
      async databaseId => {
        const { client, db } = await createDatabase(databaseId);

        const timestamp = new Date('2023-01-01T00:00:00Z');

        await client('metric_values').insert(
          [
            {
              catalogEntityRef: 'component:default/service-c',
              metricId: 'github.metric1',
              value: 1,
              timestamp,
              status: 'warning',
            },
            {
              catalogEntityRef: 'component:default/service-a',
              metricId: 'github.metric1',
              value: 2,
              timestamp,
              status: 'error',
            },
            {
              catalogEntityRef: 'component:default/service-b',
              metricId: 'github.metric1',
              value: 3,
              timestamp,
              status: 'success',
            },
            {
              catalogEntityRef: 'component:default/service-d',
              metricId: 'github.metric1',
              value: 4,
              timestamp,
              status: null,
            },
          ].map(toMetricValueRow),
        );

        const result = await db.readEntityMetricsWithFilters('github.metric1', {
          sortBy: 'status',
          sortOrder: 'asc',
          pagination: { limit: 10, offset: 0 },
        });

        expect(result).toHaveLength(4);
        // Alphabetical ascending: error < success < warning, NULL always last
        expect(result[0].status).toBe('error');
        expect(result[1].status).toBe('success');
        expect(result[2].status).toBe('warning');
        expect(result[3].status).toBeNull();
      },
    );
  });

  describe('readScalarAggregatedMetricByEntityRefs', () => {
    describe.each(databases.eachSupportedId())('%p', databaseId => {
      let db: DatabaseMetricValues;

      beforeAll(async () => {
        const database = await createDatabase(databaseId);
        const { client } = database;
        db = database.db;

        await client('metric_values').insert(
          [
            createMetricValue({
              entityRef: 'component:default/service1',
              value: 10,
              status: 'success',
            }),
            createMetricValue({
              entityRef: 'component:default/service2',
              value: 25,
              status: 'warning',
            }),
            createMetricValue({
              entityRef: 'component:default/service3',
              value: 5,
              status: 'error',
            }),
            createMetricValue({
              entityRef: 'component:default/service2',
              value: 2,
              status: 'success',
            }),
          ].map(toMetricValueRow),
        );
      });

      it('should sum raw metric values across latest rows', async () => {
        const result = await db.readScalarAggregatedMetricByEntityRefs(
          [
            'component:default/service1',
            'component:default/service2',
            'component:default/service3',
          ],
          'github.metric1',
          'sum',
        );

        expect(result).toEqual({
          metricId: 'github.metric1',
          value: 17,
          total: 3,
          latestEntityCount: 3,
          calculationErrorCount: 0,
          maxTimestamp: baseTimestamp,
        });
      });

      it('should average raw metric values across latest rows', async () => {
        const result = await db.readScalarAggregatedMetricByEntityRefs(
          [
            'component:default/service1',
            'component:default/service2',
            'component:default/service3',
          ],
          'github.metric1',
          'average',
        );

        expect(result).toMatchObject({
          metricId: 'github.metric1',
          total: 3,
          latestEntityCount: 3,
          calculationErrorCount: 0,
          maxTimestamp: baseTimestamp,
        });
        expect(result?.value).toBeCloseTo(17 / 3);
      });

      it('should count raw metric values across latest rows', async () => {
        const result = await db.readScalarAggregatedMetricByEntityRefs(
          [
            'component:default/service1',
            'component:default/service2',
            'component:default/service3',
          ],
          'github.metric1',
          'count',
        );

        expect(result).toEqual({
          metricId: 'github.metric1',
          value: 3,
          total: 3,
          latestEntityCount: 3,
          calculationErrorCount: 0,
          maxTimestamp: baseTimestamp,
        });
      });

      it('should max raw metric values across latest rows', async () => {
        const result = await db.readScalarAggregatedMetricByEntityRefs(
          [
            'component:default/service1',
            'component:default/service2',
            'component:default/service3',
          ],
          'github.metric1',
          'max',
        );

        expect(result).toEqual({
          metricId: 'github.metric1',
          value: 10,
          total: 3,
          latestEntityCount: 3,
          calculationErrorCount: 0,
          maxTimestamp: baseTimestamp,
        });
      });

      it('should min raw metric values across latest rows', async () => {
        const result = await db.readScalarAggregatedMetricByEntityRefs(
          [
            'component:default/service1',
            'component:default/service2',
            'component:default/service3',
          ],
          'github.metric1',
          'min',
        );

        expect(result).toEqual({
          metricId: 'github.metric1',
          value: 2,
          total: 3,
          latestEntityCount: 3,
          calculationErrorCount: 0,
          maxTimestamp: baseTimestamp,
        });
      });
    });

    it.each(databases.eachSupportedId())(
      'should exclude calculation failures and use latest row per entity - %p',
      async databaseId => {
        const { client, db } = await createDatabase(databaseId);

        const olderTime = new Date('2023-01-01T00:00:00Z');
        const newerTime = new Date('2023-01-01T01:00:00Z');

        await client('metric_values').insert(
          [
            createMetricValue({
              entityRef: 'component:default/service1',
              timestamp: olderTime,
              value: 5,
              status: 'success',
            }),
            createMetricValue({
              entityRef: 'component:default/service1',
              timestamp: newerTime,
              value: 15,
              status: 'warning',
            }),
            createMetricValue({
              entityRef: 'component:default/service2',
              value: null,
              status: null,
              errorMessage: 'Failed to fetch',
            }),
          ].map(toMetricValueRow),
        );

        const result = await db.readScalarAggregatedMetricByEntityRefs(
          ['component:default/service1', 'component:default/service2'],
          'github.metric1',
          'sum',
        );

        expect(result).toEqual({
          metricId: 'github.metric1',
          value: 15,
          total: 1,
          latestEntityCount: 2,
          calculationErrorCount: 1,
          maxTimestamp: newerTime,
        });
      },
    );

    it.each(databases.eachSupportedId())(
      'should return undefined when entity refs have no metric rows - %p',
      async databaseId => {
        const { db } = await createDatabase(databaseId);

        const result = await db.readScalarAggregatedMetricByEntityRefs(
          ['component:default/service-without-data'],
          'github.metric1',
          'sum',
        );

        expect(result).toBeUndefined();
      },
    );

    it.each(databases.eachSupportedId())(
      'should exclude rows with null value from aggregate - %p',
      async databaseId => {
        const { client, db } = await createDatabase(databaseId);

        await client('metric_values').insert(
          [
            createMetricValue({
              entityRef: 'component:default/service1',
              value: 10,
              status: 'success',
            }),
            createMetricValue({
              entityRef: 'component:default/service2',
              value: null,
              status: null,
            }),
          ].map(toMetricValueRow),
        );

        const result = await db.readScalarAggregatedMetricByEntityRefs(
          ['component:default/service1', 'component:default/service2'],
          'github.metric1',
          'sum',
        );

        expect(result?.value).toBe(10);
        expect(result?.total).toBe(1);
        expect(result?.latestEntityCount).toBe(2);
      },
    );

    it.each(databases.eachSupportedId())(
      'should return undefined when entity refs list is empty - %p',
      async databaseId => {
        const { db } = await createDatabase(databaseId);

        const result = await db.readScalarAggregatedMetricByEntityRefs(
          [],
          'github.metric1',
          'sum',
        );

        expect(result).toBeUndefined();
      },
    );

    describe.each(databases.eachSupportedId())(
      'status filter - %p',
      databaseId => {
        let db: DatabaseMetricValues;

        beforeAll(async () => {
          const database = await createDatabase(databaseId);
          const { client } = database;
          db = database.db;

          await client('metric_values').insert(
            [
              createMetricValue({
                entityRef: 'component:default/service1',
                value: 10,
                status: 'success',
              }),
              createMetricValue({
                entityRef: 'component:default/service2',
                value: 25,
                status: 'error',
              }),
              createMetricValue({
                entityRef: 'component:default/service3',
                value: 5,
                status: 'error',
              }),
              createMetricValue({
                entityRef: 'component:default/service4',
                value: null,
                status: null,
                errorMessage: 'Failed to fetch',
              }),
            ].map(toMetricValueRow),
          );
        });

        const entityRefs = [
          'component:default/service1',
          'component:default/service2',
          'component:default/service3',
          'component:default/service4',
        ];

        const portfolioCounts = {
          latestEntityCount: 4,
          calculationErrorCount: 1,
          maxTimestamp: baseTimestamp,
        };

        it.each([
          ['sum', 'error', { value: 30, total: 2 }],
          ['count', 'error', { value: 2, total: 2 }],
          ['max', 'error', { value: 25, total: 2 }],
          ['min', 'error', { value: 5, total: 2 }],
          ['average', 'error', { value: 15, total: 2 }],
          ['sum', 'success', { value: 10, total: 1 }],
        ] as const)(
          'should %s only rows matching filter.status=%s',
          async (aggregationFn, status, expected) => {
            const result = await db.readScalarAggregatedMetricByEntityRefs(
              entityRefs,
              'github.metric1',
              aggregationFn,
              { status },
            );

            expect(result).toEqual({
              metricId: 'github.metric1',
              ...expected,
              ...portfolioCounts,
            });
          },
        );

        it('should return zero value and total when no rows match filter.status', async () => {
          const result = await db.readScalarAggregatedMetricByEntityRefs(
            entityRefs,
            'github.metric1',
            'sum',
            { status: 'warning' },
          );

          expect(result).toEqual({
            metricId: 'github.metric1',
            value: 0,
            total: 0,
            ...portfolioCounts,
          });
        });
      },
    );
  });
});
