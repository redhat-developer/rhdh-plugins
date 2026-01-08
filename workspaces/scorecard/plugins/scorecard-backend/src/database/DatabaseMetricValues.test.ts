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

const metricValues: DbMetricValueCreate[] = [
  {
    catalog_entity_ref: 'component:default/test-service',
    metric_id: 'github.metric1',
    value: 41,
    timestamp: new Date('2023-01-01T00:00:00Z'),
    status: 'success',
  },
  {
    catalog_entity_ref: 'component:default/another-service',
    metric_id: 'github.metric1',
    value: 25,
    timestamp: new Date('2023-01-01T00:00:00Z'),
    status: 'success',
  },
  {
    catalog_entity_ref: 'component:default/another-service',
    metric_id: 'github.metric2',
    timestamp: new Date('2023-01-01T00:00:00Z'),
    error_message: 'Failed to fetch metric',
  },
];

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

  describe('readAggregatedMetricsByEntityRefs', () => {
    it.each(databases.eachSupportedId())(
      'should return aggregated metrics by status for multiple entities and metrics - %p',
      async databaseId => {
        const { client, db } = await createDatabase(databaseId);

        const baseTime = new Date('2023-01-01T00:00:00Z');
        const laterTime = new Date('2023-01-01T01:00:00Z');

        await client('metric_values').insert([
          {
            ...metricValues[0],
            timestamp: baseTime,
            status: 'success',
          },
          {
            ...metricValues[1],
            timestamp: baseTime,
            status: 'success',
          },
          {
            ...metricValues[2],
            timestamp: laterTime,
            status: 'warning',
            value: 10,
          },
          {
            catalog_entity_ref: 'component:default/test-service',
            metric_id: 'github.metric2',
            timestamp: laterTime,
            value: 20,
            error_message: null,
            status: 'error',
          },
        ]);

        const result = await db.readAggregatedMetricsByEntityRefs(
          [
            'component:default/test-service',
            'component:default/another-service',
          ],
          ['github.metric1', 'github.metric2'],
        );

        expect(result).toHaveLength(2);

        const metric1Result = result.find(
          r => r.metric_id === 'github.metric1',
        );
        const metric2Result = result.find(
          r => r.metric_id === 'github.metric2',
        );

        expect(metric1Result).toBeDefined();
        expect(metric1Result?.total).toBe(2);
        expect(metric1Result?.success).toBe(2);
        expect(metric1Result?.warning).toBe(0);
        expect(metric1Result?.error).toBe(0);

        expect(metric2Result).toBeDefined();
        expect(metric2Result?.total).toBe(2);
        expect(metric2Result?.success).toBe(0);
        expect(metric2Result?.warning).toBe(1);
        expect(metric2Result?.error).toBe(1);
      },
    );
  });
});
