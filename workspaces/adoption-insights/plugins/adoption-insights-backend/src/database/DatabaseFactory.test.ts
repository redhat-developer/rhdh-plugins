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
import { Knex } from 'knex';
import { DatabaseFactory } from './DatabaseFactory';
import { PostgresAdapter } from './adapters/PostgresAdapter';
import { SqliteAdapter } from './adapters/SqliteAdapter';
import { BaseDatabaseAdapter } from './adapters/BaseAdapter';
import { mockServices } from '@backstage/backend-test-utils';

describe('DatabaseFactory', () => {
  const logger = mockServices.logger.mock();
  const getKnexClient = (client: string): jest.Mocked<Knex> =>
    ({
      client: {
        config: {
          client,
        },
      },
    } as unknown as jest.Mocked<Knex>);

  it('should return the PostgresAdapter', () => {
    const knex = getKnexClient('pg');
    const db = DatabaseFactory.getDatabase(knex, logger);

    expect(db).toBeInstanceOf(BaseDatabaseAdapter);
    expect(db).toBeInstanceOf(PostgresAdapter);
  });
  it('should return the SqliteAdapter', () => {
    const knex = getKnexClient('better-sqlite3');
    const db = DatabaseFactory.getDatabase(knex, logger);

    expect(db).toBeInstanceOf(BaseDatabaseAdapter);
    expect(db).toBeInstanceOf(SqliteAdapter);
  });

  it('should throw an error for unsupported database', () => {
    const knex = getKnexClient('mysql');
    expect(() => DatabaseFactory.getDatabase(knex, logger)).toThrow(
      'Unsupported database type: mysql',
    );
  });
});
