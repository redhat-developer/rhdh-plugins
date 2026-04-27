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
          statusCounts: expect.objectContaining({
            success: 1,
            warning: 1,
            critical: 1,
          }),
          max_timestamp: baseTimestamp,
          calculation_error_count: 0,
          latest_entity_count: 3,
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
          statusCounts: { success: 1 },
          max_timestamp: baseTimestamp,
          calculation_error_count: 0,
          latest_entity_count: 1,
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
          statusCounts: { error: 2 },
          max_timestamp: newerTime,
          calculation_error_count: 0,
          latest_entity_count: 2,
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
          statusCounts: { success: 1 },
          max_timestamp: baseTimestamp,
          calculation_error_count: 1,
          latest_entity_count: 3,
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
          statusCounts: expect.objectContaining({
            success: 1,
            error: 1,
            warning: 1,
          }),
          max_timestamp: time3,
          calculation_error_count: 0,
          latest_entity_count: 3,
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
          statusCounts: { success: 1, warning: 2 },
          total: 3,
          max_timestamp: baseTimestamp,
          calculation_error_count: 0,
          latest_entity_count: 3,
        });
      },
    );

    it.each(databases.eachSupportedId())(
      'should aggregate calculation errors when no successful values exist - %p',
      async databaseId => {
        const { client, db } = await createDatabase(databaseId);

        await client('metric_values').insert([
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
        ]);

        const result = await db.readAggregatedMetricByEntityRefs(
          ['component:default/service1', 'component:default/service2'],
          'github.metric1',
        );

        expect(result).toEqual({
          metric_id: 'github.metric1',
          total: 0,
          statusCounts: {},
          max_timestamp: baseTimestamp,
          calculation_error_count: 2,
          latest_entity_count: 2,
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
          metric_id: 'github.metric1',
          total: 1,
          statusCounts: { warning: 1 },
          max_timestamp: baseTimestamp,
          calculation_error_count: 1,
          latest_entity_count: 2,
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

  describe('readEntityMetricsWithFilters', () => {
    it.each(databases.eachSupportedId())(
      'should return paginated entity metrics filtered by status - %p',
      async databaseId => {
        const { client, db } = await createDatabase(databaseId);

        const baseTime = new Date('2023-01-01T00:00:00Z');
        const laterTime = new Date('2023-01-01T01:00:00Z');

        // Insert test data with different statuses
        await client('metric_values').insert([
          // Older value for service1 - should be ignored
          {
            catalog_entity_ref: 'component:default/service1',
            metric_id: 'github.metric1',
            value: 999,
            timestamp: baseTime,
            status: 'success',
          },
          {
            catalog_entity_ref: 'component:default/service1',
            metric_id: 'github.metric1',
            value: 10,
            timestamp: laterTime,
            status: 'error',
          },
          {
            catalog_entity_ref: 'component:default/service2',
            metric_id: 'github.metric1',
            value: 5,
            timestamp: laterTime,
            status: 'success',
          },
          {
            catalog_entity_ref: 'component:default/service3',
            metric_id: 'github.metric1',
            value: 15,
            timestamp: laterTime,
            status: 'error',
          },
          {
            catalog_entity_ref: 'component:default/service4',
            metric_id: 'github.metric1',
            value: 3,
            timestamp: laterTime,
            status: 'warning',
          },
        ]);

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
          r => r.catalog_entity_ref === 'component:default/service1',
        );
        expect(service1Result?.value).toBe(10); // Not 999 from older entry
      },
    );

    it.each(databases.eachSupportedId())(
      'should return all statuses when no filter provided - %p',
      async databaseId => {
        const { client, db } = await createDatabase(databaseId);

        const timestamp = new Date('2023-01-01T00:00:00Z');

        await client('metric_values').insert([
          {
            catalog_entity_ref: 'component:default/service1',
            metric_id: 'github.metric1',
            value: 10,
            timestamp,
            status: 'error',
          },
          {
            catalog_entity_ref: 'component:default/service2',
            metric_id: 'github.metric1',
            value: 5,
            timestamp,
            status: 'success',
          },
          {
            catalog_entity_ref: 'component:default/service3',
            metric_id: 'github.metric1',
            value: 15,
            timestamp,
            status: 'warning',
          },
        ]);

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
        await client('metric_values').insert([
          {
            catalog_entity_ref: 'component:default/service1',
            metric_id: 'github.metric1',
            value: 1,
            timestamp,
            status: 'error',
          },
          {
            catalog_entity_ref: 'component:default/service2',
            metric_id: 'github.metric1',
            value: 2,
            timestamp,
            status: 'error',
          },
          {
            catalog_entity_ref: 'component:default/service3',
            metric_id: 'github.metric1',
            value: 3,
            timestamp,
            status: 'error',
          },
          {
            catalog_entity_ref: 'component:default/service4',
            metric_id: 'github.metric1',
            value: 4,
            timestamp,
            status: 'error',
          },
          {
            catalog_entity_ref: 'component:default/service5',
            metric_id: 'github.metric1',
            value: 5,
            timestamp,
            status: 'error',
          },
        ]);

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
        await client('metric_values').insert([
          {
            catalog_entity_ref: 'component:default/service1',
            metric_id: 'github.metric1',
            value: 10,
            timestamp,
            status: 'error',
            entity_kind: 'Component',
            entity_owner: 'team:default/platform',
          },
          {
            catalog_entity_ref: 'api:default/api1',
            metric_id: 'github.metric1',
            value: 5,
            timestamp,
            status: 'error',
            entity_kind: 'API',
            entity_owner: 'team:default/platform',
          },
          {
            catalog_entity_ref: 'component:default/service2',
            metric_id: 'github.metric1',
            value: 15,
            timestamp,
            status: 'error',
            entity_kind: 'Component',
            entity_owner: 'team:default/backend',
          },
        ]);

        const result = await db.readEntityMetricsWithFilters('github.metric1', {
          status: 'error',
          entityKind: 'Component', // Filter by kind
          pagination: { limit: 10, offset: 0 },
        });

        // Should only return Component entities
        expect(result).toHaveLength(2);
        expect(result[0].entity_kind).toBe('Component');
        expect(result[1].entity_kind).toBe('Component');
      },
    );

    it.each(databases.eachSupportedId())(
      'should filter by entity owner - %p',
      async databaseId => {
        const { client, db } = await createDatabase(databaseId);

        const timestamp = new Date('2023-01-01T00:00:00Z');

        // Insert entities with different owners
        await client('metric_values').insert([
          {
            catalog_entity_ref: 'component:default/service1',
            metric_id: 'github.metric1',
            value: 10,
            timestamp,
            status: 'error',
            entity_kind: 'Component',
            entity_owner: 'team:default/platform',
          },
          {
            catalog_entity_ref: 'component:default/service2',
            metric_id: 'github.metric1',
            value: 5,
            timestamp,
            status: 'error',
            entity_kind: 'Component',
            entity_owner: 'team:default/backend',
          },
          {
            catalog_entity_ref: 'component:default/service3',
            metric_id: 'github.metric1',
            value: 15,
            timestamp,
            status: 'error',
            entity_kind: 'Component',
            entity_owner: 'team:default/platform',
          },
        ]);

        const result = await db.readEntityMetricsWithFilters('github.metric1', {
          status: 'error',
          entityOwner: ['team:default/platform'], // Filter by owner
          pagination: { limit: 10, offset: 0 },
        });

        // Should only return entities owned by team:default/platform
        expect(result).toHaveLength(2);
        expect(result[0].entity_owner).toBe('team:default/platform');
        expect(result[1].entity_owner).toBe('team:default/platform');
      },
    );

    it.each(databases.eachSupportedId())(
      'should filter by status, kind, and owner together - %p',
      async databaseId => {
        const { client, db } = await createDatabase(databaseId);

        const timestamp = new Date('2023-01-01T00:00:00Z');

        // Insert diverse test data
        await client('metric_values').insert([
          {
            catalog_entity_ref: 'component:default/service1',
            metric_id: 'github.metric1',
            value: 10,
            timestamp,
            status: 'error',
            entity_kind: 'Component',
            entity_owner: 'team:default/platform',
          },
          {
            catalog_entity_ref: 'api:default/api1',
            metric_id: 'github.metric1',
            value: 5,
            timestamp,
            status: 'error',
            entity_kind: 'API',
            entity_owner: 'team:default/platform',
          },
          {
            catalog_entity_ref: 'component:default/service2',
            metric_id: 'github.metric1',
            value: 15,
            timestamp,
            status: 'warning',
            entity_kind: 'Component',
            entity_owner: 'team:default/platform',
          },
          {
            catalog_entity_ref: 'component:default/service3',
            metric_id: 'github.metric1',
            value: 20,
            timestamp,
            status: 'error',
            entity_kind: 'Component',
            entity_owner: 'team:default/backend',
          },
        ]);

        const result = await db.readEntityMetricsWithFilters('github.metric1', {
          status: 'error', // Only error status
          entityKind: 'Component', // Only Component kind
          entityOwner: ['team:default/platform'], // Only platform team
          pagination: { limit: 10, offset: 0 },
        });

        // Should only return service1 (Component, error, platform)
        expect(result).toHaveLength(1);
        expect(result[0].catalog_entity_ref).toBe('component:default/service1');
        expect(result[0].status).toBe('error');
        expect(result[0].entity_kind).toBe('Component');
        expect(result[0].entity_owner).toBe('team:default/platform');
      },
    );

    it.each(databases.eachSupportedId())(
      'should work without pagination (fetch all) - %p',
      async databaseId => {
        const { client, db } = await createDatabase(databaseId);

        const timestamp = new Date('2023-01-01T00:00:00Z');

        await client('metric_values').insert([
          {
            catalog_entity_ref: 'component:default/service1',
            metric_id: 'github.metric1',
            value: 10,
            timestamp,
            status: 'error',
            entity_kind: 'Component',
            entity_owner: 'team:default/platform',
          },
          {
            catalog_entity_ref: 'component:default/service2',
            metric_id: 'github.metric1',
            value: 5,
            timestamp,
            status: 'error',
            entity_kind: 'Component',
            entity_owner: 'team:default/platform',
          },
          {
            catalog_entity_ref: 'component:default/service3',
            metric_id: 'github.metric1',
            value: 15,
            timestamp,
            status: 'error',
            entity_kind: 'Component',
            entity_owner: 'team:default/platform',
          },
        ]);

        // No pagination parameter - should return all
        const result = await db.readEntityMetricsWithFilters('github.metric1', {
          status: 'error',
        });

        expect(result).toHaveLength(3);
      },
    );

    it.each(databases.eachSupportedId())(
      'should handle null entity_kind and entity_owner - %p',
      async databaseId => {
        const { client, db } = await createDatabase(databaseId);

        const timestamp = new Date('2023-01-01T00:00:00Z');

        // Insert entity with null kind/owner (legacy data)
        await client('metric_values').insert([
          {
            catalog_entity_ref: 'component:default/service1',
            metric_id: 'github.metric1',
            value: 10,
            timestamp,
            status: 'error',
            entity_kind: null,
            entity_owner: null,
          },
          {
            catalog_entity_ref: 'component:default/service2',
            metric_id: 'github.metric1',
            value: 5,
            timestamp,
            status: 'error',
            entity_kind: 'Component',
            entity_owner: 'team:default/platform',
          },
        ]);

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
        expect(filteredResult[0].catalog_entity_ref).toBe(
          'component:default/service2',
        );
      },
    );

    it.each(databases.eachSupportedId())(
      'should return all rows when no owner filter is applied - %p',
      async databaseId => {
        const { client, db } = await createDatabase(databaseId);

        const timestamp = new Date('2023-01-01T00:00:00Z');

        await client('metric_values').insert([
          {
            catalog_entity_ref: 'component:default/service1',
            metric_id: 'github.metric1',
            value: 10,
            timestamp,
            status: 'success',
            entity_kind: 'Component',
            entity_owner: 'team:default/platform',
          },
          {
            catalog_entity_ref: 'component:default/service2',
            metric_id: 'github.metric1',
            value: 5,
            timestamp,
            status: 'warning',
            entity_kind: 'Component',
            entity_owner: 'team:default/backend',
          },
        ]);

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

        await client('metric_values').insert([
          {
            catalog_entity_ref: 'component:default/service1',
            metric_id: 'github.metric1',
            value: 10,
            timestamp,
            status: 'error',
            entity_kind: 'Component',
            entity_owner: 'team:default/platform',
          },
          {
            catalog_entity_ref: 'component:default/service2',
            metric_id: 'github.metric1',
            value: 5,
            timestamp,
            status: 'error',
            entity_kind: 'Component',
            entity_owner: 'team:default/backend',
          },
          {
            catalog_entity_ref: 'component:default/service3',
            metric_id: 'github.metric1',
            value: 8,
            timestamp,
            status: 'error',
            entity_kind: 'Component',
            entity_owner: 'team:default/other',
          },
        ]);

        // Passing two owners returns only those two teams' entities.
        const result = await db.readEntityMetricsWithFilters('github.metric1', {
          status: 'error',
          entityOwner: ['team:default/platform', 'team:default/backend'],
          pagination: { limit: 10, offset: 0 },
        });

        expect(result).toHaveLength(2);
        expect(
          result
            .map(r => r.entity_owner)
            .filter((o): o is string => o !== null)
            .sort((a, b) => a.localeCompare(b)),
        ).toEqual(['team:default/backend', 'team:default/platform']);
      },
    );

    it.each(databases.eachSupportedId())(
      'should filter by entityName substring via catalog_entity_ref LIKE - %p',
      async databaseId => {
        const { client, db } = await createDatabase(databaseId);

        const timestamp = new Date('2023-01-01T00:00:00Z');

        await client('metric_values').insert([
          {
            catalog_entity_ref: 'component:default/my-service',
            metric_id: 'github.metric1',
            value: 10,
            timestamp,
            status: 'error',
            entity_kind: 'Component',
            entity_owner: 'team:default/platform',
          },
          {
            catalog_entity_ref: 'component:default/service-api',
            metric_id: 'github.metric1',
            value: 5,
            timestamp,
            status: 'error',
            entity_kind: 'Component',
            entity_owner: 'team:default/platform',
          },
          {
            catalog_entity_ref: 'component:default/unrelated',
            metric_id: 'github.metric1',
            value: 15,
            timestamp,
            status: 'error',
            entity_kind: 'Component',
            entity_owner: 'team:default/platform',
          },
        ]);

        // 'service' should match 'my-service' and 'service-api' but not 'unrelated'
        const result = await db.readEntityMetricsWithFilters('github.metric1', {
          entityName: 'service',
          pagination: { limit: 10, offset: 0 },
        });

        expect(result).toHaveLength(2);
        expect(
          result
            .map(r => r.catalog_entity_ref)
            .sort((a, b) => a.localeCompare(b)),
        ).toEqual([
          'component:default/my-service',
          'component:default/service-api',
        ]);
      },
    );

    it.each(databases.eachSupportedId())(
      'should sort by catalog_entity_ref ascending when sortBy=entityName - %p',
      async databaseId => {
        const { client, db } = await createDatabase(databaseId);

        const timestamp = new Date('2023-01-01T00:00:00Z');

        await client('metric_values').insert([
          {
            catalog_entity_ref: 'component:default/service-c',
            metric_id: 'github.metric1',
            value: 1,
            timestamp,
            status: 'success',
          },
          {
            catalog_entity_ref: 'component:default/service-a',
            metric_id: 'github.metric1',
            value: 2,
            timestamp,
            status: 'success',
          },
          {
            catalog_entity_ref: 'component:default/service-b',
            metric_id: 'github.metric1',
            value: 3,
            timestamp,
            status: 'success',
          },
        ]);

        const result = await db.readEntityMetricsWithFilters('github.metric1', {
          sortBy: 'entityName',
          sortOrder: 'asc',
          pagination: { limit: 10, offset: 0 },
        });

        expect(result).toHaveLength(3);
        expect(result[0].catalog_entity_ref).toBe(
          'component:default/service-a',
        );
        expect(result[1].catalog_entity_ref).toBe(
          'component:default/service-b',
        );
        expect(result[2].catalog_entity_ref).toBe(
          'component:default/service-c',
        );
      },
    );

    it.each(databases.eachSupportedId())(
      'should sort by value descending with nulls last when sortBy=metricValue - %p',
      async databaseId => {
        const { client, db } = await createDatabase(databaseId);

        const timestamp = new Date('2023-01-01T00:00:00Z');

        await client('metric_values').insert([
          {
            catalog_entity_ref: 'component:default/service-a',
            metric_id: 'github.metric1',
            value: null,
            timestamp,
            status: 'error',
          },
          {
            catalog_entity_ref: 'component:default/service-b',
            metric_id: 'github.metric1',
            value: 5,
            timestamp,
            status: 'error',
          },
          {
            catalog_entity_ref: 'component:default/service-c',
            metric_id: 'github.metric1',
            value: 15,
            timestamp,
            status: 'error',
          },
        ]);

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

        await client('metric_values').insert([
          {
            catalog_entity_ref: 'component:default/service-c',
            metric_id: 'github.metric1',
            value: 1,
            timestamp,
            status: 'warning',
          },
          {
            catalog_entity_ref: 'component:default/service-a',
            metric_id: 'github.metric1',
            value: 2,
            timestamp,
            status: 'error',
          },
          {
            catalog_entity_ref: 'component:default/service-b',
            metric_id: 'github.metric1',
            value: 3,
            timestamp,
            status: 'success',
          },
          {
            catalog_entity_ref: 'component:default/service-d',
            metric_id: 'github.metric1',
            value: 4,
            timestamp,
            status: null,
          },
        ]);

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
});
