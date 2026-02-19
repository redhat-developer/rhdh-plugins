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
import { migrate } from './migration';

jest.setTimeout(60000);

const baseTimestamp = new Date('2023-01-01T00:00:00Z');

const metricValues: DbMetricValueCreate[] = [
  {
    catalog_entity_ref: 'component:default/test-service',
    metric_id: 'github.metric1',
    value: 41,
    timestamp: baseTimestamp,
    status: 'success',
  },
  {
    catalog_entity_ref: 'component:default/another-service',
    metric_id: 'github.metric1',
    value: 25,
    timestamp: baseTimestamp,
    status: 'success',
  },
  {
    catalog_entity_ref: 'component:default/another-service',
    metric_id: 'github.metric2',
    timestamp: baseTimestamp,
    error_message: 'Failed to fetch metric',
  },
];

const createMetricValue = (overrides: {
  entityRef: string;
  metricId?: string;
  timestamp?: Date;
  value?: number | null;
  status?: string | null;
  errorMessage?: string | null;
}) => ({
  catalog_entity_ref: overrides.entityRef,
  metric_id: overrides.metricId ?? 'github.metric1',
  timestamp: overrides.timestamp ?? baseTimestamp,
  value: overrides.value === undefined ? 10 : overrides.value,
  error_message: overrides.errorMessage ?? null,
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

        await client('metric_values').insert([
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
            catalog_entity_ref: 'component:default/test-service',
            metric_id: 'github.metric2',
            value: undefined,
            timestamp: baseTime,
            error_message: 'Failed to fetch metric',
          },
        ]);

        const result = await db.readLatestEntityMetricValues(
          'component:default/test-service',
          ['github.metric1', 'github.metric2'],
        );

        expect(result).toHaveLength(2);

        const metric1Result = result.find(
          r => r.metric_id === 'github.metric1',
        );
        const metric2Result = result.find(
          r => r.metric_id === 'github.metric2',
        );

        expect(metric1Result).toMatchObject({
          catalog_entity_ref: 'component:default/test-service',
          metric_id: 'github.metric1',
          value: 41,
        });

        expect(metric2Result).toMatchObject({
          catalog_entity_ref: 'component:default/test-service',
          metric_id: 'github.metric2',
          value: null,
        });
      },
    );
  });

  describe('cleanupExpiredMetrics', () => {
    it.each(databases.eachSupportedId())(
      'should delete metric values that are older than the given date - %p',
      async databaseId => {
        const { client, db } = await createDatabase(databaseId);

        await client('metric_values').insert([
          {
            ...metricValues[0],
            timestamp: new Date('2022-01-01T00:00:00Z'),
          },
          {
            ...metricValues[1],
          },
        ]);

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

        await client('metric_values').insert([
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
        ]);

        const result = await db.readAggregatedMetricByEntityRefs(
          [
            'component:default/service1',
            'component:default/service2',
            'component:default/service3',
          ],
          'github.metric1',
        );

        expect(result).toEqual({
          metric_id: 'github.metric1',
          total: 3,
          statusCounts: expect.arrayContaining([
            { count: 1, name: 'success' },
            { count: 1, name: 'warning' },
            { count: 1, name: 'critical' },
          ]),
          max_timestamp: baseTimestamp,
        });
      },
    );

    it.each(databases.eachSupportedId())(
      'should filter by catalog entity refs and metric_id - %p',
      async databaseId => {
        const { client, db } = await createDatabase(databaseId);

        await client('metric_values').insert([
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
        ]);

        const result = await db.readAggregatedMetricByEntityRefs(
          ['component:default/service1'],
          'github.metric1',
        );

        expect(result).toEqual({
          metric_id: 'github.metric1',
          total: 1,
          statusCounts: [{ count: 1, name: 'success' }],
          max_timestamp: baseTimestamp,
        });
      },
    );

    it.each(databases.eachSupportedId())(
      'should only include latest metric value per metric and entity - %p',
      async databaseId => {
        const { client, db } = await createDatabase(databaseId);

        const olderTime = new Date('2023-01-01T00:00:00Z');
        const newerTime = new Date('2023-01-01T01:00:00Z');

        await client('metric_values').insert([
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
        ]);

        const result = await db.readAggregatedMetricByEntityRefs(
          ['component:default/service1', 'component:default/service2'],
          'github.metric1',
        );

        expect(result).toEqual({
          metric_id: 'github.metric1',
          total: 2,
          statusCounts: [{ count: 2, name: 'error' }],
          max_timestamp: newerTime,
        });
      },
    );

    it.each(databases.eachSupportedId())(
      'should exclude entries with null value or status - %p',
      async databaseId => {
        const { client, db } = await createDatabase(databaseId);

        await client('metric_values').insert([
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
        ]);

        const result = await db.readAggregatedMetricByEntityRefs(
          [
            'component:default/service1',
            'component:default/service2',
            'component:default/service3',
          ],
          'github.metric1',
        );

        expect(result).toEqual({
          metric_id: 'github.metric1',
          total: 1,
          statusCounts: [{ count: 1, name: 'success' }],
          max_timestamp: baseTimestamp,
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

        await client('metric_values').insert([
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
        ]);

        const result = await db.readAggregatedMetricByEntityRefs(
          [
            'component:default/service1',
            'component:default/service2',
            'component:default/service3',
          ],
          'github.metric1',
        );

        expect(result).toEqual({
          metric_id: 'github.metric1',
          total: 3,
          statusCounts: expect.arrayContaining([
            { count: 1, name: 'success' },
            { count: 1, name: 'error' },
            { count: 1, name: 'warning' },
          ]),
          max_timestamp: time3,
        });
      },
    );

    it.each(databases.eachSupportedId())(
      'should count multiple entities with same status - %p',
      async databaseId => {
        const { client, db } = await createDatabase(databaseId);

        await client('metric_values').insert([
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
        ]);

        const result = await db.readAggregatedMetricByEntityRefs(
          [
            'component:default/service1',
            'component:default/service2',
            'component:default/service3',
          ],
          'github.metric1',
        );

        expect(result).toEqual({
          metric_id: 'github.metric1',
          statusCounts: [
            { count: 1, name: 'success' },
            { count: 2, name: 'warning' },
          ],
          total: 3,
          max_timestamp: baseTimestamp,
        });
      },
    );

    it.each(databases.eachSupportedId())(
      'should return undefined when no matching entities - %p',
      async databaseId => {
        const { client, db } = await createDatabase(databaseId);

        await client('metric_values').insert([
          createMetricValue({
            entityRef: 'component:default/service1',
            status: 'success',
          }),
        ]);

        const result = await db.readAggregatedMetricByEntityRefs(
          ['component:default/non-existent'],
          'github.metric1',
        );
        expect(result).toBeUndefined();
      },
    );
  });
});
