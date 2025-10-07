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
import { DatabaseMetricValuesStore } from './DatabaseMetricValuesStore';
import { DbMetricValue } from './MetricValuesStore';
import { migrate } from './migration';

jest.setTimeout(60000);

const metricValues: Omit<DbMetricValue, 'id'>[] = [
  {
    catalog_entity_ref: 'component:default/test-service',
    metric_id: 'github.metric1',
    value: 41,
    timestamp: new Date('2023-01-01T00:00:00Z'),
    error_message: undefined,
  },
  {
    catalog_entity_ref: 'component:default/another-service',
    metric_id: 'github.metric1',
    value: 25,
    timestamp: new Date('2023-01-01T00:00:00Z'),
    error_message: undefined,
  },
  {
    catalog_entity_ref: 'component:default/another-service',
    metric_id: 'github.metric2',
    value: undefined,
    timestamp: new Date('2023-01-01T00:00:00Z'),
    error_message: 'Failed to fetch metric',
  },
];

describe('DatabaseMetricValuesStore', () => {
  const databases = TestDatabases.create({
    ids: ['POSTGRES_13', 'SQLITE_3'],
  });

  async function createDatabase(databaseId: TestDatabaseId) {
    const knex = await databases.init(databaseId);
    const mockDatabaseService = mockServices.database.mock({
      getClient: async () => knex,
      migrations: { skip: false },
    });

    await migrate(mockDatabaseService);
    return {
      knex,
      db: new DatabaseMetricValuesStore(knex),
    };
  }

  describe('createMetricValues', () => {
    it.each(databases.eachSupportedId())(
      'should successfully insert metric values - %p',
      async databaseId => {
        const { knex, db } = await createDatabase(databaseId);

        await expect(
          db.createMetricValues(metricValues),
        ).resolves.not.toThrow();

        const insertedValues = await knex('metric_values').select('*');
        expect(insertedValues).toHaveLength(3);
        expect(insertedValues[0].catalog_entity_ref).toBe(
          'component:default/test-service',
        );
        expect(insertedValues[0].metric_id).toBe('github.metric1');
        expect(insertedValues[0].value).toBe(41);
        expect(insertedValues[0].error_message).toBe(null);
        expect(insertedValues[1].value).toBe(25);
        expect(insertedValues[2].metric_id).toBe('github.metric2');
        expect(insertedValues[2].value).toBe(null);
        expect(insertedValues[2].error_message).toBe('Failed to fetch metric');
      },
    );

    describe('readLatestEntityMetricValues', () => {
      it.each(databases.eachSupportedId())(
        'should return latest metric values for entity and metrics - %p',
        async databaseId => {
          const { knex, db } = await createDatabase(databaseId);

          const baseTime = new Date('2023-01-01T00:00:00Z');
          const laterTime = new Date('2023-01-01T01:00:00Z');

          await knex('metric_values').insert([
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

          expect(metric1Result).toBeDefined();
          expect(metric1Result!.value).toBe(41);
          expect(metric1Result!.catalog_entity_ref).toBe(
            'component:default/test-service',
          );

          expect(metric2Result).toBeDefined();
          expect(metric2Result!.value).toBe(null);
          expect(metric2Result!.catalog_entity_ref).toBe(
            'component:default/test-service',
          );
        },
      );
    });
  });
});
